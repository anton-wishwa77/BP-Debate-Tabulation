/**
 * Single Source of Truth (SSOT) Tabulation Rules & Constraints
 * British Parliamentary Debate Tabulation System - Forum Aeterna
 */

const MIN_SPEAKER_SCORE = 50;
const MAX_SPEAKER_SCORE = 100;
const BENCH_POSITIONS = ['OG', 'OO', 'CG', 'CO'];

const RANK_POINTS = {
  1: 3,
  2: 2,
  3: 1,
  4: 0
};

const ROUND_STATUS = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  COMPLETED: 'Completed'
};

module.exports = {
  MIN_SPEAKER_SCORE,
  MAX_SPEAKER_SCORE,
  BENCH_POSITIONS,
  RANK_POINTS,
  ROUND_STATUS
};
