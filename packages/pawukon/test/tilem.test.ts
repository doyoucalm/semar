import { describe, expect, it } from 'vitest';
import {
  findPurnama,
  findTilemStartingSasih,
  lunationsBetween,
  nextTilem,
} from '../src/tilem.js';

describe('findTilemStartingSasih', () => {
  it('Saka 1947 Nyepi anchor: Tilem starting current sasih on 2025-03-29 = Bali 2025-03-29', () => {
    // Astronomical new moon: 2025-03-29 10:57 UTC = 18:57 WITA on 2025-03-29.
    // Nyepi 2025 = 2025-03-29 = Penanggal 1 Kadasa Saka 1947.
    const onNyepi = findTilemStartingSasih(2025, 3, 29);
    expect(onNyepi.baliDate).toEqual({ year: 2025, month: 3, day: 29 });
    const dayAfter = findTilemStartingSasih(2025, 3, 30);
    expect(dayAfter.baliDate).toEqual({ year: 2025, month: 3, day: 29 });
  });

  it('Lucky 1985-05-05: previous Tilem date is one of late April or early May 1985', () => {
    const t = findTilemStartingSasih(1985, 5, 5);
    // Sanity check: Tilem should be within ~30 days before target.
    const targetMs = Date.UTC(1985, 4, 5);
    const diffDays = (targetMs - t.utcMs) / (24 * 60 * 60 * 1000);
    expect(diffDays).toBeGreaterThan(0);
    expect(diffDays).toBeLessThan(31);
  });

  it('Returns Tilem on dates well into 21st century', () => {
    const t = findTilemStartingSasih(2026, 1, 15);
    const targetMs = Date.UTC(2026, 0, 15);
    const diffDays = (targetMs - t.utcMs) / (24 * 60 * 60 * 1000);
    expect(diffDays).toBeGreaterThan(0);
    expect(diffDays).toBeLessThan(31);
  });
});

describe('nextTilem + findPurnama', () => {
  it('next Tilem is ~29-30 days after previous Tilem', () => {
    const t1 = findTilemStartingSasih(2025, 4, 1);
    const t2 = nextTilem(t1);
    const days = (t2.utcMs - t1.utcMs) / (24 * 60 * 60 * 1000);
    expect(days).toBeGreaterThan(29);
    expect(days).toBeLessThan(31);
  });

  it('Purnama falls between consecutive Tilems', () => {
    const t1 = findTilemStartingSasih(2025, 4, 1);
    const t2 = nextTilem(t1);
    const p = findPurnama(t1);
    expect(p.utcMs).toBeGreaterThan(t1.utcMs);
    expect(p.utcMs).toBeLessThan(t2.utcMs);
  });
});

describe('lunationsBetween', () => {
  it('returns 1 for consecutive Tilems', () => {
    const t1 = findTilemStartingSasih(2025, 4, 1);
    const t2 = nextTilem(t1);
    expect(lunationsBetween(t1, t2)).toBe(1);
  });

  it('returns 12 for one year of lunations', () => {
    const t1 = findTilemStartingSasih(2025, 4, 1);
    let t = t1;
    for (let i = 0; i < 12; i++) t = nextTilem(t);
    expect(lunationsBetween(t1, t)).toBe(12);
  });
});
