const { query } = require('../db');

/**
 * GET /api/standings/teams
 * Dynamic SQL query aggregating live team records across submitted matches (m.is_submitted = TRUE).
 * Must return:
 * - team_id
 * - team_name
 * - institution
 * - is_swing
 * - rounds_played (COUNT of submitted matches)
 * - total_points (COALESCE(SUM(mp.points), 0))
 * - total_speaks (COALESCE(SUM(mp.speaker_1_score + mp.speaker_2_score), 0))
 * - bench_history (Array of occupied benches across submitted matches)
 * 
 * Order strictly by: total_points DESC, total_speaks DESC, team_name ASC.
 */
async function getTeamStandings(req, res, next) {
  try {
    const result = await query(
      `SELECT 
        t.team_id,
        t.team_name,
        t.institution,
        t.is_swing,
        COUNT(m.match_id)::int AS rounds_played,
        COALESCE(SUM(mp.points), 0)::int AS total_points,
        COALESCE(SUM(mp.speaker_1_score + mp.speaker_2_score), 0)::int AS total_speaks,
        COALESCE(
          ARRAY_AGG(mp.bench_position ORDER BY r.round_number ASC)
            FILTER (WHERE mp.bench_position IS NOT NULL),
          '{}'
        ) AS bench_history
      FROM teams t
      LEFT JOIN (
        match_participants mp
        JOIN matches m ON mp.match_id = m.match_id AND m.is_submitted = TRUE
        JOIN rounds r ON m.round_id = r.round_id
      ) ON t.team_id = mp.team_id
      GROUP BY t.team_id, t.team_name, t.institution, t.is_swing
      ORDER BY total_points DESC, total_speaks DESC, t.team_name ASC`
    );

    const standings = result.rows.map((row) => ({
      team_id: row.team_id,
      team_name: row.team_name,
      institution: row.institution,
      is_swing: row.is_swing,
      rounds_played: row.rounds_played,
      total_points: row.total_points,
      total_speaks: row.total_speaks,
      bench_history: Array.isArray(row.bench_history) ? row.bench_history : []
    }));

    return res.status(200).json(standings);
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/standings/speakers
 * Dynamic SQL query flattening Speaker 1 and Speaker 2 scores across submitted matches (m.is_submitted = TRUE).
 * Must return:
 * - speaker_name
 * - team_name
 * - institution
 * - rounds_spoken
 * - total_speaker_score
 * - average_score (Rounded to 2 decimal places)
 * 
 * Order strictly by: total_speaker_score DESC, average_score DESC, speaker_name ASC.
 */
async function getSpeakerStandings(req, res, next) {
  try {
    const result = await query(
      `WITH speaker_records AS (
        SELECT 
          t.team_id,
          t.team_name,
          t.institution,
          t.speaker_1_name AS speaker_name,
          mp.speaker_1_score AS score
        FROM teams t
        LEFT JOIN (
          match_participants mp
          JOIN matches m ON mp.match_id = m.match_id AND m.is_submitted = TRUE
        ) ON t.team_id = mp.team_id
        UNION ALL
        SELECT 
          t.team_id,
          t.team_name,
          t.institution,
          t.speaker_2_name AS speaker_name,
          mp.speaker_2_score AS score
        FROM teams t
        LEFT JOIN (
          match_participants mp
          JOIN matches m ON mp.match_id = m.match_id AND m.is_submitted = TRUE
        ) ON t.team_id = mp.team_id
      )
      SELECT 
        speaker_name,
        team_name,
        institution,
        COUNT(score)::int AS rounds_spoken,
        COALESCE(SUM(score), 0)::int AS total_speaker_score,
        CASE 
          WHEN COUNT(score) = 0 THEN 0.0
          ELSE ROUND(AVG(score)::numeric, 2)::float
        END AS average_score
      FROM speaker_records
      GROUP BY speaker_name, team_name, institution
      ORDER BY total_speaker_score DESC, average_score DESC, speaker_name ASC`
    );

    const speakers = result.rows.map((row) => ({
      speaker_name: row.speaker_name,
      team_name: row.team_name,
      institution: row.institution,
      rounds_spoken: row.rounds_spoken,
      total_speaker_score: row.total_speaker_score,
      average_score: Number(Number(row.average_score).toFixed(2))
    }));

    return res.status(200).json(speakers);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getTeamStandings,
  getSpeakerStandings
};
