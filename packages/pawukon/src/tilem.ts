/**
 * Tilem (new moon) + Purnama (full moon) detection via astronomy-engine.
 *
 * The Balinese sasih (lunar month) begins at Penanggal 1 = the civil day
 * AFTER the Tilem (new moon) at Bali local time (WITA, UTC+8). The Tilem
 * day itself is Panglong 15 (last day) of the previous sasih.
 *
 * astronomy-engine returns geocentric phase events. The lunar position is
 * essentially observer-independent at this resolution, so we don't pass
 * coordinates — we only need the local civil-date of the event for
 * calendrical labelling.
 */

import * as AstroNS from 'astronomy-engine';
import { gregorianToJDN } from './jdn.js';

// astronomy-engine ships as CJS with an ESM bridge. Node ESM exposes the
// whole module as `default`; vitest's interop pulls named exports onto the
// namespace directly. Handle both by preferring `default` when present.
const Astro = ((AstroNS as unknown as { default?: typeof AstroNS }).default ?? AstroNS);
const { SearchMoonPhase } = Astro;

const BALI_UTC_OFFSET_HOURS = 8; // WITA
const SYNODIC_MONTH_DAYS = 29.530589;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface LunarEvent {
  /** UTC instant of the new-moon (or full-moon) astronomical event. */
  readonly utcMs: number;
  /** Bali civil calendar date the event falls on. */
  readonly baliDate: { year: number; month: number; day: number };
  /** Julian Day Number of the Bali civil date. */
  readonly jdn: number;
}

function toBaliCivilDate(utcMs: number): {
  year: number;
  month: number;
  day: number;
} {
  const shifted = new Date(utcMs + BALI_UTC_OFFSET_HOURS * 60 * 60 * 1000);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

function eventFromAstro(utcMs: number): LunarEvent {
  const baliDate = toBaliCivilDate(utcMs);
  const jdn = gregorianToJDN(baliDate.year, baliDate.month, baliDate.day);
  return { utcMs, baliDate, jdn };
}

/**
 * Find the lunar phase event (0=Tilem/new moon, 180=Purnama/full moon) at or
 * after the given UTC instant.
 */
function searchPhaseForward(targetLon: 0 | 180, startUtcMs: number): LunarEvent | null {
  const start = new Date(startUtcMs);
  const t = SearchMoonPhase(targetLon, start, 40);
  if (!t) return null;
  return eventFromAstro(t.date.getTime());
}

/**
 * Find the Tilem (new moon) whose Bali civil date is AT OR BEFORE the given
 * target civil date. This Tilem starts the sasih the target date is in:
 * Penanggal 1 = the Tilem date itself in Balinese convention. (Tested:
 * Nyepi 2025-03-29 = Saka 1947 Day 1 = the same civil day as the Tilem.)
 */
export function findTilemStartingSasih(year: number, month: number, day: number): LunarEvent {
  const targetJdn = gregorianToJDN(year, month, day);
  // Start search 45 days before target to safely capture the current sasih's Tilem.
  const startUtcMs = Date.UTC(year, month - 1, day) - 45 * DAY_MS;

  let prev: LunarEvent | null = null;
  let cursor = startUtcMs;
  for (let iter = 0; iter < 5; iter++) {
    const event = searchPhaseForward(0, cursor);
    if (!event) break;
    if (event.jdn > targetJdn) break;
    prev = event;
    cursor = event.utcMs + DAY_MS; // step past this event
  }
  if (!prev) {
    throw new Error(
      `No Tilem found at or before ${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    );
  }
  return prev;
}

/** Find the next Tilem strictly after the given event. */
export function nextTilem(after: LunarEvent): LunarEvent {
  const event = searchPhaseForward(0, after.utcMs + DAY_MS);
  if (!event) throw new Error('No next Tilem within search window');
  return event;
}

/** Find the Purnama (full moon) between two consecutive Tilems. */
export function findPurnama(tilem: LunarEvent): LunarEvent {
  const event = searchPhaseForward(180, tilem.utcMs + DAY_MS);
  if (!event) throw new Error('No Purnama after given Tilem');
  return event;
}

/**
 * Count lunations between two Tilems. Uses round((Δt) / synodic month) so
 * it's robust to lunation-length variation (~29.27 to ~29.83 days).
 */
export function lunationsBetween(earlier: LunarEvent, later: LunarEvent): number {
  const days = (later.utcMs - earlier.utcMs) / DAY_MS;
  return Math.round(days / SYNODIC_MONTH_DAYS);
}
