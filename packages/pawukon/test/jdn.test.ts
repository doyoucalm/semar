import { describe, expect, it } from 'vitest';
import { gregorianToJDN, jdnToGregorian, mod } from '../src/jdn.js';

describe('gregorianToJDN', () => {
  it('returns 2451545 for 2000-01-01 (J2000 epoch)', () => {
    expect(gregorianToJDN(2000, 1, 1)).toBe(2451545);
  });

  it('returns 2400001 for 1858-11-17 (MJD epoch)', () => {
    expect(gregorianToJDN(1858, 11, 17)).toBe(2400001);
  });

  it('returns 2446191 for Lucky birthday 1985-05-05', () => {
    expect(gregorianToJDN(1985, 5, 5)).toBe(2446191);
  });

  it('round-trips via jdnToGregorian', () => {
    const cases: Array<[number, number, number]> = [
      [1985, 5, 5],
      [2000, 2, 29],
      [2026, 5, 18],
      [1900, 1, 1],
      [2100, 12, 31],
    ];
    for (const [y, m, d] of cases) {
      const jdn = gregorianToJDN(y, m, d);
      const back = jdnToGregorian(jdn);
      expect(back).toEqual({ year: y, month: m, day: d });
    }
  });
});

describe('mod', () => {
  it('handles negatives positively', () => {
    expect(mod(-1, 5)).toBe(4);
    expect(mod(-6, 5)).toBe(4);
    expect(mod(7, 5)).toBe(2);
    expect(mod(0, 5)).toBe(0);
  });
});
