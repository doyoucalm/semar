import { SIGNS, signOfLongitude, type Sign } from './constants.js';

/**
 * House systems ("schools" of domification).
 *
 * The quadrant systems (Placidus, Koch, Regiomontanus, Topocentric) are ported
 * faithfully from CircularNatalHoroscopeJS (https://github.com/0xStarcat/
 * CircularNatalHoroscopeJS), released into the PUBLIC DOMAIN (Unlicense). Its
 * formulas cite Michael P. Munkasey's "An Astrological House Formulary" and were
 * cross-checked against astrolibrary.org. Whole Sign, Equal, and Porphyry are
 * simple enough to author directly.
 *
 * Inputs the quadrant systems need: RAMC (right ascension of MC, degrees), MC
 * longitude, Ascendant longitude, geographic latitude, obliquity.
 *
 * ⚠️ Placidus / Koch / Regiomontanus / Topocentric degrade and can fail near the
 * polar circles (|lat| ≳ 66°). Whole Sign / Equal / Porphyry work everywhere.
 * Indonesia (near the equator) is unaffected. Campanus is intentionally NOT yet
 * implemented (its full hemisphere-cased algorithm is a separate task).
 */

export type HouseSystem =
  | 'whole-sign'
  | 'equal'
  | 'porphyry'
  | 'placidus'
  | 'koch'
  | 'regiomontanus'
  | 'topocentric';

export interface House {
  readonly number: number; // 1..12
  readonly sign: Sign;
  /** Ecliptic longitude of the house cusp (its start). 0..360. */
  readonly startLongitude: number;
}

export interface HouseInput {
  /** Ascendant ecliptic longitude (degrees). */
  readonly ascendant: number;
  /** Midheaven ecliptic longitude (degrees). */
  readonly midheaven: number;
  /** Right ascension of the MC (degrees) — for quadrant systems. */
  readonly ramc: number;
  /** Geographic latitude (degrees, north positive). */
  readonly latitude: number;
  /** Obliquity of the ecliptic (degrees). */
  readonly obliquity: number;
}

// ── trig helpers (degree-based), matching the reference implementation ─────────
const mod360 = (n: number): number => ((n % 360) + 360) % 360;
const d2r = (d: number): number => (d * Math.PI) / 180;
const r2d = (r: number): number => (r * 180) / Math.PI;
const sind = (d: number): number => Math.sin(d2r(d));
const cosd = (d: number): number => Math.cos(d2r(d));
const tand = (d: number): number => Math.tan(d2r(d));
const arccot = (x: number): number => Math.PI / 2 - Math.atan(x); // radians

// ──────────────────────────────────────────────────────────────────────────────
// Cusp arrays: each returns 12 ecliptic longitudes, index 0 = house 1.
// ──────────────────────────────────────────────────────────────────────────────

function wholeSignCusps(ascendant: number): number[] {
  const start = Math.floor(mod360(ascendant) / 30) * 30;
  return Array.from({ length: 12 }, (_, i) => mod360(start + i * 30));
}

function equalCusps(ascendant: number): number[] {
  return Array.from({ length: 12 }, (_, i) => mod360(ascendant + i * 30));
}

/**
 * Porphyry — trisect the ecliptic arcs between the four angles. The oldest
 * quadrant system; no trigonometry, no high-latitude failure.
 */
function porphyryCusps(ascendant: number, midheaven: number): number[] {
  const ic = mod360(midheaven + 180);
  const dsc = mod360(ascendant + 180);
  const quadMcAsc = mod360(ascendant - midheaven); // MC(10) → ASC(1)
  const quadAscIc = mod360(ic - ascendant); // ASC(1) → IC(4)
  const c = new Array<number>(12);
  c[0] = mod360(ascendant); // 1
  c[9] = mod360(midheaven); // 10
  c[3] = ic; // 4
  c[6] = dsc; // 7
  c[10] = mod360(midheaven + quadMcAsc / 3); // 11
  c[11] = mod360(midheaven + (2 * quadMcAsc) / 3); // 12
  c[1] = mod360(ascendant + quadAscIc / 3); // 2
  c[2] = mod360(ascendant + (2 * quadAscIc) / 3); // 3
  c[4] = mod360(c[10]! + 180); // 5
  c[5] = mod360(c[11]! + 180); // 6
  c[7] = mod360(c[1]! + 180); // 8
  c[8] = mod360(c[2]! + 180); // 9
  return c;
}

/**
 * ±180° correction so each computed cusp stays in its own quadrant. Ported from
 * CircularNatalHoroscopeJS `shouldMod180`.
 */
