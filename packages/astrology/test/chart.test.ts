import { describe, it, expect } from 'vitest';
import { computeChart } from '../src/chart.js';
import { renderChartText, renderChartMarkdown } from '../src/render.js';

describe("Lucky's natal chart — 1985-05-05 09:31 WIB, Bandung", () => {
  const LUCKY = {
    year: 1985, month: 5, day: 5,
    hour: 9, minute: 31,
    utcOffsetMinutes: 7 * 60,
    latitude: -6.91,
    longitude: 107.61,
  };

  const chart = computeChart(LUCKY);

  it('returns 12 placements: 10 classical planets + North/South Node', () => {
    expect(chart.placements).toHaveLength(12);
    expect(chart.placements.map((p) => p.planet)).toEqual([
      'Sun', 'Moon', 'Mercury', 'Venus', 'Mars',
      'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto',
      'NorthNode', 'SouthNode',
    ]);
  });

  it('North and South Node are always 180° apart and both retrograde', () => {
    const nn = chart.placements.find((p) => p.planet === 'NorthNode')!;
    const sn = chart.placements.find((p) => p.planet === 'SouthNode')!;
    const diff = ((nn.longitude - sn.longitude) % 360 + 360) % 360; // [0,360)
    expect(Math.abs(diff - 180)).toBeLessThan(0.01);
    expect(nn.retrograde).toBe(true);
    expect(sn.retrograde).toBe(true);
  });

  it('1985-05-05: North Node is in Taurus (≈ 18° — NN was in Taurus Sep 1984–Apr 1986)', () => {
    const nn = chart.placements.find((p) => p.planet === 'NorthNode')!;
    expect(nn.sign).toBe('Taurus');
    expect(nn.degreeInSign).toBeGreaterThan(16);
    expect(nn.degreeInSign).toBeLessThan(21);
  });

  it('Sun is in Taurus (early May → ~14° Taurus)', () => {
    const sun = chart.placements.find((p) => p.planet === 'Sun')!;
    expect(sun.sign).toBe('Taurus');
    expect(sun.degreeInSign).toBeGreaterThan(13);
    expect(sun.degreeInSign).toBeLessThan(16);
  });

  it('Sun is not retrograde (Sun never is, geocentrically)', () => {
    const sun = chart.placements.find((p) => p.planet === 'Sun')!;
    expect(sun.retrograde).toBe(false);
  });

  it('Moon is not retrograde', () => {
    const moon = chart.placements.find((p) => p.planet === 'Moon')!;
    expect(moon.retrograde).toBe(false);
  });

  it('All 10 placements have a house number in 1..12', () => {
    for (const p of chart.placements) {
      expect(p.house).toBeGreaterThanOrEqual(1);
      expect(p.house).toBeLessThanOrEqual(12);
    }
  });

  it('returns 12 Whole Sign houses, ordered, no duplicates', () => {
    expect(chart.houses).toHaveLength(12);
    const signs = chart.houses.map((h) => h.sign);
    expect(new Set(signs).size).toBe(12);
    expect(chart.houses[0]!.number).toBe(1);
    expect(chart.houses[11]!.number).toBe(12);
  });

  it('1st house sign matches the Ascendant sign', () => {
    expect(chart.houses[0]!.sign).toBe(chart.ascendant.sign);
  });

  it('houseSystem is whole-sign', () => {
    expect(chart.houseSystem).toBe('whole-sign');
  });

  it('renderChartText produces a multi-line summary', () => {
    const text = renderChartText(chart);
    expect(text).toContain('Natal Chart');
    expect(text).toContain('Ascendant');
    expect(text).toContain('Sun');
    expect(text).toContain('Taurus');
    expect(text.split('\n').length).toBeGreaterThan(20);
  });

  it('renderChartMarkdown produces a table', () => {
    const md = renderChartMarkdown(chart);
    expect(md).toContain('## Natal Chart');
    expect(md).toContain('| Planet |');
    expect(md).toContain('Taurus');
  });
});

describe('vernal equinox sanity check', () => {
  it('2026-03-20 ~12:00 UTC: Sun is very near 0° Aries', () => {
    // 2026 vernal equinox ≈ Mar 20 14:46 UTC. At 12:00 UTC the Sun
    // should be ~0° Aries within a degree.
    const chart = computeChart({
      year: 2026, month: 3, day: 20,
      hour: 12, minute: 0,
      utcOffsetMinutes: 0,
      latitude: 0, longitude: 0,
    });
    const sun = chart.placements.find((p) => p.planet === 'Sun')!;
    // Could be late Pisces or very early Aries within a degree.
    const lon = sun.longitude;
    const nearAries = lon < 2 || lon > 358;
    expect(nearAries).toBe(true);
  });
});

describe('validation', () => {
  it('rejects out-of-range fields', () => {
    expect(() => computeChart({
      year: 1985, month: 13, day: 1, hour: 0, minute: 0,
      utcOffsetMinutes: 0, latitude: 0, longitude: 0,
    })).toThrow();
    expect(() => computeChart({
      year: 1985, month: 1, day: 1, hour: 0, minute: 0,
      utcOffsetMinutes: 0, latitude: 91, longitude: 0,
    })).toThrow();
  });
});
