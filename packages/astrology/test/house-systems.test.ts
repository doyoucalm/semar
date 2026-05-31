import { describe, it, expect } from 'vitest';
import { computeChart } from '../src/chart.js';
import { computeHouses, type HouseSystem, type HouseInput } from '../src/houses.js';

const SYSTEMS: HouseSystem[] = [
  'whole-sign', 'equal', 'porphyry', 'placidus', 'koch', 'regiomontanus', 'topocentric',
];

// Bandung birth (near-equator latitude — quadrant systems are well-behaved here).
const BIRTH = {
  year: 1985, month: 5, day: 5, hour: 3, minute: 15,
  utcOffsetMinutes: 420, latitude: -6.91, longitude: 107.61,
};

function angDiff(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

describe('computeHouses — all systems', () => {
  it('every system returns 12 numbered houses', () => {
    const input: HouseInput = { ascendant: 210.7, midheaven: 122.3, ramc: 120.5, latitude: -6.91, obliquity: 23.4367 };
    for (const sys of SYSTEMS) {
      const houses = computeHouses(sys, input);
      expect(houses).toHaveLength(12);
      expect(houses.map((h) => h.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      for (const h of houses) {
        expect(h.startLongitude).toBeGreaterThanOrEqual(0);
        expect(h.startLongitude).toBeLessThan(360);
      }
    }
  });

  it('quadrant + equal + porphyry put cusp 1 exactly on the Ascendant', () => {
    // (Whole Sign intentionally starts the 1st house at the sign boundary.)
    const chart = computeChart(BIRTH);
    const asc = chart.ascendant.longitude;
    for (const sys of ['equal', 'porphyry', 'placidus', 'koch', 'regiomontanus', 'topocentric'] as HouseSystem[]) {
      const c = computeChart(BIRTH, { houseSystem: sys });
      expect(angDiff(c.houses[0]!.startLongitude, asc)).toBeLessThan(0.05);
    }
  });

  it('quadrant systems put cusp 10 exactly on the MC', () => {
    for (const sys of ['porphyry', 'placidus', 'koch', 'regiomontanus', 'topocentric'] as HouseSystem[]) {
      const c = computeChart(BIRTH, { houseSystem: sys });
      expect(angDiff(c.houses[9]!.startLongitude, c.midheaven.longitude)).toBeLessThan(0.05);
    }
  });

  it('Placidus, Regiomontanus and Topocentric agree closely at low latitude', () => {
    const p = computeChart(BIRTH, { houseSystem: 'placidus' });
    const r = computeChart(BIRTH, { houseSystem: 'regiomontanus' });
    const t = computeChart(BIRTH, { houseSystem: 'topocentric' });
    for (let i = 0; i < 12; i++) {
      expect(angDiff(p.houses[i]!.startLongitude, r.houses[i]!.startLongitude)).toBeLessThan(5);
      expect(angDiff(p.houses[i]!.startLongitude, t.houses[i]!.startLongitude)).toBeLessThan(2);
    }
  });

  it('default house system is whole-sign', () => {
    expect(computeChart(BIRTH).houseSystem).toBe('whole-sign');
  });

  it('opposite cusps are 180° apart for Porphyry', () => {
    const c = computeChart(BIRTH, { houseSystem: 'porphyry' });
    for (let i = 0; i < 6; i++) {
      expect(angDiff(c.houses[i]!.startLongitude, c.houses[i + 6]!.startLongitude)).toBeCloseTo(180, 1);
    }
  });
});

describe('computeChart — sidereal (Vedic) mode', () => {
  it('tropical is the default with zero ayanamsa', () => {
    const c = computeChart(BIRTH);
    expect(c.zodiac).toBe('tropical');
    expect(c.ayanamsaDeg).toBe(0);
  });

  it('sidereal subtracts the Lahiri ayanamsa from every longitude', () => {
    const trop = computeChart(BIRTH, { houseSystem: 'placidus' });
    const sid = computeChart(BIRTH, { houseSystem: 'placidus', zodiac: 'sidereal' });
    expect(sid.zodiac).toBe('sidereal');
    expect(sid.ayanamsaDeg).toBeGreaterThan(23);
    expect(sid.ayanamsaDeg).toBeLessThan(24);
    // Every planet shifts back by exactly the ayanamsa.
    for (let i = 0; i < trop.placements.length; i++) {
      expect(angDiff(trop.placements[i]!.longitude - sid.ayanamsaDeg, sid.placements[i]!.longitude)).toBeLessThan(0.01);
    }
  });

  it('house MEMBERSHIP is invariant between tropical and sidereal (uniform rotation)', () => {
    const trop = computeChart(BIRTH, { houseSystem: 'placidus' });
    const sid = computeChart(BIRTH, { houseSystem: 'placidus', zodiac: 'sidereal' });
    for (let i = 0; i < trop.placements.length; i++) {
      expect(sid.placements[i]!.house).toBe(trop.placements[i]!.house);
    }
  });
});
