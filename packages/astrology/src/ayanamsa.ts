/**
 * Ayanamsa — the offset between the tropical and sidereal zodiacs, used to
 * serve Vedic / Jyotish (sidereal) charts from the same tropical longitudes
 * the rest of the engine computes.
 *
 * A sidereal chart is produced by computing everything tropically and then
 * SUBTRACTING the ayanamsa from every ecliptic longitude (planets, Ascendant,
 * MC, house cusps). Equatorial quantities (RAMC) are unaffected, so house
 * *cusps* are computed tropically and shifted afterwards — a uniform rotation
 * that preserves which house a planet falls in.
 *
 *     siderealLongitude = (tropicalLongitude − ayanamsa) mod 360
 *
 * LAHIRI (Chitra Paksha) — India's national standard (1956), reference star
 * Spica fixed at 0° Libra sidereal. ICRC value at J2000.0 (JD 2451545.0) is
 * 23.853222°. We extrapolate linearly using the precession rate ~50.2388″/yr.
 *
 * ⚠️ ACCURACY: this linear model is good to a few arcminutes over ±1–2
 * centuries of J2000 — fine for interpretation (sign/house resolution), but
 * NOT arcsecond-exact. Validate against Swiss Ephemeris before selling Vedic
 * readings as precise. Other ayanamsas (Fagan-Bradley, Raman, KP) differ by
 * ~0.5–2° and are out of scope for v1.
 */

export type Ayanamsa = 'lahiri';

/** Lahiri ayanamsa at J2000.0, degrees (ICRC standard). */
const LAHIRI_J2000_DEG = 23.853222;

/** Precession of the equinoxes, arcseconds per Julian year. */
const PRECESSION_ARCSEC_PER_YEAR = 50.2388475;

const J2000_UTC_MS = Date.UTC(2000, 0, 1, 12, 0, 0); // 2000-01-01 12:00 TT ≈ UTC
const JULIAN_YEAR_MS = 365.25 * 86_400_000;

/**
 * Lahiri ayanamsa in degrees for a given instant (linear precession model).
 */
export function lahiriAyanamsa(utcMs: number): number {
  const years = (utcMs - J2000_UTC_MS) / JULIAN_YEAR_MS;
  return LAHIRI_J2000_DEG + (years * PRECESSION_ARCSEC_PER_YEAR) / 3600;
}

/** Ayanamsa value for the named system (only Lahiri in v1). */
export function ayanamsaValue(system: Ayanamsa, utcMs: number): number {
  switch (system) {
    case 'lahiri':
      return lahiriAyanamsa(utcMs);
    default:
      throw new Error(`Unsupported ayanamsa: ${system as string}`);
  }
}

/** Convert a tropical ecliptic longitude to sidereal by subtracting the ayanamsa. */
export function toSidereal(tropicalLongitude: number, ayanamsaDeg: number): number {
  return ((tropicalLongitude - ayanamsaDeg) % 360 + 360) % 360;
}
