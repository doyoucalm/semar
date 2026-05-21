import { describe, it, expect } from 'vitest';
import { nayinOfIndex } from '../src/nayin.js';

describe("Nayin (纳音) — Lucky's chart", () => {
  it('乙丑 (year, index 1) → 海中金', () => {
    expect(nayinOfIndex(1).cn).toBe('海中金');
    expect(nayinOfIndex(1).element).toBe('金');
  });

  it('庚辰 (month, index 16) → 白蜡金', () => {
    expect(nayinOfIndex(16).cn).toBe('白蜡金');
    expect(nayinOfIndex(16).element).toBe('金');
  });

  it('甲辰 (day, index 40) → 覆灯火', () => {
    expect(nayinOfIndex(40).cn).toBe('覆灯火');
    expect(nayinOfIndex(40).element).toBe('火');
  });

  it('己巳 (hour, index 5) → 大林木', () => {
    expect(nayinOfIndex(5).cn).toBe('大林木');
    expect(nayinOfIndex(5).element).toBe('木');
  });

  it('wraps modulo 60', () => {
    expect(nayinOfIndex(0).cn).toBe(nayinOfIndex(60).cn);
    expect(nayinOfIndex(-1).cn).toBe(nayinOfIndex(59).cn);
  });

  it('consecutive even-indexed entries share their nayin name', () => {
    for (let i = 0; i < 60; i += 2) {
      expect(nayinOfIndex(i).cn).toBe(nayinOfIndex(i + 1).cn);
    }
  });
});
