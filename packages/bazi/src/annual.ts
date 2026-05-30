/**
 * 流年 — Annual Pillars (yearly fortune).
 *
 * For any Gregorian year, the annual pillar is that year's stem-branch in the
 * 60-cycle. Read against the natal chart it tells you how the year's energy
 * relates to the day master (via Ten Gods) and which natal pillars it
 * activates (via branch combinations / clashes).
 *
 * Boundary note: the BaZi year flips at 立春 (Lichun, ~Feb 4), not Jan 1. The
 * stem-branch here is keyed to the BaZi year via the classical (year − 4)
 * formula. For a date in Jan/early-Feb, pass the BaZi year (Gregorian − 1).
 */

import type { BaziChart } from './engine.js';
import { pillarFromIndex, type Pillar } from './sexagenary.js';
import type { StemIdx, BranchIdx } from './constants.js';
import { tenGodOf, type TenGod } from './ten-gods.js';
import { hiddenStemsOf } from './hidden-stems.js';
import { pairBranchRelations, type BranchInteraction, type PillarSlot } from './interactions.js';

export interface NatalBranchHit {
  readonly slot: PillarSlot;
  readonly natalBranch: string;
  readonly relations: readonly BranchInteraction[];
}

export interface AnnualFortune {
  readonly year: number;
  readonly pillar: Pillar;
  /** Ten god of the annual stem vs the natal day master. */
  readonly stemTenGod: TenGod;
  /** Ten gods of the annual branch's hidden stems vs the day master. */
  readonly branchTenGods: readonly TenGod[];
  /** Branch interactions between the annual branch and each natal branch. */
  readonly natalHits: readonly NatalBranchHit[];
}

/** The stem-branch pillar of a given BaZi year via the (year − 4) formula. */
export function computeAnnualPillar(baziYear: number): Pillar {
  const stemIdx = ((((baziYear - 4) % 10) + 10) % 10) as StemIdx;
  const branchIdx = ((((baziYear - 4) % 12) + 12) % 12) as BranchIdx;
  // pillarFromIndex needs the 60-cycle position; derive it from stem+branch.
  // Year N maps to cycle index ((N-4) mod 60).
  return pillarFromIndex(((baziYear - 4) % 60 + 60) % 60);
}

/** Annual fortune for one BaZi year, read against a natal chart. */
export function annualFortune(chart: BaziChart, baziYear: number): AnnualFortune {
  const pillar = computeAnnualPillar(baziYear);
  const dayMaster = chart.day.stem;

  const slots: readonly PillarSlot[] = ['year', 'month', 'day', 'hour'];
  const natalHits: NatalBranchHit[] = [];
  for (const slot of slots) {
    const natalBranch = chart[slot].branch;
    const relations = pairBranchRelations(pillar.branch, natalBranch)
      .map((r) => ({ ...r, slots: [slot] as const }));
    if (relations.length > 0) {
      natalHits.push({ slot, natalBranch, relations });
    }
  }

  return {
    year: baziYear,
    pillar,
    stemTenGod: tenGodOf(dayMaster, pillar.stem),
    branchTenGods: hiddenStemsOf(pillar.branch).map((hs) => tenGodOf(dayMaster, hs.stem)),
    natalHits,
  };
}

/** Annual fortunes for an inclusive range of BaZi years. */
export function annualRange(chart: BaziChart, fromYear: number, toYear: number): AnnualFortune[] {
  if (toYear < fromYear) throw new Error('toYear must be >= fromYear');
  const out: AnnualFortune[] = [];
  for (let y = fromYear; y <= toYear; y++) out.push(annualFortune(chart, y));
  return out;
}
