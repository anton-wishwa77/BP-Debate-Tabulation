const { pool, query } = require('../db');
const pairingService = require('../services/pairingService');

// GET /api/rounds
// Return all rounds, motions, status, and nested matches with assigned judges and participant teams
async function getAllRounds(req, res, next) {
  try {
    const roundsRes = await query('SELECT * FROM rounds ORDER BY round_number ASC');
    const rounds = roundsRes.rows;

    if (rounds.length === 0) {
      return res.status(200).json([]);
    }

    // Fetch all matches with judge info
    const matchesRes = await query(
      `SELECT m.match_id, m.round_id, m.room_name, m.is_submitted, m.judge_id,
              j.judge_name, j.institution AS judge_institution, j.is_active AS judge_is_active
       FROM matches m
       LEFT JOIN judges j ON m.judge_id = j.judge_id
       ORDER BY m.match_id ASC`
    );

    // Fetch all match participants with team info
    const participantsRes = await query(
      `SELECT mp.participant_id, mp.match_id, mp.team_id, mp.bench_position,
              mp.rank, mp.points, mp.speaker_1_score, mp.speaker_2_score,
              t.team_name, t.institution AS team_institution, t.speaker_1_name, t.speaker_2_name, t.is_swing
       FROM match_participants mp
       JOIN teams t ON mp.team_id = t.team_id
       ORDER BY mp.participant_id ASC`
    );

    // Index participants by match_id
    const participantsByMatch = {};
    for (const p of participantsRes.rows) {
      if (!participantsByMatch[p.match_id]) {
        participantsByMatch[p.match_id] = [];
      }
      participantsByMatch[p.match_id].push({
        participant_id: p.participant_id,
        team_id: p.team_id,
        team_name: p.team_name,
        institution: p.team_institution,
        speaker_1_name: p.speaker_1_name,
        speaker_2_name: p.speaker_2_name,
        is_swing: p.is_swing,
        bench_position: p.bench_position,
        rank: p.rank,
        points: p.points,
        speaker_1_score: p.speaker_1_score,
        speaker_2_score: p.speaker_2_score
      });
    }

    // Index matches by round_id
    const matchesByRound = {};
    for (const m of matchesRes.rows) {
      if (!matchesByRound[m.round_id]) {
        matchesByRound[m.round_id] = [];
      }
      matchesByRound[m.round_id].push({
        match_id: m.match_id,
        round_id: m.round_id,
        room_name: m.room_name,
        is_submitted: m.is_submitted,
        judge: m.judge_id
          ? {
              judge_id: m.judge_id,
              judge_name: m.judge_name,
              institution: m.judge_institution,
              is_active: m.judge_is_active
            }
          : null,
        participants: participantsByMatch[m.match_id] || []
      });
    }

    // Check if requester has admin authorization (via route, query, or flag)
    const isAdmin = Boolean(req.isAdmin || req.query.scope === 'admin');

    // Combine into nested rounds array with strict draft protection for public view
    const formattedRounds = rounds.map((r) => {
      const isDraft = r.status === 'Draft';

      // Security Guardrail: Public clients must NEVER receive draft pairings, benches, or motions
      if (isDraft && !isAdmin) {
        return {
          round_id: r.round_id,
          round_number: r.round_number,
          motion_text: null,
          info_slide: null,
          status: 'Draft',
          matches: []
        };
      }

      return {
        round_id: r.round_id,
        round_number: r.round_number,
        motion_text: r.motion_text,
        info_slide: r.info_slide,
        status: r.status,
        matches: matchesByRound[r.round_id] || []
      };
    });

    return res.status(200).json(formattedRounds);
  } catch (err) {
    return next(err);
  }
}

// Dedicated Admin Endpoint: GET /api/admin/rounds
// Returns all rounds including confidential draft room matrices
async function getAllRoundsAdmin(req, res, next) {
  req.isAdmin = true;
  return getAllRounds(req, res, next);
}

