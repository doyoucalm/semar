import { describe, it, expect } from 'vitest';
import { castHexagram, castFromLines, mulberry32 } from '../src/cast.js';

describe('castFromLines', () => {
  it('all young yang → hexagram 1, no relating', () => {
    const r = castFromLines([7, 7, 7, 7, 7, 7]);
    expect(r.primary.number).toBe(1);
    expect(r.relating).toBeNull();
    expect(r.changingPositions).toEqual([]);
  });

  it('all young yin → hexagram 2, no relating', () => {
    const r = castFromLines([8, 8, 8, 8, 8, 8]);
    expect(r.primary.number).toBe(2);
    expect(r.relating).toBeNull();
  });

  it('all old yang → primary 1 (Creative) → relating 2 (Receptive)', () => {
    const r = castFromLines([9, 9, 9, 9, 9, 9]);
    expect(r.primary.number).toBe(1);
    expect(r.relating?.number).toBe(2);
    expect(r.changingPositions).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('all old yin → primary 2 (Receptive) → relating 1 (Creative)', () => {
    const r = castFromLines([6, 6, 6, 6, 6, 6]);
    expect(r.primary.number).toBe(2);
    expect(r.relating?.number).toBe(1);
  });

  it('builds lines bottom-up: yang yang yang yin yin yin → 泰 (11) Peace', () => {
    const r = castFromLines([7, 7, 7, 8, 8, 8]);
    expect(r.primary.number).toBe(11);
    expect(r.primary.cn).toBe('泰');
  });

  it('single old yang at line 1 of Peace mutates to 升 (46) Pushing Upward', () => {
    // Peace = 111000; flip bottom yang → 011000 = hex 46
    const r = castFromLines([9, 7, 7, 8, 8, 8]);
    expect(r.primary.number).toBe(11);
    expect(r.relating?.number).toBe(46);
    expect(r.changingPositions).toEqual([1]);
  });

  it('throws on wrong line count', () => {
    expect(() => castFromLines([7, 7, 7])).toThrow();
  });

  it('line flags are consistent with value', () => {
    const r = castFromLines([6, 7, 8, 9, 7, 8]);
    expect(r.lines[0]).toMatchObject({ value: 6, yang: false, changing: true });
    expect(r.lines[1]).toMatchObject({ value: 7, yang: true,  changing: false });
    expect(r.lines[2]).toMatchObject({ value: 8, yang: false, changing: false });
    expect(r.lines[3]).toMatchObject({ value: 9, yang: true,  changing: true });
  });
});

describe('castHexagram with seeded rng', () => {
  it('is deterministic for a given seed', () => {
    const a = castHexagram(mulberry32(42));
    const b = castHexagram(mulberry32(42));
    expect(a.primary.number).toBe(b.primary.number);
    expect(a.relating?.number ?? null).toBe(b.relating?.number ?? null);
    expect(a.changingPositions).toEqual(b.changingPositions);
  });

  it('different seeds generally produce different casts', () => {
    const a = castHexagram(mulberry32(1));
    const b = castHexagram(mulberry32(2));
    const sameLines = a.lines.every((l, i) => l.value === b.lines[i]?.value);
    expect(sameLines).toBe(false);
  });

  it('every line value is in {6,7,8,9}', () => {
    const r = castHexagram(mulberry32(123));
    for (const line of r.lines) {
      expect([6, 7, 8, 9]).toContain(line.value);
    }
  });

  it('produces a valid primary hexagram for 1000 random seeds', () => {
    for (let seed = 1; seed <= 1000; seed++) {
      const r = castHexagram(mulberry32(seed));
      expect(r.primary.number).toBeGreaterThanOrEqual(1);
      expect(r.primary.number).toBeLessThanOrEqual(64);
    }
  });

  it('3-coin method statistical distribution roughly matches 1:3:3:1 over 8000 lines', () => {
    const rng = mulberry32(2026);
    const counts = { 6: 0, 7: 0, 8: 0, 9: 0 };
    const N = 8000;
    for (let i = 0; i < N; i++) {
      let sum = 0;
      for (let c = 0; c < 3; c++) sum += rng() < 0.5 ? 2 : 3;
      counts[sum as 6 | 7 | 8 | 9]++;
    }
    // Expected: ~1000, 3000, 3000, 1000. Allow generous margin.
    expect(counts[6]).toBeGreaterThan(800);
    expect(counts[6]).toBeLessThan(1200);
    expect(counts[7]).toBeGreaterThan(2700);
    expect(counts[7]).toBeLessThan(3300);
    expect(counts[8]).toBeGreaterThan(2700);
    expect(counts[8]).toBeLessThan(3300);
    expect(counts[9]).toBeGreaterThan(800);
    expect(counts[9]).toBeLessThan(1200);
  });
});
