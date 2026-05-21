/**
 * 210-day Pawukon cycle: 30 wuku × 7 days.
 *
 * The Pawukon cycle has no historical epoch; day 1 of wuku Sinta is anchored
 * by convention. The constant `+ 65` aligns the cycle so that:
 *   - 1985-05-05 (JDN 2,446,191) → pawukon-day 176, wuku Ugu (#26, 0-indexed 25)
 *   - 2000-01-01 (JDN 2,451,545) → pawukon-day 70, wuku Sungsang (#10, 0-indexed 9)
 *   - 2024-01-01 (JDN 2,460,311) → pawukon-day 16, wuku Ukir (#3, 0-indexed 2)
 * matching kalenderbali.org. Equivalent to Dershowitz-Reingold's JDN-146 anchor.
 */

import { WUKU, type Wuku } from './constants.js';
import { gregorianToJDN, mod } from './jdn.js';

export interface PawukonPosition {
  /** Day 1..210 within the Pawukon cycle. */
  readonly day: number;
  /** Wuku index 0..29. */
  readonly wukuIndex: number;
  /** Wuku name. */
  readonly wuku: Wuku;
  /** Day-in-wuku 0..6. 0=Redite (start of wuku, always a Sunday). */
  readonly dayInWuku: number;
}

const PAWUKON_OFFSET = 65;

/** Compute pawukon position from JDN. */
export function pawukonOf(jdn: number): PawukonPosition {
  const raw = mod(jdn + PAWUKON_OFFSET, 210);
  const day = raw === 0 ? 210 : raw;
  const wukuIndex = Math.floor((day - 1) / 7);
  const dayInWuku = (day - 1) % 7;
  return {
    day,
    wukuIndex,
    wuku: WUKU[wukuIndex]!,
    dayInWuku,
  };
}

/** Compute pawukon position from a Gregorian civil date. */
export function pawukonFromDate(year: number, month: number, day: number): PawukonPosition {
  return pawukonOf(gregorianToJDN(year, month, day));
}
