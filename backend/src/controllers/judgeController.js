const { query } = require('../db');

// GET /api/judges
// Query all judges with active status
async function getAllJudges(req, res, next) {
  try {
    const result = await query(
      `SELECT judge_id, judge_name, institution, username, pin, is_active
       FROM judges
       ORDER BY judge_id ASC`
    );
    return res.status(200).json(result.rows);
  } catch (err) {
    return next(err);
  }
}

// POST /api/judges
// Accept { judge_name, institution, username, pin }
async function createJudge(req, res, next) {
  try {
    const { judge_name, institution, username, pin, is_active } = req.body;

    if (
      !judge_name ||
      !institution ||
      !username ||
      !pin ||
      !judge_name.toString().trim() ||
      !institution.toString().trim() ||
      !username.toString().trim() ||
      !pin.toString().trim()
    ) {
      return res.status(400).json({
        error: 'All fields are required: judge_name, institution, username, pin'
      });
    }

    const trimmedJudgeName = judge_name.toString().trim();
    const trimmedInstitution = institution.toString().trim();
    const trimmedUsername = username.toString().trim();
    const trimmedPin = pin.toString().trim();

    // Check unique username
    const existing = await query(
      'SELECT judge_id FROM judges WHERE LOWER(username) = LOWER($1)',
      [trimmedUsername]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Judge username already exists' });
    }

    const activeStatus = typeof is_active === 'boolean' ? is_active : true;

    const result = await query(
      `INSERT INTO judges (judge_name, institution, username, pin, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [trimmedJudgeName, trimmedInstitution, trimmedUsername, trimmedPin, activeStatus]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Judge username already exists' });
    }
    return next(err);
  }
}

// PUT /api/judges/:id
// Update adjudicator profile or toggle is_active boolean
async function updateJudge(req, res, next) {
  try {
    const judgeId = parseInt(req.params.id, 10);
    if (isNaN(judgeId) || judgeId <= 0) {
      return res.status(400).json({ error: 'Invalid judge ID' });
    }

    const existingJudge = await query('SELECT * FROM judges WHERE judge_id = $1', [judgeId]);
    if (existingJudge.rows.length === 0) {
      return res.status(404).json({ error: 'Judge not found' });
    }

    const current = existingJudge.rows[0];
    const { judge_name, institution, username, pin, is_active } = req.body;

    // Detect if this is solely an is_active toggle
    const isToggleOnly =
      judge_name === undefined &&
      institution === undefined &&
      username === undefined &&
      pin === undefined &&
      typeof is_active === 'boolean';

    let targetName = current.judge_name;
    let targetInstitution = current.institution;
    let targetUsername = current.username;
    let targetPin = current.pin;
    let targetActive = typeof is_active === 'boolean' ? is_active : current.is_active;

    if (!isToggleOnly) {
      // Validate judge_name
      if (!judge_name || !judge_name.toString().trim()) {
        return res.status(400).json({ error: 'Adjudicator name is required' });
      }
      targetName = judge_name.toString().trim();

      // Validate institution
      if (!institution || !institution.toString().trim()) {
        return res.status(400).json({ error: 'Institution is required' });
      }
      targetInstitution = institution.toString().trim();

      // Validate username
      if (!username || !username.toString().trim()) {
        return res.status(400).json({ error: 'Username is required' });
      }
      targetUsername = username.toString().trim();
      if (!/^[a-zA-Z0-9_]+$/.test(targetUsername)) {
        return res.status(400).json({
          error: 'Username must contain only letters, numbers, and underscores'
        });
      }

      // Check username uniqueness across judges (excluding current judge_id)
      const dupCheck = await query(
        'SELECT judge_id FROM judges WHERE LOWER(username) = LOWER($1) AND judge_id != $2',
        [targetUsername, judgeId]
      );
      if (dupCheck.rows.length > 0) {
        return res.status(409).json({ error: 'Username already allocated to another adjudicator' });
      }

      // Validate pin
      if (pin !== undefined) {
        if (!pin || !pin.toString().trim()) {
          return res.status(400).json({ error: 'PIN is required' });
        }
        targetPin = pin.toString().trim();
        if (!/^\d{4}$/.test(targetPin)) {
          return res.status(400).json({ error: 'PIN must be exactly 4 numeric digits' });
        }
      }
    }

    const updateResult = await query(
      `UPDATE judges
       SET judge_name = $1,
           institution = $2,
           username = $3,
           pin = $4,
           is_active = $5
       WHERE judge_id = $6
       RETURNING judge_id, judge_name, institution, username, is_active`,
      [targetName, targetInstitution, targetUsername, targetPin, targetActive, judgeId]
    );

    const updated = updateResult.rows[0];

    return res.status(200).json({
      message: 'Adjudicator records updated successfully',
      judge: {
        id: updated.judge_id,
        judge_id: updated.judge_id,
        judge_name: updated.judge_name,
        institution: updated.institution,
        username: updated.username,
        is_active: updated.is_active
      }
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Username already allocated to another adjudicator' });
    }
    return next(err);
  }
}

// DELETE /api/judges/:id
// Delete a judge record by ID
async function deleteJudge(req, res, next) {
  try {
    const judgeId = parseInt(req.params.id, 10);
    if (isNaN(judgeId)) {
      return res.status(400).json({ error: 'Invalid judge ID' });
    }

    const existingJudge = await query('SELECT * FROM judges WHERE judge_id = $1', [judgeId]);
    if (existingJudge.rows.length === 0) {
      return res.status(404).json({ error: 'Judge not found' });
    }

    await query('DELETE FROM judges WHERE judge_id = $1', [judgeId]);
    return res.status(200).json({
      message: 'Judge deleted successfully',
      judge: existingJudge.rows[0]
    });
  } catch (err) {
    return next(err);
  }
}

// POST /api/judges/login
// Accepts { username, pin } and validates credentials against active judges
async function loginJudge(req, res, next) {
  try {
    const { username, pin } = req.body;

    if (!username || !pin || !username.toString().trim() || !pin.toString().trim()) {
      return res.status(400).json({ error: 'Username and PIN are required' });
    }

    const trimmedUsername = username.toString().trim();
    const trimmedPin = pin.toString().trim();

    const result = await query(
      `SELECT judge_id, judge_name, institution, username, pin, is_active
       FROM judges
       WHERE LOWER(username) = LOWER($1)`,
      [trimmedUsername]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials or inactive adjudicator status' });
    }

    const judge = result.rows[0];

    if (judge.pin !== trimmedPin || !judge.is_active) {
      return res.status(401).json({ error: 'Invalid credentials or inactive adjudicator status' });
    }

    return res.status(200).json({
      judge_id: judge.judge_id,
      judge_name: judge.judge_name,
      institution: judge.institution,
      username: judge.username
    });
  } catch (err) {
    return next(err);
  }
}

// GET /api/judges/:judgeId/matches
// Fetches all matches where judge_id = judgeId with round and participant details
async function getJudgeMatches(req, res, next) {
  try {
    const judgeId = parseInt(req.params.judgeId || req.params.id, 10);
    if (isNaN(judgeId) || judgeId <= 0) {
      return res.status(400).json({ error: 'Invalid judge ID' });
    }

    const judgeRes = await query(
      'SELECT judge_id, judge_name, institution, is_active FROM judges WHERE judge_id = $1',
      [judgeId]
    );
    if (judgeRes.rows.length === 0) {
      return res.status(404).json({ error: 'Judge not found' });
    }

    const matchesRes = await query(
      `SELECT m.match_id, m.round_id, m.room_name, m.is_submitted,
              r.round_number, r.motion_text, r.info_slide, r.status AS round_status
       FROM matches m
       JOIN rounds r ON m.round_id = r.round_id
       WHERE m.judge_id = $1
       ORDER BY r.round_number ASC, m.match_id ASC`,
      [judgeId]
    );

    const matches = matchesRes.rows;
    if (matches.length === 0) {
      return res.status(200).json([]);
    }

    const matchIds = matches.map((m) => m.match_id);
    const participantsRes = await query(
      `SELECT mp.participant_id, mp.match_id, mp.team_id, mp.bench_position,
              mp.rank, mp.points, mp.speaker_1_score, mp.speaker_2_score,
              t.team_name, t.institution AS team_institution,
              t.speaker_1_name, t.speaker_2_name, t.is_swing
       FROM match_participants mp
       JOIN teams t ON mp.team_id = t.team_id
       WHERE mp.match_id = ANY($1::int[])
       ORDER BY mp.participant_id ASC`,
      [matchIds]
    );

    const participantsByMatch = {};
    for (const p of participantsRes.rows) {
      if (!participantsByMatch[p.match_id]) {
        participantsByMatch[p.match_id] = [];
      }
      participantsByMatch[p.match_id].push(p);
    }

    const resultMatches = matches.map((m) => ({
      ...m,
      participants: participantsByMatch[m.match_id] || []
    }));

    return res.status(200).json(resultMatches);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getAllJudges,
  createJudge,
  updateJudge,
  deleteJudge,
  loginJudge,
  getJudgeMatches
};