function shouldMod180(prevCusp: number, currentCusp: number): boolean {
  if (currentCusp < prevCusp) return Math.abs(currentCusp - prevCusp) < 180;
  if (prevCusp < currentCusp) return currentCusp - prevCusp >= 180;
  return false;
}

/**
 * The assembly shared by Placidus / Regiomontanus / Topocentric: cusps 1,4,7,10
 * are the angles; 2,3,11,12 come from `calc`; the rest are opposites; each gets
 * the ±180° quadrant correction. Ported from CircularNatalHoroscopeJS.
 */
function monkAssembly(
  ascendant: number,
  midheaven: number,
  calc: (houseNumber: number) => number,
): number[] {
  const c1 = ascendant;
  const c2 = mod360(calc(2));
  const c3 = mod360(calc(3));
  const c4 = mod360(midheaven + 180);
  const c10 = midheaven;
  const c11 = calc(11);
  const c12 = calc(12);
  const c5 = mod360(c11 + 180);
  const c6 = mod360(c12 + 180);
  const c7 = mod360(ascendant + 180);
  const c8 = mod360(c2 + 180);
  const c9 = mod360(c3 + 180);

  return [
    c1,
    shouldMod180(c1, c2) ? mod360(c2 + 180) : c2,
    shouldMod180(c1, c3) ? mod360(c3 + 180) : c3,
    c4,
    shouldMod180(c4, c5) ? mod360(c5 + 180) : c5,
    shouldMod180(c4, c6) ? mod360(c6 + 180) : c6,
    c7,
    shouldMod180(c7, c8) ? mod360(c8 + 180) : c8,
    shouldMod180(c7, c9) ? mod360(c9 + 180) : c9,
    c10,
    shouldMod180(c10, c11) ? mod360(c11 + 180) : c11,
    shouldMod180(c10, c12) ? mod360(c12 + 180) : c12,
  ].map(mod360);
}

function placidusCusps(i: HouseInput): number[] {
  const { ramc, ascendant, midheaven, latitude, obliquity } = i;
  const cuspInterval = (h: number): number =>
    h === 2 ? ramc + 120 : h === 3 ? ramc + 150 : h === 11 ? ramc + 30 : ramc + 60;
  const saRatio = (h: number): number => (h === 2 || h === 12 ? 2 / 3 : 1 / 3);

  const calc = (h: number): number => {
    const interval = cuspInterval(h);
    const ratio = saRatio(h);
    let cusp = Math.asin(sind(obliquity) * sind(interval)); // radians
    let prev = 0;
    let r = cusp;
    let guard = 0;
    while (Math.abs(cusp - prev) > 0.0001 && guard++ < 100) {
      // Trig simplification of Munkasey's steps that avoids an out-of-domain
      // arcsin (astrologyweekly forum thread #50451).
      const m = Math.atan(ratio * (tand(latitude) / cosd(interval)));
      r = Math.atan((tand(interval) * Math.cos(m)) / Math.cos(m + d2r(obliquity)));
      prev = cusp;
      cusp = r;
    }
    return r2d(cusp) + 180;
  };

  return monkAssembly(ascendant, midheaven, calc);
}

function regiomontanusCusps(i: HouseInput): number[] {
  const { ramc, ascendant, midheaven, latitude, obliquity } = i;
  const interval = (h: number): number => (h === 2 ? 120 : h === 3 ? 150 : h === 11 ? 30 : 60);
  const pole = (h: number): number => Math.atan(tand(latitude) * sind(interval(h)));

  const calc = (h: number): number => {
    const eqint = ramc + interval(h);
    const m = Math.atan(Math.tan(pole(h)) / cosd(eqint));
    const r = Math.atan((tand(eqint) * Math.cos(m)) / Math.cos(m + d2r(obliquity)));
    return r2d(r);
  };

  return monkAssembly(ascendant, midheaven, calc);
}

function topocentricCusps(i: HouseInput): number[] {
  const { ramc, ascendant, midheaven, latitude, obliquity } = i;
  const interval = (h: number): number =>
    h === 2 ? ramc + 120 : h === 3 ? ramc + 150 : h === 11 ? ramc + 30 : ramc + 60;
  const poleRatio = (h: number): number =>
    h === 2 || h === 12 ? Math.atan(2 * (tand(latitude) / 3)) : Math.atan(tand(latitude) / 3);

  const calc = (h: number): number => {
    const m = Math.atan(Math.tan(poleRatio(h)) / cosd(interval(h)));
    const r = Math.atan((tand(interval(h)) * Math.cos(m)) / Math.cos(m + d2r(obliquity)));
    return r2d(r);
  };

  return monkAssembly(ascendant, midheaven, calc);
}

/**
 * Koch (Birthplace) — has its own assembly (the 1st cusp is itself computed,
 * not taken as the Ascendant angle). Ported from CircularNatalHoroscopeJS.
 */
