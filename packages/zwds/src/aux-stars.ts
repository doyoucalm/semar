/**
 * Auxiliary star placement: 六吉 (six auspicious) + 六煞 (six inauspicious).
 *
 * Unlike the 14 main stars, aux stars do not participate in 四化. Each
 * aux star has its own placement rule keyed off year stem, year branch,
 * lunar month, or hour branch.
 *
 * Sources cross-checked against 紫微斗数全书 (Chen Xiyi tradition) and the
 * standard 钦天派 placement tables. Where lineages disagree (notably 庚 stem
 * for 天魁/天钺), the 甲戊庚→丑未 majority assignment is used.
 *
 * ┌────────┬──────────────────────────────┬────────────────────────────────────┐
 * │ Star   │ Keyed off                    │ Rule                               │
 * ├────────┼──────────────────────────────┼────────────────────────────────────┤
 * │ 文昌   │ hour branch                  │ idx = (10 − hourIdx) mod 12        │
 * │ 文曲   │ hour branch                  │ idx = (4 + hourIdx) mod 12         │
 * │ 左辅   │ lunar month                  │ idx = (3 + month) mod 12           │
 * │ 右弼   │ lunar month                  │ idx = (11 − month) mod 12          │
 * │ 天魁   │ year stem (yang noble)       │ lookup                              │
 * │ 天钺   │ year stem (yin noble)        │ lookup                              │
 * │ 擎羊   │ year stem (禄存 + 1)         │ derived                             │
 * │ 陀罗   │ year stem (禄存 − 1)         │ derived                             │
 * │ 火星   │ year branch trine + hour     │ start + hourIdx (forward)          │
 * │ 铃星   │ year branch trine + hour     │ start + hourIdx (forward)          │
 * │ 地劫   │ hour branch                  │ idx = (11 + hourIdx) mod 12        │
 * │ 地空   │ hour branch                  │ idx = (11 − hourIdx) mod 12        │
 * └────────┴──────────────────────────────┴────────────────────────────────────┘
 */

import {
  BRANCHES, branchIndex, branchPlus,
  type Branch, type Stem,
  type AuxStar,
} from './constants.js';

export interface AuxPlacement {
  readonly star: AuxStar;
  readonly branch: Branch;
}

// ─── 六吉 ──────────────────────────────────────────────────────────────────

export function wenchangBranch(hour: Branch): Branch {
  const idx = (10 - branchIndex(hour) + 12) % 12;
  return BRANCHES[idx]!;
}

export function wenquBranch(hour: Branch): Branch {
  const idx = (4 + branchIndex(hour)) % 12;
  return BRANCHES[idx]!;
}

/** 左辅: from 辰 forward, month 1..12. */
export function zuofuBranch(lunarMonth: number): Branch {
  const idx = (3 + lunarMonth) % 12;
  return BRANCHES[idx]!;
}

/** 右弼: from 戌 backward, month 1..12. */
export function youbiBranch(lunarMonth: number): Branch {
  const idx = (11 - lunarMonth + 12 * 10) % 12;
  return BRANCHES[idx]!;
}

/**
 * 天魁/天钺 — yang and yin noble. Lookup by year stem.
 *
 * Classical mnemonic 歌诀:
 *   甲戊庚牛羊  → 丑/未
 *   乙己鼠猴乡  → 子/申
 *   丙丁猪鸡位  → 亥/酉
 *   六辛逢马虎  → 午/寅
 *   壬癸兔蛇藏  → 卯/巳
 *
 * Convention: 天魁 = yang (the first of the pair); 天钺 = yin (the second).
 */
const NOBLE_TABLE: Record<Stem, { kui: Branch; yue: Branch }> = {
  '甲': { kui: '丑', yue: '未' },
  '乙': { kui: '子', yue: '申' },
  '丙': { kui: '亥', yue: '酉' },
  '丁': { kui: '亥', yue: '酉' },
  '戊': { kui: '丑', yue: '未' },
  '己': { kui: '子', yue: '申' },
  '庚': { kui: '丑', yue: '未' },
  '辛': { kui: '午', yue: '寅' },
  '壬': { kui: '卯', yue: '巳' },
  '癸': { kui: '卯', yue: '巳' },
};

export function tiankuiBranch(yearStem: Stem): Branch {
  return NOBLE_TABLE[yearStem].kui;
}

export function tianyueBranch(yearStem: Stem): Branch {
  return NOBLE_TABLE[yearStem].yue;
}

// ─── 六煞 ──────────────────────────────────────────────────────────────────

