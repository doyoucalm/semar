import { describe, it, expect } from 'vitest';
import { pillarFromIndex, makePillar, sexagenaryIndexOf } from '../src/sexagenary.js';

describe('sexagenary cycle', () => {
  it('index 0 = 甲子', () => {
    const p = pillarFromIndex(0);
    expect(p.name).toBe('甲子');
    expect(p.sexagenaryIndex).toBe(0);
  });

  it('index 1 = 乙丑 (Lucky\'s year)', () => {
    expect(pillarFromIndex(1).name).toBe('乙丑');
  });

  it('index 40 = 甲辰 (Lucky\'s day)', () => {
    expect(pillarFromIndex(40).name).toBe('甲辰');
  });

  it('index 59 = 癸亥, index 60 wraps back to 甲子', () => {
    expect(pillarFromIndex(59).name).toBe('癸亥');
    expect(pillarFromIndex(60).name).toBe('甲子');
  });

  it('negative indices wrap correctly', () => {
    expect(pillarFromIndex(-1).name).toBe('癸亥');
    expect(pillarFromIndex(-60).name).toBe('甲子');
  });

  it('rejects invalid parity pairs', () => {
    expect(() => makePillar(0, 1)).toThrow(); // 甲丑 — invalid
    expect(() => makePillar(1, 0)).toThrow(); // 乙子 — invalid
  });

  it('sexagenaryIndexOf round-trips through pillarFromIndex', () => {
    for (let n = 0; n < 60; n++) {
      const p = pillarFromIndex(n);
      expect(sexagenaryIndexOf(p.stemIdx, p.branchIdx)).toBe(n);
    }
  });
});
