/**
 * Julian Day Number helpers.
 *
 * Pawukon and the wara cycles are pure modular arithmetic over civil days.
 * Working in JDN keeps every cycle a single modulo operation and avoids
 * Date timezone surprises. We always interpret a calendar date as a civil
 * day in some IANA-like local zone; the caller is responsible for choosing
 * which date "today" is for them.
 *
 * For an input like 1985-05-05 in Bandung (UTC+7), pass year=1985, month=5,
 * day=5 directly. The JDN returned represents that civil date regardless
 * of UTC offset.
 */

/**
 * Convert a Gregorian (proleptic) civil date to Julian Day Number.
 * Reference: Fliegel & Van Flandern (1968).
 */
export function gregorianToJDN(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

/** Convert a JS Date treated as a civil date in `tzOffsetMinutes` to JDN. */
export function dateToJDN(date: Date, tzOffsetMinutes = 0): number {
  const shifted = new Date(date.getTime() + tzOffsetMinutes * 60_000);
  return gregorianToJDN(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth() + 1,
    shifted.getUTCDate(),
  );
}

/** Inverse — JDN → Gregorian civil date {year, month, day}. */
export function jdnToGregorian(jdn: number): { year: number; month: number; day: number } {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = 100 * b + d - 4800 + Math.floor(m / 10);
  return { year, month, day };
}

/** Pythagorean-positive modulo. */
export function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}
