import { DECK, type Card } from './cards.js';

export type Rng = () => number;

export interface DrawnCard {
  readonly card: Card;
  readonly reversed: boolean;
}

export interface DrawOptions {
  /** Use reversals (50/50 per card). Default: true. */
  readonly reversals?: boolean;
  /** Pluggable PRNG. Default: Math.random. Use mulberry32(seed) for replay. */
  readonly rng?: Rng;
}

/**
 * Draw n unique cards from a freshly shuffled deck.
 *
 * Order matters — the first element is the first card drawn.
 */
export function drawCards(n: number, opts: DrawOptions = {}): DrawnCard[] {
  if (!Number.isInteger(n) || n < 1 || n > DECK.length) {
    throw new Error(`Cannot draw ${n} cards from a 78-card deck`);
  }
  const { reversals = true, rng = Math.random } = opts;

  const order = shuffle([...DECK], rng);
  return order.slice(0, n).map((card) => ({
    card,
    reversed: reversals ? rng() < 0.5 : false,
  }));
}

/** Fisher-Yates shuffle, in place. Returns the same array for chaining. */
export function shuffle<T>(arr: T[], rng: Rng = Math.random): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

/**
 * Mulberry32 — small, fast, deterministic PRNG.
 * Same implementation as @semar/iching; intentionally duplicated to keep
 * the package dependency-free.
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
