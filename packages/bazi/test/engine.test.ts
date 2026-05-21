import { describe, it, expect } from 'vitest';
import { computeBazi, hourBranchIndex } from '../src/engine.js';

describe("Lucky's chart — the canonical fixture", () => {
  // Born 1985-05-05 09:31 WIB (Asia/Jakarta, UTC+7).
  // Note: fixtures/lucky-bazi.json has `solarDatetime: "1985-05-05T03:31"`
  // which appears to be a bug — the underlying chart was computed for the
  // 09:31 figure shown in the chart's 阳历 field. Truth = 09:31 local.
  const LUCKY = {
    year: 1985,
    month: 5,
    day: 5,
    hour: 9,
    minute: 31,
    utcOffsetMinutes: 7 * 60,
  };

  it('produces 乙丑 庚辰 甲辰 己巳', () => {
    const chart = computeBazi(LUCKY);
    expect(chart.eightCharacters).toBe('乙丑 庚辰 甲辰 己巳');
  });

  it('day master is 甲 (yang wood)', () => {
    const chart = computeBazi(LUCKY);
    expect(chart.dayMaster.stem).toBe('甲');
    expect(chart.dayMaster.element).toBe('木');
    expect(chart.dayMaster.polarity).toBe('阳');
  });

  it('individual pillars match', () => {
    const chart = computeBazi(LUCKY);
    expect(chart.year.name).toBe('乙丑');
    expect(chart.month.name).toBe('庚辰');
    expect(chart.day.name).toBe('甲辰');
    expect(chart.hour.name).toBe('己巳');
  });

  it('one minute later would still resolve to 辰 month (Lixia is ~02:43 UTC)', () => {
    const chart = computeBazi({ ...LUCKY, minute: 32 });
    expect(chart.month.branch).toBe('辰');
  });
});

describe('year pillar Lichun boundary', () => {
  it('born Feb 3 1985 (before Lichun) → 1984 year = 甲子', () => {
    const chart = computeBazi({
      year: 1985, month: 2, day: 3, hour: 12, minute: 0,
      utcOffsetMinutes: 8 * 60,
    });
    expect(chart.year.name).toBe('甲子');
  });

  it('born Feb 5 1985 (after Lichun) → 1985 year = 乙丑', () => {
    const chart = computeBazi({
      year: 1985, month: 2, day: 5, hour: 12, minute: 0,
      utcOffsetMinutes: 8 * 60,
    });
    expect(chart.year.name).toBe('乙丑');
  });
});

describe('day pillar continuity around Lucky\'s 甲辰 reference', () => {
  // We trust 1985-05-05 = 甲辰 (sexagenary 40) from the fixture. Anchored
  // there, neighbouring days must advance by exactly one in the 60-cycle.
  const day = (d: number) => computeBazi({
    year: 1985, month: 5, day: d, hour: 12, minute: 0,
    utcOffsetMinutes: 8 * 60,
  });

  it('1985-05-04 is 癸卯 (one before 甲辰)', () => {
    expect(day(4).day.name).toBe('癸卯');
  });

  it('1985-05-05 is 甲辰', () => {
    expect(day(5).day.name).toBe('甲辰');
  });

  it('1985-05-06 is 乙巳 (one after 甲辰)', () => {
    expect(day(6).day.name).toBe('乙巳');
  });

  it('60 days later wraps the full cycle back to 甲辰', () => {
    expect(day(5).day.name).toBe(
      computeBazi({
        year: 1985, month: 7, day: 4, hour: 12, minute: 0,
        utcOffsetMinutes: 8 * 60,
      }).day.name,
    );
  });
});

describe('hourBranchIndex', () => {
  it('maps each hour to the correct branch', () => {
    // 23:xx and 00:xx → 子 (0)
    expect(hourBranchIndex(23)).toBe(0);
    expect(hourBranchIndex(0)).toBe(0);
    // 01:00–02:59 → 丑 (1)
    expect(hourBranchIndex(1)).toBe(1);
    expect(hourBranchIndex(2)).toBe(1);
    // 03:00–04:59 → 寅 (2)
    expect(hourBranchIndex(3)).toBe(2);
    expect(hourBranchIndex(4)).toBe(2);
    // 09:00–10:59 → 巳 (5)
    expect(hourBranchIndex(9)).toBe(5);
    expect(hourBranchIndex(10)).toBe(5);
    // 21:00–22:59 → 亥 (11)
    expect(hourBranchIndex(21)).toBe(11);
    expect(hourBranchIndex(22)).toBe(11);
  });
});

describe('validation', () => {
  it('rejects out-of-range fields', () => {
    expect(() => computeBazi({
      year: 1985, month: 13, day: 1, hour: 0, minute: 0, utcOffsetMinutes: 0,
    })).toThrow();
    expect(() => computeBazi({
      year: 1985, month: 5, day: 5, hour: 24, minute: 0, utcOffsetMinutes: 0,
    })).toThrow();
  });
});
