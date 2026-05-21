/**
 * Gregorian → Chinese lunisolar calendar conversion.
 *
 * The Chinese lunar calendar:
 *   - Months begin at new moons (astronomical conjunction Sun-Moon).
 *   - A regular year contains 12 lunar months.
 *   - Periodically a 13th leap month is inserted to keep the calendar
 *     synchronized with solar terms (中气).
 *
 * The leap-month rule (since 1645, Shixian calendar):
 *   - Number lunar months 11, 12, 1, 2, ..., 10 such that the lunar
 *     month containing 冬至 (winter solstice) is month 11.
 *   - A lunar year (suì) runs from one winter-solstice month to the
 *     next. It contains either 12 lunar months (no leap) or 13 (leap).
 *   - If 13, the leap month is the first lunar month inside the suì
 *     that contains no 中气 (major solar term). It is labelled "leap"
 *     of the preceding month (闰N月).
 *
 * Day boundary: a lunar day boundary is local-civil midnight at the
 * calendar's home meridian. The modern Chinese civil calendar uses
 * Beijing time (UTC+8). For Asia/Jakarta (UTC+7) the difference is
 * small but can shift day-of-month near boundaries; we honour the
 * caller's UTC offset so most birth records line up with the official
 * lunar date a Chinese astrologer would use.
 *
 * Range: tested 1900–2100. Outside that range Astronomy Engine still
 * works but we do not validate.
 */

import * as AstroNS from 'astronomy-engine';

const Astro = ((AstroNS as unknown as { default?: typeof AstroNS }).default ?? AstroNS);
const { SearchMoonPhase, AstroTime, SunPosition } = Astro;
type AstroTime = InstanceType<typeof AstroNS.AstroTime>;

const DAY_MS = 86_400_000;

export interface LunarDate {
  /** Sui-based lunar year — see note below. */
  readonly year: number;
  /** 1..12. */
  readonly month: number;
  /** True if this is the leap version of `month`. */
  readonly isLeapMonth: boolean;
  /** 1..30. */
  readonly day: number;
}

/**
 * Convert a Gregorian moment to the Chinese lunisolar date.
 *
 * `utcMs` is the UTC instant of birth.
 * `tzOffsetMinutes` is the local UTC offset at the birth location
 *   (Beijing/Bandung = +480 / +420). Required because the lunar
 *   calendar date boundary follows local midnight.
 *
 * The returned `year` is the Gregorian year of the lunar new year that
 * starts this lunar year — i.e. the year that holds 春节. Lunar
 * months 11 and 12 of a given lunar year fall in the *next* Gregorian
 * year; the lunar `year` field stays anchored to the starting Gregorian
 * year so it matches the convention of Chinese almanacs.
 */
export function toLunar(utcMs: number, tzOffsetMinutes: number): LunarDate {
  // Local date midnight: the wall-clock instant 00:00 on the local
  // calendar day of `utcMs`.
  const localMs = utcMs + tzOffsetMinutes * 60_000;
  const localDate = new Date(localMs);
  // Reset to local-midnight of birth's wall-clock date:
  const localY = localDate.getUTCFullYear();
  const localM = localDate.getUTCMonth();
  const localD = localDate.getUTCDate();
  const localMidnightUtcMs = Date.UTC(localY, localM, localD) - tzOffsetMinutes * 60_000;

  // Find the most recent new moon at or before local midnight.
  // SearchMoonPhase(0, time, limitDays) searches forward; to go
  // backwards we ask it for the last conjunction within a 40-day window
  // before local midnight.
  const monthStartUtcMs = lastNewMoonBefore(localMidnightUtcMs + 1);

  // Determine the lunar month/year through the suì rule.
  const suiInfo = locateMonth(monthStartUtcMs, tzOffsetMinutes);

  // Day of month: local-midnight day count since the month-start new moon.
  // The month-start new moon's *day* is lunar day 1.
  const monthStartLocalMidnight = localMidnightOf(monthStartUtcMs, tzOffsetMinutes);
  const localMidnightOfBirth = localMidnightUtcMs;
  const day = 1 + Math.round((localMidnightOfBirth - monthStartLocalMidnight) / DAY_MS);

  return {
    year: suiInfo.year,
    month: suiInfo.month,
    isLeapMonth: suiInfo.isLeapMonth,
    day,
  };
}

