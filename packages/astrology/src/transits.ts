/**
 * Transits — compare a natal chart against a moment in time, usually "now".
 *
 * The transit chart is just a snapshot of where the planets are at the
 * given moment. The interesting product is the cross-table: every
 * transiting planet against every natal planet, finding the aspects that
 * are within orb. Transit-to-natal aspects are how astrologers read
 * "what is being activated right now."
 */

import {
  PLANETS, signOfLongitude, degreeInSign, type Planet, type Sign,
} from './constants.js';
import { eclipticLongitudeOf, isRetrograde, makeAstroTime } from './astro.js';
import type { NatalChart, Placement } from './chart.js';
import type { AspectKind, AspectOptions } from './aspects.js';
import { angularSeparation } from './aspects.js';

const TRANSIT_ASPECTS: ReadonlyArray<{ kind: AspectKind; angle: number; defaultOrb: number }> = [
  { kind: 'conjunction', angle: 0,   defaultOrb: 3 },
  { kind: 'sextile',     angle: 60,  defaultOrb: 2 },
  { kind: 'square',      angle: 90,  defaultOrb: 3 },
  { kind: 'trine',       angle: 120, defaultOrb: 3 },
  { kind: 'opposition',  angle: 180, defaultOrb: 3 },
];

export interface TransitPlacement {
  readonly planet: Planet;
  readonly longitude: number;
  readonly sign: Sign;
  readonly degreeInSign: number;
  readonly retrograde: boolean;
}

export interface TransitAspect {
  readonly transit: Planet;
  readonly natal: Planet;
  readonly kind: AspectKind;
  readonly angle: number;
  readonly separation: number;
  readonly orb: number;
  /**
   * 'applying'  → transit is moving toward exact aspect (tightening)
   * 'separating'→ transit is moving away from exact (loosening)
   * 'stationary'→ retrograde flip near the aspect; treat as exact-ish
   */
  readonly motion: 'applying' | 'separating' | 'stationary';
}

export interface TransitChart {
  readonly utcMs: number;
  readonly placements: readonly TransitPlacement[];
  /** Cross-aspects: every transit planet × every natal planet within orb. */
  readonly aspectsToNatal: readonly TransitAspect[];
}

export interface ComputeTransitsOptions {
  /** Override transit orbs (tighter than natal orbs by default). */
  readonly orbOverrides?: Partial<Record<AspectKind, number>>;
  /**
   * Restrict which transiting planets are computed. Default: all 10.
   * Common practice excludes Moon (it transits everything in 28 days).
   */
  readonly transitPlanets?: readonly Planet[];
  /**
   * Restrict which natal points to aspect. Default: all 10 natal planets.
   * Pass ['Sun','Moon','Mercury','Venus','Mars'] to focus on personal planets.
   */
  readonly natalPlanets?: readonly Planet[];
}

/**
 * Compute the transit chart at `utcMs` against the given natal chart.
 *
 * The transiting planets are read at `utcMs`; their longitudes are then
 * checked against every natal placement for the 5 major aspects within
 * the transit orbs. Motion (applying / separating / stationary) is
 * derived from the transit planet's instantaneous longitude rate.
 */
export function computeTransits(
  natal: NatalChart,
  utcMs: number,
  opts: ComputeTransitsOptions = {},
): TransitChart {
  const time = makeAstroTime(utcMs);
  const transitSet: ReadonlySet<Planet> = new Set(opts.transitPlanets ?? PLANETS);
  const natalSet: ReadonlySet<Planet> = new Set(opts.natalPlanets ?? PLANETS);

  const transits: TransitPlacement[] = PLANETS
    .filter((p) => transitSet.has(p))
    .map((planet) => {
      const longitude = eclipticLongitudeOf(planet, time);
      return {
        planet,
        longitude: round3(longitude),
        sign: signOfLongitude(longitude),
        degreeInSign: round3(degreeInSign(longitude)),
        retrograde: isRetrograde(planet, time),
      };
    });

  const natalByPlanet = new Map<Planet, Placement>();
  for (const p of natal.placements) natalByPlanet.set(p.planet, p);

  const aspectsToNatal: TransitAspect[] = [];
  for (const t of transits) {
    const rateNow = longitudeRateAt(t.planet, utcMs);
    for (const np of PLANETS) {
      if (!natalSet.has(np)) continue;
      const natalPlacement = natalByPlanet.get(np);
      if (!natalPlacement) continue;
      const sep = angularSeparation(t.longitude, natalPlacement.longitude);
      for (const def of TRANSIT_ASPECTS) {
        const orb = opts.orbOverrides?.[def.kind] ?? def.defaultOrb;
        const diff = Math.abs(sep - def.angle);
        if (diff > orb) continue;
        aspectsToNatal.push({
          transit: t.planet,
          natal: np,
          kind: def.kind,
          angle: def.angle,
          separation: round3(sep),
          orb: round3(diff),
          motion: motionTowardAspect(t.longitude, natalPlacement.longitude, def.angle, rateNow),
        });
        break;
      }
    }
  }

  aspectsToNatal.sort((a, b) => a.orb - b.orb);

  return { utcMs, placements: transits, aspectsToNatal };
}

/**
 * Motion classification: is the transit currently moving toward or away
 * from exact aspect? Uses the signed difference between current
 * separation and the exact-aspect separation, plus the transit's rate.
 */
function motionTowardAspect(
  transitLon: number,
  natalLon: number,
  exactAngle: number,
  rate: number,
): 'applying' | 'separating' | 'stationary' {
  if (Math.abs(rate) < 0.01) return 'stationary';
  // Signed difference (transit − natal) in (-180, 180].
  let delta = ((transitLon - natalLon + 540) % 360) - 180;
  // The "exact" target is at ±exactAngle. Pick whichever side delta is on.
  const target = delta >= 0 ? exactAngle : -exactAngle;
  const currentGap = delta - target;
  // If rate > 0 (direct), currentGap < 0 means transit will catch the target → applying.
  // If rate < 0 (retrograde), the sign flips.
  const closing = rate > 0 ? (currentGap < 0) : (currentGap > 0);
  return closing ? 'applying' : 'separating';
}

function longitudeRateAt(planet: Planet, utcMs: number): number {
  // Avoid re-importing longitudeRate to keep this self-contained;
  // use a one-day centred finite difference like astro.ts does.
  const dayMs = 86_400_000;
  const before = eclipticLongitudeOf(planet, makeAstroTime(utcMs - dayMs));
  const after = eclipticLongitudeOf(planet, makeAstroTime(utcMs + dayMs));
  let delta = after - before;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return delta / 2;
}

function round3(n: number): number { return Math.round(n * 1000) / 1000; }
