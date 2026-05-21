/**
 * Heavenly Stems (天干) and Earthly Branches (地支).
 *
 * Stems cycle 0..9; branches cycle 0..11. Their pairing (always even stem
 * with even branch, or odd with odd) produces the 60-jiazi (sexagenary)
 * cycle: index N → stem N%10, branch N%12.
 */

export const STEMS = [
  '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸',
] as const;
export type Stem = (typeof STEMS)[number];
export type StemIdx = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export const BRANCHES = [
  '子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥',
] as const;
export type Branch = (typeof BRANCHES)[number];
export type BranchIdx = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

/**
 * The 12 month-branch sequence in BaZi order, starting from the lichun
 * boundary. 寅 (Tiger) is the first month of the year because the year
 * boundary is Lichun (Spring Commences), which begins 寅 month.
 */
export const MONTH_BRANCH_ORDER: readonly Branch[] = [
  '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑',
];

/** Five Elements (五行) per stem. */
const STEM_ELEMENT = ['木','木','火','火','土','土','金','金','水','水'] as const;
const STEM_YIN_YANG = ['阳','阴','阳','阴','阳','阴','阳','阴','阳','阴'] as const;

/** Five Elements (五行) per branch. */
const BRANCH_ELEMENT = ['水','土','木','木','土','火','火','土','金','金','土','水'] as const;
const BRANCH_YIN_YANG = ['阳','阴','阳','阴','阳','阴','阳','阴','阳','阴','阳','阴'] as const;

export function stemElement(s: StemIdx): string { return STEM_ELEMENT[s]; }
export function stemYinYang(s: StemIdx): string { return STEM_YIN_YANG[s]; }
export function branchElement(b: BranchIdx): string { return BRANCH_ELEMENT[b]; }
export function branchYinYang(b: BranchIdx): string { return BRANCH_YIN_YANG[b]; }
