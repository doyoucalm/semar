import { describe, it, expect } from 'vitest';
import {
  decadeLimitDirection,
  computeDecadeLimits,
  activeDecadeLimit,
  suiAge,
} from '../src/decade-limits.js';
import { computeZWDSChart } from '../src/engine.js';
import type { Branch, Palace } from '../src/constants.js';

// ── Direction tests ────────────────────────────────────────────────────────────

describe('decadeLimitDirection', () => {
  it('Yang stem + male → CCW (-1)', () => {
    expect(decadeLimitDirection('甲', 'male')).toBe(-1);
    expect(decadeLimitDirection('庚', 'male')).toBe(-1);
    expect(decadeLimitDirection('壬', 'male')).toBe(-1);
  });

  it('Yang stem + female → CW (+1)', () => {
    expect(decadeLimitDirection('丙', 'female')).toBe(1);
  });

  it('Yin stem + male → CW (+1)', () => {
    expect(decadeLimitDirection('乙', 'male')).toBe(1);
    expect(decadeLimitDirection('癸', 'male')).toBe(1);
  });

  it('Yin stem + female → CCW (-1)', () => {
    expect(decadeLimitDirection('丁', 'female')).toBe(-1);
    expect(decadeLimitDirection('己', 'female')).toBe(-1);
  });
});

// ── Lucky 1985 chart: decade limits ──────────────────────────────────────────

describe('Lucky 1985 chart — decade limits', () => {
  // Lucky: 1985-05-05 03:15 WIB, 土五局, self at 寅, year stem 乙 (Yin), male
  // → Yin + Male → CW (+1)
  // → First limit starts age 5 (bureau 5)
  // → Sequence from 寅: 寅(5-14), 卯(15-24), 辰(25-34), 巳(35-44), 午(45-54) ...
  const chart = computeZWDSChart({
    year: 1985, month: 5, day: 5,
    hour: 3, minute: 15,
    utcOffsetMinutes: 7 * 60,
    gender: 'male',
    lunarOverride: { year: 1985, month: 3, day: 16, isLeapMonth: false },
  });

  it('returns 12 decade limits', () => {
    expect(chart.decadeLimits).toHaveLength(12);
  });

  it('direction is CW (乙 year + male)', () => {
    // First limit is at 寅 (selfBranch), next is 卯 (CW +1)
    expect(chart.decadeLimits[0]!.branch).toBe('寅');
    expect(chart.decadeLimits[1]!.branch).toBe('卯');
  });

  it('first limit starts at age 5 (bureau 土五局 = 5)', () => {
    const first = chart.decadeLimits[0]!;
    expect(first.startAge).toBe(5);
    expect(first.endAge).toBe(14);
    expect(first.sequence).toBe(1);
  });

  it('each limit spans exactly 10 years', () => {
    for (const dl of chart.decadeLimits) {
      expect(dl.endAge - dl.startAge).toBe(9);
    }
  });

  it('limits are contiguous (no gaps)', () => {
    const lims = chart.decadeLimits;
    for (let i = 1; i < lims.length; i++) {
      expect(lims[i]!.startAge).toBe(lims[i - 1]!.endAge + 1);
    }
  });

  it('age-35 limit is at 巳 (4th limit, sequence 4)', () => {
    const dl = activeDecadeLimit(chart.decadeLimits, 35);
    expect(dl).not.toBeNull();
    expect(dl!.branch).toBe('巳');
    expect(dl!.sequence).toBe(4);
  });

  it('age-40 is still in the same 大限 as age-35', () => {
    const dl35 = activeDecadeLimit(chart.decadeLimits, 35);
    const dl40 = activeDecadeLimit(chart.decadeLimits, 40);
    expect(dl35!.branch).toBe(dl40!.branch);
  });
});

// ── suiAge ────────────────────────────────────────────────────────────────────

describe('suiAge', () => {
  it('birth year = age 1', () => {
    expect(suiAge(1985, 1985)).toBe(1);
  });

  it('one year later = age 2', () => {
    expect(suiAge(1985, 1986)).toBe(2);
  });

  it('Lucky in 2026 = age 42', () => {
    expect(suiAge(1985, 2026)).toBe(42);
  });
});

// ── activeDecadeLimit edge cases ──────────────────────────────────────────────

describe('activeDecadeLimit', () => {
  const chart = computeZWDSChart({
    year: 1985, month: 5, day: 5,
    hour: 3, minute: 15,
    utcOffsetMinutes: 7 * 60,
    gender: 'male',
    lunarOverride: { year: 1985, month: 3, day: 16, isLeapMonth: false },
  });

  it('age before first limit → null', () => {
    expect(activeDecadeLimit(chart.decadeLimits, 4)).toBeNull();
  });

  it('exactly on start age is included', () => {
    expect(activeDecadeLimit(chart.decadeLimits, 5)).not.toBeNull();
  });

  it('exactly on end age is included', () => {
    expect(activeDecadeLimit(chart.decadeLimits, 14)).not.toBeNull();
    expect(activeDecadeLimit(chart.decadeLimits, 14)!.sequence).toBe(1);
  });

  it('one past end age moves to next limit', () => {
    expect(activeDecadeLimit(chart.decadeLimits, 15)!.sequence).toBe(2);
  });
});
