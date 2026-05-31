import { describe, it, expect } from 'vitest';
import { lahiriAyanamsa, ayanamsaValue, toSidereal } from '../src/ayanamsa.js';

describe('Lahiri ayanamsa', () => {
  it('matches the ICRC J2000.0 standard (~23.853°)', () => {
    const j2000 = Date.UTC(2000, 0, 1, 12, 0, 0);
    expect(lahiriAyanamsa(j2000)).toBeCloseTo(23.853222, 3);
  });

  it('increases with time (precession of the equinoxes)', () => {
    const j2000 = Date.UTC(2000, 0, 1, 12, 0, 0);
    const y1985 = Date.UTC(1985, 0, 1);
    const y2025 = Date.UTC(2025, 0, 1);
    expect(lahiriAyanamsa(y1985)).toBeLessThan(lahiriAyanamsa(j2000));
    expect(lahiriAyanamsa(y2025)).toBeGreaterThan(23.853222);
    // ~50.3″/yr ⇒ ~0.014°/yr.
    const perYear = (lahiriAyanamsa(y2025) - lahiriAyanamsa(Date.UTC(2024, 0, 1)));
    expect(perYear).toBeCloseTo(50.2388475 / 3600, 4);
  });

  it('ayanamsaValue dispatches to lahiri', () => {
    const t = Date.UTC(2000, 0, 1, 12);
    expect(ayanamsaValue('lahiri', t)).toBe(lahiriAyanamsa(t));
  });

  it('toSidereal subtracts and wraps into [0,360)', () => {
    expect(toSidereal(345, 24.13)).toBeCloseTo(320.87, 2);
    expect(toSidereal(10, 24)).toBeCloseTo(346, 2); // wraps below 0
    expect(toSidereal(24, 24)).toBeCloseTo(0, 6);
  });
});