/**
 * Position the month containing `monthStartUtcMs` (a new moon's UTC ms)
 * within the suì-based numbering system. Returns the lunar
 * year/month/leap flag for this new-moon month.
 */
function locateMonth(
  monthStartUtcMs: number,
  tzOffsetMinutes: number,
): { year: number; month: number; isLeapMonth: boolean } {
  // 1. Find 冬至 (winter solstice, Sun ecliptic longitude = 270°) that
  //    bounds the suì containing this new moon.
  const newMoonLocalDate = new Date(monthStartUtcMs + tzOffsetMinutes * 60_000);
  const ny = newMoonLocalDate.getUTCFullYear();

  const dongzhiPrev = winterSolsticeUtcMs(ny - 1);
  const dongzhiThis = winterSolsticeUtcMs(ny);
  const dongzhiNext = winterSolsticeUtcMs(ny + 1);

  // The suì containing this new-moon month: the suì from dongzhi(N-1)
  // to dongzhi(N), or dongzhi(N) to dongzhi(N+1).
  let suiStartSolstice: number;
  let suiEndSolstice: number;
  let suiAnchorYear: number; // Gregorian year of the lunar new year (春节)
  if (monthStartUtcMs >= dongzhiThis) {
    suiStartSolstice = dongzhiThis;
    suiEndSolstice = dongzhiNext;
    // The lunar new year of this suì falls in (ny + 1).
    suiAnchorYear = ny + 1;
  } else {
    suiStartSolstice = dongzhiPrev;
    suiEndSolstice = dongzhiThis;
    suiAnchorYear = ny;
  }

  // 2. List all new moons within the suì, plus the suì-end new moon.
  const monthsInSui = listMonthStarts(suiStartSolstice, suiEndSolstice);
  // monthsInSui[0] is the new moon at-or-before the start solstice
  // (which is month 11). monthsInSui[k] is month (11 + k) mod 12.

  const monthIndexInSui = monthsInSui.findIndex(
    (ms) => sameNewMoon(ms, monthStartUtcMs),
  );
  if (monthIndexInSui < 0) {
    throw new Error(`Lunar conversion: month-start ${new Date(monthStartUtcMs).toISOString()} not found in suì.`);
  }

  // 3. Determine if this suì has a leap month.
  // A suì has 12 or 13 months between dongzhi(N) (inclusive of the
  // month containing it) and dongzhi(N+1) (exclusive of the month
  // containing it). The standard rule: 13 months ⇒ leap; insert leap
  // at the first month with no 中气.
  const hasLeap = monthsInSui.length === 13;
  const leapIdx = hasLeap ? findFirstMonthWithoutZhongqi(monthsInSui, tzOffsetMinutes) : -1;

  // 4. Compute month number and leap flag for monthIndexInSui.
  // monthsInSui[0] = month 11; consecutive months increment unless a
  // leap month falls before this index, in which case the leap month
  // itself takes the previous month's number and "isLeap" is true.
  let month: number;
  let isLeapMonth = false;
  if (!hasLeap || monthIndexInSui < leapIdx) {
    month = ((11 + monthIndexInSui - 1) % 12) + 1;
  } else if (monthIndexInSui === leapIdx) {
    // Leap month takes the previous month's number.
    month = ((11 + (leapIdx - 1) - 1) % 12) + 1;
    isLeapMonth = true;
  } else {
    month = ((11 + (monthIndexInSui - 1) - 1) % 12) + 1;
  }

  return { year: suiAnchorYear, month, isLeapMonth };
}

/** List new-moon UTC ms in [solsticeStart, solsticeEnd]. */
function listMonthStarts(solsticeStartUtc: number, solsticeEndUtc: number): number[] {
  const months: number[] = [];
  // The first month-start is the new moon at-or-before solsticeStart
  // (the month containing the start solstice).
  let cursor = lastNewMoonBefore(solsticeStartUtc + 1);
  months.push(cursor);
  // Step forward by new moons until we pass solsticeEnd.
  const safetyLimit = 16;
  for (let i = 0; i < safetyLimit; i++) {
    cursor = nextNewMoonAfter(cursor + DAY_MS / 2);
    if (cursor > solsticeEndUtc) break;
    months.push(cursor);
  }
  return months;
}

