import { describe, it, expect } from 'vitest';
import { computeZWDSChart } from '../src/engine.js';
import { renderZWDSText, renderZWDSMarkdown } from '../src/render.js';

/**
 * NOTE: Gregorian→lunar conversion in `lunar.ts` still has edge-case
 * bugs around the dongzhi-bounded leap-month rule. Engine tests below
 * therefore pass a `lunarOverride` taken from a trusted lunar-calendar
 * source. Once the auto-converter is fixed, the override can be
 * dropped.
 */

describe("Lucky's ZWDS chart — 1985-05-05 03:15 WIB Bandung, male", () => {
  const chart = computeZWDSChart({
    year: 1985, month: 5, day: 5,
    hour: 3, minute: 15,
    utcOffsetMinutes: 7 * 60,
    gender: 'male',
    lunarOverride: { year: 1985, month: 3, day: 16, isLeapMonth: false },
  });

  it('hour branch is 寅 (3:15 AM falls in 寅时 3-5)', () => {
    expect(chart.hour).toBe('寅');
  });

  it('year pillar is 乙丑', () => {
    expect(chart.year.stem).toBe('乙');
    expect(chart.year.branch).toBe('丑');
  });

  it('Self palace is at 寅', () => {
    // Lunar 3月 + 寅时: from 寅 forward 2 = 辰, backward by 寅-index (2) = 寅.
    expect(chart.selfPalaceBranch).toBe('寅');
  });

  it('Body palace is at 午 (寅 hour: forward 2 from 辰 = 午)', () => {
    expect(chart.bodyPalaceBranch).toBe('午');
  });

  it('returns 12 palace cells', () => {
    expect(chart.cells).toHaveLength(12);
  });

  it('every main star appears on exactly one branch', () => {
    const seen = new Map<string, number>();
    for (const cell of chart.cells) {
      for (const s of cell.mainStars) {
        seen.set(s, (seen.get(s) ?? 0) + 1);
      }
    }
    expect(seen.size).toBe(14);
    for (const n of seen.values()) expect(n).toBe(1);
  });

  it('紫微 and 天府 are mirror-symmetric about the 寅-申 axis', () => {
    const branches = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
    const ziIdx = branches.indexOf(chart.ziweiBranch);
    const fuIdx = branches.indexOf(chart.tianfuBranch);
    expect((4 - ziIdx + 12) % 12).toBe(fuIdx);
  });

  it('one cell is marked as the Self palace', () => {
    const selfCells = chart.cells.filter((c) => c.isSelf);
    expect(selfCells).toHaveLength(1);
    expect(selfCells[0]!.branch).toBe(chart.selfPalaceBranch);
    expect(selfCells[0]!.palace).toBe('命宫');
  });

  it('year stem 乙 → transformations include 化忌 太阴 and 化禄 天机', () => {
    const allTrans = chart.cells.flatMap((c) => c.transformations);
    const map = new Map(allTrans.map((t) => [t.transformation, t.star]));
    expect(map.get('化禄')).toBe('天机');
    expect(map.get('化权')).toBe('天梁');
    expect(map.get('化科')).toBe('紫微');
    expect(map.get('化忌')).toBe('太阴');
  });

  it('renderZWDSText is a non-empty multi-line string', () => {
    const text = renderZWDSText(chart);
    expect(text).toContain('紫微');
    expect(text.split('\n').length).toBeGreaterThan(15);
  });

  it('renderZWDSMarkdown produces a table', () => {
    const md = renderZWDSMarkdown(chart);
    expect(md).toContain('## Zi Wei Dou Shu');
    expect(md).toContain('| Branch |');
    expect(md).toContain('紫微');
  });
});

describe('computeZWDSChart — validation', () => {
  it('rejects bad gender', () => {
    expect(() => computeZWDSChart({
      year: 1985, month: 5, day: 5, hour: 9, minute: 31,
      utcOffsetMinutes: 420,
      gender: 'other' as 'male',
      lunarOverride: { year: 1985, month: 3, day: 16, isLeapMonth: false },
    })).toThrow();
  });

  it('rejects out-of-range month', () => {
    expect(() => computeZWDSChart({
      year: 1985, month: 13, day: 1, hour: 0, minute: 0,
      utcOffsetMinutes: 0, gender: 'male',
      lunarOverride: { year: 1985, month: 3, day: 16, isLeapMonth: false },
    })).toThrow();
  });
});
