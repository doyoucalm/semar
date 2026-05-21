import { describe, it, expect } from 'vitest';
import { HEXAGRAMS, hexagramByBinary, hexagramByNumber } from '../src/hexagrams.js';

describe('hexagram table', () => {
  it('has exactly 64 entries', () => {
    expect(HEXAGRAMS).toHaveLength(64);
  });

  it('numbers run 1..64 in order', () => {
    HEXAGRAMS.forEach((h, i) => {
      expect(h.number).toBe(i + 1);
    });
  });

  it('every binary is 6 bits of 0/1', () => {
    for (const h of HEXAGRAMS) {
      expect(h.binary).toMatch(/^[01]{6}$/);
    }
  });

  it('all 64 binaries are unique (covers the full 2^6 space)', () => {
    const set = new Set(HEXAGRAMS.map((h) => h.binary));
    expect(set.size).toBe(64);
  });

  it('canonical anchors land at the right numbers', () => {
    expect(hexagramByNumber(1).binary).toBe('111111');  // 乾 The Creative
    expect(hexagramByNumber(2).binary).toBe('000000');  // 坤 The Receptive
    expect(hexagramByNumber(11).binary).toBe('111000'); // 泰 Peace
    expect(hexagramByNumber(12).binary).toBe('000111'); // 否 Standstill
    expect(hexagramByNumber(63).binary).toBe('101010'); // 既濟 After Completion
    expect(hexagramByNumber(64).binary).toBe('010101'); // 未濟 Before Completion
  });

  it('lookups round-trip', () => {
    for (const h of HEXAGRAMS) {
      expect(hexagramByBinary(h.binary).number).toBe(h.number);
      expect(hexagramByNumber(h.number).binary).toBe(h.binary);
    }
  });

  it('throws on unknown lookup', () => {
    expect(() => hexagramByBinary('xxxxxx')).toThrow();
    expect(() => hexagramByNumber(0)).toThrow();
    expect(() => hexagramByNumber(65)).toThrow();
  });
});
