/**
 * 真太阳时 — True Solar Time correction.
 *
 * Civil clock time is standardised to a timezone meridian, but BaZi's hour
 * pillar is defined by the Sun's actual position over the birth location.
 * Two corrections close the gap:
 *
 *   1. Longitude (LMT) offset — the birth city is east/west of its timezone's
 *      standard meridian. Each degree = 4 minutes of time.
 *        standardMeridian° = (utcOffsetMinutes / 60) × 15
 *        longitudeCorrection(min) = (birthLongitude° − standardMeridian°) × 4
 *
 *   2. Equation of Time — the Sun runs fast/slow against clock time over the
 *      year (orbital eccentricity + axial tilt), ranging roughly −14…+16 min.
 *      Computed here with the standard NOAA/Spencer day-of-year approximation
 *      (accurate to well under a minute — far finer than the 2-hour 时辰 grid).
 *
 * trueSolar = civilClock + longitudeCorrection + equationOfTime
 *
 * A birth in western Java (~107°E) on WIB (meridian 105°E) shifts ~+8 min from
 * longitude alone; the EoT can add or subtract another ~15 min. Near a 时辰
 * boundary that is enough to move the hour branch — which is exactly why
 * practitioners insist on it.
 */

export interface SolarCorrection {
  /** Minutes from the birth-city longitude vs its timezone meridian. */
  readonly longitudeMinutes: number;
  /** Minutes from the Equation of Time at the birth date. */
  readonly equationOfTimeMinutes: number;
  /** Total minutes to add to civil clock time to get true solar time. */
  readonly totalMinutes: number;
}

/**
 * Compute the true-solar-time correction (in minutes) for a birth.
 *
 * @param utcMs            Birth instant, UTC ms.
 * @param longitude        Birth longitude in degrees east (Bandung ≈ 107.6).
 * @param utcOffsetMinutes Civil UTC offset in minutes (WIB = 420).
 */
export function solarCorrection(
  utcMs: number,
  longitude: number,
  utcOffsetMinutes: number,
): SolarCorrection {
  const standardMeridian = (utcOffsetMinutes / 60) * 15;
  const longitudeMinutes = round2((longitude - standardMeridian) * 4);
  const equationOfTimeMinutes = round2(equationOfTime(utcMs));
  return {
    longitudeMinutes,
    equationOfTimeMinutes,
    totalMinutes: round2(longitudeMinutes + equationOfTimeMinutes),
  };
}

/**
 * Apply a correction to a civil wall-clock instant and return the true-solar
 * wall-clock fields. Local civil wall time is passed as the UTC-encoded
 * milliseconds of the local Y-M-D h:m (i.e. Date.UTC(localFields)).
 */
export function applyCorrectionToWall(
  localWallMs: number,
  totalMinutes: number,
): { year: number; month: number; day: number; hour: number; minute: number } {
  const d = new Date(localWallMs + totalMinutes * 60_000);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
  };
}

/**
 * Equation of Time in minutes for a given instant.
 *
 * Spencer (1971) Fourier approximation via the fractional year angle. Error
 * is on the order of seconds — well below the resolution BaZi needs.
 */
export function equationOfTime(utcMs: number): number {
  const d = new Date(utcMs);
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  const dayOfYear = Math.floor((utcMs - start) / 86_400_000);

  // Fractional year (radians).
  const B = (2 * Math.PI * (dayOfYear - 1)) / 365;

  const eotMinutes =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(B) -
      0.032077 * Math.sin(B) -
      0.014615 * Math.cos(2 * B) -
      0.040849 * Math.sin(2 * B));

  return eotMinutes;
}

function round2(n: number): number { return Math.round(n * 100) / 100; }
