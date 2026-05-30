/**
 * 大运 — Luck Pillars (decade luck cycles).
 *
 * Each luck pillar governs ~10 years of life. Together with 流年 (annual
 * pillars) they are the *timing* layer of BaZi: the natal chart says what
 * you are, the luck pillars say when it activates.
 *
 * Algorithm (classical):
 *
 * 1. Direction (顺/逆) depends on the YEAR-stem polarity and gender:
 *      阳年 male   → forward (顺行)
 *      阴年 female → forward (顺行)
 *      阴年 male   → backward (逆行)
 *      阳年 female → backward (逆行)
 *    i.e. forward when (yearStemIsYang === isMale).
 *
 * 2. The pillars step through the 60-cycle starting from the MONTH pillar:
 *      forward  → month+1, month+2, month+3 …
 *      backward → month−1, month−2, month−3 …
 *
 * 3. Starting age (起运) = distance from birth to the bracketing 節
 *    (the month-commencing minor solar term) in the direction of travel,
 *    converted at the classical rate **3 days of life = 1 year of luck**:
 *      forward  → count to the NEXT 節 after birth
 *      backward → count to the PREVIOUS 節 before birth
 *
 * Solar-term moments come from the same astronomically-precise source
 * (astronomy-engine + HKO) the month pillar uses, so the start age is exact
 * rather than table-rounded.
 */

import type { BaziChart } from './engine.js';
import { pillarFromIndex, type Pillar } from './sexagenary.js';
import { tenGodOf, type TenGod } from './ten-gods.js';
import { MINOR_TERMS_ORDER, termMeta } from './data.js';
import { solarTermMoment } from './astro.js';

export type Gender = 'male' | 'female';

const DAY_MS = 86_400_000;

export interface LuckPillar {
  /** 1-based ordinal (1 = first decade of luck). */
  readonly index: number;
  readonly pillar: Pillar;
  /** Western age (decimal years) at which this pillar begins. */
  readonly startAge: number;
  /** Western age at which it ends (= next pillar's startAge). */
  readonly endAge: number;
  /** Gregorian year this pillar begins (approximate — based on start age). */
  readonly startYear: number;
  /** Ten god of this pillar's stem relative to the natal day master. */
  readonly stemTenGod: TenGod;
}

export interface LuckPillars {
  readonly gender: Gender;
  /** True if the cycle runs forward (顺行) through the 60-cycle. */
  readonly forward: boolean;
  /** Age (decimal years) at which the first luck pillar starts (起运). */
  readonly startAge: number;
  /** Convenience breakdown of startAge into whole years + months. */
  readonly startAgeYM: { years: number; months: number };
  readonly pillars: readonly LuckPillar[];
}

/**
 * Compute the luck-pillar cycle for a chart.
 *
 * @param chart   A computed BaziChart.
 * @param gender  Birth gender. Falls back to `chart.birth.gender` if omitted.
 * @param count   How many decade pillars to generate (default 9 ≈ 90 years).
 */
export function computeLuckPillars(
  chart: BaziChart,
  gender?: Gender,
  count = 9,
): LuckPillars {
  const g = gender ?? chart.birth.gender;
  if (g !== 'male' && g !== 'female') {
    throw new Error('computeLuckPillars requires gender ("male" | "female")');
  }

  const yearStemIsYang = chart.year.stemIdx % 2 === 0;
  const isMale = g === 'male';
  const forward = yearStemIsYang === isMale;

  // Start age: distance to the bracketing 節 in the direction of travel.
  const { nextMs, prevMs } = bracketingTermMoments(chart.utcMs);
  const targetMs = forward ? nextMs : prevMs;
  const daysDiff = Math.abs(targetMs - chart.utcMs) / DAY_MS;
  const startAge = round2(daysDiff / 3); // 3 days of life = 1 year of luck

  const dayMaster = chart.day.stem;
  const monthIdx = chart.month.sexagenaryIndex;

  const pillars: LuckPillar[] = [];
  for (let i = 1; i <= count; i++) {
    const cycleIdx = forward ? monthIdx + i : monthIdx - i;
    const pillar = pillarFromIndex(cycleIdx);
    const pillarStartAge = round2(startAge + (i - 1) * 10);
    pillars.push({
      index: i,
      pillar,
      startAge: pillarStartAge,
      endAge: round2(pillarStartAge + 10),
      startYear: chart.birth.year + Math.floor(pillarStartAge),
      stemTenGod: tenGodOf(dayMaster, pillar.stem),
    });
  }

  return {
    gender: g,
    forward,
    startAge,
    startAgeYM: toYearsMonths(startAge),
    pillars,
  };
}

/**
 * Find the UTC moments of the 節 (month-commencing minor terms) immediately
 * before and after a birth instant. The 12 節 are exactly MINOR_TERMS_ORDER.
 */
function bracketingTermMoments(birthUtcMs: number): { prevMs: number; nextMs: number } {
  const probeYear = new Date(birthUtcMs).getUTCFullYear();
  const moments: number[] = [];

  for (const year of [probeYear - 1, probeYear, probeYear + 1]) {
    for (const key of MINOR_TERMS_ORDER) {
      const meta = termMeta(key);
      if (!meta.monthBranch) continue;
      try {
        moments.push(solarTermMoment(key, year).utcMs);
      } catch {
        // out-of-range year; skip
      }
    }
  }
  moments.sort((a, b) => a - b);

  let prevMs = -Infinity;
  let nextMs = Infinity;
  for (const m of moments) {
    if (m <= birthUtcMs && m > prevMs) prevMs = m;
    if (m > birthUtcMs && m < nextMs) nextMs = m;
  }
  if (!Number.isFinite(prevMs) || !Number.isFinite(nextMs)) {
    throw new Error('Could not bracket birth between two 節 — birth near data range edge');
  }
  return { prevMs, nextMs };
}

function toYearsMonths(age: number): { years: number; months: number } {
  const years = Math.floor(age);
  const months = Math.round((age - years) * 12);
  return months === 12 ? { years: years + 1, months: 0 } : { years, months };
}

function round2(n: number): number { return Math.round(n * 100) / 100; }
