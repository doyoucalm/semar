/**
 * Weton — pancawara + saptawara pair (35-day cycle, also called "selapan").
 *
 * Used both in Javanese (e.g. "Senin Kliwon") and Balinese (e.g. "Soma Kliwon")
 * traditions. The pair has a combined urip/neptu used for character readings.
 */

import {
  PANCAWARA,
  PANCAWARA_JV,
  SAPTAWARA,
  SAPTAWARA_ID,
  URIP_PANCAWARA,
  URIP_SAPTAWARA,
  type Pancawara,
  type Saptawara,
} from './constants.js';
import { gregorianToJDN, mod } from './jdn.js';

export interface Weton {
  readonly pancawara: Pancawara;
  readonly saptawara: Saptawara;
  /** Indonesian day name, e.g. "Senin". */
  readonly hari: string;
  /** Javanese pasaran name, e.g. "Kliwon" or "Pahing". */
  readonly pasaran: string;
  /** Indonesian-formatted: "Senin Pahing". */
  readonly idLabel: string;
  /** Balinese-formatted: "Soma Paing". */
  readonly baliLabel: string;
  /** Urip of pancawara. */
  readonly uripPancawara: number;
  /** Urip of saptawara. */
  readonly uripSaptawara: number;
  /** Total urip / neptu = uripPancawara + uripSaptawara. Range 8..18. */
  readonly neptu: number;
}

/** Compute pancawara from JDN. 0=Umanis(Legi) ... 4=Kliwon. */
export function pancawaraOf(jdn: number): Pancawara {
  return PANCAWARA[mod(jdn, 5)]!;
}

/** Compute saptawara from JDN. 0=Redite(Sun) ... 6=Saniscara(Sat). */
export function saptawaraOf(jdn: number): Saptawara {
  return SAPTAWARA[mod(jdn + 1, 7)]!;
}

/** Compute weton from JDN. */
export function wetonOf(jdn: number): Weton {
  const pancawara = pancawaraOf(jdn);
  const saptawara = saptawaraOf(jdn);
  const hari = SAPTAWARA_ID[saptawara];
  const pasaran = PANCAWARA_JV[pancawara];
  const uripPancawara = URIP_PANCAWARA[pancawara];
  const uripSaptawara = URIP_SAPTAWARA[saptawara];
  return {
    pancawara,
    saptawara,
    hari,
    pasaran,
    idLabel: `${hari} ${pasaran}`,
    baliLabel: `${saptawara} ${pancawara}`,
    uripPancawara,
    uripSaptawara,
    neptu: uripPancawara + uripSaptawara,
  };
}

/** Compute weton directly from a Gregorian civil date. */
export function wetonFromDate(year: number, month: number, day: number): Weton {
  return wetonOf(gregorianToJDN(year, month, day));
}
