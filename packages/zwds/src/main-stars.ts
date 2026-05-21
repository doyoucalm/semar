/**
 * Place the 14 main stars on the 12-palace board.
 *
 * Step 1 — find 紫微's branch.
 *   The lookup is the classical "紫微定位表": given the bureau number
 *   (2..6) and the lunar day (1..30), find a branch. The procedure
 *   (Ziwei Doushu Quanshu):
 *      Let n = bureau number (2 for 水, 3 for 木, 4 for 金, 5 for 土, 6 for 火).
 *      For each lunar day d, find integer k with d/n ≤ k (i.e. k = ceil(d/n)).
 *      Let r = k*n − d. (The "remainder" within the bureau.)
 *      Starting from 子, count k positions clockwise; this is the
 *      "candidate" position.
 *      If r is even, the candidate is 紫微.
 *      If r is odd, step backward (counter-clockwise) by r to find 紫微.
 *
 *   Equivalently, this is most commonly stored as a 30 × 5 table; we
 *   compute it directly and validate with one anchor (1985 lunar day 16 →
 *   Lucky's chart).
 *
 * Step 2 — place 紫微 group (6 stars including 紫微).
 *   From 紫微's branch, the rest go on fixed offsets:
 *     紫微 + 0 = 紫微
 *     紫微 − 1 (ccw) = 天机
 *     紫微 − 3 (ccw) = 太阳
 *     紫微 − 4 (ccw) = 武曲
 *     紫微 − 5 (ccw) = 天同
 *     紫微 − 8 (ccw) = 廉贞
 *
 *   (Equivalent to: 紫微, [empty 卯 only if needed], 天机, [empty],
 *    太阳, 武曲, 天同, [empty x2], 廉贞 — a fixed pattern.)
 *
 * Step 3 — find 天府's branch.
 *   天府 is on the mirror axis. The pair (紫微, 天府) is symmetric
 *   about the 寅-申 axis. Equivalently:
 *     天府 branch = reflection of 紫微 across the 寅↔申 axis.
 *
 *   Standard rule:
 *     If 紫微 at 寅, 天府 also at 寅.
 *     Else 天府 = (寅 - (紫微 - 寅 step distance from 寅)), counter-clockwise.
 *
 *   In branch-index arithmetic (using BRANCHES order 子..亥, index mod 12):
 *     idx(天府) = ((2 + 2 - idx(紫微)) mod 12 + 12) mod 12
 *              = (4 - idx(紫微)) mod 12
 *   (寅's index = 2; mirror around 寅 means idx(t府) = 2 - (idx(紫微) - 2) = 4 - idx(紫微).)
 *   Tested against the canonical table for 紫微 ∈ all 12 branches.
 *
 * Step 4 — place 天府 group (8 stars including 天府).
 *   From 天府's branch, in clockwise direction:
 *     天府 + 0 = 天府
 *     天府 + 1 = 太阴
 *     天府 + 2 = 贪狼
 *     天府 + 3 = 巨门
 *     天府 + 4 = 天相
 *     天府 + 5 = 天梁
 *     天府 + 6 = 七杀
 *     天府 + 10 = 破军   (the "back end" of the cycle, 4 positions before 天府)
 */

import {
  BRANCHES, branchIndex, branchPlus, MAIN_STARS,
  type Branch, type MainStar,
} from './constants.js';
import type { Bureau } from './bureau.js';

export interface StarPlacement {
  readonly star: MainStar;
  readonly branch: Branch;
}

/** Compute 紫微's branch from bureau and lunar day. */
export function ziweiBranch(bureau: Bureau, lunarDay: number): Branch {
  if (lunarDay < 1 || lunarDay > 30) {
    throw new Error(`lunar day must be 1..30, got ${lunarDay}`);
  }
  const n = bureau.number;
  const k = Math.ceil(lunarDay / n);
  const r = k * n - lunarDay;
  // Step k clockwise from 子 (子 index 0).
  let idx = (k - 1 + 12) % 12;
  // (the canonical formulation: count k positions starting *from* 子,
  //  inclusive, so the k-th position is k-1 steps after 子.)
  // If r odd, step backward by r.
  if (r % 2 === 1) {
    idx = (idx - r + 12 * 10) % 12;
  } else {
    idx = (idx + r + 12 * 10) % 12;
  }
  return BRANCHES[idx]!;
}

/** Compute 天府's branch from 紫微's branch (寅-axis mirror). */
export function tianfuBranch(ziwei: Branch): Branch {
  const idx = (4 - branchIndex(ziwei) + 12 * 10) % 12;
  return BRANCHES[idx]!;
}

/** Place all 14 main stars given 紫微 and 天府 branches. */
export function placeMainStars(
  ziwei: Branch,
  tianfu: Branch,
): readonly StarPlacement[] {
  // 紫微 group (offsets going counter-clockwise from 紫微)
  const ziweiGroup: ReadonlyArray<[MainStar, number]> = [
    ['紫微', 0],
    ['天机', -1],
    ['太阳', -3],
    ['武曲', -4],
    ['天同', -5],
    ['廉贞', -8],
  ];
  // 天府 group (offsets going clockwise from 天府)
  const tianfuGroup: ReadonlyArray<[MainStar, number]> = [
    ['天府', 0],
    ['太阴', 1],
    ['贪狼', 2],
    ['巨门', 3],
    ['天相', 4],
    ['天梁', 5],
    ['七杀', 6],
    ['破军', 10],
  ];

  const placements: StarPlacement[] = [];
  for (const [star, offset] of ziweiGroup) {
    placements.push({ star, branch: branchPlus(ziwei, offset) });
  }
  for (const [star, offset] of tianfuGroup) {
    placements.push({ star, branch: branchPlus(tianfu, offset) });
  }
  return placements;
}

/** Sanity check: ensures all 14 expected main stars were placed. */
export function validatePlacements(p: readonly StarPlacement[]): void {
  const placed = new Set(p.map((x) => x.star));
  for (const s of MAIN_STARS) {
    if (!placed.has(s)) throw new Error(`Main star ${s} not placed`);
  }
}
