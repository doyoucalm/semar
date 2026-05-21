import { describe, it, expect } from 'vitest';
import { wholeSignHouses, houseOfLongitude } from '../src/houses.js';

describe('Whole Sign houses', () => {
  it('Ascendant in Aries → houses run Aries, Taurus, ..., Pisces', () => {
    const houses = wholeSignHouses(5); // 5° Aries
    expect(houses).toHaveLength(12);
    expect(houses[0]!.sign).toBe('Aries');
    expect(houses[0]!.number).toBe(1);
    expect(houses[5]!.sign).toBe('Virgo');
    expect(houses[11]!.sign).toBe('Pisces');
  });

  it('Ascendant late in a sign still puts the WHOLE sign as 1st house', () => {
    const houses = wholeSignHouses(29.9); // late Aries
    expect(houses[0]!.sign).toBe('Aries');
    expect(houses[0]!.startLongitude).toBe(0);
  });

  it('Ascendant in Scorpio → 1st = Scorpio, 10th = Leo', () => {
    const houses = wholeSignHouses(217); // mid Scorpio
    expect(houses[0]!.sign).toBe('Scorpio');
    expect(houses[9]!.sign).toBe('Leo');
  });

  it('houseOfLongitude routes by sign membership', () => {
    const houses = wholeSignHouses(5); // ASC in Aries
    expect(houseOfLongitude(45, houses)).toBe(2);  // 15° Taurus → 2nd
    expect(houseOfLongitude(180, houses)).toBe(7); // 0° Libra → 7th
    expect(houseOfLongitude(355, houses)).toBe(12);// late Pisces → 12th
  });
});