// POST /api/rounds/generate
// Accepts { round_number, motion_text, info_slide }
// Executes draw and inserts records in a single PostgreSQL transaction
async function generateRound(req, res, next) {
  const roundNumber = parseInt(req.body.round_number, 10);
  if (isNaN(roundNumber) || roundNumber < 1) {
    return res.status(400).json({ error: 'round_number must be a positive integer' });
  }

  const motionText =
    req.body.motion_text !== undefined ? req.body.motion_text.toString().trim() : '';
  if (!motionText) {
    return res.status(400).json({ error: 'motion_text is required' });
  }

  const infoSlide =
    req.body.info_slide !== undefined && req.body.info_slide !== null
      ? req.body.info_slide.toString().trim()
      : null;

  const client = await pool.connect();
  try {
    // Check if round_number already exists
    const existing = await client.query('SELECT round_id FROM rounds WHERE round_number = $1', [
      roundNumber
    ]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: `Round ${roundNumber} already exists` });
    }

    // Pre-draw validation
    const { teams, judges } = await pairingService.validatePreDraw(roundNumber, client);

    // Compute rooms and bench assignments
    let rooms;
    if (roundNumber === 1) {
      rooms = pairingService.generateRoundOneDraw(teams, judges);
    } else {
      rooms = await pairingService.generateSwissDraw(roundNumber, teams, judges, client);
    }

    // Begin atomic transaction
    await client.query('BEGIN');

    // 1. Insert into rounds
    const roundInsert = await client.query(
      `INSERT INTO rounds (round_number, motion_text, info_slide, status)
       VALUES ($1, $2, $3, 'Draft')
       RETURNING *`,
      [roundNumber, motionText, infoSlide]
    );
    const roundRecord = roundInsert.rows[0];

    // 2. Insert matches and match_participants
    const createdMatches = [];
    for (const room of rooms) {
      const matchInsert = await client.query(
        `INSERT INTO matches (round_id, room_name, judge_id, is_submitted)
         VALUES ($1, $2, $3, false)
         RETURNING *`,
        [roundRecord.round_id, room.room_name, room.judge_id]
      );
      const matchRecord = matchInsert.rows[0];

      const createdParticipants = [];
      for (const p of room.participants) {
        const participantInsert = await client.query(
          `INSERT INTO match_participants (match_id, team_id, bench_position)
           VALUES ($1, $2, $3)
           RETURNING *`,
          [matchRecord.match_id, p.team_id, p.bench_position]
        );
        createdParticipants.push(participantInsert.rows[0]);
      }

      createdMatches.push({
        ...matchRecord,
        participants: createdParticipants
      });
    }

    await client.query('COMMIT');

    return res.status(201).json({
      round_id: roundRecord.round_id,
      round_number: roundRecord.round_number,
      motion_text: roundRecord.motion_text,
      info_slide: roundRecord.info_slide,
      status: roundRecord.status,
      matches: createdMatches
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

// PATCH /api/rounds/:id
// Update motion_text, info_slide, or toggle status ('Draft', 'Published', 'Completed')
async function updateRound(req, res, next) {
  try {
    const roundId = parseInt(req.params.id, 10);
    if (isNaN(roundId)) {
      return res.status(400).json({ error: 'Invalid round ID' });
    }

    const existing = await query('SELECT * FROM rounds WHERE round_id = $1', [roundId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Round not found' });
    }

    const { motion_text, info_slide, status } = req.body;

    if (status !== undefined && !['Draft', 'Published', 'Completed'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status. Allowed values: Draft, Published, Completed'
      });
    }

    const current = existing.rows[0];
    const updateRes = await query(
      `UPDATE rounds
       SET motion_text = $1,
           info_slide = $2,
           status = $3
       WHERE round_id = $4
       RETURNING *`,
      [
        motion_text !== undefined ? motion_text.toString().trim() : current.motion_text,
        info_slide !== undefined
          ? info_slide
            ? info_slide.toString().trim()
            : null
          : current.info_slide,
        status !== undefined ? status : current.status,
        roundId
      ]
    );

    return res.status(200).json(updateRes.rows[0]);
  } catch (err) {
    return next(err);
  }
}

// DELETE /api/rounds/:id
// Delete a round and cascade delete its matches and participants
async function deleteRound(req, res, next) {
  try {
    const roundId = parseInt(req.params.id, 10);
    if (isNaN(roundId)) {
      return res.status(400).json({ error: 'Invalid round ID' });
    }

    const existing = await query('SELECT * FROM rounds WHERE round_id = $1', [roundId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Round not found' });
    }

    await query('DELETE FROM rounds WHERE round_id = $1', [roundId]);

    return res.status(200).json({
      message: 'Round deleted successfully',
      round: existing.rows[0]
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getAllRounds,
  getAllRoundsAdmin,
  generateRound,
  updateRound,
  deleteRound
};
