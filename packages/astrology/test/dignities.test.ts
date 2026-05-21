import { describe, it, expect } from 'vitest';
import { dignityOf } from '../src/dignities.js';

describe('classical dignities', () => {
  it('Sun rules Leo, is exalted in Aries, detriment Aquarius, fall Libra', () => {
    expect(dignityOf('Sun', 'Leo')).toBe('domicile');
    expect(dignityOf('Sun', 'Aries')).toBe('exaltation');
    expect(dignityOf('Sun', 'Aquarius')).toBe('detriment');
    expect(dignityOf('Sun', 'Libra')).toBe('fall');
  });

  it('Moon: Cancer / Taurus / Capricorn / Scorpio', () => {
    expect(dignityOf('Moon', 'Cancer')).toBe('domicile');
    expect(dignityOf('Moon', 'Taurus')).toBe('exaltation');
    expect(dignityOf('Moon', 'Capricorn')).toBe('detriment');
    expect(dignityOf('Moon', 'Scorpio')).toBe('fall');
  });

  it('Mars: Aries+Scorpio / Capricorn / Libra+Taurus / Cancer', () => {
    expect(dignityOf('Mars', 'Aries')).toBe('domicile');
    expect(dignityOf('Mars', 'Scorpio')).toBe('domicile');
    expect(dignityOf('Mars', 'Capricorn')).toBe('exaltation');
    expect(dignityOf('Mars', 'Libra')).toBe('detriment');
    expect(dignityOf('Mars', 'Taurus')).toBe('detriment');
    expect(dignityOf('Mars', 'Cancer')).toBe('fall');
  });

  it('returns null when there\'s no dignity', () => {
    expect(dignityOf('Sun', 'Gemini')).toBeNull();
    expect(dignityOf('Mars', 'Pisces')).toBeNull();
  });

  it('modern overlay: Pluto domicile in Scorpio, Uranus in Aquarius, Neptune in Pisces', () => {
    expect(dignityOf('Pluto', 'Scorpio')).toBe('domicile');
    expect(dignityOf('Uranus', 'Aquarius')).toBe('domicile');
    expect(dignityOf('Neptune', 'Pisces')).toBe('domicile');
  });
});
