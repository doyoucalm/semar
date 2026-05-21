import {
  STEMS, BRANCHES,
  type Stem, type Branch, type StemIdx, type BranchIdx,
} from './constants.js';

export interface Pillar {
  readonly stem: Stem;
  readonly branch: Branch;
  readonly stemIdx: StemIdx;
  readonly branchIdx: BranchIdx;
  /** Combined stem+branch, e.g. "甲辰". */
  readonly name: string;
  /** Position in the 60-jiazi cycle (0–59). */
  readonly sexagenaryIndex: number;
}

export function pillarFromIndex(n: number): Pillar {
  const norm = ((n % 60) + 60) % 60;
  const stemIdx = (norm % 10) as StemIdx;
  const branchIdx = (norm % 12) as BranchIdx;
  return makePillar(stemIdx, branchIdx);
}

export function makePillar(stemIdx: StemIdx, branchIdx: BranchIdx): Pillar {
  // Valid stem-branch pairings must have matching parity (yang↔yang, yin↔yin).
  if (stemIdx % 2 !== branchIdx % 2) {
    throw new Error(
      `Invalid jiazi pair: ${STEMS[stemIdx]}${BRANCHES[branchIdx]} (parity mismatch)`,
    );
  }
  const stem = STEMS[stemIdx];
  const branch = BRANCHES[branchIdx];
  return {
    stem,
    branch,
    stemIdx,
    branchIdx,
    name: `${stem}${branch}`,
    sexagenaryIndex: sexagenaryIndexOf(stemIdx, branchIdx),
  };
}

/**
 * Given the stem index and branch index, return their combined position
 * in the 60-cycle. Uses the Chinese Remainder Theorem solution:
 *   N ≡ stem (mod 10) and N ≡ branch (mod 12), with gcd-aware step.
 */
export function sexagenaryIndexOf(stemIdx: StemIdx, branchIdx: BranchIdx): number {
  for (let n = 0; n < 60; n++) {
    if (n % 10 === stemIdx && n % 12 === branchIdx) return n;
  }
  throw new Error(`No 60-cycle position for stem=${stemIdx} branch=${branchIdx}`);
}
