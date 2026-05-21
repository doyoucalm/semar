/**
 * A number is "Pythagorean-reduced": single digit 1–9, or master 11/22/33.
 *
 * Master numbers are preserved at intermediate sums and at the final result.
 * Anything else is collapsed by repeated digit-sum until in 1..9 or a master.
 */

export const MASTER_NUMBERS = [11, 22, 33] as const;
export type MasterNumber = (typeof MASTER_NUMBERS)[number];

export type Reduced = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | MasterNumber;

export function isMaster(n: number): n is MasterNumber {
  return n === 11 || n === 22 || n === 33;
}

/** Sum the absolute decimal digits of an integer. */
export function digitSum(n: number): number {
  let x = Math.abs(Math.trunc(n));
  let sum = 0;
  while (x > 0) {
    sum += x % 10;
    x = Math.floor(x / 10);
  }
  return sum;
}

/**
 * Reduce to 1–9 or a master number.
 * 0 → 0 (the only non-reduced fixed point we tolerate; used by Soul Urge of
 * pure-consonant names etc.).
 */
export function reduce(n: number): Reduced | 0 {
  let x = Math.abs(Math.trunc(n));
  if (x === 0) return 0;
  while (x > 9 && !isMaster(x)) {
    x = digitSum(x);
  }
  return x as Reduced;
}
