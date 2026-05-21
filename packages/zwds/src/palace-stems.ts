/**
 * Assign a stem to each palace using the Five Tigers Formula (五虎遁).
 *
 * The formula: given the year stem, the stem of the 寅 palace (the
 * "tiger" branch) is:
 *
 *   甲 or 己 year → 寅 palace stem = 丙
 *   乙 or 庚 year → 寅 palace stem = 戊
 *   丙 or 辛 year → 寅 palace stem = 庚
 *   丁 or 壬 year → 寅 palace stem = 壬
 *   戊 or 癸 year → 寅 palace stem = 甲
 *
 * From the 寅-palace stem, each subsequent branch (clockwise) takes
 * the next stem in the sexagenary cycle. So 寅, 卯, 辰, ... 丑 cycle
 * through STEMS, wrapping mod 10.
 */

import {
  STEMS, BRANCHES, stemIndex, branchIndex,
  type Stem, type Branch,
} from './constants.js';

const TIGER_STEM_FOR_YEAR: Record<Stem, Stem> = {
  '甲': '丙', '己': '丙',
  '乙': '戊', '庚': '戊',
  '丙': '庚', '辛': '庚',
  '丁': '壬', '壬': '壬',
  '戊': '甲', '癸': '甲',
};

/** Return the stem for each branch palace, given the year stem. */
export function palaceStems(yearStem: Stem): ReadonlyMap<Branch, Stem> {
  const tigerStem = TIGER_STEM_FOR_YEAR[yearStem];
  const tigerStemIdx = stemIndex(tigerStem);
  const tigerBranchIdx = branchIndex('寅');

  const map = new Map<Branch, Stem>();
  for (const branch of BRANCHES) {
    const offset = (branchIndex(branch) - tigerBranchIdx + 12) % 12;
    const stem = STEMS[(tigerStemIdx + offset) % 10]!;
    map.set(branch, stem);
  }
  return map;
}
