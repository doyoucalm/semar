/**
 * Wraps astronomy-engine for the four primitives a chart needs:
 *   - ecliptic longitude of each planet (apparent, geocentric)
 *   - retrograde flag (sign of longitude rate)
 *   - Ascendant ecliptic longitude
 *   - Midheaven ecliptic longitude
 */

import * as AstroNS from 'astronomy-engine';
import { MEAN_OBLIQUITY_J2000, type Planet } from './constants.js';

// astronomy-engine ships as CJS with an ESM bridge. Node ESM exposes the
// whole module as `default`; vitest's interop pulls named exports onto the
// namespace directly. Handle both by preferring `default` when present.
const Astro = ((AstroNS as unknown as { default?: typeof AstroNS }).default ?? AstroNS);
const { AstroTime, Body, GeoVector, Ecliptic, SunPosition, EclipticGeoMoon, SiderealTime } = Astro;
type AstroTime = InstanceType<typeof AstroNS.AstroTime>;

// Bodies that astronomy-engine knows directly (i.e. not Sun/Moon, which use
// their own functions, and not the lunar nodes, which are not bodies at all).
type GeoBody = Exclude<Planet, 'Sun' | 'Moon' | 'NorthNode' | 'SouthNode'>;

const BODY_MAP: Record<GeoBody, AstroNS.Body> = {
  Mercury: Body.Mercury,
  Venus: Body.Venus,
  Mars: Body.Mars,
  Jupiter: Body.Jupiter,
  Saturn: Body.Saturn,
  Uranus: Body.Uranus,
  Neptune: Body.Neptune,
  Pluto: Body.Pluto,
};

/**
 * Geocentric apparent ecliptic longitude, in degrees [0, 360).
 *
 *  - Sun: SunPosition (apparent geocentric ecliptic of the Sun)
 *  - Moon: EclipticGeoMoon (apparent geocentric ecliptic of the Moon)
 *  - NorthNode: mean longitude Ω of Moon's ascending node (Meeus ch. 47)
 *  - SouthNode: NorthNode + 180° (always opposite by definition)
 *  - Others: GeoVector → Ecliptic (geocentric, aberration-corrected)
 */
export function eclipticLongitudeOf(planet: Planet, time: AstroTime): number {
  if (planet === 'Sun') return normalizeDegrees(SunPosition(time).elon);
  if (planet === 'Moon') return normalizeDegrees(EclipticGeoMoon(time).lon);
  if (planet === 'NorthNode') return meanLunarNodeLongitude(time);
  if (planet === 'SouthNode') return normalizeDegrees(meanLunarNodeLongitude(time) + 180);
  const vec = GeoVector(BODY_MAP[planet], time, /* aberration */ true);
  return normalizeDegrees(Ecliptic(vec).elon);
}

/**
 * Mean longitude of the Moon's ascending node Ω, in degrees [0, 360).
 *
 * Meeus, "Astronomical Algorithms" 2nd ed., eq. 47.7:
 *   Ω = 125.04452 − 1934.136261 T + 0.0020708 T² + T³ / 450000
 *
 * where T = (JDE − 2451545) / 36525 (Julian centuries from J2000 TT).
 * astronomy-engine's AstroTime.tt is days since J2000 TT, so T = tt / 36525.
 *
 * This is the **mean** node — smooth, retrogrades steadily ~19°/year. The
 * "true" (instantaneous) node oscillates ±1.7° around this due to solar
 * perturbations and needs a fuller computation. Mean is the default in
 * most astrology software unless the user opts into true.
 */
export function meanLunarNodeLongitude(time: AstroTime): number {
  const T = time.tt / 36525;
  const omega =
    125.04452
    - 1934.136261 * T
    + 0.0020708 * T * T
    + (T * T * T) / 450000;
  return normalizeDegrees(omega);
}

/**
 * Approximate longitude rate (degrees per day) via centred finite difference.
 * Negative ⇒ retrograde motion. The Sun and Moon never appear retrograde
 * from Earth, so this only flags Mercury..Pluto in practice.
 */
export function longitudeRate(planet: Planet, time: AstroTime): number {
  const dtDays = 1; // one-day window — enough resolution for retrograde detection
  const before = eclipticLongitudeOf(planet, time.AddDays(-dtDays));
  const after = eclipticLongitudeOf(planet, time.AddDays(dtDays));
  // Unwrap across the 360° seam.
  let delta = after - before;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return delta / (2 * dtDays);
}

export function isRetrograde(planet: Planet, time: AstroTime): boolean {
  if (planet === 'Sun' || planet === 'Moon') return false;
  // Mean lunar nodes are always retrograde — Ω decreases secularly.
  if (planet === 'NorthNode' || planet === 'SouthNode') return true;
  return longitudeRate(planet, time) < 0;
}

/**
 * Ascendant and Midheaven via the standard spherical-trigonometry formulas.
 *
 *   RAMC  = local sidereal time, in degrees east of vernal equinox
 *   MC    = atan2(sin(RAMC), cos(RAMC) cos ε)
 *   ASC   = atan2(-cos(RAMC), sin(RAMC) cos ε + tan φ sin ε)
 *
 * Quadrant of ASC: it must lie east of MC along the ecliptic — i.e.
 * (asc − mc) mod 360 ∈ (0, 180). If not, add 180°.
 */
export function ascendantAndMidheaven(
  time: AstroTime,
  latitudeDeg: number,
  longitudeDegEast: number,
): { ascendant: number; midheaven: number } {
  const gstHours = SiderealTime(time);
  const lstHours = (gstHours + longitudeDegEast / 15 + 24) % 24;
  const ramcDeg = lstHours * 15;

  const epsRad = deg2rad(MEAN_OBLIQUITY_J2000);
  const ramcRad = deg2rad(ramcDeg);
  const latRad = deg2rad(latitudeDeg);

  const mcRad = Math.atan2(Math.sin(ramcRad), Math.cos(ramcRad) * Math.cos(epsRad));
  const midheaven = normalizeDegrees(rad2deg(mcRad));

  const ascRad = Math.atan2(
    -Math.cos(ramcRad),
    Math.sin(ramcRad) * Math.cos(epsRad) + Math.tan(latRad) * Math.sin(epsRad),
  );
  let ascendant = normalizeDegrees(rad2deg(ascRad));

  const eastward = (ascendant - midheaven + 360) % 360;
  if (eastward === 0 || eastward > 180) ascendant = normalizeDegrees(ascendant + 180);

  return { ascendant, midheaven };
}

export function makeAstroTime(utcMs: number): AstroTime {
  return new AstroTime(new Date(utcMs));
}

function normalizeDegrees(d: number): number {
  return ((d % 360) + 360) % 360;
}
function deg2rad(d: number): number { return (d * Math.PI) / 180; }
function rad2deg(r: number): number { return (r * 180) / Math.PI; }
