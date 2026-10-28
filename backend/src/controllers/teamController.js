const { query } = require('../db');

// GET /api/teams
// Query all teams with dynamic rounds_played calculation from completed matches
async function getAllTeams(req, res, next) {
  try {
    const result = await query(
      `SELECT 
        t.team_id,
        t.team_name,
        t.institution,
        t.speaker_1_name,
        t.speaker_2_name,
        t.is_swing,
        t.created_at,
        COALESCE(
          (
            SELECT COUNT(DISTINCT m.round_id)::int
            FROM match_participants mp
            JOIN matches m ON mp.match_id = m.match_id
            WHERE mp.team_id = t.team_id AND m.is_submitted = true
          ), 0
        ) AS rounds_played
      FROM teams t
      ORDER BY t.team_id ASC`
    );
    return res.status(200).json(result.rows);
  } catch (err) {
    return next(err);
  }
}

// POST /api/teams
// Accept { team_name, institution, speaker_1_name, speaker_2_name }
async function createTeam(req, res, next) {
  try {
    const { team_name, institution, speaker_1_name, speaker_2_name } = req.body;

    if (
      !team_name ||
      !institution ||
      !speaker_1_name ||
      !speaker_2_name ||
      !team_name.toString().trim() ||
      !institution.toString().trim() ||
      !speaker_1_name.toString().trim() ||
      !speaker_2_name.toString().trim()
    ) {
      return res.status(400).json({
        error: 'All fields are required: team_name, institution, speaker_1_name, speaker_2_name'
      });
    }

    const trimmedTeamName = team_name.toString().trim();
    const trimmedInstitution = institution.toString().trim();
    const trimmedSpeaker1 = speaker_1_name.toString().trim();
    const trimmedSpeaker2 = speaker_2_name.toString().trim();

    // Check unique team_name
    const existing = await query(
      'SELECT team_id FROM teams WHERE LOWER(team_name) = LOWER($1)',
      [trimmedTeamName]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Team name already exists' });
    }

    const result = await query(
      `INSERT INTO teams (team_name, institution, speaker_1_name, speaker_2_name, is_swing)
       VALUES ($1, $2, $3, $4, false)
       RETURNING *`,
      [trimmedTeamName, trimmedInstitution, trimmedSpeaker1, trimmedSpeaker2]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Team name already exists' });
    }
    return next(err);
  }
}

