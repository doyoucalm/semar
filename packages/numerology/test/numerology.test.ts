import { describe, it, expect } from 'vitest';
import {
  lifePath,
  birthdayNumber,
  expressionNumber,
  soulUrgeNumber,
  personalityNumber,
  buildChart,
} from '../src/numerology.js';

describe('lifePath', () => {
  it("Lucky 1985-05-05 → 6 (year 1985→5, +5+5 = 15 → 6)", () => {
    expect(lifePath({ year: 1985, month: 5, day: 5 })).toBe(6);
  });

  it('preserves master 11 at the final sum', () => {
    // 2000-09-29 → year 2 + month 9 + day 11 = 22 (master, stop)
    // We constructed: year 2000→2, month 9→9, day 29→11
    expect(lifePath({ year: 2000, month: 9, day: 29 })).toBe(22);
  });

  it('preserves master at a component (day 29 → 11)', () => {
    // 2001-01-29 → 3 + 1 + 11 = 15 → 6
    expect(lifePath({ year: 2001, month: 1, day: 29 })).toBe(6);
  });

  it('handles plain non-master result', () => {
    // 1990-01-01 → 1 + 1 + 1 = 3
    expect(lifePath({ year: 1990, month: 1, day: 1 })).toBe(3);
  });

  it('rejects invalid dates', () => {
    expect(() => lifePath({ year: 0, month: 1, day: 1 })).toThrow();
    expect(() => lifePath({ year: 2000, month: 13, day: 1 })).toThrow();
    expect(() => lifePath({ year: 2000, month: 1, day: 32 })).toThrow();
  });
});

describe('birthdayNumber', () => {
  it('reduces the day of month, preserving masters', () => {
    expect(birthdayNumber({ year: 1985, month: 5, day: 5 })).toBe(5);
    expect(birthdayNumber({ year: 1985, month: 5, day: 11 })).toBe(11);
    expect(birthdayNumber({ year: 1985, month: 5, day: 29 })).toBe(11); // 29 → 11
    expect(birthdayNumber({ year: 1985, month: 5, day: 22 })).toBe(22);
    expect(birthdayNumber({ year: 1985, month: 5, day: 31 })).toBe(4);
  });
});

describe("Lucky's name numbers (Lucky Surya Haryadi)", () => {
  const NAME = 'Lucky Surya Haryadi';

  it('expression = 6 (LUCKY 18 + SURYA 21 + HARYADI 39 = 78 → 15 → 6)', () => {
    expect(expressionNumber(NAME)).toBe(6);
  });

  it('soul urge = 9 (vowels U+U+A+A+A+I = 3+3+1+1+1+9 = 18 → 9)', () => {
    expect(soulUrgeNumber(NAME)).toBe(9);
  });

  it('personality = 6 (consonants sum to 60 → 6)', () => {
    expect(personalityNumber(NAME)).toBe(6);
  });
});

describe('expression with diacritics and punctuation', () => {
  it('"Émile" === "Emile"', () => {
    expect(expressionNumber('Émile')).toBe(expressionNumber('Emile'));
  });

  it('punctuation does not affect totals', () => {
    expect(expressionNumber("O'Brien")).toBe(expressionNumber('OBrien'));
  });
});

describe('soulUrge edge case', () => {
  it('returns 0 for a name with no vowels', () => {
    expect(soulUrgeNumber('Bryn')).toBe(0); // Y is consonant
  });
});

describe('personality edge case', () => {
  it('throws for a name with no consonants', () => {
    expect(() => personalityNumber('Aeiou')).toThrow();
  });
});

describe('buildChart', () => {
  it("returns Lucky's full chart", () => {
    const chart = buildChart('Lucky Surya Haryadi', { year: 1985, month: 5, day: 5 });
    expect(chart).toMatchObject({
      name: 'Lucky Surya Haryadi',
      birth: { year: 1985, month: 5, day: 5 },
      lifePath: 6,
      birthday: 5,
      expression: 6,
      soulUrge: 9,
      personality: 6,
    });
  });
});
