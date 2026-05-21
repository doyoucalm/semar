/**
 * Wewaran — the ten parallel day cycles of the Balinese calendar
 * (Ekawara through Dasawara, lengths 1..10).
 *
 * Pure arithmetic cycles: Triwara, Sadwara, Saptawara, Pancawara.
 * Urip-derived cycles: Dwiwara, Dasawara.
 * Semi-arithmetic (with held days at p=71..73, the "Trijaya Dungulan" /
 * "Kala Tiga" window before Galungan): Caturwara, Astawara, Sangawara.
 *
 * Wuku-position-and-urip-based formulas per Babadbali (pewarigaan rumus).
 */

import {
  ASTAWARA,
  CATURWARA,
  DASAWARA,
  DWIWARA,
  EKAWARA,
  SADWARA,
  SANGAWARA,
  TRIWARA,
  URIP_PANCAWARA,
  URIP_SAPTAWARA,
  type Astawara,
  type Caturwara,
  type Dasawara,
  type Dwiwara,
  type Ekawara,
  type Pancawara,
  type Sadwara,
  type Sangawara,
  type Saptawara,
  type Triwara,
} from './constants.js';
import { mod } from './jdn.js';

export interface Wewaran {
  /**
   * Ekawara is 'Luang' on days where the saptawara+pancawara urip sum is odd
   * (equivalently: Dwiwara = Pepet), and null on even-urip days. This matches
   * the convention shown on kalenderbali.org / m.kalenderbali.org artihari,
   * where the "Eka Wara" row is rendered as a dash on even days.
   */
  readonly ekawara: Ekawara | null;
  readonly dwiwara: Dwiwara;
  readonly triwara: Triwara;
  readonly caturwara: Caturwara;
  readonly pancawara: Pancawara;
  readonly sadwara: Sadwara;
  readonly saptawara: Saptawara;
  readonly astawara: Astawara;
  readonly sangawara: Sangawara;
  readonly dasawara: Dasawara;
}

export function ekawaraOf(pancawara: Pancawara, saptawara: Saptawara): Ekawara | null {
  const uripSum = URIP_PANCAWARA[pancawara] + URIP_SAPTAWARA[saptawara];
  return uripSum % 2 === 1 ? EKAWARA : null;
}

export function dwiwaraOf(pancawara: Pancawara, saptawara: Saptawara): Dwiwara {
  const uripSum = URIP_PANCAWARA[pancawara] + URIP_SAPTAWARA[saptawara];
  return DWIWARA[uripSum % 2]!;
}

export function triwaraOf(pawukonDay: number): Triwara {
  return TRIWARA[mod(pawukonDay - 1, 3)]!;
}

export function sadwaraOf(pawukonDay: number): Sadwara {
  return SADWARA[mod(pawukonDay - 1, 6)]!;
}

export function dasawaraOf(pancawara: Pancawara, saptawara: Saptawara): Dasawara {
  const uripSum = URIP_PANCAWARA[pancawara] + URIP_SAPTAWARA[saptawara];
  return DASAWARA[uripSum % 10]!;
}

/**
 * Caturwara (4) with the Dungulan hold: Laba runs 4 days in a row at
 * p=70,71,72,73 (p=70 is natural Laba; p=71..73 are held). Post-hold the
 * cycle resumes at p=74 with Menala (skipping Jaya/Sri/Laba relative to a
 * pure-modular continuation), matching kalenderbali.org.
 *
 * Spot-checked 2026-05-19 against m.kalenderbali.org/artihari for
 * p=1,2,3,4,70,71,72,73,74,75,176 — all match.
 */
export function caturwaraOf(pawukonDay: number): Caturwara {
  if (pawukonDay <= 70) return CATURWARA[mod(pawukonDay - 1, 4)]!;
  if (pawukonDay <= 73) return CATURWARA[1]!; // Laba held
  return CATURWARA[mod(pawukonDay - 3, 4)]!;
}

/**
 * Astawara (8) with Kala Tiga: Kala held for 3 days at p=71,72,73. Post-hold
 * at p=74 the cycle resumes with Uma (skipping forward 2 names relative to
 * Kala), matching kalenderbali.org.
 *
 * Spot-checked 2026-05-19 against m.kalenderbali.org/artihari for
 * p=1,2,3,4,5,45,70,71,72,73,74,75,176 — all match.
 */
export function astawaraOf(pawukonDay: number): Astawara {
  if (pawukonDay <= 70) return ASTAWARA[mod(pawukonDay - 1, 8)]!;
  if (pawukonDay <= 73) return ASTAWARA[6]!; // Kala held
  return ASTAWARA[mod(pawukonDay - 3, 8)]!;
}

/**
 * Sangawara (9): Dangu held for p=1..4, natural cycle resumes at p=5 with
 * Jangur (not Dangu again). Post-hold offset is -4 relative to a natural
 * (p-1)%9 reading.
 *
 * Spot-checked 2026-05-19 against m.kalenderbali.org/artihari for
 * p=1,2,3,4,5,45,70,71,72,73,74,75,176 — all match.
 */
export function sangawaraOf(pawukonDay: number): Sangawara {
  if (pawukonDay <= 4) return SANGAWARA[0]!; // Dangu
  return SANGAWARA[mod(pawukonDay - 4, 9)]!;
}

export function computeWewaran(
  pawukonDay: number,
  pancawara: Pancawara,
  saptawara: Saptawara,
): Wewaran {
  return {
    ekawara: ekawaraOf(pancawara, saptawara),
    dwiwara: dwiwaraOf(pancawara, saptawara),
    triwara: triwaraOf(pawukonDay),
    caturwara: caturwaraOf(pawukonDay),
    pancawara,
    sadwara: sadwaraOf(pawukonDay),
    saptawara,
    astawara: astawaraOf(pawukonDay),
    sangawara: sangawaraOf(pawukonDay),
    dasawara: dasawaraOf(pancawara, saptawara),
  };
}
