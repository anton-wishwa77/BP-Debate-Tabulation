/**
 * Ballot Integrity & LPW Validation Service
 * Enforces British Parliamentary scoring rules and Low-Point Win prohibitions.
 */

const RANK_POINTS = {
  1: 3,
  2: 2,
  3: 1,
  4: 0
};

/**
 * Validates a ballot submission containing 4 team entries.
 * 
 * Rules:
 * 1. Payload must be an array of exactly 4 entries.
 * 2. Each entry must have valid team_id, rank (1..4), speaker_1_score (50..100), speaker_2_score (50..100).
 * 3. Ranks must be a strictly unique permutation of [1, 2, 3, 4].
 * 4. Automatic point mapping: 1st -> 3, 2nd -> 2, 3rd -> 1, 4th -> 0.
 * 5. Strict LPW Prohibition:
 *    For every pair of teams (A, B) where rank_A < rank_B:
 *    totalSpeaks_A must be strictly greater than totalSpeaks_B.
 *    If totalSpeaks_A <= totalSpeaks_B, throw explicit LPW error:
 *    "Low-Point Win Error: Team ranked X has lower or equal speaker points than team ranked Y."
 * 
 * @param {Array} ballotEntries
 * @returns {Array} mapped entries with computed points and totalSpeaks
 */
function validateBallot(ballotEntries) {
  if (!Array.isArray(ballotEntries) || ballotEntries.length !== 4) {
    const err = new Error('Ballot must contain an array of exactly 4 team entries');
    err.statusCode = 400;
    throw err;
  }

  const mappedEntries = ballotEntries.map((entry, index) => {
    if (!entry || typeof entry !== 'object') {
      const err = new Error(`Ballot entry at index ${index} is invalid`);
      err.statusCode = 400;
      throw err;
    }

    const teamId = Number(entry.team_id);
    if (!Number.isInteger(teamId) || teamId <= 0) {
      const err = new Error(`Invalid team_id provided at entry ${index + 1}`);
      err.statusCode = 400;
      throw err;
    }

    const rank = Number(entry.rank);
    if (!Number.isInteger(rank) || rank < 1 || rank > 4) {
      const err = new Error('Ballot ranks must be integers between 1 and 4');
      err.statusCode = 400;
      throw err;
    }

    const s1 = Number(entry.speaker_1_score);
    const s2 = Number(entry.speaker_2_score);
    if (
      !Number.isInteger(s1) ||
      s1 < 50 ||
      s1 > 100 ||
      !Number.isInteger(s2) ||
      s2 < 50 ||
      s2 > 100
    ) {
      const err = new Error('Speaker scores must be integers between 50 and 100 inclusive');
      err.statusCode = 400;
      throw err;
    }

    const points = RANK_POINTS[rank];
    const totalSpeaks = s1 + s2;

    return {
      team_id: teamId,
      rank,
      points,
      speaker_1_score: s1,
      speaker_2_score: s2,
      total_speaks: totalSpeaks
    };
  });

  // Verify unique team IDs
  const teamIds = new Set(mappedEntries.map((e) => e.team_id));
  if (teamIds.size !== 4) {
    const err = new Error('All 4 teams in the ballot must be distinct');
    err.statusCode = 400;
    throw err;
  }

  // Verify ranks are a strictly unique permutation of [1, 2, 3, 4]
  const ranks = new Set(mappedEntries.map((e) => e.rank));
  if (ranks.size !== 4 || ![1, 2, 3, 4].every((r) => ranks.has(r))) {
    const err = new Error('Ballot ranks must be a unique permutation of [1, 2, 3, 4]');
    err.statusCode = 400;
    throw err;
  }

  // Strict Low-Point Win (LPW) Prohibition
  // Sort entries by rank ascending: rank 1, rank 2, rank 3, rank 4
  const sortedByRank = [...mappedEntries].sort((a, b) => a.rank - b.rank);

  for (let i = 0; i < sortedByRank.length; i++) {
    for (let j = i + 1; j < sortedByRank.length; j++) {
      const teamA = sortedByRank[i];
      const teamB = sortedByRank[j];

      // teamA finished higher than teamB (teamA.rank < teamB.rank)
      // Assert: totalSpeaks_A > totalSpeaks_B
      if (teamA.total_speaks <= teamB.total_speaks) {
        const err = new Error(
          `Low-Point Win Error: Team ranked ${teamA.rank} has lower or equal speaker points than team ranked ${teamB.rank}.`
        );
        err.statusCode = 400;
        throw err;
      }
    }
  }

  return mappedEntries;
}

module.exports = {
  RANK_POINTS,
  validateBallot
};
