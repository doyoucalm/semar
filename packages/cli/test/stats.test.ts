import { describe, it, expect } from 'vitest';
import { computeStats, renderStats } from '../src/stats.js';
import type { DiaryEntry } from '../src/diary-log.js';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeEntry(
  localDate: string,
  opts: {
    tarot?: Array<{ position: string; card: string; reversed: boolean }>;
    iching?: { primary: { number: number; cn: string; en: string; pinyin: string }; relating: null };
    weton?: { hari: string; pasaran: string; neptu: number; wuku: string };
    kind?: DiaryEntry['kind'];
    notes?: string;
  } = {},
): DiaryEntry {
  return {
    id: `test-${localDate}`,
    createdAt: `${localDate}T12:00:00.000Z`,
    localDate,
    kind: opts.kind ?? 'today',
    ...(opts.notes ? { notes: opts.notes } : {}),
    payload: {
      bazi: { natal: '乙丑 庚辰 甲辰 丙寅', today: '壬子' },
      transits: { moment: `${localDate}T12:00:00.000Z`, aspectsToNatal: [] },
      ...(opts.weton ? { weton: opts.weton } : {}),
      ...(opts.tarot ? { tarot: opts.tarot } : {}),
      ...(opts.iching ? { iching: opts.iching } : {}),
    },
  };
}

const HEX25 = { number: 25, cn: '無妄', en: 'Innocence', pinyin: 'Wú Wàng' };
const HEX36 = { number: 36, cn: '明夷', en: 'Darkening of the Light', pinyin: 'Míng Yí' };

const SPREAD_A = [
  { position: 'past',    card: 'The Magician', reversed: true  },
  { position: 'present', card: 'The Tower',    reversed: false },
  { position: 'future',  card: 'The Star',     reversed: false },
];
const SPREAD_B = [
  { position: 'past',    card: 'The Magician', reversed: false },
  { position: 'present', card: 'The Moon',     reversed: false },
  { position: 'future',  card: 'The Tower',    reversed: false },
];
const WETON_A = { hari: 'Minggu', pasaran: 'Pahing', neptu: 14, wuku: 'Ugu' };
const WETON_B = { hari: 'Senin',  pasaran: 'Wage',   neptu: 7,  wuku: 'Wariga' };

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('computeStats — empty diary', () => {
  it('returns zero stats for empty entries', () => {
    const s = computeStats([]);
    expect(s.totalEntries).toBe(0);
    expect(s.dateRange).toBeNull();
    expect(s.streak.current).toBe(0);
    expect(s.tarot.sessions).toBe(0);
    expect(s.iching.sessions).toBe(0);
  });

  it('ignores non-today entries in daily stats', () => {
    const e = makeEntry('2026-05-01', { kind: 'note', notes: 'hello' });
    const s = computeStats([e]);
    expect(s.totalEntries).toBe(1);
    expect(s.dateRange).toBeNull(); // no 'today' entries
    expect(s.tarot.sessions).toBe(0);
  });
});

describe('computeStats — engine counts', () => {
  const entries = [
    makeEntry('2026-05-01', { tarot: SPREAD_A, iching: { primary: HEX25, relating: null } }),
    makeEntry('2026-05-02', { tarot: SPREAD_B }),
    makeEntry('2026-05-03', { iching: { primary: HEX36, relating: null } }),
    makeEntry('2026-05-04', {}), // core only
  ];

  it('counts both / tarotOnly / ichingOnly / coreOnly correctly', () => {
    const s = computeStats(entries, '2026-05-04');
    expect(s.engines.both).toBe(1);
    expect(s.engines.tarotOnly).toBe(1);
    expect(s.engines.ichingOnly).toBe(1);
    expect(s.engines.coreOnly).toBe(1);
  });

  it('tarot.sessions = tarotOnly + both', () => {
    const s = computeStats(entries, '2026-05-04');
    expect(s.tarot.sessions).toBe(2);
  });

  it('iching.sessions = ichingOnly + both', () => {
    const s = computeStats(entries, '2026-05-04');
    expect(s.iching.sessions).toBe(2);
  });
});

