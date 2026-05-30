/**
 * Enrichment layer on top of a basic BaziChart: hidden stems, ten gods,
 * element distribution, day-master strength, nayin per pillar, branch &
 * stem interactions, and shen sha.
 */

import type { BaziChart } from './engine.js';
import { hiddenStemsOf, type HiddenStem, type HiddenStemRole } from './hidden-stems.js';
import { tenGodOf, type TenGod } from './ten-gods.js';
import { nayinOfIndex, type Nayin } from './nayin.js';
import { elementDistribution, dayMasterStrength, type ElementCounts, type DayMasterStrength } from './elements.js';
import {
  findBranchInteractions, findStemInteractions,
  type BranchInteraction, type StemInteraction, type ChartPillars, type PillarSlot,
} from './interactions.js';
import { findShenSha, type StarHit } from './shen-sha.js';
import { computeUsefulGod, type UsefulGod } from './useful-god.js';
import { computeLuckPillars, type LuckPillars, type Gender } from './luck-pillars.js';

export interface PillarAnalysis {
  readonly slot: PillarSlot;
  readonly name: string;        // e.g. 乙丑
  readonly stem: string;
  readonly branch: string;
  /** Ten god of this pillar's stem relative to the day master. Null for the day pillar itself. */
  readonly stemTenGod: TenGod | null;
  readonly hiddenStems: ReadonlyArray<HiddenStem & { tenGod: TenGod }>;
  readonly nayin: Nayin;
}

export interface BaziAnalysis {
  readonly pillars: Record<PillarSlot, PillarAnalysis>;
  readonly elements: ElementCounts;
  readonly dayMasterStrength: DayMasterStrength;
  readonly branchInteractions: readonly BranchInteraction[];
  readonly stemInteractions: readonly StemInteraction[];
  readonly shenSha: readonly StarHit[];
  /** 用神 — favourable/unfavourable elements (扶抑法). Always computed. */
  readonly usefulGod: UsefulGod;
  /** 大运 — luck pillars. Present only when a gender is available. */
  readonly luckPillars?: LuckPillars;
}

export interface AnalyzeOptions {
  /** Gender for luck-pillar (大运) computation. Falls back to chart.birth.gender. */
  readonly gender?: Gender;
}

const SLOTS: readonly PillarSlot[] = ['year', 'month', 'day', 'hour'];

export function analyzeChart(chart: BaziChart, opts: AnalyzeOptions = {}): BaziAnalysis {
  const dayMaster = chart.day.stem;
  const cp: ChartPillars = {
    year:  { stem: chart.year.stem,  branch: chart.year.branch },
    month: { stem: chart.month.stem, branch: chart.month.branch },
    day:   { stem: chart.day.stem,   branch: chart.day.branch },
    hour:  { stem: chart.hour.stem,  branch: chart.hour.branch },
  };

  const pillars: Record<PillarSlot, PillarAnalysis> = {} as Record<PillarSlot, PillarAnalysis>;
  for (const slot of SLOTS) {
    const p = chart[slot];
    pillars[slot] = {
      slot,
      name: p.name,
      stem: p.stem,
      branch: p.branch,
      stemTenGod: slot === 'day' ? null : tenGodOf(dayMaster, p.stem),
      hiddenStems: hiddenStemsOf(p.branch).map((hs) => ({
        ...hs,
        tenGod: tenGodOf(dayMaster, hs.stem),
      })),
      nayin: nayinOfIndex(p.sexagenaryIndex),
    };
  }

  const distribution = elementDistribution([
    { stem: chart.year.stem,  branch: chart.year.branch },
    { stem: chart.month.stem, branch: chart.month.branch },
    { stem: chart.day.stem,   branch: chart.day.branch },
    { stem: chart.hour.stem,  branch: chart.hour.branch },
  ]);

  const strength = dayMasterStrength(dayMaster, distribution);
  const gender = opts.gender ?? chart.birth.gender;

  return {
    pillars,
    elements: distribution,
    dayMasterStrength: strength,
    branchInteractions: findBranchInteractions(cp),
    stemInteractions: findStemInteractions(cp),
    shenSha: findShenSha(cp),
    usefulGod: computeUsefulGod(dayMaster, distribution, strength),
    ...(gender ? { luckPillars: computeLuckPillars(chart, gender) } : {}),
  };
}
