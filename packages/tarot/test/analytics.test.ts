import { describe, it, expect } from 'vitest';
import {
  filterByBucket,
  mirrorStats,
  type ReadingRecord,
} from '../src/analytics.js';

/**
 * Fixture spans a year so bucket cutoffs are exercised. "today" is fixed at
 * 2026-05-31 (matches the build date) and passed explicitly — the engine never
 * reads the clock.
 */
const TODAY = '2026-05-31';

const records: readonly ReadingRecord[] = [
  // --- recent (within last 7d) ---
  { cardId: 'the-fool', reversed: false, date: '2026-05-31' },
  { cardId: 'the-fool', reversed: true, date: '2026-05-28' },
  { cardId: 'wands-ace', reversed: false, date: '2026-05-26' },
  // --- within last 30d but older than 7d ---
  { cardId: 'cups-3', reversed: true, date: '2026-05-10' },
  { cardId: 'the-fool', reversed: false, date: '2026-05-05' },
  // --- within last 3mo / this year ---
  { cardId: 'swords-king', reversed: false, date: '2026-03-15' },
  { cardId: 'pentacles-2', reversed: true, date: '2026-01-20' },
  // --- last year (only caught by alltime) ---
  { cardId: 'the-tower', reversed: true, date: '2025-08-01' },
  // --- future-dated noise: must always be dropped ---
  { cardId: 'the-sun', reversed: false, date: '2026-12-25' },
];

describe('filterByBucket', () => {
  it('alltime keeps every non-future record', () => {
    const out = filterByBucket(records, 'alltime', TODAY);
    // 9 records total, 1 is future-dated → 8 kept.
    expect(out).toHaveLength(8);
    expect(out.some((r) => r.cardId === 'the-sun')).toBe(false);
  });

  it('last7d keeps only the three most recent', () => {
    const out = filterByBucket(records, 'last7d', TODAY);
    expect(out.map((r) => r.date).sort()).toEqual([
      '2026-05-26',
      '2026-05-28',
      '2026-05-31',
    ]);
  });

  it('last30d keeps records on/after 2026-05-01', () => {
    const out = filterByBucket(records, 'last30d', TODAY);
    // 5 records dated May 2026 (excluding the future Dec record).
    expect(out).toHaveLength(5);
    expect(out.every((r) => r.date >= '2026-05-01')).toBe(true);
  });

  it('last3mo keeps records on/after 2026-02-28', () => {
    const out = filterByBucket(records, 'last3mo', TODAY);
    // May (5) + the 2026-03-15 swords-king = 6; the Jan record is older.
    expect(out).toHaveLength(6);
    expect(out.some((r) => r.cardId === 'pentacles-2')).toBe(false);
    expect(out.some((r) => r.cardId === 'swords-king')).toBe(true);
  });

  it('thisYear keeps all 2026 records and drops 2025', () => {
    const out = filterByBucket(records, 'thisYear', TODAY);
    // All 7 non-future 2026 records; the 2025-08-01 Tower is excluded.
    expect(out).toHaveLength(7);
    expect(out.every((r) => r.date.startsWith('2026-'))).toBe(true);
  });

  it('last6mo keeps records on/after 2025-11-30', () => {
    const out = filterByBucket(records, 'last6mo', TODAY);
    // All 7 of 2026; the 2025-08 Tower is > 6 months back → excluded.
    expect(out).toHaveLength(7);
    expect(out.some((r) => r.cardId === 'the-tower')).toBe(false);
  });
});

describe('mirrorStats', () => {
  const stats = mirrorStats(records);

  it('total counts every record passed (no internal time filtering)', () => {
    expect(stats.total).toBe(9);
  });

  it('mostCommonCard is the-fool (appears 3 times)', () => {
    expect(stats.mostCommonCard).toEqual({ cardId: 'the-fool', count: 3 });
  });

  it('topCards is sorted by count desc, then cardId asc', () => {
    expect(stats.topCards[0]).toEqual({ cardId: 'the-fool', count: 3 });
    // All other cards appear once; remaining order is cardId-ascending.
    const rest = stats.topCards.slice(1).map((c) => c.count);
    expect(rest.every((c) => c === 1)).toBe(true);
  });

  it('majorMinorRatio counts arcana correctly', () => {
    // Majors: the-fool×3, the-tower, the-sun = 5. Minors: wands-ace, cups-3,
    // swords-king, pentacles-2 = 4.
    expect(stats.majorMinorRatio).toEqual({ major: 5, minor: 4 });
  });

  it('suitDistribution counts only minors, one per suit here', () => {
    expect(stats.suitDistribution).toEqual({
      wands: 1,
      cups: 1,
      swords: 1,
      pentacles: 1,
    });
  });

  it('elementBalance maps suits to RWS elements (majors excluded)', () => {
    // wands→fire, cups→water, swords→air, pentacles→earth.
    expect(stats.elementBalance).toEqual({
      fire: 1,
      water: 1,
      air: 1,
      earth: 1,
    });
    // majors contribute nothing → element balance sums to the minor count.
    const sum = Object.values(stats.elementBalance).reduce((a, b) => a + b, 0);
    expect(sum).toBe(stats.majorMinorRatio.minor);
  });

  it('reversalPct is rounded to one decimal', () => {
    // 4 of 9 reversed = 44.444… → 44.4.
    expect(stats.reversalPct).toBe(44.4);
  });

  it('handles an empty record set without throwing', () => {
    const empty = mirrorStats([]);
    expect(empty.total).toBe(0);
    expect(empty.mostCommonCard).toBeNull();
    expect(empty.reversalPct).toBe(0);
    expect(empty.topCards).toEqual([]);
    expect(empty.majorMinorRatio).toEqual({ major: 0, minor: 0 });
  });

  it('throws on an unknown card id (data-integrity guard)', () => {
    expect(() =>
      mirrorStats([{ cardId: 'not-a-card', reversed: false, date: TODAY }]),
    ).toThrow();
  });

  it('integrates with filterByBucket for a windowed view', () => {
    const last7 = mirrorStats(filterByBucket(records, 'last7d', TODAY));
    expect(last7.total).toBe(3);
    // the-fool appears twice in the last 7 days (05-31, 05-28).
    expect(last7.mostCommonCard).toEqual({ cardId: 'the-fool', count: 2 });
  });
});
