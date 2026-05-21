import type { Planet } from './constants.js';

/**
 * Major aspects only — the five Ptolemaic aspects. Orbs are conservative
 * defaults; serious practice tightens or loosens these per-planet, but
 * this is the right MVP baseline.
 */

export type AspectKind = 'conjunction' | 'sextile' | 'square' | 'trine' | 'opposition';

interface AspectDef {
  readonly kind: AspectKind;
  readonly angle: number;
  readonly defaultOrb: number;
}

const ASPECTS: readonly AspectDef[] = [
  { kind: 'conjunction', angle: 0,   defaultOrb: 8 },
  { kind: 'sextile',     angle: 60,  defaultOrb: 6 },
  { kind: 'square',      angle: 90,  defaultOrb: 7 },
  { kind: 'trine',       angle: 120, defaultOrb: 8 },
  { kind: 'opposition',  angle: 180, defaultOrb: 8 },
];

export interface Aspect {
  readonly a: Planet;
  readonly b: Planet;
  readonly kind: AspectKind;
  /** Exact aspect angle (e.g. 90°). */
  readonly angle: number;
  /** Observed separation between the two longitudes (0..180). */
  readonly separation: number;
  /** How far off exact, in degrees. Negative = applying-style isn't tracked here. */
  readonly orb: number;
}

export interface AspectOptions {
  /** Override default orb per-aspect. */
  readonly orbOverrides?: Partial<Record<AspectKind, number>>;
}

export function findAspects(
  placements: ReadonlyArray<{ planet: Planet; longitude: number }>,
  options: AspectOptions = {},
): Aspect[] {
  const aspects: Aspect[] = [];
  for (let i = 0; i < placements.length; i++) {
    for (let j = i + 1; j < placements.length; j++) {
      const A = placements[i]!;
      const B = placements[j]!;
      const sep = angularSeparation(A.longitude, B.longitude);
      for (const def of ASPECTS) {
        const orb = options.orbOverrides?.[def.kind] ?? def.defaultOrb;
        const diff = Math.abs(sep - def.angle);
        if (diff <= orb) {
          aspects.push({
            a: A.planet,
            b: B.planet,
            kind: def.kind,
            angle: def.angle,
            separation: round3(sep),
            orb: round3(diff),
          });
          break; // one aspect per pair — pick the tightest by definition order
        }
      }
    }
  }
  return aspects;
}

/** Angular separation in [0, 180]. */
export function angularSeparation(a: number, b: number): number {
  const diff = ((a - b) % 360 + 360) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}
