/**
 * Pythagorean letter-to-number mapping.
 *
 *   1: A J S
 *   2: B K T
 *   3: C L U
 *   4: D M V
 *   5: E N W
 *   6: F O X
 *   7: G P Y
 *   8: H Q Z
 *   9: I R
 */

const PYTHAGOREAN: Record<string, number> = {
  A: 1, J: 1, S: 1,
  B: 2, K: 2, T: 2,
  C: 3, L: 3, U: 3,
  D: 4, M: 4, V: 4,
  E: 5, N: 5, W: 5,
  F: 6, O: 6, X: 6,
  G: 7, P: 7, Y: 7,
  H: 8, Q: 8, Z: 8,
  I: 9, R: 9,
};

/** AEIOU. Y is treated as consonant by default (strict Pythagorean). */
const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);

export type LetterClass = 'vowel' | 'consonant' | 'ignored';

export function classifyLetter(ch: string): LetterClass {
  const upper = ch.toUpperCase();
  if (!(upper in PYTHAGOREAN)) return 'ignored';
  return VOWELS.has(upper) ? 'vowel' : 'consonant';
}

export function letterValue(ch: string): number {
  const upper = ch.toUpperCase();
  return PYTHAGOREAN[upper] ?? 0;
}

/**
 * Strip diacritics so "Émile" → "Emile". Falls back to identity on
 * runtimes without String.normalize (modern Node has it).
 */
function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function* letters(name: string): Generator<string> {
  const norm = stripDiacritics(name);
  for (const ch of norm) {
    if (/[A-Za-z]/.test(ch)) yield ch.toUpperCase();
  }
}
