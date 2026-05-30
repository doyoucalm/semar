import { describe, it, expect } from 'vitest';
import { computeBazi, type BirthInput } from '../src/engine.js';
import { computeAnnualPillar, annualFortune, annualRange } from '../src/annual.js';

const LUCKY: BirthInput = {
  year: 1985, month: 5, day: 5, hour: 3, minute: 15, utcOffsetMinutes: 420,
};

describe('computeAnnualPillar', () => {
  it('matches well-known recent years', () => {
    expect(computeAnnualPillar(2024).name).toBe('甲辰'); // Wood Dragon
    expect(computeAnnualPillar(2025).name).toBe('乙巳'); // Wood Snake
    expect(computeAnnualPillar(2020).name).toBe('庚子'); // Metal Rat
    expect(computeAnnualPillar(1984).name).toBe('甲子'); // start of the 60-cycle
  });

  it('is periodic with period 60', () => {
    expect(computeAnnualPillar(2024).name).toBe(computeAnnualPillar(2024 - 60).name);
  });
});

describe('annualFortune — against Lucky (day master 甲)', () => {
  const chart = computeBazi(LUCKY);

  it('2024 甲辰: annual stem 甲 vs DM 甲 = 比肩', () => {
    const af = annualFortune(chart, 2024);
    expect(af.pillar.name).toBe('甲辰');
    expect(af.stemTenGod).toBe('比肩');
  });

  it('detects 辰 vs natal 丑 (year branch) as a 破 break', () => {
    const af = annualFortune(chart, 2024);
    const yearHit = af.natalHits.find((h) => h.slot === 'year');
    expect(yearHit).toBeDefined();
    expect(yearHit!.relations.map((r) => r.kind)).toContain('break');
  });

  it('branchTenGods are derived from the annual branch hidden stems', () => {
    const af = annualFortune(chart, 2024);
    expect(af.branchTenGods.length).toBeGreaterThan(0);
  });
});

describe('annualRange', () => {
  it('returns one fortune per inclusive year', () => {
    const r = annualRange(computeBazi(LUCKY), 2024, 2027);
    expect(r.map((f) => f.year)).toEqual([2024, 2025, 2026, 2027]);
    expect(r.map((f) => f.pillar.name)).toEqual(['甲辰', '乙巳', '丙午', '丁未']);
  });

  it('throws on an inverted range', () => {
    expect(() => annualRange(computeBazi(LUCKY), 2027, 2024)).toThrow();
  });
});