/**
 * 禄存 placement by year stem.
 *
 * 甲禄在寅 / 乙禄在卯 / 丙戊禄在巳 / 丁己禄在午 /
 * 庚禄在申 / 辛禄在酉 / 壬禄在亥 / 癸禄在子
 */
const LUCUN_TABLE: Record<Stem, Branch> = {
  '甲': '寅', '乙': '卯',
  '丙': '巳', '丁': '午',
  '戊': '巳', '己': '午',
  '庚': '申', '辛': '酉',
  '壬': '亥', '癸': '子',
};

/** 禄存 itself — a luck-bearing point (not in the 六煞 list, but its
 *  placement is the anchor for both 擎羊 and 陀罗). Exported so the
 *  engine can render it alongside the others. */
export function lucunBranch(yearStem: Stem): Branch {
  return LUCUN_TABLE[yearStem];
}

/** 擎羊: one step clockwise (forward) from 禄存. */
export function qingyangBranch(yearStem: Stem): Branch {
  return branchPlus(LUCUN_TABLE[yearStem], 1);
}

/** 陀罗: one step counter-clockwise (backward) from 禄存. */
export function tuoluoBranch(yearStem: Stem): Branch {
  return branchPlus(LUCUN_TABLE[yearStem], -1);
}

/**
 * 火星 / 铃星 starting branch by year-branch trine.
 *
 * Classical mnemonic:
 *   寅午戌人  → 火丑铃卯
 *   申子辰人  → 火寅铃戌
 *   巳酉丑人  → 火卯铃戌
 *   亥卯未人  → 火酉铃戌
 *
 * Then count forward (clockwise) by the hour-branch index (子=0 .. 亥=11).
 *
 * NB: some Northern-派 lineages add a male/female reverse rule. We follow
 * the canonical 钦天/中州 version which is gender-invariant — matches the
 * majority of modern computation software.
 */
function fireBellTrine(yearBranch: Branch): { fire: Branch; bell: Branch } {
  const yb = yearBranch;
  if (yb === '寅' || yb === '午' || yb === '戌') return { fire: '丑', bell: '卯' };
  if (yb === '申' || yb === '子' || yb === '辰') return { fire: '寅', bell: '戌' };
  if (yb === '巳' || yb === '酉' || yb === '丑') return { fire: '卯', bell: '戌' };
  return { fire: '酉', bell: '戌' }; // 亥卯未
}

export function huoxingBranch(yearBranch: Branch, hour: Branch): Branch {
  const start = fireBellTrine(yearBranch).fire;
  return branchPlus(start, branchIndex(hour));
}

export function lingxingBranch(yearBranch: Branch, hour: Branch): Branch {
  const start = fireBellTrine(yearBranch).bell;
  return branchPlus(start, branchIndex(hour));
}

/** 地劫: from 亥, count forward by hour idx. */
export function dijieBranch(hour: Branch): Branch {
  const idx = (11 + branchIndex(hour)) % 12;
  return BRANCHES[idx]!;
}

/** 地空: from 亥, count backward by hour idx. */
export function dikongBranch(hour: Branch): Branch {
  const idx = (11 - branchIndex(hour) + 12 * 10) % 12;
  return BRANCHES[idx]!;
}

// ─── Aggregate ─────────────────────────────────────────────────────────────

export interface AuxPlacementContext {
  readonly yearStem: Stem;
  readonly yearBranch: Branch;
  readonly lunarMonth: number;
  readonly hour: Branch;
}

/** Compute all 12 aux-star placements (六吉 + 六煞) for a chart. */
export function placeAuxStars(ctx: AuxPlacementContext): readonly AuxPlacement[] {
  return [
    { star: '文昌', branch: wenchangBranch(ctx.hour) },
    { star: '文曲', branch: wenquBranch(ctx.hour) },
    { star: '左辅', branch: zuofuBranch(ctx.lunarMonth) },
    { star: '右弼', branch: youbiBranch(ctx.lunarMonth) },
    { star: '天魁', branch: tiankuiBranch(ctx.yearStem) },
    { star: '天钺', branch: tianyueBranch(ctx.yearStem) },
    { star: '擎羊', branch: qingyangBranch(ctx.yearStem) },
    { star: '陀罗', branch: tuoluoBranch(ctx.yearStem) },
    { star: '火星', branch: huoxingBranch(ctx.yearBranch, ctx.hour) },
    { star: '铃星', branch: lingxingBranch(ctx.yearBranch, ctx.hour) },
    { star: '地空', branch: dikongBranch(ctx.hour) },
    { star: '地劫', branch: dijieBranch(ctx.hour) },
  ];
}
