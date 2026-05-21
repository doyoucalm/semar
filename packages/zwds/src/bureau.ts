/**
 * The Five Elements Bureau (五行局).
 *
 * The bureau is determined by the stem-branch pair of the 命宫 palace.
 * The lookup proceeds by Nayin (the 60-pillar nayin element of the
 * sexagenary pair). In ZWDS practice the bureau is one of:
 *
 *   水二局 (Water 2)
 *   木三局 (Wood 3)
 *   金四局 (Metal 4)
 *   土五局 (Earth 5)
 *   火六局 (Fire 6)
 *
 * The number (2..6) is critical: it is the "interval" used to step
 * 紫微 forward from a base position determined by the lunar day.
 */

import { STEMS, BRANCHES, stemIndex, branchIndex, type Stem, type Branch } from './constants.js';

export type BureauElement = 'water' | 'wood' | 'metal' | 'earth' | 'fire';

export interface Bureau {
  readonly element: BureauElement;
  readonly number: 2 | 3 | 4 | 5 | 6;
  readonly cn: string; // e.g. '水二局'
}

const BUREAU_TABLE: Record<BureauElement, Bureau> = {
  water: { element: 'water', number: 2, cn: '水二局' },
  wood:  { element: 'wood',  number: 3, cn: '木三局' },
  metal: { element: 'metal', number: 4, cn: '金四局' },
  earth: { element: 'earth', number: 5, cn: '土五局' },
  fire:  { element: 'fire',  number: 6, cn: '火六局' },
};

/**
 * Nayin → bureau element. The 60 sexagenary pairs are grouped into 30
 * nayin (each nayin shared by an adjacent pair). The standard ZWDS
 * bureau mapping (from the *Ziwei Doushu Quanshu*) maps each nayin
 * element to one of the five bureaus.
 *
 * The classical Nayin elements are: 金 (metal), 木 (wood), 水 (water),
 * 火 (fire), 土 (earth). The bureau name uses these directly.
 */
const NAYIN_BY_INDEX: readonly BureauElement[] = [
  // sexagenary index 0..59 → nayin element
  // 0: 甲子 海中金 metal; 1: 乙丑 海中金 metal
  'metal', 'metal',
  // 2: 丙寅 炉中火 fire; 3: 丁卯 炉中火 fire
  'fire', 'fire',
  // 4: 戊辰 大林木 wood; 5: 己巳 大林木 wood
  'wood', 'wood',
  // 6: 庚午 路旁土 earth; 7: 辛未 路旁土 earth
  'earth', 'earth',
  // 8: 壬申 剑锋金 metal; 9: 癸酉 剑锋金 metal
  'metal', 'metal',
  // 10: 甲戌 山头火 fire; 11: 乙亥 山头火 fire
  'fire', 'fire',
  // 12: 丙子 涧下水 water; 13: 丁丑 涧下水 water
  'water', 'water',
  // 14: 戊寅 城头土 earth; 15: 己卯 城头土 earth
  'earth', 'earth',
  // 16: 庚辰 白蜡金 metal; 17: 辛巳 白蜡金 metal
  'metal', 'metal',
  // 18: 壬午 杨柳木 wood; 19: 癸未 杨柳木 wood
  'wood', 'wood',
  // 20: 甲申 泉中水 water; 21: 乙酉 泉中水 water
  'water', 'water',
  // 22: 丙戌 屋上土 earth; 23: 丁亥 屋上土 earth
  'earth', 'earth',
  // 24: 戊子 霹雳火 fire; 25: 己丑 霹雳火 fire
  'fire', 'fire',
  // 26: 庚寅 松柏木 wood; 27: 辛卯 松柏木 wood
  'wood', 'wood',
  // 28: 壬辰 长流水 water; 29: 癸巳 长流水 water
  'water', 'water',
  // 30: 甲午 砂中金 metal; 31: 乙未 砂中金 metal
  'metal', 'metal',
  // 32: 丙申 山下火 fire; 33: 丁酉 山下火 fire
  'fire', 'fire',
  // 34: 戊戌 平地木 wood; 35: 己亥 平地木 wood
  'wood', 'wood',
  // 36: 庚子 壁上土 earth; 37: 辛丑 壁上土 earth
  'earth', 'earth',
  // 38: 壬寅 金箔金 metal; 39: 癸卯 金箔金 metal
  'metal', 'metal',
  // 40: 甲辰 覆灯火 fire; 41: 乙巳 覆灯火 fire
  'fire', 'fire',
  // 42: 丙午 天河水 water; 43: 丁未 天河水 water
  'water', 'water',
  // 44: 戊申 大驿土 earth; 45: 己酉 大驿土 earth
  'earth', 'earth',
  // 46: 庚戌 钗钏金 metal; 47: 辛亥 钗钏金 metal
  'metal', 'metal',
  // 48: 壬子 桑柘木 wood; 49: 癸丑 桑柘木 wood
  'wood', 'wood',
  // 50: 甲寅 大溪水 water; 51: 乙卯 大溪水 water
  'water', 'water',
  // 52: 丙辰 沙中土 earth; 53: 丁巳 沙中土 earth
  'earth', 'earth',
  // 54: 戊午 天上火 fire; 55: 己未 天上火 fire
  'fire', 'fire',
  // 56: 庚申 石榴木 wood; 57: 辛酉 石榴木 wood
  'wood', 'wood',
  // 58: 壬戌 大海水 water; 59: 癸亥 大海水 water
  'water', 'water',
];

export function sexagenaryIndex(stem: Stem, branch: Branch): number {
  const s = stemIndex(stem);
  const b = branchIndex(branch);
  // The 60-cycle is constrained: index satisfies idx ≡ s mod 10 and idx ≡ b mod 12.
  // Solve via CRT (small enough to scan).
  for (let i = 0; i < 60; i++) {
    if (i % 10 === s && i % 12 === b) return i;
  }
  throw new Error(`Invalid sexagenary pair: ${stem}${branch}`);
}

export function bureauOf(stem: Stem, branch: Branch): Bureau {
  const idx = sexagenaryIndex(stem, branch);
  const element = NAYIN_BY_INDEX[idx]!;
  return BUREAU_TABLE[element];
}

/** Reference: STEMS/BRANCHES arrays exported for downstream use. */
export { STEMS, BRANCHES };
