/**
 * Sasih (Balinese lunar month) + Saka year.
 *
 * Strategy: hybrid of astronomical Tilem (via astronomy-engine) for sasih
 * boundaries, and the deterministic Saka-mod-19 rule for Nampih (intercalary)
 * month insertion (per peradnya/balinese-date research, see
 * docs/research/2026-05-19-mala-sasih.md).
 *
 * Anchor (verified): Tilem civil-date 2025-03-29 = Saka 1947 Nyepi = first
 * day of Sasih Kadasa. We walk lunations forward/backward from there.
 *
 * Scope / limitations (v1 — descriptive use only):
 *   - Modern regime (Pengalantaka Eka Sungsang ka Paing, post-2000) is used
 *     for all dates. The 1993–2002 "Sasih Berkesinambungan" transition with
 *     its alternative nampih table is NOT modelled — dates in that window
 *     may be 1 sasih off and should be verified against kalenderbali.org.
 *   - Saka 1917 (Nyepi 1995-04-01) 1-day shift anomaly is documented but
 *     not corrected (would affect penanggal numbering for that specific
 *     year, not sasih name).
 *   - Saka 1925 (Nyepi 2003) nampih is INCLUDED per the strict rule;
 *     peradnya code suppresses it. Verify against kalenderbali.org if used.
 *   - Penanggal/pangelong reported as nominal days-since-Tilem. The 63-day
 *     ngunaratri day-skip is NOT applied — exact penanggal number may
 *     differ by ±1 from kalenderbali.org. Sasih name + Saka year stay
 *     correct.
 */

import { SASIH } from './constants.js';
import { gregorianToJDN, mod } from './jdn.js';
import { findTilemStartingSasih, lunationsBetween, type LunarEvent } from './tilem.js';

/** Canonical Saka-year sasih order: Kadasa first (Nyepi), Kesanga last. */
export const SASIH_IN_SAKA = [
  'Kadasa',  // 10
  'Desta',   // 11 (Jyestha)
  'Sadha',   // 12
  'Kasa',    // 1
  'Karo',    // 2
  'Katiga',  // 3
  'Kapat',   // 4
  'Kalima',  // 5
  'Kanem',   // 6
  'Kapitu',  // 7
  'Kawolu',  // 8
  'Kasanga', // 9
] as const;

export type SasihInSaka = (typeof SASIH_IN_SAKA)[number];

/** Sasih number in Saka year ordering: Kadasa=10, Desta=11, ..., Kasanga=9. */
const SASIH_NUMBER: Record<SasihInSaka, number> = {
  Kadasa: 10, Desta: 11, Sadha: 12,
  Kasa: 1, Karo: 2, Katiga: 3, Kapat: 4, Kalima: 5,
  Kanem: 6, Kapitu: 7, Kawolu: 8, Kasanga: 9,
};

interface SasihEntry {
  readonly sasih: SasihInSaka;
  readonly isNampih: boolean;
}

/**
 * Saka-mod-19 nampih lookup, modern regime (post-2000 Pengalantaka Eka
 * Sungsang ka Paing). Per peradnya source + research note §1.
 *
 *   r = saka mod 19
 *   r ∈ {0, 6, 11}     → Nampih Destha
 *   r ∈ {3, 8, 14, 16} → Nampih Sadha
 *
 * The Saka year referenced is the year currently being lived (i.e., the
 * year that started at the most recent Nyepi). Empirically verified
 * against modern Nyepi-to-Nyepi day deltas (Wikipedia 2020–2030):
 *   - Saka 1944 (Nyepi 2022→2023, 384 days): r=6 → Nampih Destha ✓
 *   - Saka 1946 (Nyepi 2024→2025, 383 days): r=8 → Nampih Sadha ✓
 *   - Saka 1947 (Nyepi 2025→2026, 355 days): r=9 → no nampih ✓
 *
 * Note: the research note's table uses a confused labeling
 * (`(saka+5) mod 19`) — empirical observation overrides it.
 *
 * Returns null if no nampih in this Saka year.
 */
function nampihTargetFor(saka: number): 'Desta' | 'Sadha' | null {
  const r = mod(saka, 19);
  if (r === 0 || r === 6 || r === 11) return 'Desta';
  if (r === 3 || r === 8 || r === 14 || r === 16) return 'Sadha';
  return null;
}

/** Build the full sasih sequence for a Saka year (12 or 13 entries). */
export function sasihSequenceForSaka(saka: number): SasihEntry[] {
  const nampihAfter = nampihTargetFor(saka);
  const seq: SasihEntry[] = [];
  for (const name of SASIH_IN_SAKA) {
    seq.push({ sasih: name, isNampih: false });
    if (name === nampihAfter) {
      seq.push({ sasih: name, isNampih: true });
    }
  }
  return seq;
}

interface WalkResult {
  readonly saka: number;
  readonly sasih: SasihInSaka;
  readonly sasihNumber: number;
  readonly isNampih: boolean;
  readonly indexInSakaYear: number;
}