// GET /api/teams/:id
// Query single team by ID
async function getTeamById(req, res, next) {
  try {
    const teamId = parseInt(req.params.id, 10);
    if (isNaN(teamId)) {
      return res.status(400).json({ error: 'Invalid team ID' });
    }

    const result = await query(
      `SELECT 
        t.team_id,
        t.team_name,
        t.institution,
        t.speaker_1_name,
        t.speaker_2_name,
        t.is_swing,
        t.created_at,
        COALESCE(
          (
            SELECT COUNT(DISTINCT m.round_id)::int
            FROM match_participants mp
            JOIN matches m ON mp.match_id = m.match_id
            WHERE mp.team_id = t.team_id AND m.is_submitted = true
          ), 0
        ) AS rounds_played
      FROM teams t
      WHERE t.team_id = $1`,
      [teamId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const t = result.rows[0];
    return res.status(200).json({
      id: t.team_id,
      team_id: t.team_id,
      name: t.team_name,
      team_name: t.team_name,
      institution: t.institution,
      speaker_1_name: t.speaker_1_name,
      speaker_2_name: t.speaker_2_name,
      is_swing: t.is_swing,
      rounds_played: t.rounds_played,
      created_at: t.created_at
    });
  } catch (err) {
    return next(err);
  }
}

// PUT /api/teams/:id
// Update team details or speaker names
async function updateTeam(req, res, next) {
  try {
    const teamId = parseInt(req.params.id, 10);
    if (isNaN(teamId)) {
      return res.status(400).json({ error: 'Invalid team ID' });
    }

    const existingTeam = await query('SELECT * FROM teams WHERE team_id = $1', [teamId]);
    if (existingTeam.rows.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Accept either 'name' or 'team_name'
    const rawName = req.body.name !== undefined ? req.body.name : req.body.team_name;
    const rawInstitution = req.body.institution;
    const rawSpeaker1 = req.body.speaker_1_name;
    const rawSpeaker2 = req.body.speaker_2_name;
    const rawSwing = req.body.is_swing;

    const trimmedName = rawName !== undefined ? rawName.toString().trim() : '';
    const trimmedInstitution = rawInstitution !== undefined ? rawInstitution.toString().trim() : '';
    const trimmedSpeaker1 = rawSpeaker1 !== undefined ? rawSpeaker1.toString().trim() : '';
    const trimmedSpeaker2 = rawSpeaker2 !== undefined ? rawSpeaker2.toString().trim() : '';

    if (!trimmedName || !trimmedInstitution || !trimmedSpeaker1 || !trimmedSpeaker2) {
      return res.status(400).json({
        error: 'All fields are required: name, institution, speaker_1_name, speaker_2_name'
      });
    }

    // Check unique team_name across other teams
    const dupCheck = await query(
      'SELECT team_id FROM teams WHERE LOWER(team_name) = LOWER($1) AND team_id != $2',
      [trimmedName, teamId]
    );

    if (dupCheck.rows.length > 0) {
      return res.status(409).json({
        error: 'A delegation with this name is already registered'
      });
    }

    const current = existingTeam.rows[0];
    const isSwingBool =
      typeof rawSwing === 'boolean'
        ? rawSwing
        : rawSwing === 'true'
        ? true
        : rawSwing === 'false'
        ? false
        : current.is_swing;

    const updateResult = await query(
      `UPDATE teams
       SET team_name = $1,
           institution = $2,
           speaker_1_name = $3,
           speaker_2_name = $4,
           is_swing = $5
       WHERE team_id = $6
       RETURNING *`,
      [trimmedName, trimmedInstitution, trimmedSpeaker1, trimmedSpeaker2, isSwingBool, teamId]
    );

    const updatedRow = updateResult.rows[0];

    return res.status(200).json({
      message: 'Delegation dossier updated successfully',
      team: {
        id: updatedRow.team_id,
        team_id: updatedRow.team_id,
        name: updatedRow.team_name,
        team_name: updatedRow.team_name,
        institution: updatedRow.institution,
        speaker_1_name: updatedRow.speaker_1_name,
        speaker_2_name: updatedRow.speaker_2_name,
        is_swing: updatedRow.is_swing
      }
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        error: 'A delegation with this name is already registered'
      });
    }
    return next(err);
  }
}

// DELETE /api/teams/:id
// Delete team record by ID
async function deleteTeam(req, res, next) {
  try {
    const teamId = parseInt(req.params.id, 10);
    if (isNaN(teamId)) {
      return res.status(400).json({ error: 'Invalid team ID' });
    }

    const existingTeam = await query('SELECT * FROM teams WHERE team_id = $1', [teamId]);
    if (existingTeam.rows.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    await query('DELETE FROM teams WHERE team_id = $1', [teamId]);
    return res.status(200).json({
      message: 'Team deleted successfully',
      team: existingTeam.rows[0]
    });
  } catch (err) {
    return next(err);
  }
}

// POST /api/teams/swing
// Rule of 4 Swing Balancer
async function addSwingTeams(req, res, next) {
  try {
    const countRes = await query('SELECT COUNT(*)::int AS count FROM teams');
    const N = countRes.rows[0].count;
    const remainder = N % 4;

    if (remainder === 0) {
      return res.status(200).json({
        message: 'Team count is already divisible by 4',
        added: 0
      });
    }

    const needed = (4 - remainder) % 4;

    const existingNamesRes = await query("SELECT team_name FROM teams WHERE team_name LIKE 'Swing Team %'");
    const existingNames = new Set(existingNamesRes.rows.map(r => r.team_name));

    const createdTeams = [];
    let charCode = 65; // 'A'

    while (createdTeams.length < needed) {
      const candidateName = `Swing Team ${String.fromCharCode(charCode)}`;
      charCode++;
      if (!existingNames.has(candidateName)) {
        const insertRes = await query(
          `INSERT INTO teams (team_name, institution, speaker_1_name, speaker_2_name, is_swing)
           VALUES ($1, $2, $3, $4, true)
           RETURNING *`,
          [candidateName, 'Tournament Swing', 'Iron Speaker 1', 'Iron Speaker 2']
        );
        createdTeams.push(insertRes.rows[0]);
      }
    }

    return res.status(201).json({
      message: `Added ${needed} swing team(s)`,
      added: needed,
      teams: createdTeams
    });
  } catch (err) {
    return next(err);
  }
}

// GET /api/teams/:id/stats
// Comprehensive live stats, speaker breakdown, and round trajectory for a team
async function getTeamStats(req, res, next) {
  try {
    const teamId = parseInt(req.params.id, 10);
    if (isNaN(teamId)) {
      return res.status(400).json({ error: 'Invalid team ID' });
    }

    // 1. Fetch Core Team Info
    const teamRes = await query(
      `SELECT team_id, team_name, institution, speaker_1_name, speaker_2_name, is_swing
       FROM teams
       WHERE team_id = $1`,
      [teamId]
    );

    if (teamRes.rows.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const team = teamRes.rows[0];

    // 2. Tournament Metrics & Current Rank across all teams
    const rankRes = await query(
      `WITH team_aggregates AS (
        SELECT 
          t.team_id,
          COALESCE(SUM(mp.points), 0)::int AS total_points,
          COALESCE(SUM(mp.speaker_1_score + mp.speaker_2_score), 0)::int AS total_speaks,
          ROW_NUMBER() OVER (
            ORDER BY 
              COALESCE(SUM(mp.points), 0) DESC, 
              COALESCE(SUM(mp.speaker_1_score + mp.speaker_2_score), 0) DESC, 
              t.team_name ASC
          )::int AS current_rank
        FROM teams t
        LEFT JOIN (
          match_participants mp
          JOIN matches m ON mp.match_id = m.match_id AND m.is_submitted = TRUE
        ) ON t.team_id = mp.team_id
        GROUP BY t.team_id, t.team_name
      )
      SELECT total_points, total_speaks, current_rank
      FROM team_aggregates
      WHERE team_id = $1`,
      [teamId]
    );

    const metrics = rankRes.rows[0] || {
      total_points: 0,
      total_speaks: 0,
      current_rank: 1
    };

    // 3. Speaker Breakdown
    const speakerRes = await query(
      `SELECT 
        COUNT(mp.speaker_1_score)::int AS s1_rounds_spoken,
        COALESCE(SUM(mp.speaker_1_score), 0)::int AS s1_total_speaks,
        CASE 
          WHEN COUNT(mp.speaker_1_score) = 0 THEN 0.0
          ELSE ROUND(AVG(mp.speaker_1_score)::numeric, 2)::float
        END AS s1_average_speaks,
        COUNT(mp.speaker_2_score)::int AS s2_rounds_spoken,
        COALESCE(SUM(mp.speaker_2_score), 0)::int AS s2_total_speaks,
        CASE 
          WHEN COUNT(mp.speaker_2_score) = 0 THEN 0.0
          ELSE ROUND(AVG(mp.speaker_2_score)::numeric, 2)::float
        END AS s2_average_speaks
       FROM match_participants mp
       JOIN matches m ON mp.match_id = m.match_id AND m.is_submitted = TRUE
       WHERE mp.team_id = $1`,
      [teamId]
    );

    const spk = speakerRes.rows[0] || {
      s1_rounds_spoken: 0,
      s1_total_speaks: 0,
      s1_average_speaks: 0.0,
      s2_rounds_spoken: 0,
      s2_total_speaks: 0,
      s2_average_speaks: 0.0
    };

    // 4. Round History (Array ordered by round_number ASC)
    const historyRes = await query(
      `SELECT 
        r.round_number,
        r.motion_text,
        m.room_name,
        mp.bench_position,
        mp.rank,
        mp.points,
        mp.speaker_1_score,
        mp.speaker_2_score,
        (COALESCE(mp.speaker_1_score, 0) + COALESCE(mp.speaker_2_score, 0))::int AS total_round_speaks
       FROM match_participants mp
       JOIN matches m ON mp.match_id = m.match_id AND m.is_submitted = TRUE
       JOIN rounds r ON m.round_id = r.round_id
       WHERE mp.team_id = $1
       ORDER BY r.round_number ASC`,
      [teamId]
    );

    const ordinalRank = (rank) => {
      if (!rank) return '-';
      if (rank === 1) return '1st';
      if (rank === 2) return '2nd';
      if (rank === 3) return '3rd';
      if (rank === 4) return '4th';
      return `${rank}`;
    };

    const roundHistory = historyRes.rows.map((row) => ({
      round_number: row.round_number,
      motion_text: row.motion_text || '',
      room_name: row.room_name,
      bench_position: row.bench_position,
      rank: row.rank,
      rank_display: ordinalRank(row.rank),
      points: row.points ?? 0,
      speaker_1_score: row.speaker_1_score ?? 0,
      speaker_2_score: row.speaker_2_score ?? 0,
      total_round_speaks: row.total_round_speaks ?? 0
    }));

    const speaker1 = {
      speaker_1_name: team.speaker_1_name,
      speaker_name: team.speaker_1_name,
      total_speaks: spk.s1_total_speaks,
      average_speaks: Number(Number(spk.s1_average_speaks).toFixed(2)),
      rounds_spoken: spk.s1_rounds_spoken
    };

    const speaker2 = {
      speaker_2_name: team.speaker_2_name,
      speaker_name: team.speaker_2_name,
      total_speaks: spk.s2_total_speaks,
      average_speaks: Number(Number(spk.s2_average_speaks).toFixed(2)),
      rounds_spoken: spk.s2_rounds_spoken
    };

    return res.status(200).json({
      id: team.team_id,
      team_id: team.team_id,
      name: team.team_name,
      team_name: team.team_name,
      institution: team.institution,
      is_swing: team.is_swing,
      speaker_1_name: team.speaker_1_name,
      speaker_2_name: team.speaker_2_name,
      total_points: metrics.total_points,
      total_speaks: metrics.total_speaks,
      current_rank: metrics.current_rank,
      speaker_1: speaker1,
      speaker_2: speaker2,
      speaker_breakdown: {
        speaker_1: speaker1,
        speaker_2: speaker2
      },
      round_history: roundHistory
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getAllTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  addSwingTeams,
  getTeamStats
};
