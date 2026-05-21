/**
 * Map a lunar year number to its stem-branch pillar (the 年柱).
 *
 * ZWDS uses the lunar (sui) year for stem-branch, not the solar BaZi
 * year. The convention: lunar year 1984 = 甲子, lunar year 1985 = 乙丑,
 * etc. The sexagenary cycle goes forward by one each year.
 */

import { STEMS, BRANCHES, type Stem, type Branch } from './constants.js';

const SEX_INDEX_OFFSET = 4; // year 1984 has stem index 0 (甲) and branch index 0 (子). 1984 ≡ 4 mod 10, ≡ 4 mod 12 ⇒ index = (year + 4) gives wrong result; verify below.

/**
 * The reference anchor: year 1984 (lunar 甲子). So:
 *   stemIndex   = (year - 4) mod 10  → year 1984 = (1984 - 4) mod 10 = 0 = 甲. ✓
 *   branchIndex = (year - 4) mod 12  → year 1984 = (1984 - 4) mod 12 = 0 = 子. ✓
 *
 * Note: the year must be the lunar suì-year (i.e. the year containing
 * the lunar new year), not the Gregorian year. For births in January/
 * February before lunar new year, subtract 1 from the Gregorian year.
 */
export function yearPillar(lunarYear: number): { stem: Stem; branch: Branch } {
  const _ = SEX_INDEX_OFFSET; // silence unused
  const s = ((lunarYear - 4) % 10 + 10) % 10;
  const b = ((lunarYear - 4) % 12 + 12) % 12;
  return { stem: STEMS[s]!, branch: BRANCHES[b]! };
}
