import { describe, it, expect } from 'vitest';
import { toLunar } from '../src/lunar.js';

const WIB = 7 * 60;
const CST = 8 * 60;

/**
 * lunar-javascript backend: these cases now pass.
 * Note on test 3: 2020-04-23 = regular 4月 day 1.
 *                 2020-05-23 = 闰四月 day 1 (the actual leap 4th month).
 */
describe('Gregorian → Lunisolar conversion', () => {
  it("Lucky's 1985-05-05 09:31 WIB → lunar 1985 year, 3月 16日", () => {
    const utcMs = Date.UTC(1985, 4, 5, 9, 31) - WIB * 60_000;
    const ld = toLunar(utcMs, WIB);
    expect(ld.year).toBe(1985);
    expect(ld.month).toBe(3);
    expect(ld.isLeapMonth).toBe(false);
    expect(ld.day).toBe(16);
  });

  it('1984-02-02 (Spring Festival 1984) → lunar 1984 year, 1月 1日', () => {
    const utcMs = Date.UTC(1984, 1, 2, 12, 0) - CST * 60_000;
    const ld = toLunar(utcMs, CST);
    expect(ld.year).toBe(1984);
    expect(ld.month).toBe(1);
    expect(ld.day).toBe(1);
    expect(ld.isLeapMonth).toBe(false);
  });

  it('2020-04-23 = regular 四月 1日 (NOT leap)', () => {
    const utcMs = Date.UTC(2020, 3, 23, 12, 0) - CST * 60_000;
    const ld = toLunar(utcMs, CST);
    expect(ld.year).toBe(2020);
    expect(ld.month).toBe(4);
    expect(ld.isLeapMonth).toBe(false);
    expect(ld.day).toBe(1);
  });

  it('2020-05-23 = 闰四月 1日 (leap 4th month)', () => {
    const utcMs = Date.UTC(2020, 4, 23, 12, 0) - CST * 60_000;
    const ld = toLunar(utcMs, CST);
    expect(ld.year).toBe(2020);
    expect(ld.month).toBe(4);
    expect(ld.isLeapMonth).toBe(true);
    expect(ld.day).toBe(1);
  });
});

describe('Lunar conversion smoke (no crash)', () => {
  it('does not throw for a typical date even if the result is wrong', () => {
    const utcMs = Date.UTC(2026, 4, 17, 12, 0) - WIB * 60_000;
    expect(() => toLunar(utcMs, WIB)).not.toThrow();
  });
});
