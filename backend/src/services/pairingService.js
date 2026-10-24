/**
 * British Parliamentary Pairing Engine
 * Handles Pre-Draw Validation, Round 1 Random Draw, and Round 2+ Swiss Power-Pairing with Bench Equity.
 */

// Generate all 24 permutations of the 4 BP bench positions
function getBenchPermutations(arr = ['OG', 'OO', 'CG', 'CO']) {
  if (arr.length <= 1) return [arr];
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    const current = arr[i];
    const remaining = [...arr.slice(0, i), ...arr.slice(i + 1)];
    const perms = getBenchPermutations(remaining);
    for (const p of perms) {
      result.push([current, ...p]);
    }
  }
  return result;
}

const ALL_BENCH_PERMUTATIONS = getBenchPermutations(['OG', 'OO', 'CG', 'CO']);

/**
 * Fisher-Yates in-place shuffle algorithm
 */
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Task 3.1: Pre-draw constraint validator
 * Checks:
 * 1. N > 0 and N % 4 === 0
 * 2. active chair judges >= N / 4
 * 3. If roundNumber > 1: round roundNumber - 1 has all matches with is_submitted = true
 */
async function validatePreDraw(roundNumber, dbClient) {
  // Check team count
  const teamsRes = await dbClient.query('SELECT team_id, team_name FROM teams ORDER BY team_id ASC');
  const teams = teamsRes.rows;
  const N = teams.length;

  if (N === 0 || N % 4 !== 0) {
    const err = new Error('Cannot generate draw: Team count must be divisible by 4');
    err.statusCode = 400;
    throw err;
  }

  // Check active judges
  const judgesRes = await dbClient.query(
    'SELECT judge_id, judge_name, institution FROM judges WHERE is_active = true ORDER BY judge_id ASC'
  );
  const judges = judgesRes.rows;
  const requiredJudges = N / 4;

  if (judges.length < requiredJudges) {
    const err = new Error('Cannot generate draw: Insufficient active chair judges');
    err.statusCode = 400;
    throw err;
  }

  // If round > 1, check that previous round exists and is fully submitted
  if (roundNumber > 1) {
    const prevRoundNumber = roundNumber - 1;
    const prevRoundRes = await dbClient.query(
      `SELECT r.round_id,
              COUNT(m.match_id)::int AS total_matches,
              COUNT(CASE WHEN m.is_submitted = true THEN 1 END)::int AS submitted_matches
       FROM rounds r
       LEFT JOIN matches m ON r.round_id = m.round_id
       WHERE r.round_number = $1
       GROUP BY r.round_id`,
      [prevRoundNumber]
    );

    if (
      prevRoundRes.rows.length === 0 ||
      prevRoundRes.rows[0].total_matches === 0 ||
      prevRoundRes.rows[0].submitted_matches < prevRoundRes.rows[0].total_matches
    ) {
      const err = new Error('Cannot generate round: Previous round has pending ballots');
      err.statusCode = 400;
      throw err;
    }
  }

  return { teams, judges };
}

/**
 * Task 3.2: Round 1 Random Draw & Bench Assignment
 * Randomly shuffles teams and assigns benches:
 * Index 0 -> OG, Index 1 -> OO, Index 2 -> CG, Index 3 -> CO
 * Assigns one unique chair judge per room.
 */
function generateRoundOneDraw(teams, judges) {
  const shuffledTeams = shuffle(teams);
  const shuffledJudges = shuffle(judges);
  const roomsCount = shuffledTeams.length / 4;
  const rooms = [];

  const BENCH_ORDER = ['OG', 'OO', 'CG', 'CO'];

  for (let i = 0; i < roomsCount; i++) {
    const roomTeams = shuffledTeams.slice(i * 4, i * 4 + 4);
    const assignedJudge = shuffledJudges[i];

    const participants = roomTeams.map((team, idx) => ({
      team_id: team.team_id,
      bench_position: BENCH_ORDER[idx]
    }));

    rooms.push({
      room_name: `Room ${i + 1}`,
      judge_id: assignedJudge.judge_id,
      participants
    });
  }

  return rooms;
}

/**
 * Tasks 3.3 & 3.4: Round 2+ Swiss Power-Pairing Engine & Bench Equity
 * 1. Prerequisite check on roundNumber - 1 ballots (handled in validatePreDraw).
 * 2. Query standings ordered by:
 *    - Primary: Cumulative Team Points DESC
 *    - Secondary: Cumulative Speaker Scores DESC
 * 3. Slice sorted array into rooms of 4 (pull-ups occur naturally).
 * 4. Bench Equity: Allocate benches (OG, OO, CG, CO) to minimize duplicate bench assignments
 *    and balance Government/Opposition and Opening/Closing appearances.
 * 5. Assign one unique chair judge per room.
 */
