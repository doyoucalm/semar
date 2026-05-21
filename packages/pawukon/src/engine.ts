/**
 * Top-level engine: from a Gregorian civil date, compute the full Pawukon
 * + wewaran + weton + sasih/Saka chart.
 *
 * The `sasih` field is optional in the return type because computing it
 * involves astronomical Tilem detection (which can fail at the edges of the
 * 1900-2100 search window). When sasih computation throws, the rest of the
 * chart still returns and `sasih` is undefined.
 */

import { gregorianToJDN } from './jdn.js';
import { pawukonOf, type PawukonPosition } from './pawukon.js';
import { computeSasih, type SasihReading } from './sasih.js';
import { wetonOf, type Weton } from './weton.js';
import { computeWewaran, type Wewaran } from './wewaran.js';

export interface PawukonChartInput {
  readonly year: number;
  readonly month: number; // 1..12
  readonly day: number; // 1..31
}

export interface PawukonChart {
  readonly jdn: number;
  readonly date: PawukonChartInput;
  readonly weton: Weton;
  readonly pawukon: PawukonPosition;
  readonly wewaran: Wewaran;
  readonly sasih?: SasihReading;
}

export interface ComputePawukonOptions {
  /** Skip sasih computation (faster, no astronomy-engine call). Default false. */
  readonly skipSasih?: boolean;
}

export function computePawukonChart(
  input: PawukonChartInput,
  options: ComputePawukonOptions = {},
): PawukonChart {
  const jdn = gregorianToJDN(input.year, input.month, input.day);
  const weton = wetonOf(jdn);
  const pawukon = pawukonOf(jdn);
  const wewaran = computeWewaran(pawukon.day, weton.pancawara, weton.saptawara);

  let sasih: SasihReading | undefined;
  if (!options.skipSasih) {
    try {
      sasih = computeSasih(input.year, input.month, input.day);
    } catch {
      sasih = undefined;
    }
  }

  return sasih
    ? { jdn, date: input, weton, pawukon, wewaran, sasih }
    : { jdn, date: input, weton, pawukon, wewaran };
}
