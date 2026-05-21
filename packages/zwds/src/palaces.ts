/**
 * Place the twelve palaces around the chart.
 *
 * The board has the twelve branches arranged in a fixed clockwise order
 * starting from 寅 (lower-left), going around the square:
 *     寅 卯 辰 巳     (bottom row, left → right)
 *     丑           午    (left column ↑, right column ↓)
 *     子           未
 *     亥 戌 酉 申     (top row, right → left)
 *
 * For computation we just use the canonical BRANCHES array (子-亥) and
 * the chart's "forward" direction = increasing branch index (cw).
 *
 * 命宫 (Self palace) placement formula:
 *   1. Start at 寅. Step forward (cw) by (lunar_month - 1).
 *   2. From that month palace, step backward (ccw) by
 *      (hour_branch_index from 子), which is the index of the birth
 *      hour-branch (子=0, 丑=1, ..., 亥=11).
 *
 * 身宫 (Body palace) placement formula:
 *   1. Start at 寅. Step forward by (lunar_month - 1).
 *   2. From that month palace, step *forward* by hour_branch_index.
 *   The Body palace is the Self palace's "mirror" — it shows where the
 *   figure ends up over time, versus the inherent self.
 *
 * Once 命宫 is known, the other 11 palaces are placed counter-clockwise
 * from it in the canonical order: 命宫 → 兄弟 → 夫妻 → ...
 */

import {
  BRANCHES, PALACES, branchPlus, branchIndex, type Branch, type Palace,
} from './constants.js';

export interface PalaceAssignment {
  readonly palace: Palace;
  readonly branch: Branch;
}

export function selfPalaceBranch(lunarMonth: number, hourBranch: Branch): Branch {
  // Step forward by (lunarMonth - 1) from 寅 (= BRANCHES index 2).
  const monthPalace = branchPlus('寅', lunarMonth - 1);
  // Step backward (counter-clockwise) by hour-branch index.
  const hourIdx = branchIndex(hourBranch);
  return branchPlus(monthPalace, -hourIdx);
}

export function bodyPalaceBranch(lunarMonth: number, hourBranch: Branch): Branch {
  const monthPalace = branchPlus('寅', lunarMonth - 1);
  const hourIdx = branchIndex(hourBranch);
  return branchPlus(monthPalace, +hourIdx);
}

/**
 * Assign each of the 12 palaces to a branch, starting from 命宫 and
 * going counter-clockwise. Returns a `branch → palace` map and the
 * inverse `palace → branch` map.
 */
export function placePalaces(
  selfPalaceBranch: Branch,
): {
  byBranch: ReadonlyMap<Branch, Palace>;
  byPalace: ReadonlyMap<Palace, Branch>;
  assignments: readonly PalaceAssignment[];
} {
  const byBranch = new Map<Branch, Palace>();
  const byPalace = new Map<Palace, Branch>();
  const assignments: PalaceAssignment[] = [];
  for (let i = 0; i < 12; i++) {
    const branch = branchPlus(selfPalaceBranch, -i); // counter-clockwise
    const palace = PALACES[i]!;
    byBranch.set(branch, palace);
    byPalace.set(palace, branch);
    assignments.push({ palace, branch });
  }
  return { byBranch, byPalace, assignments };
}

/** Convenience: return the BRANCHES array (子..亥) in canonical order. */
export function allBranches(): readonly Branch[] {
  return BRANCHES;
}
