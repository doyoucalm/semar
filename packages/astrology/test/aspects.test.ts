import { describe, it, expect } from 'vitest';
import { findAspects, angularSeparation } from '../src/aspects.js';

describe('angularSeparation', () => {
  it('always returns a value in [0, 180]', () => {
    expect(angularSeparation(0, 90)).toBe(90);
    expect(angularSeparation(0, 270)).toBe(90);
    expect(angularSeparation(355, 5)).toBeCloseTo(10);
    expect(angularSeparation(180, 0)).toBe(180);
  });
});

describe('findAspects', () => {
  it('detects an exact opposition', () => {
    const aspects = findAspects([
      { planet: 'Sun', longitude: 0 },
      { planet: 'Moon', longitude: 180 },
    ]);
    expect(aspects).toHaveLength(1);
    expect(aspects[0]!.kind).toBe('opposition');
    expect(aspects[0]!.orb).toBe(0);
  });

  it('detects a tight square within default 7° orb', () => {
    const aspects = findAspects([
      { planet: 'Mars', longitude: 10 },
      { planet: 'Saturn', longitude: 95 },
    ]);
    expect(aspects).toHaveLength(1);
    expect(aspects[0]!.kind).toBe('square');
    expect(aspects[0]!.orb).toBeCloseTo(5, 1);
  });

  it('rejects when separation exceeds the orb', () => {
    const aspects = findAspects([
      { planet: 'Mars', longitude: 0 },
      { planet: 'Saturn', longitude: 100 },
    ]);
    expect(aspects).toHaveLength(0);
  });

  it('detects a conjunction across the 0°/360° seam', () => {
    const aspects = findAspects([
      { planet: 'Sun', longitude: 358 },
      { planet: 'Mercury', longitude: 2 },
    ]);
    expect(aspects).toHaveLength(1);
    expect(aspects[0]!.kind).toBe('conjunction');
  });

  it('respects orb overrides', () => {
    const a1 = findAspects(
      [
        { planet: 'Sun', longitude: 0 },
        { planet: 'Moon', longitude: 7 },
      ],
      { orbOverrides: { conjunction: 5 } },
    );
    expect(a1).toHaveLength(0);

    const a2 = findAspects(
      [
        { planet: 'Sun', longitude: 0 },
        { planet: 'Moon', longitude: 7 },
      ],
      { orbOverrides: { conjunction: 8 } },
    );
    expect(a2).toHaveLength(1);
  });

  it('emits at most one aspect per planet-pair (tightest by definition order)', () => {
    // 0 and 60 form an exact sextile (within 6° orb)
    const aspects = findAspects([
      { planet: 'Sun', longitude: 0 },
      { planet: 'Moon', longitude: 60 },
    ]);
    expect(aspects).toHaveLength(1);
    expect(aspects[0]!.kind).toBe('sextile');
  });
});
