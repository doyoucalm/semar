import { describe, it, expect } from 'vitest';
import { solarTermMoment, validateAgainstHko } from '../src/astro.js';
import { loadHkoData, MINOR_TERMS_ORDER } from '../src/data.js';

describe('solarTermMoment via Astronomy Engine', () => {
  it('1985 lixia is on 1985-05-05 in HKT', () => {
    const { utcMs } = solarTermMoment('lixia', 1985);
    const hkt = new Date(utcMs + 8 * 3600_000);
    expect(hkt.toISOString().slice(0, 10)).toBe('1985-05-05');
  });

  it("1985 lixia comes AFTER Lucky's birth instant 09:31 WIB (so month stays 辰, not 巳)", () => {
    // Lucky birth = 1985-05-05 09:31 WIB = 02:31 UTC
    const luckyUtcMs = Date.UTC(1985, 4, 5, 9, 31) - 420 * 60_000;
    const { utcMs } = solarTermMoment('lixia', 1985);
    expect(luckyUtcMs).toBeLessThan(utcMs);
    // Both fall on the same UTC calendar day (1985-05-05).
    expect(new Date(luckyUtcMs).toISOString().slice(0, 10))
      .toBe(new Date(utcMs).toISOString().slice(0, 10));
  });
});

describe('HKO cross-validation', () => {
  it('Astronomy Engine and HKO agree on date to within ±1 day for every minor term', () => {
    const data = loadHkoData();
    const [min, max] = data.yearRange;
    const mismatches: Array<{ year: number; term: string; hko: string; astro: string; diffDays: number }> = [];
    for (let year = min; year <= max; year++) {
      for (const key of MINOR_TERMS_ORDER) {
        const r = validateAgainstHko(key, year);
        if (!r.ok) {
          const diffMs = new Date(r.astroDateHkt).getTime() - new Date(r.hkoDate).getTime();
          const diffDays = Math.abs(diffMs / 86400_000);
          mismatches.push({ year, term: key, hko: r.hkoDate, astro: r.astroDateHkt, diffDays });
        }
      }
    }
    // Every mismatch must be ≤1 day (boundary cases where the term moment
    // straddles midnight HKT and HKO's convention differs by a hair).
    const farOff = mismatches.filter((m) => m.diffDays > 1);
    expect(farOff).toEqual([]);

    // And mismatches should remain rare (<0.5% of 2400 checks).
    expect(mismatches.length / (200 * 12)).toBeLessThan(0.005);

    if (mismatches.length > 0) {
      console.log(`HKO/AE ±1-day boundary cases (${mismatches.length}):`, mismatches);
    }
  }, 60_000);
});
