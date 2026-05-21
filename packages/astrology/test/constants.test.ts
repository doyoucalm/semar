import { describe, it, expect } from 'vitest';
import { SIGNS, PLANETS, signOfLongitude, degreeInSign } from '../src/constants.js';

describe('zodiac signs', () => {
  it('has 12 signs in canonical order', () => {
    expect(SIGNS).toEqual([
      'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
      'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
    ]);
  });

  it('signOfLongitude lands at the wedge boundaries correctly', () => {
    expect(signOfLongitude(0)).toBe('Aries');
    expect(signOfLongitude(29.999)).toBe('Aries');
    expect(signOfLongitude(30)).toBe('Taurus');
    expect(signOfLongitude(180)).toBe('Libra');
    expect(signOfLongitude(330)).toBe('Pisces');
  });

  it('handles longitudes outside [0, 360)', () => {
    expect(signOfLongitude(-30)).toBe('Pisces');
    expect(signOfLongitude(390)).toBe('Taurus');
  });

  it('degreeInSign returns 0..30', () => {
    expect(degreeInSign(0)).toBe(0);
    expect(degreeInSign(15)).toBe(15);
    expect(degreeInSign(30)).toBe(0);
    expect(degreeInSign(45.5)).toBeCloseTo(15.5);
  });
});

describe('planets', () => {
  it('lists 10 classical bodies + North and South Nodes', () => {
    expect(PLANETS).toHaveLength(12);
    expect(PLANETS).toEqual([
      'Sun', 'Moon', 'Mercury', 'Venus', 'Mars',
      'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto',
      'NorthNode', 'SouthNode',
    ]);
  });
});
