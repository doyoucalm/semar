import { describe, it, expect } from 'vitest';
import { reduce, digitSum, isMaster, MASTER_NUMBERS } from '../src/reduce.js';

describe('digitSum', () => {
  it('sums digits of positive integers', () => {
    expect(digitSum(0)).toBe(0);
    expect(digitSum(9)).toBe(9);
    expect(digitSum(123)).toBe(6);
    expect(digitSum(1985)).toBe(23);
  });

  it('ignores sign', () => {
    expect(digitSum(-1985)).toBe(23);
  });
});

describe('isMaster', () => {
  it('recognises 11 / 22 / 33 only', () => {
    expect(isMaster(11)).toBe(true);
    expect(isMaster(22)).toBe(true);
    expect(isMaster(33)).toBe(true);
    expect(isMaster(44)).toBe(false);
    expect(isMaster(13)).toBe(false);
    expect(isMaster(0)).toBe(false);
  });

  it('MASTER_NUMBERS contains exactly 11/22/33', () => {
    expect([...MASTER_NUMBERS]).toEqual([11, 22, 33]);
  });
});

describe('reduce', () => {
  it('single-digit numbers pass through', () => {
    for (let i = 1; i <= 9; i++) expect(reduce(i)).toBe(i);
  });

  it('preserves master numbers', () => {
    expect(reduce(11)).toBe(11);
    expect(reduce(22)).toBe(22);
    expect(reduce(33)).toBe(33);
  });

  it('preserves masters reached via intermediate sums', () => {
    // 29 → 11 (master), stop
    expect(reduce(29)).toBe(11);
    // 49 → 13 → 4 (not master)
    expect(reduce(49)).toBe(4);
    // 99 → 18 → 9
    expect(reduce(99)).toBe(9);
    // 1985 → 23 → 5
    expect(reduce(1985)).toBe(5);
  });

  it('0 stays 0', () => {
    expect(reduce(0)).toBe(0);
  });
});
