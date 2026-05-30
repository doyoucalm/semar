import { describe, it, expect } from 'vitest';
import { solarCorrection, equationOfTime } from '../src/solar-time.js';
import { computeBazi, type BirthInput } from '../src/engine.js';

describe('equationOfTime', () => {
  it('is near its early-November maximum (~+16 min)', () => {
    expect(equationOfTime(Date.UTC(2024, 10, 3))).toBeCloseTo(16.3, 0);
  });
  it('is near its mid-February minimum (~−14 min)', () => {
    expect(equationOfTime(Date.UTC(2024, 1, 11))).toBeCloseTo(-14.2, 0);
  });
  it('always stays within the physical ±17 min envelope', () => {
    for (let doy = 0; doy < 365; doy += 5) {
      const v = equationOfTime(Date.UTC(2024, 0, 1 + doy));
      expect(Math.abs(v)).toBeLessThan(17);
    }
  });
});

describe('solarCorrection — longitude offset', () => {
  it('Bandung 107.6° on WIB (meridian 105°) ≈ +10.4 min', () => {
    const c = solarCorrection(Date.UTC(1985, 4, 4, 20, 15), 107.6, 420);
    expect(c.longitudeMinutes).toBeCloseTo(10.4, 1);
  });
  it('a city exactly on its meridian has zero longitude correction', () => {
    // WIB meridian = 420/60*15 = 105°E.
    const c = solarCorrection(Date.UTC(2024, 5, 1), 105, 420);
    expect(c.longitudeMinutes).toBe(0);
  });
  it('west of the meridian gives a negative correction', () => {
    const c = solarCorrection(Date.UTC(2024, 5, 1), 100, 420);
    expect(c.longitudeMinutes).toBeLessThan(0);
  });
  it('totalMinutes = longitude + equation-of-time', () => {
    const ms = Date.UTC(1985, 4, 4, 20, 15);
    const c = solarCorrection(ms, 107.6, 420);
    expect(c.totalMinutes).toBeCloseTo(c.longitudeMinutes + c.equationOfTimeMinutes, 2);
  });
});

describe('computeBazi — true-solar-time integration', () => {
  const base: BirthInput = {
    year: 1985, month: 5, day: 5, hour: 3, minute: 15, utcOffsetMinutes: 420,
  };

  it('omitting longitude leaves the chart uncorrected (backwards compatible)', () => {
    const chart = computeBazi(base);
    expect(chart.solarTime).toBeUndefined();
    expect(chart.eightCharacters).toBe('乙丑 庚辰 甲辰 丙寅');
  });

  it('supplying longitude attaches a solarTime correction', () => {
    const chart = computeBazi({ ...base, longitude: 107.6 });
    expect(chart.solarTime).toBeDefined();
    expect(chart.solarTime!.correctedLocal.minute).toBe(28); // 03:15 + ~13.77min
    expect(chart.solarTime!.correctedLocal.hour).toBe(3);
  });

  it('correction can flip the hour branch near a 时辰 boundary', () => {
    // 04:58 civil + ~14 min true-solar push → crosses into 卯 (05:00–06:59).
    const civil = computeBazi({ ...base, hour: 4, minute: 58 });
    const solar = computeBazi({ ...base, hour: 4, minute: 58, longitude: 107.6 });
    expect(civil.hour.branch).toBe('寅');   // 03–05
    expect(solar.hour.branch).toBe('卯');   // 05–07
    expect(solar.hour.branch).not.toBe(civil.hour.branch);
  });
});
