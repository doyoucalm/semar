/**
 * Constants for Zi Wei Dou Shu.
 *
 * Although BaZi shares some of these (STEMS, BRANCHES), each engine
 * carries its own copy — packages are intentionally independent.
 */

export const STEMS = [
  '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸',
] as const;
export type Stem = (typeof STEMS)[number];

export const BRANCHES = [
  '子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥',
] as const;
export type Branch = (typeof BRANCHES)[number];

/**
 * The twelve palaces of ZWDS, in the canonical order.
 * Index 0 = 命宫 (Self/Life), then counter-clockwise on the chart.
 */
export const PALACES = [
  '命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄',
  '迁移', '仆役', '官禄', '田宅', '福德', '父母',
] as const;
export type Palace = (typeof PALACES)[number];

export const PALACE_EN: Record<Palace, string> = {
  '命宫': 'Self',
  '兄弟': 'Siblings',
  '夫妻': 'Spouse',
  '子女': 'Children',
  '财帛': 'Wealth',
  '疾厄': 'Health',
  '迁移': 'Travel',
  '仆役': 'Friends',
  '官禄': 'Career',
  '田宅': 'Property',
  '福德': 'Fortune',
  '父母': 'Parents',
};

/**
 * The 14 main stars of ZWDS.
 *
 * 紫微 group (the "Emperor" group, 6 stars) follows 紫微 in a fixed
 * sequence around the chart. 天府 group (the "Empress" group, 8 stars)
 * follows 天府 in a separate sequence. The two groups are positioned
 * symmetrically; once 紫微 and 天府 are placed, all 14 main stars are
 * determined.
 */
export const MAIN_STARS = [
  // 紫微 group (6 stars)
  '紫微', '天机', '太阳', '武曲', '天同', '廉贞',
  // 天府 group (8 stars)
  '天府', '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军',
] as const;
export type MainStar = (typeof MAIN_STARS)[number];

export const MAIN_STAR_EN: Record<MainStar, string> = {
  '紫微': 'Purple Star (the Emperor)',
  '天机': 'Heavenly Strategist',
  '太阳': 'Sun',
  '武曲': 'Martial Treasury',
  '天同': 'Heavenly Companion',
  '廉贞': 'Pure and Upright',
  '天府': 'Heavenly Treasury (the Empress)',
  '太阴': 'Moon',
  '贪狼': 'Greedy Wolf',
  '巨门': 'Giant Gate',
  '天相': 'Heavenly Minister',
  '天梁': 'Heavenly Beam',
  '七杀': 'Seven Killings',
  '破军': 'Breaking Army',
};

/**
 * Auxiliary stars: 六吉 (six auspicious) + 六煞 (six inauspicious).
 *
 * Unlike main stars, aux stars do not participate in 四化 transformations.
 * Their placement depends on year stem, year branch, lunar month, or
 * hour branch — see aux-stars.ts for each rule.
 *
 * 六吉:  文昌 文曲 左辅 右弼 天魁 天钺
 * 六煞:  擎羊 陀罗 火星 铃星 地空 地劫
 */
export const AUSPICIOUS_STARS = [
  '文昌', '文曲', '左辅', '右弼', '天魁', '天钺',
] as const;
export type AuspiciousStar = (typeof AUSPICIOUS_STARS)[number];

export const INAUSPICIOUS_STARS = [
  '擎羊', '陀罗', '火星', '铃星', '地空', '地劫',
] as const;
export type InauspiciousStar = (typeof INAUSPICIOUS_STARS)[number];

export type AuxStar = AuspiciousStar | InauspiciousStar;

export const AUX_STAR_EN: Record<AuxStar, string> = {
  '文昌': 'Literary Flourish',
  '文曲': 'Literary Curve',
  '左辅': 'Left Assistant',
  '右弼': 'Right Assistant',
  '天魁': 'Heavenly Eminence (yang noble)',
  '天钺': 'Heavenly Axe (yin noble)',
  '擎羊': 'Wielded Sheep (blade)',
  '陀罗': 'Pendulum (yoke)',
  '火星': 'Mars (fire star)',
  '铃星': 'Bell Star',
  '地空': 'Earthly Void',
  '地劫': 'Earthly Misfortune',
};

/** The 12 two-hour periods of the day. 子 = 23:00–01:00, then forward. */
export const HOUR_BRANCHES: readonly Branch[] = BRANCHES;

export function hourBranchOf(hour: number, minute: number = 0): Branch {
  // Map 0:00–22:59 → branch index = floor((hour + 1) / 2) % 12
  // 23:00–23:59 → 子 (index 0)
  const t = hour + minute / 60;
  const idx = Math.floor(((t + 1) % 24) / 2);
  return BRANCHES[idx]!;
}

export function branchIndex(b: Branch): number { return BRANCHES.indexOf(b); }
export function stemIndex(s: Stem): number { return STEMS.indexOf(s); }

/** Rotate a branch by n positions clockwise (forward through BRANCHES). */
export function branchPlus(b: Branch, n: number): Branch {
  const idx = (branchIndex(b) + ((n % 12) + 12)) % 12;
  return BRANCHES[idx]!;
}
