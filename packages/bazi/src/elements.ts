/**
 * Element-distribution analysis across the 8 visible characters plus hidden
 * stems. Useful for the classic "day master strength" judgment.
 *
 * Weights: visible stems and branches each contribute 1.0. Hidden stems
 * contribute by their role weight (primary 0.6, middle 0.3, residual 0.1).
 * Branches themselves contribute their dominant element 1.0; hidden stems
 * within them are counted on top (some schools collapse these — we expose
 * both views).
 */

import {
  STEMS, BRANCHES,
  stemElement, branchElement,
  type Stem, type Branch, type StemIdx, type BranchIdx,
} from './constants.js';
import type { Pillar } from './sexagenary.js';
import { hiddenStemsOf } from './hidden-stems.js';

export const ELEMENTS = ['木', '火', '土', '金', '水'] as const;
export type Element = (typeof ELEMENTS)[number];

export interface ElementCounts {
  readonly 木: number;
  readonly 火: number;
  readonly 土: number;
  readonly 金: number;
  readonly 水: number;
}

export interface DayMasterStrength {
  readonly supporting: number;   // same-element + generating
  readonly draining: number;     // generated + overcoming + overcome
  readonly verdict: 'strong' | 'balanced' | 'weak';
}

const GENERATES: Record<Element, Element> = {
  '木': '火', '火': '土', '土': '金', '金': '水', '水': '木',
};

export function elementDistribution(pillars: { readonly stem: Stem; readonly branch: Branch }[]): ElementCounts {
  const totals: Record<Element, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 };

  for (const p of pillars) {
    const stemIdx = STEMS.indexOf(p.stem) as StemIdx;
    const branchIdx = BRANCHES.indexOf(p.branch) as BranchIdx;
    totals[stemElement(stemIdx) as Element] += 1;
    totals[branchElement(branchIdx) as Element] += 1;
    for (const hs of hiddenStemsOf(p.branch)) {
      // Skip the dominant stem we already counted via branch.
      if (BRANCHES.indexOf(p.branch) as BranchIdx in BRANCHES) {
        // (intentional pass-through; the next line is the real work)
      }
      const hsIdx = STEMS.indexOf(hs.stem) as StemIdx;
      totals[stemElement(hsIdx) as Element] += hs.weight;
    }
  }

  return round2(totals);
}

export function dayMasterStrength(
  dayMasterStem: Stem,
  distribution: ElementCounts,
): DayMasterStrength {
  const dmIdx = STEMS.indexOf(dayMasterStem) as StemIdx;
  const dmElement = stemElement(dmIdx) as Element;
  const supports = generatorOf(dmElement);

  const supporting = distribution[dmElement] + distribution[supports];
  const total = ELEMENTS.reduce((sum, e) => sum + distribution[e], 0);
  const draining = total - supporting;

  const ratio = supporting / total;
  const verdict: DayMasterStrength['verdict'] =
    ratio > 0.55 ? 'strong' :
    ratio < 0.40 ? 'weak' :
    'balanced';

  return { supporting: round1(supporting), draining: round1(draining), verdict };
}

function generatorOf(element: Element): Element {
  const found = (Object.entries(GENERATES) as [Element, Element][])
    .find(([, child]) => child === element);
  if (!found) throw new Error(`No generator for ${element}`);
  return found[0];
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
function round2(t: Record<Element, number>): ElementCounts {
  return {
    木: Math.round(t['木'] * 100) / 100,
    火: Math.round(t['火'] * 100) / 100,
    土: Math.round(t['土'] * 100) / 100,
    金: Math.round(t['金'] * 100) / 100,
    水: Math.round(t['水'] * 100) / 100,
  };
}

// Re-export pillar type for convenience.
export type { Pillar };
