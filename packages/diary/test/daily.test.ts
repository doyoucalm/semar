import { describe, it, expect } from 'vitest';
import { computeChart, type TransitChart } from '@semar/astrology';
import { askDaily, mulberry32, localDateString } from '../src/daily.js';
import { InMemoryStorage } from '../src/storage.js';

// Lucky's corrected birth chart (03:15 WIB Bandung 1985-05-05) — gives
// tests something realistic to aspect against.
const LUCKY_NATAL = computeChart({
  year: 1985, month: 5, day: 5,
  hour: 3, minute: 15,
  utcOffsetMinutes: 7 * 60,
  latitude: -6.9175, longitude: 107.6191,
});

describe('askDaily', () => {
  it('writes one entry with iching + tarot readings', async () => {
    const storage = new InMemoryStorage();
    const entry = await askDaily({
      storage,
      question: 'What does today ask of me?',
      rng: mulberry32(42),
      now: () => new Date('2026-05-17T12:00:00Z'),
      localTimezoneOffsetMinutes: 7 * 60, // WIB
    });

    const all = await storage.list();
    expect(all).toHaveLength(1);
    expect(all[0]!.id).toBe(entry.id);

    const engines = entry.readings.map((r) => r.engine);
    expect(engines).toEqual(['iching', 'tarot']);

    // Each reading must have a non-empty summary line.
    for (const r of entry.readings) {
      expect(r.summary.length).toBeGreaterThan(0);
    }

    // Question is preserved verbatim.
    expect(entry.question).toBe('What does today ask of me?');
  });

  it('question and notes are optional', async () => {
    const storage = new InMemoryStorage();
    const entry = await askDaily({ storage, rng: mulberry32(1) });
    expect(entry.question).toBeUndefined();
    expect(entry.notes).toBeUndefined();
  });

  it('seeded rng → identical entry shape (ignoring id and timestamp)', async () => {
    const a = await askDaily({
      storage: new InMemoryStorage(),
      rng: mulberry32(7),
      now: () => new Date('2026-05-17T12:00:00Z'),
      localTimezoneOffsetMinutes: 0,
    });
    const b = await askDaily({
      storage: new InMemoryStorage(),
      rng: mulberry32(7),
      now: () => new Date('2026-05-17T12:00:00Z'),
      localTimezoneOffsetMinutes: 0,
    });
    expect(a.readings.map((r) => r.summary)).toEqual(b.readings.map((r) => r.summary));
  });

  it('records the local-timezone date (not UTC) for the diary day', async () => {
    const storage = new InMemoryStorage();
    // 2026-05-18T01:00 WIB == 2026-05-17T18:00 UTC
    const entry = await askDaily({
      storage,
      rng: mulberry32(1),
      now: () => new Date('2026-05-17T18:00:00Z'),
      localTimezoneOffsetMinutes: 7 * 60,
    });
    expect(entry.date).toBe('2026-05-18');
  });

  it('storage.today returns the entry just written', async () => {
    const storage = new InMemoryStorage();
    const e = await askDaily({
      storage,
      rng: mulberry32(2),
      now: () => new Date('2026-05-17T12:00:00Z'),
      localTimezoneOffsetMinutes: 0,
    });
    const t = await storage.today('2026-05-17');
    expect(t?.id).toBe(e.id);
  });

  it('adds an astrology reading with transits when natalChart is provided', async () => {
    const storage = new InMemoryStorage();
    const entry = await askDaily({
      storage,
      rng: mulberry32(11),
      now: () => new Date('2026-05-18T05:00:00Z'),
      localTimezoneOffsetMinutes: 7 * 60,
      natalChart: LUCKY_NATAL,
    });

    const engines = entry.readings.map((r) => r.engine);
    expect(engines).toEqual(['iching', 'tarot', 'astrology']);

    const astro = entry.readings.find((r) => r.engine === 'astrology');
    expect(astro).toBeDefined();
    expect(astro!.summary.length).toBeGreaterThan(0);

    const cast = astro!.cast as TransitChart;
    expect(cast.utcMs).toBe(new Date('2026-05-18T05:00:00Z').getTime());
    expect(cast.placements.length).toBeGreaterThan(0);
    // Aspects sorted by tightest orb first.
    for (let i = 1; i < cast.aspectsToNatal.length; i++) {
      expect(cast.aspectsToNatal[i]!.orb).toBeGreaterThanOrEqual(cast.aspectsToNatal[i - 1]!.orb);
    }
  });

  it('summary line names the tightest applying aspect when there is one', async () => {
    const storage = new InMemoryStorage();
    const entry = await askDaily({
      storage,
      rng: mulberry32(13),
      now: () => new Date('2026-05-18T05:00:00Z'),
      localTimezoneOffsetMinutes: 7 * 60,
      natalChart: LUCKY_NATAL,
    });

    const astro = entry.readings.find((r) => r.engine === 'astrology')!;
    const cast = astro.cast as TransitChart;

    if (cast.aspectsToNatal.length === 0) {
      expect(astro.summary).toBe('no transits within tight orb');
    } else {
      const applying = cast.aspectsToNatal.find((a) => a.motion === 'applying');
      const featured = applying ?? cast.aspectsToNatal[0]!;
      expect(astro.summary).toContain(`t.${featured.transit}`);
      expect(astro.summary).toContain(`n.${featured.natal}`);
      expect(astro.summary).toContain(featured.kind);
    }
  });

  it('transitOptions are forwarded to computeTransits (tighter orbs → fewer aspects)', async () => {
    const moment = new Date('2026-05-18T05:00:00Z');

    const wide = await askDaily({
      storage: new InMemoryStorage(),
      rng: mulberry32(17),
      now: () => moment,
      natalChart: LUCKY_NATAL,
    });
    const tight = await askDaily({
      storage: new InMemoryStorage(),
      rng: mulberry32(17),
      now: () => moment,
      natalChart: LUCKY_NATAL,
      transitOptions: {
        orbOverrides: { conjunction: 0.1, square: 0.1, trine: 0.1, sextile: 0.1, opposition: 0.1 },
      },
    });

    const wideCast = wide.readings.find((r) => r.engine === 'astrology')!.cast as TransitChart;
    const tightCast = tight.readings.find((r) => r.engine === 'astrology')!.cast as TransitChart;
    expect(tightCast.aspectsToNatal.length).toBeLessThanOrEqual(wideCast.aspectsToNatal.length);
  });

  it('omitting natalChart keeps the entry to iching + tarot (backwards compatible)', async () => {
    const storage = new InMemoryStorage();
    const entry = await askDaily({
      storage,
      rng: mulberry32(19),
      now: () => new Date('2026-05-17T12:00:00Z'),
    });
    expect(entry.readings.map((r) => r.engine)).toEqual(['iching', 'tarot']);
  });
});

describe('localDateString', () => {
  it('shifts by the explicit offset', () => {
    // 2026-05-17T20:00Z + 7h = 2026-05-18T03:00 local
    expect(localDateString(new Date('2026-05-17T20:00:00Z'), 7 * 60)).toBe('2026-05-18');
    // 2026-05-17T20:00Z + (-5h) = 2026-05-17T15:00 local
    expect(localDateString(new Date('2026-05-17T20:00:00Z'), -5 * 60)).toBe('2026-05-17');
  });
});