async function generateSwissDraw(roundNumber, teams, judges, dbClient) {
  // Query dynamic standings
  const standingsRes = await dbClient.query(
    `SELECT 
      t.team_id,
      t.team_name,
      COALESCE(SUM(mp.points), 0)::int AS total_points,
      COALESCE(SUM(mp.speaker_1_score + mp.speaker_2_score), 0)::int AS total_speaks
    FROM teams t
    LEFT JOIN match_participants mp ON t.team_id = mp.team_id
    LEFT JOIN matches m ON mp.match_id = m.match_id AND m.is_submitted = true
    GROUP BY t.team_id, t.team_name
    ORDER BY total_points DESC, total_speaks DESC, t.team_id ASC`
  );

  const sortedTeams = standingsRes.rows;

  // Query historical bench positions for all teams across completed matches
  const benchHistoryRes = await dbClient.query(
    `SELECT mp.team_id, mp.bench_position, COUNT(*)::int AS count
     FROM match_participants mp
     JOIN matches m ON mp.match_id = m.match_id
     WHERE m.is_submitted = true
     GROUP BY mp.team_id, mp.bench_position`
  );

  const benchHistory = {};
  for (const row of benchHistoryRes.rows) {
    if (!benchHistory[row.team_id]) {
      benchHistory[row.team_id] = { OG: 0, OO: 0, CG: 0, CO: 0 };
    }
    benchHistory[row.team_id][row.bench_position] = row.count;
  }

  const shuffledJudges = shuffle(judges);
  const roomsCount = sortedTeams.length / 4;
  const rooms = [];

  for (let r = 0; r < roomsCount; r++) {
    const roomTeams = sortedTeams.slice(r * 4, r * 4 + 4);
    const assignedJudge = shuffledJudges[r];

    // Find optimal bench assignment permutation for the 4 teams
    let bestPermutation = null;
    let minCost = Infinity;
    const tiedPermutations = [];

    // Shuffle candidate permutations first for fair tie-breaking
    const candidatePerms = shuffle(ALL_BENCH_PERMUTATIONS);

    for (const perm of candidatePerms) {
      let cost = 0;

      for (let i = 0; i < 4; i++) {
        const teamId = roomTeams[i].team_id;
        const hist = benchHistory[teamId] || { OG: 0, OO: 0, CG: 0, CO: 0 };
        const bench = perm[i];

        // 1. Direct bench repetition penalty (heavily penalize repeated benches)
        const benchTimes = hist[bench] || 0;
        const benchPenalty = benchTimes * benchTimes * 1000 + benchTimes * 100;

        // 2. Government vs Opposition balance penalty
        const currentGov = (hist.OG || 0) + (hist.CG || 0);
        const currentOpp = (hist.OO || 0) + (hist.CO || 0);
        const newGov = currentGov + (bench === 'OG' || bench === 'CG' ? 1 : 0);
        const newOpp = currentOpp + (bench === 'OO' || bench === 'CO' ? 1 : 0);
        const govOppPenalty = Math.abs(newGov - newOpp) * 10;

        // 3. Opening vs Closing balance penalty
        const currentOpen = (hist.OG || 0) + (hist.OO || 0);
        const currentClose = (hist.CG || 0) + (hist.CO || 0);
        const newOpen = currentOpen + (bench === 'OG' || bench === 'OO' ? 1 : 0);
        const newClose = currentClose + (bench === 'CG' || bench === 'CO' ? 1 : 0);
        const openClosePenalty = Math.abs(newOpen - newClose) * 5;

        cost += benchPenalty + govOppPenalty + openClosePenalty;
      }

      if (cost < minCost) {
        minCost = cost;
        tiedPermutations.length = 0;
        tiedPermutations.push(perm);
      } else if (cost === minCost) {
        tiedPermutations.push(perm);
      }
    }

    bestPermutation = tiedPermutations[Math.floor(Math.random() * tiedPermutations.length)];

    const participants = roomTeams.map((team, idx) => ({
      team_id: team.team_id,
      bench_position: bestPermutation[idx]
    }));

    rooms.push({
      room_name: `Room ${r + 1}`,
      judge_id: assignedJudge.judge_id,
      participants
    });
  }

  return rooms;
}

module.exports = {
  validatePreDraw,
  generateRoundOneDraw,
  generateSwissDraw,
  shuffle
};
