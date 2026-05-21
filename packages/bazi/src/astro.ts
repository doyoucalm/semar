/**
 * Wraps astronomy-engine to compute the exact UTC moment when the Sun's
 * apparent ecliptic longitude reaches a given multiple of 15° — i.e. when
 * a given solar term commences.
 *
 * The HKO data fixes the *date*; this module computes the *time* and
 * cross-checks the date against HKO as a correctness gate.
 */

import * as AstroNS from 'astronomy-engine';
import { loadHkoData, type TermKey } from './data.js';

// astronomy-engine ships as CJS with an ESM bridge. Node ESM exposes the
// whole module as `default`; vitest's interop pulls named exports onto the
// namespace directly. Handle both by preferring `default` when present.
const Astro = ((AstroNS as unknown as { default?: typeof AstroNS }).default ?? AstroNS);
const { AstroTime, SearchSunLongitude } = Astro;

interface TermMoment {
  readonly key: TermKey;
  readonly year: number;
  readonly utcMs: number;
}

const cache = new Map<string, TermMoment>();

/**
 * Returns the precise UTC instant when the given solar term occurs in the
 * given year. Year here means the calendar year on which the term's HKO
 * date falls — that is the search anchor.
 */
export function solarTermMoment(termKey: TermKey, year: number): TermMoment {
  const cacheKey = `${termKey}@${year}`;
  const hit = cache.get(cacheKey);
  if (hit) return hit;

  const data = loadHkoData();
  const meta = data.terms.find((t) => t.key === termKey);
  if (!meta) throw new Error(`Unknown term ${termKey}`);

  // Use HKO's published date as the search anchor: start 2 days before
  // its midnight UTC, search forward 5 days. That window comfortably
  // contains the actual moment regardless of timezone or HKO rounding.
  const hkoRow = data.entries.find((e) => e.year === year && e.termKey === termKey);
  if (!hkoRow) {
    throw new Error(`No HKO entry for ${termKey} ${year} (range is ${data.yearRange[0]}..${data.yearRange[1]})`);
  }

  const [y, m, d] = hkoRow.date.split('-').map(Number) as [number, number, number];
  const anchor = new Date(Date.UTC(y, m - 1, d) - 2 * 86400_000);
  const moment = SearchSunLongitude(meta.longitude, new AstroTime(anchor), 5);
  if (!moment) {
    throw new Error(`SearchSunLongitude returned null for ${termKey} ${year}`);
  }

  const utcMs = moment.date.getTime();
  const result: TermMoment = { key: termKey, year, utcMs };
  cache.set(cacheKey, result);
  return result;
}

/**
 * Validate that astronomy-engine's computed UTC moment falls on the same
 * Gregorian date HKO publishes, when both are expressed in HKT (UTC+8).
 * If this ever returns false, we have either an HKO data row error or an
 * algorithm bug — both worth surfacing.
 */
export function validateAgainstHko(termKey: TermKey, year: number): {
  ok: boolean;
  hkoDate: string;
  astroDateHkt: string;
} {
  const data = loadHkoData();
  const hkoRow = data.entries.find((e) => e.year === year && e.termKey === termKey);
  if (!hkoRow) throw new Error(`No HKO entry for ${termKey} ${year}`);

  const { utcMs } = solarTermMoment(termKey, year);
  const hkt = new Date(utcMs + 8 * 3600_000);
  const astroDateHkt = hkt.toISOString().slice(0, 10);

  return {
    ok: astroDateHkt === hkoRow.date,
    hkoDate: hkoRow.date,
    astroDateHkt,
  };
}