function findFirstMonthWithoutZhongqi(
  monthStartsUtcMs: number[],
  tzOffsetMinutes: number,
): number {
  // 中气 are the 12 major solar terms: Sun ecliptic longitude at multiples
  // of 30° starting from 0° (春分, Mar 20-ish). Specifically 中气 are
  // longitudes 0°, 30°, 60°, ..., 330° — every 30° starting from
  // vernal equinox.
  for (let i = 1; i < monthStartsUtcMs.length - 1; i++) {
    // Skip month index 0 (the suì-start month, always month 11
    // containing dongzhi by construction).
    const start = monthStartsUtcMs[i]!;
    const end = monthStartsUtcMs[i + 1]!;
    if (!containsZhongqi(start, end, tzOffsetMinutes)) return i;
  }
  // Fallback: if nothing matched (shouldn't happen if leap is present),
  // place leap at index 12 (won't be hit in any well-formed suì).
  return monthStartsUtcMs.length - 1;
}

/** True if any 中气 falls in [startUtc, endUtc). */
function containsZhongqi(startUtc: number, endUtc: number, _tzOffsetMinutes: number): boolean {
  // For each integer k in 0..11, find Sun-at-30k° in this window.
  // Quick check: sample the Sun's longitude at startUtc and endUtc; if
  // a multiple of 30° lies strictly between them (going forward), a
  // zhongqi falls inside.
  const lonStart = sunEclipticLongitude(startUtc);
  const lonEnd = sunEclipticLongitude(endUtc);
  // Sun moves forward (~0.9856°/day). If end > start linearly modulo 360,
  // a 30°-multiple is inside iff floor(lonEnd / 30) > floor(lonStart / 30)
  // (handling wrap at 360).
  let s = lonStart;
  let e = lonEnd;
  if (e < s) e += 360;
  return Math.floor(e / 30) > Math.floor(s / 30);
}

function sunEclipticLongitude(utcMs: number): number {
  const t = new AstroTime(new Date(utcMs));
  return normalizeDegrees(SunPosition(t).elon);
}

function winterSolsticeUtcMs(year: number): number {
  // 冬至 = Sun apparent geocentric ecliptic longitude = 270°.
  // Binary-search across roughly Dec 18–25 of `year`.
  let lo = Date.UTC(year, 11, 18);
  let hi = Date.UTC(year, 11, 25);
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const lon = sunEclipticLongitude(mid);
    // Target = 270. lon increases through the year. Map to a signed
    // distance from 270 considering wrap.
    let signed = lon - 270;
    if (signed > 180) signed -= 360;
    if (signed < -180) signed += 360;
    if (signed < 0) lo = mid;
    else hi = mid;
    if (hi - lo < 1000) break; // 1 second precision
  }
  return (lo + hi) / 2;
}

function lastNewMoonBefore(utcMs: number): number {
  // Search backwards by stepping a 40-day window in front of (utcMs - 40d).
  const startTime = new AstroTime(new Date(utcMs - 40 * DAY_MS));
  const evt = SearchMoonPhase(0, startTime, 80);
  if (!evt) throw new Error('Lunar conversion: no new moon found.');
  // SearchMoonPhase returns the *next* event ≥ start; we want the
  // last new moon strictly at-or-before utcMs. Iterate forward until
  // the next one would overshoot.
  let cursor = evt.date.getTime();
  while (true) {
    const next = SearchMoonPhase(0, new AstroTime(new Date(cursor + DAY_MS)), 35);
    if (!next || next.date.getTime() > utcMs) return cursor;
    cursor = next.date.getTime();
  }
}

function nextNewMoonAfter(utcMs: number): number {
  const evt = SearchMoonPhase(0, new AstroTime(new Date(utcMs)), 35);
  if (!evt) throw new Error('Lunar conversion: no new moon found.');
  return evt.date.getTime();
}

function sameNewMoon(a: number, b: number): boolean {
  // New moons are at least 27 days apart, so anything within ±1 day
  // is the same event.
  return Math.abs(a - b) < DAY_MS;
}

function localMidnightOf(utcMs: number, tzOffsetMinutes: number): number {
  const local = new Date(utcMs + tzOffsetMinutes * 60_000);
  const y = local.getUTCFullYear();
  const m = local.getUTCMonth();
  const d = local.getUTCDate();
  return Date.UTC(y, m, d) - tzOffsetMinutes * 60_000;
}

function normalizeDegrees(d: number): number {
  return ((d % 360) + 360) % 360;
}
