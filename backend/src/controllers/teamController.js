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

    const { team_name, institution, speaker_1_name, speaker_2_name, is_swing } = req.body;

    const trimmedTeamName = team_name !== undefined ? team_name.toString().trim() : undefined;
    const trimmedInstitution = institution !== undefined ? institution.toString().trim() : undefined;
    const trimmedSpeaker1 = speaker_1_name !== undefined ? speaker_1_name.toString().trim() : undefined;
    const trimmedSpeaker2 = speaker_2_name !== undefined ? speaker_2_name.toString().trim() : undefined;

    if (trimmedTeamName !== undefined) {
      if (!trimmedTeamName) {
        return res.status(400).json({ error: 'team_name cannot be empty' });
      }
      const dupCheck = await query(
        'SELECT team_id FROM teams WHERE LOWER(team_name) = LOWER($1) AND team_id != $2',
        [trimmedTeamName, teamId]
      );
      if (dupCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Team name already exists' });
      }
    }

    const current = existingTeam.rows[0];
    const updateResult = await query(
      `UPDATE teams
       SET team_name = $1,
           institution = $2,
           speaker_1_name = $3,
           speaker_2_name = $4,
           is_swing = $5
       WHERE team_id = $6
       RETURNING *`,
      [
        trimmedTeamName !== undefined ? trimmedTeamName : current.team_name,
        trimmedInstitution !== undefined ? trimmedInstitution : current.institution,
        trimmedSpeaker1 !== undefined ? trimmedSpeaker1 : current.speaker_1_name,
        trimmedSpeaker2 !== undefined ? trimmedSpeaker2 : current.speaker_2_name,
        typeof is_swing === 'boolean' ? is_swing : current.is_swing,
        teamId
      ]
    );

    return res.status(200).json(updateResult.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Team name already exists' });
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

module.exports = {
  getAllTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  addSwingTeams
};
