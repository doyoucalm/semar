import { describe, it, expect } from 'vitest';
import { findBranchInteractions, findStemInteractions } from '../src/interactions.js';

// Lucky's pillars: 乙丑 庚辰 甲辰 己巳
const LUCKY = {
  year:  { stem: '乙' as const, branch: '丑' as const },
  month: { stem: '庚' as const, branch: '辰' as const },
  day:   { stem: '甲' as const, branch: '辰' as const },
  hour:  { stem: '己' as const, branch: '巳' as const },
};

describe("branch interactions in Lucky's chart", () => {
  const interactions = findBranchInteractions(LUCKY);

  it('detects 辰辰 self-punishment (month/day are both 辰)', () => {
    const found = interactions.find((i) => i.kind === 'punishment' && i.name.includes('辰辰'));
    expect(found).toBeTruthy();
    expect([...(found?.slots ?? [])].sort()).toEqual(['day', 'month']);
  });

  it('detects 丑辰 break in year/month and year/day', () => {
    const breaks = interactions.filter((i) => i.kind === 'break' && i.branches.includes('丑') && i.branches.includes('辰'));
    expect(breaks).toHaveLength(2);
    const slotsCombos = breaks.map((b) => b.slots.slice().sort().join(','));
    expect(slotsCombos).toContain('month,year');
    expect(slotsCombos).toContain('day,year');
  });

  it('does NOT spuriously detect 六合 or 三合 for Lucky\'s chart', () => {
    const combos = interactions.filter((i) => i.kind === 'sixCombination' || i.kind === 'threeCombination');
    expect(combos).toEqual([]);
  });
});

describe("stem interactions in Lucky's chart", () => {
  const interactions = findStemInteractions(LUCKY);

  it('乙 + 庚 = 乙庚合金 (year/month combination)', () => {
    const found = interactions.find((i) => i.kind === 'fiveCombination' && i.stems.includes('乙') && i.stems.includes('庚'));
    expect(found?.element).toBe('金');
    expect([...(found?.slots ?? [])].sort()).toEqual(['month', 'year']);
  });

  it('甲 + 己 = 甲己合土 (day/hour combination)', () => {
    const found = interactions.find((i) => i.kind === 'fiveCombination' && i.stems.includes('甲') && i.stems.includes('己'));
    expect(found?.element).toBe('土');
    expect([...(found?.slots ?? [])].sort()).toEqual(['day', 'hour']);
  });

  it('甲 + 庚 = clash (相冲)', () => {
    const found = interactions.find((i) => i.kind === 'clash' && i.stems.includes('甲') && i.stems.includes('庚'));
    expect(found).toBeTruthy();
    expect([...(found?.slots ?? [])].sort()).toEqual(['day', 'month']);
  });
});

describe('triple combination detection', () => {
  it('申子辰 in year/month/day → 三合水', () => {
    const interactions = findBranchInteractions({
      year:  { stem: '甲', branch: '申' },
      month: { stem: '乙', branch: '子' },
      day:   { stem: '丙', branch: '辰' },
      hour:  { stem: '丁', branch: '巳' },
    });
    const triad = interactions.find((i) => i.kind === 'threeCombination');
    expect(triad).toBeTruthy();
    expect(triad?.element).toBe('水');
  });
});

describe('六合 detection', () => {
  it('detects 子丑合土', () => {
    const interactions = findBranchInteractions({
      year:  { stem: '甲', branch: '子' },
      month: { stem: '乙', branch: '丑' },
      day:   { stem: '丙', branch: '寅' },
      hour:  { stem: '丁', branch: '卯' },
    });
    const combo = interactions.find((i) => i.kind === 'sixCombination');
    expect(combo?.element).toBe('土');
  });
});