/**
 * Walk `n` sasih forward (positive n) or backward (negative n) from the
 * anchor (Saka 1947, Kadasa, index 0).
 */
function walkSasihFromAnchor(n: number): WalkResult {
  const ANCHOR_SAKA = 1947;
  let saka = ANCHOR_SAKA;
  let idx = 0;
  let seq = sasihSequenceForSaka(saka);

  if (n >= 0) {
    let remaining = n;
    while (remaining > 0) {
      const stepsInYear = seq.length - idx;
      if (remaining < stepsInYear) {
        idx += remaining;
        remaining = 0;
      } else {
        remaining -= stepsInYear;
        saka += 1;
        seq = sasihSequenceForSaka(saka);
        idx = 0;
      }
    }
  } else {
    let remaining = -n;
    while (remaining > 0) {
      if (idx >= remaining) {
        idx -= remaining;
        remaining = 0;
      } else {
        remaining -= idx + 1;
        saka -= 1;
        seq = sasihSequenceForSaka(saka);
        idx = seq.length - 1;
      }
    }
  }

  const entry = seq[idx]!;
  return {
    saka,
    sasih: entry.sasih,
    sasihNumber: SASIH_NUMBER[entry.sasih],
    isNampih: entry.isNampih,
    indexInSakaYear: idx,
  };
}

export interface SasihReading {
  /** Saka year (e.g. 1947). */
  readonly saka: number;
  /** Sasih name (Kadasa, Desta, ..., Kasanga). */
  readonly sasih: SasihInSaka;
  /** Sasih number in calendar order (Kasa=1, ..., Sadha=12). */
  readonly sasihNumber: number;
  /** Display name — "Nampih Sadha" if this is the intercalary month, else just the sasih name. */
  readonly displayName: string;
  /** True if this is an intercalary (nampih) month. */
  readonly isNampih: boolean;
  /** 0-based position of this sasih in the Saka year (0=Kadasa). */
  readonly indexInSakaYear: number;
  /** 1..15. Penanggal (waxing) or pangelong (waning) day number. Approximate (no ngunaratri correction). */
  readonly penanggal: number;
  /** True if waning half of sasih, false if waxing. */
  readonly isPangelong: boolean;
  /** True if today is Tilem (new moon) — first day of this sasih. */
  readonly isTilem: boolean;
  /** True if today is Purnama (full moon, ~middle of sasih). */
  readonly isPurnama: boolean;
  /** Tilem (new moon) that started this sasih. */
  readonly tilemStart: LunarEvent;
}

/** The anchor: Saka 1947 Nyepi = Tilem civil-date 2025-03-29 = Penanggal 1 Kadasa. */
const ANCHOR_NYEPI_JDN = 2460764; // gregorianToJDN(2025, 3, 29)

function findAnchorTilem(): LunarEvent {
  // The Tilem that started Saka 1947 Kadasa = the Tilem with Bali civil date 2025-03-29.
  return findTilemStartingSasih(2025, 3, 29);
}

let _anchorTilemCache: LunarEvent | null = null;
function getAnchorTilem(): LunarEvent {
  if (!_anchorTilemCache) _anchorTilemCache = findAnchorTilem();
  return _anchorTilemCache;
}

/**
 * Compute sasih + Saka reading for a Gregorian civil date (Bali local time).
 */
export function computeSasih(year: number, month: number, day: number): SasihReading {
  const targetJdn = gregorianToJDN(year, month, day);
  const tilemStart = findTilemStartingSasih(year, month, day);
  const anchor = getAnchorTilem();
  const lunationIdx = lunationsBetween(anchor, tilemStart);

  const walk = walkSasihFromAnchor(lunationIdx);

  const daysSinceTilem = targetJdn - tilemStart.jdn; // 0..29 typically
  // Penanggal 1 = Tilem day itself (matches Nyepi 2025 convention).
  const penanggalNumber = daysSinceTilem + 1;
  const isPangelong = penanggalNumber > 15;
  const penanggal = isPangelong ? penanggalNumber - 15 : penanggalNumber;

  const isTilem = daysSinceTilem === 0;
  // Purnama is ~14 days after Tilem; approximate as day 15 (Penanggal 15).
  const isPurnama = penanggalNumber === 15;

  const displayName = walk.isNampih ? `Nampih ${walk.sasih}` : walk.sasih;

  return {
    saka: walk.saka,
    sasih: walk.sasih,
    sasihNumber: walk.sasihNumber,
    displayName,
    isNampih: walk.isNampih,
    indexInSakaYear: walk.indexInSakaYear,
    penanggal,
    isPangelong,
    isTilem,
    isPurnama,
    tilemStart,
  };
}

/** Sanity check: anchor JDN matches gregorianToJDN(2025, 3, 29). */
export function _verifyAnchor(): boolean {
  return gregorianToJDN(2025, 3, 29) === ANCHOR_NYEPI_JDN;
}
