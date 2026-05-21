import { hexagramByBinary, type Hexagram } from './hexagrams.js';

/**
 * Three-coin method.
 *
 * Each line is the sum of three coin tosses: yang face = 3, yin face = 2.
 *   6 = old yin     (changing, yin → yang)
 *   7 = young yang  (stable)
 *   8 = young yin   (stable)
 *   9 = old yang    (changing, yang → yin)
 *
 * Probability per line (per toss of 3 fair coins):
 *   6: 1/8   (TTT)
 *   7: 3/8   (HTT, THT, TTH)
 *   8: 3/8   (HHT, HTH, THH)
 *   9: 1/8   (HHH)
 *
 * Real practice uses yarrow stalks with different probabilities, but the
 * three-coin method is the standard digital approximation and what most
 * apps implement.
 */

export type LineValue = 6 | 7 | 8 | 9;

export interface Line {
  /** Position 1–6, bottom to top (traditional reading order). */
  readonly position: 1 | 2 | 3 | 4 | 5 | 6;
  readonly value: LineValue;
  readonly yang: boolean;
  readonly changing: boolean;
}

export interface CastResult {
  /** Bottom line first. lines[0] is line 1 (bottom). */
  readonly lines: readonly Line[];
  readonly primary: Hexagram;
  /** Null when no lines are changing. */
  readonly relating: Hexagram | null;
  readonly changingPositions: readonly number[];
}

export type Rng = () => number;

function tossLine(rng: Rng): LineValue {
  let sum = 0;
  for (let i = 0; i < 3; i++) {
    sum += rng() < 0.5 ? 2 : 3;
  }
  return sum as LineValue;
}

function lineFromValue(position: Line['position'], value: LineValue): Line {
  const yang = value === 7 || value === 9;
  const changing = value === 6 || value === 9;
  return { position, value, yang, changing };
}

export function castHexagram(rng: Rng = Math.random): CastResult {
  const lines: Line[] = [];
  for (let i = 0; i < 6; i++) {
    const position = (i + 1) as Line['position'];
    lines.push(lineFromValue(position, tossLine(rng)));
  }
  return buildResult(lines);
}

/** Build a result from explicit line values — useful for tests and replay. */
export function castFromLines(values: readonly LineValue[]): CastResult {
  if (values.length !== 6) {
    throw new Error(`Expected 6 line values, got ${values.length}`);
  }
  const lines = values.map((v, i) =>
    lineFromValue((i + 1) as Line['position'], v),
  );
  return buildResult(lines);
}

function buildResult(lines: readonly Line[]): CastResult {
  const primaryBits = lines.map((l) => (l.yang ? '1' : '0')).join('');
  const primary = hexagramByBinary(primaryBits);

  const changingPositions = lines.filter((l) => l.changing).map((l) => l.position);

  let relating: Hexagram | null = null;
  if (changingPositions.length > 0) {
    const relatingBits = lines
      .map((l) => (l.changing ? (l.yang ? '0' : '1') : l.yang ? '1' : '0'))
      .join('');
    relating = hexagramByBinary(relatingBits);
  }

  return { lines, primary, relating, changingPositions };
}

/**
 * Mulberry32 — small, fast, deterministic PRNG.
 * Use for reproducible casts in tests or fixtures.
 */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
