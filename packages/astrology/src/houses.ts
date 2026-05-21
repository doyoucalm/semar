import { SIGNS, type Sign } from './constants.js';

/**
 * Whole Sign Houses.
 *
 * The sign containing the Ascendant is the 1st House (it occupies the
 * full 30°, not a wedge bounded by the cuspal degree). Subsequent houses
 * follow zodiac order. This is the simplest and oldest house system,
 * Hellenistic in origin, and produces unambiguous house assignments
 * regardless of birth latitude (no failure at high latitudes like
 * Placidus).
 */

export interface House {
  readonly number: number; // 1..12
  readonly sign: Sign;
  /** Starting ecliptic longitude of the house (= 0° of its sign). */
  readonly startLongitude: number;
}

export function wholeSignHouses(ascendantLongitude: number): readonly House[] {
  const ascSignIdx = Math.floor((((ascendantLongitude % 360) + 360) % 360) / 30);
  const houses: House[] = [];
  for (let i = 0; i < 12; i++) {
    const signIdx = (ascSignIdx + i) % 12;
    houses.push({
      number: i + 1,
      sign: SIGNS[signIdx]!,
      startLongitude: signIdx * 30,
    });
  }
  return houses;
}

/** Which house (1..12) does an ecliptic longitude fall in? */
export function houseOfLongitude(longitude: number, houses: readonly House[]): number {
  const lon = ((longitude % 360) + 360) % 360;
  const signIdx = Math.floor(lon / 30);
  const found = houses.find((h) => h.startLongitude / 30 === signIdx);
  if (!found) throw new Error(`No house for longitude ${longitude}`);
  return found.number;
}
