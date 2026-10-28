const { pool, query } = require('../db');
const { validateBallot } = require('../services/validationService');

/**
 * GET /api/matches/:matchId
 * Retrieve details of a specific match and its participants
 */
async function getMatchById(req, res, next) {
  try {
    const matchId = parseInt(req.params.matchId, 10);
    if (isNaN(matchId) || matchId <= 0) {
      return res.status(400).json({ error: 'Invalid match ID' });
    }

    const matchRes = await query(
      `SELECT m.match_id, m.round_id, m.room_name, m.is_submitted, m.judge_id,
              j.judge_name, j.institution AS judge_institution,
              r.round_number, r.motion_text, r.info_slide, r.status AS round_status
       FROM matches m
       JOIN rounds r ON m.round_id = r.round_id
       LEFT JOIN judges j ON m.judge_id = j.judge_id
       WHERE m.match_id = $1`,
      [matchId]
    );

    if (matchRes.rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const participantsRes = await query(
      `SELECT mp.participant_id, mp.match_id, mp.team_id, mp.bench_position,
              mp.rank, mp.points, mp.speaker_1_score, mp.speaker_2_score,
              t.team_name, t.institution AS team_institution,
              t.speaker_1_name, t.speaker_2_name, t.is_swing
       FROM match_participants mp
       JOIN teams t ON mp.team_id = t.team_id
       WHERE mp.match_id = $1
       ORDER BY mp.participant_id ASC`,
      [matchId]
    );

    const matchData = {
      ...matchRes.rows[0],
      participants: participantsRes.rows
    };

    return res.status(200).json(matchData);
  } catch (err) {
    return next(err);
  }
}

/**
 * PUT /api/matches/:matchId/ballot
 * Accepts JSON array of 4 objects: [{ team_id, rank, speaker_1_score, speaker_2_score }, ...]
 * Validates ballot via validateBallot (checking LPW & rank uniqueness & score bounds)
 * Executes atomic PostgreSQL transaction:
 *   1. Verifies match exists and team_ids match registered participants
 *   2. Updates rank, points, speaker scores for all participants
 *   3. Sets matches.is_submitted = true
 */
async function submitBallot(req, res, next) {
  const matchId = parseInt(req.params.matchId, 10);
  if (isNaN(matchId) || matchId <= 0) {
    return res.status(400).json({ error: 'Invalid match ID' });
  }

  const rawBallot = Array.isArray(req.body) ? req.body : req.body.ballot;
  if (!rawBallot) {
    return res.status(400).json({ error: 'Ballot data must be provided as an array of 4 team entries' });
  }

  // 1. Validate ballot syntax, boundaries, uniqueness, and LPW rules
  let validatedEntries;
  try {
    validatedEntries = validateBallot(rawBallot);
  } catch (validationErr) {
    return res.status(validationErr.statusCode || 400).json({ error: validationErr.message });
  }

  // 2. Perform database transaction
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verify match exists
    const matchRes = await client.query(
      'SELECT match_id, round_id, is_submitted FROM matches WHERE match_id = $1',
      [matchId]
    );

    if (matchRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Match not found' });
    }

    // Verify registered participants
    const participantsRes = await client.query(
      'SELECT participant_id, team_id, bench_position FROM match_participants WHERE match_id = $1',
      [matchId]
    );
    const registered = participantsRes.rows;

    if (registered.length !== 4) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Match does not have 4 registered participants' });
    }

    const registeredTeamIds = new Set(registered.map((p) => p.team_id));
    for (const entry of validatedEntries) {
      if (!registeredTeamIds.has(entry.team_id)) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: `Team ID ${entry.team_id} is not a registered participant in match ${matchId}`
        });
      }
    }

    // Clear ranks temporarily to avoid transient unique constraint (uq_match_rank) collision
    await client.query(
      'UPDATE match_participants SET rank = NULL WHERE match_id = $1',
      [matchId]
    );

    // Update each participant's scores and rank
    for (const entry of validatedEntries) {
      await client.query(
        `UPDATE match_participants
         SET rank = $1,
             points = $2,
             speaker_1_score = $3,
             speaker_2_score = $4
         WHERE match_id = $5 AND team_id = $6`,
        [
          entry.rank,
          entry.points,
          entry.speaker_1_score,
          entry.speaker_2_score,
          matchId,
          entry.team_id
        ]
      );
    }

    // Set match as submitted
    await client.query(
      'UPDATE matches SET is_submitted = TRUE WHERE match_id = $1',
      [matchId]
    );

    await client.query('COMMIT');

    return res.status(200).json({
      message: 'Ballot submitted successfully',
      match_id: matchId
    });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    return next(err);
  } finally {
    client.release();
  }
}

/**
 * PATCH /api/matches/:id/adjudicator
 * Payload: { judge_id: number | null }
 * Reassign, allocate, or vacate chair adjudicator for a match
 */
async function reassignAdjudicator(req, res, next) {
  try {
    const matchId = parseInt(req.params.id || req.params.matchId, 10);
    if (isNaN(matchId) || matchId <= 0) {
      return res.status(400).json({ error: 'Invalid match ID' });
    }

    // 1. Verify match existence
    const matchRes = await query(
      'SELECT match_id, round_id, room_name, judge_id, is_submitted FROM matches WHERE match_id = $1',
      [matchId]
    );

    if (matchRes.rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const match = matchRes.rows[0];

    // 2. Ballot Lockout Guard
    if (match.is_submitted) {
      return res.status(400).json({
        error: 'Cannot reassign adjudicator: Official ballot has already been sealed for this chamber'
      });
    }

    const { judge_id } = req.body;

    // 3. Vacating Chair (judge_id === null or empty string or undefined)
    if (judge_id === null || judge_id === '' || judge_id === undefined) {
      await query('UPDATE matches SET judge_id = NULL WHERE match_id = $1', [matchId]);
      return res.status(200).json({
        message: 'Chamber adjudicator chair vacated successfully',
        match_id: matchId,
        judge: null
      });
    }

    const targetJudgeId = parseInt(judge_id, 10);
    if (isNaN(targetJudgeId) || targetJudgeId <= 0) {
      return res.status(400).json({ error: 'Invalid judge ID provided' });
    }

    // 4. Verify judge exists and is active
    const judgeRes = await query(
      'SELECT judge_id, judge_name, institution, is_active FROM judges WHERE judge_id = $1',
      [targetJudgeId]
    );

    if (judgeRes.rows.length === 0) {
      return res.status(404).json({ error: 'Judge not found' });
    }

    const judge = judgeRes.rows[0];
    if (!judge.is_active) {
      return res.status(400).json({ error: 'Cannot assign inactive adjudicator' });
    }

    // 5. Double-Booking Check in the same round
    const conflictRes = await query(
      `SELECT match_id, room_name FROM matches 
       WHERE round_id = $1 AND judge_id = $2 AND match_id != $3`,
      [match.round_id, targetJudgeId, matchId]
    );

    if (conflictRes.rows.length > 0) {
      const conflictRoom = conflictRes.rows[0].room_name;
      return res.status(409).json({
        error: `Conflict: ${judge.judge_name} is already presiding over ${conflictRoom} in this round.`
      });
    }

    // 6. Update match
    await query('UPDATE matches SET judge_id = $1 WHERE match_id = $2', [targetJudgeId, matchId]);

    return res.status(200).json({
      message: 'Adjudicator allocated successfully',
      match_id: matchId,
      judge: {
        id: judge.judge_id,
        judge_id: judge.judge_id,
        judge_name: judge.judge_name,
        institution: judge.institution
      }
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getMatchById,
  submitBallot,
  reassignAdjudicator
};