describe('computeStats — card frequency', () => {
  const entries = [
    makeEntry('2026-05-01', { tarot: SPREAD_A }),
    makeEntry('2026-05-02', { tarot: SPREAD_B }),
  ];

  it('counts The Magician appearing twice (once reversed)', () => {
    const s = computeStats(entries, '2026-05-02');
    const magician = s.tarot.topCards.find((c) => c.card === 'The Magician');
    expect(magician).toBeDefined();
    expect(magician!.count).toBe(2);
    expect(magician!.reversedCount).toBe(1);
  });

  it('topCards sorted by count descending', () => {
    const s = computeStats(entries, '2026-05-02');
    for (let i = 1; i < s.tarot.topCards.length; i++) {
      expect(s.tarot.topCards[i]!.count).toBeLessThanOrEqual(s.tarot.topCards[i - 1]!.count);
    }
  });

  it('byPosition.past top card is The Magician', () => {
    const s = computeStats(entries, '2026-05-02');
    expect(s.tarot.byPosition.past[0]!.card).toBe('The Magician');
    expect(s.tarot.byPosition.past[0]!.count).toBe(2);
  });

  it('byPosition.future counts Tower and Star once each', () => {
    const s = computeStats(entries, '2026-05-02');
    const future = s.tarot.byPosition.future;
    const cards = future.map((c) => c.card);
    expect(cards).toContain('The Star');
    expect(cards).toContain('The Tower');
  });
});

describe('computeStats — hexagram frequency', () => {
  const entries = [
    makeEntry('2026-05-01', { iching: { primary: HEX25, relating: null } }),
    makeEntry('2026-05-02', { iching: { primary: HEX25, relating: null } }),
    makeEntry('2026-05-03', { iching: { primary: HEX36, relating: null } }),
  ];

  it('hex 25 appears twice', () => {
    const s = computeStats(entries, '2026-05-03');
    expect(s.iching.topHexagrams[0]!.number).toBe(25);
    expect(s.iching.topHexagrams[0]!.count).toBe(2);
  });
});

describe('computeStats — streak', () => {
  it('streak = 3 on consecutive days (today = last date)', () => {
    const entries = [
      makeEntry('2026-05-01'),
      makeEntry('2026-05-02'),
      makeEntry('2026-05-03'),
    ];
    const s = computeStats(entries, '2026-05-03');
    expect(s.streak.current).toBe(3);
    expect(s.streak.longest).toBe(3);
  });

  it('streak = 0 if last entry is not today or yesterday', () => {
    const entries = [makeEntry('2026-04-01'), makeEntry('2026-04-02')];
    const s = computeStats(entries, '2026-05-25');
    expect(s.streak.current).toBe(0);
  });

  it('streak counts yesterday as active', () => {
    const entries = [makeEntry('2026-05-23'), makeEntry('2026-05-24')];
    const s = computeStats(entries, '2026-05-25');
    expect(s.streak.current).toBe(2);
  });

  it('longest streak tracks the longest run even if broken', () => {
    const entries = [
      makeEntry('2026-05-01'),
      makeEntry('2026-05-02'),
      makeEntry('2026-05-03'),
      // gap
      makeEntry('2026-05-10'),
      makeEntry('2026-05-11'),
    ];
    const s = computeStats(entries, '2026-05-11');
    expect(s.streak.longest).toBe(3);
    expect(s.streak.current).toBe(2);
  });
});

describe('computeStats — weton', () => {
  const entries = [
    makeEntry('2026-05-01', { weton: WETON_A }),
    makeEntry('2026-05-02', { weton: WETON_A }),
    makeEntry('2026-05-03', { weton: WETON_B }),
  ];

  it('most frequent weton is Minggu Pahing (2×)', () => {
    const s = computeStats(entries, '2026-05-03');
    expect(s.weton[0]!.label).toBe('Minggu Pahing');
    expect(s.weton[0]!.count).toBe(2);
  });
});

describe('renderStats', () => {
  it('shows "Diary kosong" for empty stats', () => {
    const s = computeStats([]);
    expect(renderStats(s)).toContain('Diary kosong');
  });

  it('includes streak and entry count for real data', () => {
    const entries = [
      makeEntry('2026-05-01', { tarot: SPREAD_A, iching: { primary: HEX25, relating: null } }),
      makeEntry('2026-05-02', { tarot: SPREAD_B }),
    ];
    const s = computeStats(entries, '2026-05-02');
    const out = renderStats(s);
    expect(out).toContain('Entries');
    expect(out).toContain('Streak');
    expect(out).toContain('Tarot');
    expect(out).toContain('I-Ching');
    expect(out).toContain('The Magician');
  });
});
