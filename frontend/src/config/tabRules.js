/**
 * Single Source of Truth (SSOT) Tabulation Rules & Constraints
 * British Parliamentary Debate Tabulation System - Forum Aeterna
 */

export const MIN_SPEAKER_SCORE = 50;
export const MAX_SPEAKER_SCORE = 100;
export const BENCH_POSITIONS = ['OG', 'OO', 'CG', 'CO'];

export const RANK_POINTS = {
  1: 3,
  2: 2,
  3: 1,
  4: 0
};

export const ROUND_STATUS = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  COMPLETED: 'Completed'
};

export const BENCH_PALETTES = {
  OG: {
    code: 'OG',
    name: 'Opening Government',
    shortName: 'Opening Govt',
    bg: 'bg-[#E9F2F7]',
    text: 'text-[#3A7CA5]',
    border: 'border-[#BDD5E7]',
    tag: 'Gov'
  },
  OO: {
    code: 'OO',
    name: 'Opening Opposition',
    shortName: 'Opening Opp',
    bg: 'bg-[#F7EAEB]',
    text: 'text-[#9C3A3A]',
    border: 'border-[#E8C4C4]',
    tag: 'Opp'
  },
  CG: {
    code: 'CG',
    name: 'Closing Government',
    shortName: 'Closing Govt',
    bg: 'bg-[#EBEFF5]',
    text: 'text-[#2A3A5C]',
    border: 'border-[#C5CFDF]',
    tag: 'Gov'
  },
  CO: {
    code: 'CO',
    name: 'Closing Opposition',
    shortName: 'Closing Opp',
    bg: 'bg-[#F5ECE8]',
    text: 'text-[#8E522C]',
    border: 'border-[#DFCECA]',
    tag: 'Opp'
  }
};
