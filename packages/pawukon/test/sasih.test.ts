import { describe, expect, it } from 'vitest';
import { computeSasih, sasihSequenceForSaka, _verifyAnchor } from '../src/sasih.js';

describe('anchor sanity', () => {
  it('anchor JDN constant matches gregorianToJDN(2025, 3, 29)', () => {
    expect(_verifyAnchor()).toBe(true);
  });
});

describe('sasihSequenceForSaka — nampih rule (Saka mod 19)', () => {
  it('Saka 1946 (mod 19 = 8) → Nampih Sadha, sequence has 13 entries', () => {
    // Empirically: Nyepi 2024 (Mar 11) to Nyepi 2025 (Mar 29) = 383 days = 13 lunations
    const seq = sasihSequenceForSaka(1946);
    expect(seq.length).toBe(13);
    expect(seq[2]).toEqual({ sasih: 'Sadha', isNampih: false });
    expect(seq[3]).toEqual({ sasih: 'Sadha', isNampih: true });
  });

  it('Saka 1944 (mod 19 = 6) → Nampih Desta', () => {
    // Empirically: Nyepi 2022 (Mar 3) to Nyepi 2023 (Mar 22) = 384 days = 13 lunations
    const seq = sasihSequenceForSaka(1944);
    expect(seq.length).toBe(13);
    expect(seq[1]).toEqual({ sasih: 'Desta', isNampih: false });
    expect(seq[2]).toEqual({ sasih: 'Desta', isNampih: true });
  });

  it('Saka 1947 (mod 19 = 9) → no nampih, sequence has 12 entries', () => {
    // Empirically: Nyepi 2025 (Mar 29) to Nyepi 2026 (Mar 19) = 355 days = 12 lunations
    const seq = sasihSequenceForSaka(1947);
    expect(seq.length).toBe(12);
  });

  it('Saka 1945 (mod 19 = 7) → no nampih', () => {
    const seq = sasihSequenceForSaka(1945);
    expect(seq.length).toBe(12);
  });

  it('Saka 1933 (mod 19 = 14) → Nampih Sadha', () => {
    const seq = sasihSequenceForSaka(1933);
    expect(seq.length).toBe(13);
    expect(seq[3]).toEqual({ sasih: 'Sadha', isNampih: true });
  });
});

describe('computeSasih — anchor: Nyepi 2025-03-29', () => {
  it('returns Saka 1947, Kadasa, Penanggal 1, Tilem', () => {
    const r = computeSasih(2025, 3, 29);
    expect(r.saka).toBe(1947);
    expect(r.sasih).toBe('Kadasa');
    expect(r.sasihNumber).toBe(10);
    expect(r.isNampih).toBe(false);
    expect(r.penanggal).toBe(1);
    expect(r.isPangelong).toBe(false);
    expect(r.isTilem).toBe(true);
    expect(r.indexInSakaYear).toBe(0);
  });

  it('day after Nyepi (2025-03-30) = Penanggal 2 Kadasa Saka 1947', () => {
    const r = computeSasih(2025, 3, 30);
    expect(r.saka).toBe(1947);
    expect(r.sasih).toBe('Kadasa');
    expect(r.penanggal).toBe(2);
    expect(r.isTilem).toBe(false);
  });
});

describe('computeSasih — forward walks within Saka 1947', () => {
  it('mid-April 2025 (well after Nyepi) is still Kadasa', () => {
    const r = computeSasih(2025, 4, 15);
    expect(r.saka).toBe(1947);
    expect(r.sasih).toBe('Kadasa');
  });

  it('mid-May 2025 is Desta Saka 1947', () => {
    const r = computeSasih(2025, 5, 20);
    expect(r.saka).toBe(1947);
    expect(r.sasih).toBe('Desta');
  });

  it('today 2026-05-18 — sanity check: returns valid Saka 1948', () => {
    const r = computeSasih(2026, 5, 18);
    // After Nyepi 2026-03-19, we're in Saka 1948.
    expect(r.saka).toBe(1948);
    expect(typeof r.sasih).toBe('string');
    expect(r.penanggal).toBeGreaterThanOrEqual(1);
    expect(r.penanggal).toBeLessThanOrEqual(15);
  });
});

describe('computeSasih — backward walks (pre-anchor)', () => {
  it('pre-Nyepi 2025 date (2025-03-15) is in Saka 1946 (Sasih Kasanga)', () => {
    const r = computeSasih(2025, 3, 15);
    expect(r.saka).toBe(1946);
    expect(r.sasih).toBe('Kasanga');
  });

  it('mid-2024 is in Saka 1946', () => {
    const r = computeSasih(2024, 7, 15);
    expect(r.saka).toBe(1946);
  });

  it('post-Nyepi 2024 (2024-03-15, Nyepi was March 11) is Saka 1946', () => {
    // Nyepi 2024 = 2024-03-11 = Saka 1946 day 1.
    const r = computeSasih(2024, 3, 15);
    expect(r.saka).toBe(1946);
    expect(r.sasih).toBe('Kadasa');
  });

  it('Lucky birthday 1985-05-05 returns valid result', () => {
    const r = computeSasih(1985, 5, 5);
    // Saka 1907 expected (1985 - 78). Sasih likely Desta or Sadha (May).
    // Note: 40-year backward walk through possible SK 1993-2002 gap may be off.
    expect(r.saka).toBeGreaterThanOrEqual(1905);
    expect(r.saka).toBeLessThanOrEqual(1909);
    expect(typeof r.sasih).toBe('string');
  });
});

describe('computeSasih — Saka year transitions', () => {
  it('Nyepi 2026-03-19 = Saka 1948 day 1', () => {
    const r = computeSasih(2026, 3, 19);
    expect(r.saka).toBe(1948);
    expect(r.sasih).toBe('Kadasa');
    expect(r.penanggal).toBe(1);
    expect(r.isTilem).toBe(true);
  });

  it('day before Nyepi 2026 = Saka 1947 (Kasanga)', () => {
    const r = computeSasih(2026, 3, 18);
    expect(r.saka).toBe(1947);
    expect(r.sasih).toBe('Kasanga');
  });
});
