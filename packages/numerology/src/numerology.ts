import { reduce, isMaster, type Reduced } from './reduce.js';
import { classifyLetter, letterValue, letters } from './letters.js';

export interface BirthDate {
  /** Four-digit year. */
  readonly year: number;
  /** 1–12. */
  readonly month: number;
  /** 1–31. */
  readonly day: number;
}

export interface NameNumbers {
  /** Full birth name as given. */
  readonly expression: Reduced;
  /** Vowels only (AEIOU). */
  readonly soulUrge: Reduced | 0;
  /** Consonants only. */
  readonly personality: Reduced;
}

export interface NumerologyChart {
  readonly birth: BirthDate;
  readonly name: string;
  readonly lifePath: Reduced;
  readonly birthday: Reduced;
  readonly expression: Reduced;
  readonly soulUrge: Reduced | 0;
  readonly personality: Reduced;
}

function assertDate({ year, month, day }: BirthDate): void {
  if (!Number.isInteger(year) || year < 1) throw new Error(`Invalid year: ${year}`);
  if (!Number.isInteger(month) || month < 1 || month > 12) throw new Error(`Invalid month: ${month}`);
  if (!Number.isInteger(day) || day < 1 || day > 31) throw new Error(`Invalid day: ${day}`);
}

/**
 * Life Path: reduce month, day, year separately (preserving masters), then
 * sum and reduce. This is the component-wise method, which differs from
 * "sum-all-digits-then-reduce" only when intermediate sums hit a master.
 *
 * Example: 1985-05-05
 *   year  1985 → 23 → 5
 *   month 5    → 5
 *   day   5    → 5
 *   sum   15   → 6
 */
export function lifePath(birth: BirthDate): Reduced {
  assertDate(birth);
  const y = reduce(birth.year);
  const m = reduce(birth.month);
  const d = reduce(birth.day);
  return reduce(asNum(y) + asNum(m) + asNum(d)) as Reduced;
}

export function birthdayNumber(birth: BirthDate): Reduced {
  assertDate(birth);
  return reduce(birth.day) as Reduced;
}

/**
 * Sum letter values, preserving master sums.
 * Returns 0 only when there are no scoreable letters in the filter.
 */
function sumLetters(name: string, filter: (cls: ReturnType<typeof classifyLetter>) => boolean): Reduced | 0 {
  let total = 0;
  let any = false;
  for (const ch of letters(name)) {
    const cls = classifyLetter(ch);
    if (!filter(cls)) continue;
    total += letterValue(ch);
    any = true;
  }
  if (!any) return 0;
  return reduce(total) as Reduced;
}

export function expressionNumber(name: string): Reduced {
  const r = sumLetters(name, (c) => c === 'vowel' || c === 'consonant');
  if (r === 0) throw new Error(`Name has no scoreable letters: "${name}"`);
  return r;
}

export function soulUrgeNumber(name: string): Reduced | 0 {
  return sumLetters(name, (c) => c === 'vowel');
}

export function personalityNumber(name: string): Reduced {
  const r = sumLetters(name, (c) => c === 'consonant');
  if (r === 0) throw new Error(`Name has no consonants: "${name}"`);
  return r;
}

export function buildChart(name: string, birth: BirthDate): NumerologyChart {
  return {
    birth,
    name,
    lifePath: lifePath(birth),
    birthday: birthdayNumber(birth),
    expression: expressionNumber(name),
    soulUrge: soulUrgeNumber(name),
    personality: personalityNumber(name),
  };
}

function asNum(r: Reduced | 0): number {
  return r;
}

export { isMaster };
