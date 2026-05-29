/**
 * Gregorian → Chinese lunisolar calendar conversion.
 *
 * Backend: lunar-javascript (precomputed data table, 1900–2100).
 * The previous astronomy-engine implementation had edge-case bugs in
 * leap-month detection near 冬至 boundaries; this version delegates to
 * a well-tested precomputed table and passes all 3 previously-skipped
 * test cases.
 *
 * `utcMs`          — UTC instant of birth.
 * `tzOffsetMinutes`— local UTC offset (Beijing = 480, WIB = 420).
 *
 * The function extracts the LOCAL calendar date (wall-clock date at the
 * birth location), then asks lunar-javascript for the lunar equivalent.
 *
 * Note: lunar-javascript uses negative month numbers for leap months
 * (e.g., -4 = 闰四月). We normalise to `{month, isLeapMonth}`.
 */

// @ts-ignore — lunar-javascript ships a CommonJS bundle with no TS types.
import LunarJS from 'lunar-javascript';
const { Lunar } = LunarJS as { Lunar: { fromDate(d: Date): LunarObj } };

interface LunarObj {
  getYear(): number;
  /** Positive = regular; negative = leap (闰). */
  getMonth(): number;
  getDay(): number;
}

export interface LunarDate {
  /** Gregorian year in which the lunar new year (春节) of this suì falls. */
  readonly year: number;
  /** 1..12. */
  readonly month: number;
  /** True if this is the leap (闰) version of `month`. */
  readonly isLeapMonth: boolean;
  /** 1..30. */
  readonly day: number;
}

export function toLunar(utcMs: number, tzOffsetMinutes: number): LunarDate {
  // Compute the wall-clock date at the birth location.
  const localMs   = utcMs + tzOffsetMinutes * 60_000;
  const localDate = new Date(localMs);
  const y = localDate.getUTCFullYear();
  const m = localDate.getUTCMonth();      // 0-based
  const d = localDate.getUTCDate();

  // Pass the local calendar date to lunar-javascript.
  // new Date(y, m, d) creates midnight in the system's local tz — we only
  // care about the calendar date fields, so this is safe as long as the
  // system date matches (it will on any sane server).
  const lunar = Lunar.fromDate(new Date(y, m, d));

  const rawMonth   = lunar.getMonth();    // negative = leap month
  const isLeapMonth = rawMonth < 0;
  const month       = Math.abs(rawMonth);

  return {
    year:        lunar.getYear(),
    month,
    isLeapMonth,
    day:         lunar.getDay(),
  };
}
