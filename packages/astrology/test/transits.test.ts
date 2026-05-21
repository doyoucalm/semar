import { describe, it, expect } from 'vitest';
import { computeChart } from '../src/chart.js';
import { computeTransits } from '../src/transits.js';
import { renderTransitsText, renderTransitsMarkdown } from '../src/render.js';

const LUCKY = {
  year: 1985, month: 5, day: 5,
  hour: 9, minute: 31,
  utcOffsetMinutes: 7 * 60,
  latitude: -6.91,
  longitude: 107.61,
};

const natal = computeChart(LUCKY);

// Today (test fixture): 2026-05-17 12:00 UTC — a year after Lucky's 41st return.
const NOW = Date.UTC(2026, 4, 17, 12, 0);

describe('computeTransits', () => {
  const t = computeTransits(natal, NOW);

  it('returns 12 transiting placements by default (10 planets + 2 lunar nodes)', () => {
    expect(t.placements).toHaveLength(12);
    expect(t.placements.map((p) => p.planet)).toEqual([
      'Sun', 'Moon', 'Mercury', 'Venus', 'Mars',
      'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto',
      'NorthNode', 'SouthNode',
    ]);
  });

  it('Sun in mid-May 2026 is in Taurus or early Gemini', () => {
    const sun = t.placements.find((p) => p.planet === 'Sun')!;
    const lon = sun.longitude;
    // 17 May ⇒ Sun around 26° Taurus (≈56°). Allow a wide window.
    expect(lon).toBeGreaterThan(40);
    expect(lon).toBeLessThan(80);
  });

  it('Sun is never retrograde in the transit chart either', () => {
    const sun = t.placements.find((p) => p.planet === 'Sun')!;
    expect(sun.retrograde).toBe(false);
  });

  it('every aspect-to-natal has a known transit and natal planet', () => {
    for (const a of t.aspectsToNatal) {
      expect(t.placements.some((p) => p.planet === a.transit)).toBe(true);
      expect(natal.placements.some((p) => p.planet === a.natal)).toBe(true);
    }
  });

  it('aspectsToNatal are sorted by orb ascending', () => {
    for (let i = 1; i < t.aspectsToNatal.length; i++) {
      expect(t.aspectsToNatal[i]!.orb).toBeGreaterThanOrEqual(t.aspectsToNatal[i - 1]!.orb);
    }
  });

  it('every aspect orb is within its declared aspect window', () => {
    for (const a of t.aspectsToNatal) {
      expect(a.orb).toBeGreaterThanOrEqual(0);
      expect(a.orb).toBeLessThanOrEqual(3); // default transit orb cap
    }
  });

  it('motion is one of applying / separating / stationary', () => {
    for (const a of t.aspectsToNatal) {
      expect(['applying', 'separating', 'stationary']).toContain(a.motion);
    }
  });
});

describe('computeTransits — solar return day', () => {
  // On Lucky's 41st solar return (around May 5 2026), transiting Sun
  // should be making a conjunction to natal Sun within orb.
  const solarReturn = Date.UTC(2026, 4, 5, 2, 31); // 9:31 WIB
  const t = computeTransits(natal, solarReturn, {
    transitPlanets: ['Sun'],
    natalPlanets: ['Sun'],
  });

  it('produces a Sun-to-natal-Sun conjunction within orb', () => {
    expect(t.aspectsToNatal.length).toBeGreaterThanOrEqual(1);
    const sunToSun = t.aspectsToNatal.find((a) => a.transit === 'Sun' && a.natal === 'Sun');
    expect(sunToSun).toBeDefined();
    expect(sunToSun!.kind).toBe('conjunction');
    expect(sunToSun!.orb).toBeLessThan(1);
  });
});

describe('computeTransits — filter options', () => {
  it('transitPlanets option restricts the transiting set', () => {
    const t = computeTransits(natal, NOW, { transitPlanets: ['Saturn', 'Jupiter'] });
    expect(t.placements).toHaveLength(2);
    expect(t.placements.map((p) => p.planet).sort()).toEqual(['Jupiter', 'Saturn']);
  });

  it('natalPlanets option restricts the natal aspect targets', () => {
    const t = computeTransits(natal, NOW, { natalPlanets: ['Sun'] });
    for (const a of t.aspectsToNatal) {
      expect(a.natal).toBe('Sun');
    }
  });

  it('orbOverrides tightens or loosens orbs', () => {
    const wide = computeTransits(natal, NOW, {
      orbOverrides: { conjunction: 10, sextile: 10, square: 10, trine: 10, opposition: 10 },
    });
    const tight = computeTransits(natal, NOW, {
      orbOverrides: { conjunction: 0.1, sextile: 0.1, square: 0.1, trine: 0.1, opposition: 0.1 },
    });
    expect(wide.aspectsToNatal.length).toBeGreaterThanOrEqual(tight.aspectsToNatal.length);
  });
});

describe('renderTransits', () => {
  const t = computeTransits(natal, NOW);

  it('renderTransitsText includes the moment and the placements', () => {
    const text = renderTransitsText(t, natal);
    expect(text).toContain('Transits');
    expect(text).toContain('2026-05-17');
    expect(text).toContain('Sun');
  });

  it('renderTransitsMarkdown produces a planets table', () => {
    const md = renderTransitsMarkdown(t, natal);
    expect(md).toContain('## Transits');
    expect(md).toContain('| Planet |');
  });
});
