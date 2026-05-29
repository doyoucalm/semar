/**
 * 大限 (Decade Limits) — the 10-year major luck periods of ZWDS.
 *
 * Rules (Chen Xiyi / 钦天派 standard):
 *
 * 1. STARTING AGE of the first 大限 = the bureau number (2..6).
 *    e.g. 土五局 → first limit begins at age 5 (before 5th birthday).
 *
 * 2. DIRECTION (CW or CCW around the palace board):
 *    - Yang year stem + Male  → Counter-clockwise (CCW)
 *    - Yang year stem + Female → Clockwise (CW)
 *    - Yin year stem + Male   → Clockwise (CW)
 *    - Yin year stem + Female → Counter-clockwise (CCW)
 *
 *    Yang stems: 甲 丙 戊 庚 壬 (index 0, 2, 4, 6, 8)
 *    Yin  stems: 乙 丁 己 辛 癸 (index 1, 3, 5, 7, 9)
 *
 * 3. SEQUENCE: starting from the 命宮 (Self palace) branch, move in
 *    the determined direction by one palace per 10-year period.
 *
 * 4. AGE CONVENTION: each 大限 is active from its start age (inclusive)
 *    to start age + 9 (inclusive). Age here is sui (虚岁): birth year = 1.
 *
 * Result: an array of 12 大限 records covering the full 120-year span
 * (practically the first 10-12 cover a lifetime).
 */

import { BRANCHES, branchPlus, branchIndex, type Branch, type Stem } from './constants.js';
import type { Palace } from './constants.js';

export interface DecadeLimit {
  /** The palace that governs this 大限. */
  readonly palace: Palace;
  /** The branch of that palace on the board. */
  readonly branch: Branch;
  /** Inclusive start age (sui, 虚岁). */
  readonly startAge: number;
  /** Inclusive end age. */
  readonly endAge: number;
  /** 1-indexed sequence number (first limit = 1). */
  readonly sequence: number;
}

/** Yang stems are at even indices in STEMS (甲=0, 丙=2, 戊=4, 庚=6, 壬=8). */
function isYangStem(stem: Stem): boolean {
  const idx = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'].indexOf(stem);
  return idx % 2 === 0;
}

/**
 * Determine the direction of 大限 progression.
 *
 * Returns +1 for clockwise (CW, forward through BRANCHES sub-index),
 * or -1 for counter-clockwise (CCW, backward).
 *
 * Convention: BRANCHES = ['子','丑','寅',...,'亥']. CW (+1) means
 * going in the OPPOSITE direction to the palace layout (the palace order
 * is CCW on the board, so "forward" through palace order = -1 in BRANCHES).
 *
 * In our implementation we track by BRANCH index:
 *   +1 → branch index increases (子→丑→寅... = clockwise on actual board)
 *   -1 → branch index decreases (子→亥→戌... = counter-clockwise on actual board)
 *
 * Mapping to 顺/逆:
 *   CCW (逆时针, going 子→亥→戌) = direction -1 in branch-index terms
 *   CW  (顺时针, going 子→丑→寅) = direction +1 in branch-index terms
 *
 * But in ZWDS terminology, 顺 (shùn) actually means FORWARD through the
 * palace counter (which is laid CCW on the board). To avoid confusion,
 * we define direction purely as the branch-index step.
 *
 * Rule applied (majority lineage):
 *   Yang year + Male    → CCW (限 branch goes -1 per 10 years)
 *   Yang year + Female  → CW  (+1)
 *   Yin  year + Male    → CW  (+1)
 *   Yin  year + Female  → CCW (-1)
 */
export function decadeLimitDirection(yearStem: Stem, gender: 'male' | 'female'): 1 | -1 {
  const yang = isYangStem(yearStem);
  const male = gender === 'male';
  // Yang+Male or Yin+Female → CCW = -1
  if (yang === male) return -1;
  return 1;
}

/**
 * Compute all 12 大限 starting from the 命宮 branch.
 *
 * @param selfBranch  Branch of the 命宮 (Self palace).
 * @param selfPalace  Name of the 命宮 palace.
 * @param bureauNumber  2..6 — determines starting age.
 * @param yearStem  Year heavenly stem.
 * @param gender    'male' | 'female'.
 * @param palaceByBranch  Map from branch to palace name (from placePalaces).
 */
export function computeDecadeLimits(
  selfBranch: Branch,
  selfPalace: Palace,
  bureauNumber: number,
  yearStem: Stem,
  gender: 'male' | 'female',
  palaceByBranch: ReadonlyMap<Branch, Palace>,
): readonly DecadeLimit[] {
  void selfPalace; // The first limit is always from 命宮 regardless of palace name.
  const dir = decadeLimitDirection(yearStem, gender);
  const limits: DecadeLimit[] = [];

  for (let i = 0; i < 12; i++) {
    const branch = branchPlus(selfBranch, dir * i);
    const palace = palaceByBranch.get(branch) ?? '命宫';
    const startAge = bureauNumber + i * 10;
    limits.push({
      palace,
      branch,
      startAge,
      endAge: startAge + 9,
      sequence: i + 1,
    });
  }

  return limits;
}

/**
 * Find the active 大限 for a given current age (sui / 虚岁).
 * Returns null if the age is before the first 大限 starts.
 */
export function activeDecadeLimit(
  limits: readonly DecadeLimit[],
  currentAge: number,
): DecadeLimit | null {
  for (const limit of limits) {
    if (currentAge >= limit.startAge && currentAge <= limit.endAge) return limit;
  }
  return null;
}

/**
 * Compute current sui age from birth year and current year.
 * Sui (虚岁): birth year counts as age 1; each Chinese New Year adds 1.
 * Simplified here as (currentYear - birthYear + 1) — accurate enough for
 * the decade-limit purpose (±1 near Chinese New Year).
 */
export function suiAge(birthYear: number, currentYear: number): number {
  return currentYear - birthYear + 1;
}
