import { describe, it, expect } from 'vitest';
import { computeBazi, type BirthInput } from '../src/engine.js';
import { computeLuckPillars } from '../src/luck-pillars.js';

// Lucky: 1985-05-05 03:15 WIB Bandung, 乙丑 庚辰 甲辰 丙寅, day master 甲.
const LUCKY: BirthInput = {
  year: 1985, month: 5, day: 5, hour: 3, minute: 15, utcOffsetMinutes: 420,
};

describe('computeLuckPillars — direction (顺/逆)', () => {
  it('阴年 (乙) male → backward (逆行)', () => {
    const chart = computeBazi(LUCKY);
    const lp = computeLuckPillars(chart, 'male');
    expect(lp.forward).toBe(false);
  });

  it('阴年 (乙) female → forward (顺行)', () => {
    const chart = computeBazi(LUCKY);
    const lp = computeLuckPillars(chart, 'female');
    expect(lp.forward).toBe(true);
  });

  it('forward iff (yearStemIsYang === isMale)', () => {
    const chart = computeBazi(LUCKY); // year stem 乙 = yin (idx 1)
    expect(chart.year.stemIdx % 2).toBe(1);
    expect(computeLuckPillars(chart, 'male').forward).toBe(false);   // yin + male
    expect(computeLuckPillars(chart, 'female').forward).toBe(true);  // yin + female
  });
});

describe('computeLuckPillars — Lucky fixture', () => {
  const chart = computeBazi(LUCKY);
  const lp = computeLuckPillars(chart, 'male');

  it('start age = 10 (30 days back to 清明)', () => {
    expect(lp.startAge).toBe(10);
    expect(lp.startAgeYM).toEqual({ years: 10, months: 0 });
  });

  it('steps backward from the month pillar 庚辰', () => {
    expect(chart.month.name).toBe('庚辰');
    const names = lp.pillars.slice(0, 4).map((p) => p.pillar.name);
    expect(names).toEqual(['己卯', '戊寅', '丁丑', '丙子']);
  });

  it('each pillar spans 10 years and carries a ten god', () => {
    for (let i = 0; i < lp.pillars.length; i++) {
      const p = lp.pillars[i]!;
      expect(p.index).toBe(i + 1);
      expect(p.endAge - p.startAge).toBeCloseTo(10, 5);
      expect(p.startYear).toBe(chart.birth.year + Math.floor(p.startAge));
      expect(p.stemTenGod).toBeTruthy();
    }
  });

  it('default count is 9 pillars', () => {
    expect(lp.pillars).toHaveLength(9);
  });
});

describe('computeLuckPillars — gender plumbing', () => {
  it('reads gender from birth input when not passed explicitly', () => {
    const chart = computeBazi({ ...LUCKY, gender: 'male' });
    const lp = computeLuckPillars(chart);
    expect(lp.gender).toBe('male');
    expect(lp.forward).toBe(false);
  });

  it('throws when gender is absent everywhere', () => {
    const chart = computeBazi(LUCKY);
    expect(() => computeLuckPillars(chart)).toThrow(/gender/);
  });
});