function kochCusps(i: HouseInput): number[] {
  const { ramc, ascendant, midheaven, latitude, obliquity } = i;
  const declMC = Math.asin(sind(midheaven) * sind(obliquity));
  const ascDiff = Math.asin(Math.tan(declMC) * tand(latitude));
  const oaMC = d2r(ramc) - ascDiff; // radians
  const interval = mod360((ramc + 90 - r2d(oaMC)) / 3);

  // Walk 11 → 12 → 1 → 2 → 3, each + interval, from the oblique ascension of MC.
  // pos(11) is the base (0 steps); each later house adds one interval. The step
  // count is exactly the house's index in this order.
  const order = [11, 12, 1, 2, 3];
  const pos = (h: number): number => {
    const steps = order.indexOf(h);
    return r2d(oaMC) + interval - 90 + steps * interval;
  };

  const calc = (h: number): number => {
    const p = pos(h);
    const rad = arccot(
      -((tand(latitude) * sind(obliquity) + sind(p) * cosd(obliquity)) / cosd(p)),
    );
    return r2d(rad);
  };

  const c1 = mod360(calc(1));
  const c2 = mod360(calc(2));
  const c3 = mod360(calc(3));
  const c4 = mod360(midheaven + 180);
  const c10 = midheaven;
  const c11 = calc(11);
  const c12 = calc(12);
  const c5 = mod360(c11 + 180);
  const c6 = mod360(c12 + 180);
  const c7 = mod360(ascendant + 180);
  const c8 = mod360(c2 + 180);
  const c9 = mod360(c3 + 180);

  return [
    c1,
    shouldMod180(c1, c2) ? mod360(c2 + 180) : c2,
    shouldMod180(c1, c3) ? mod360(c3 + 180) : c3,
    c4,
    shouldMod180(c4, c5) ? mod360(c5 + 180) : c5,
    shouldMod180(c4, c6) ? mod360(c6 + 180) : c6,
    c7,
    shouldMod180(c7, c8) ? mod360(c8 + 180) : c8,
    shouldMod180(c7, c9) ? mod360(c9 + 180) : c9,
    c10,
    shouldMod180(c10, c11) ? mod360(c11 + 180) : c11,
    shouldMod180(c10, c12) ? mod360(c12 + 180) : c12,
  ].map(mod360);
}

// ── public API ─────────────────────────────────────────────────────────────────

/** Compute the 12 houses for the chosen system. */
export function computeHouses(system: HouseSystem, input: HouseInput): House[] {
  let cusps: number[];
  switch (system) {
    case 'whole-sign': cusps = wholeSignCusps(input.ascendant); break;
    case 'equal': cusps = equalCusps(input.ascendant); break;
    case 'porphyry': cusps = porphyryCusps(input.ascendant, input.midheaven); break;
    case 'placidus': cusps = placidusCusps(input); break;
    case 'koch': cusps = kochCusps(input); break;
    case 'regiomontanus': cusps = regiomontanusCusps(input); break;
    case 'topocentric': cusps = topocentricCusps(input); break;
    default: throw new Error(`Unknown house system: ${system as string}`);
  }
  return cusps.map((lon, idx) => ({
    number: idx + 1,
    sign: signOfLongitude(lon),
    startLongitude: round4(lon),
  }));
}

/**
 * Whole Sign houses from an Ascendant longitude. Standalone export (original
 * public API): the sign containing the Ascendant is the 1st house, spanning 0°.
 */
export function wholeSignHouses(ascendantLongitude: number): readonly House[] {
  const ascSignIdx = Math.floor(mod360(ascendantLongitude) / 30);
  return Array.from({ length: 12 }, (_, i) => {
    const signIdx = (ascSignIdx + i) % 12;
    return { number: i + 1, sign: SIGNS[signIdx]!, startLongitude: signIdx * 30 };
  });
}

/**
 * Which house (1..12) does an ecliptic longitude fall in? Arc-based: house i
 * spans [cusp_i, cusp_{i+1}) walking forward through the zodiac, so it works for
 * unequal quadrant cusps as well as equal/whole-sign.
 */
export function houseOfLongitude(longitude: number, houses: readonly House[]): number {
  const lon = mod360(longitude);
  for (let i = 0; i < houses.length; i++) {
    const start = houses[i]!.startLongitude;
    const end = houses[(i + 1) % houses.length]!.startLongitude;
    const span = mod360(end - start);
    const offset = mod360(lon - start);
    if (span === 0 ? offset === 0 : offset < span) return houses[i]!.number;
  }
  return houses[houses.length - 1]!.number;
}

function round4(n: number): number { return Math.round(n * 10000) / 10000; }
