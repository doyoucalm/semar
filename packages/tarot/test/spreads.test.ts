import { describe, it, expect } from 'vitest';
import {
  SPREADS,
  spreadById,
  drawForSpread,
  type Spread,
} from '../src/spreads.js';
import { mulberry32 } from '../src/draw.js';

describe('SPREADS catalogue', () => {
  it('is non-empty', () => {
    expect(SPREADS.length).toBeGreaterThan(0);
  });

  it('has unique ids', () => {
    const ids = SPREADS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has unique names', () => {
    const names = SPREADS.map((s) => s.name);
    expect(new Set(names).size).toBe(names.length);
  });

  describe.each(SPREADS.map((s) => [s.id, s] as const))('spread %s', (_id, spread: Spread) => {
    it('cardCount equals positions.length', () => {
      expect(spread.cardCount).toBe(spread.positions.length);
    });

    it('has at least one position', () => {
      expect(spread.positions.length).toBeGreaterThan(0);
    });

    it('has contiguous 0..n-1 indexes in order', () => {
      spread.positions.forEach((p, i) => {
        expect(p.index).toBe(i);
      });
    });

    it('has a non-empty label and meaning for every position', () => {
      for (const p of spread.positions) {
        expect(p.label.length).toBeGreaterThan(0);
        expect(p.meaning.length).toBeGreaterThan(0);
      }
    });

    it('has unique labels within the spread', () => {
      const labels = spread.positions.map((p) => p.label);
      expect(new Set(labels).size).toBe(labels.length);
    });
  });

  it('contains the expected starter spreads', () => {
    const ids = SPREADS.map((s) => s.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'single',
        'past-present-future',
        'situation-action-outcome',
        'celtic-cross',
        'relationship',
        'career-path',
        'year-ahead',
      ]),
    );
  });

  it('covers all four categories', () => {
    const cats = new Set(SPREADS.map((s) => s.category));
    expect(cats).toEqual(new Set(['general', 'love', 'career', 'time']));
  });
});

describe('specific spread shapes', () => {
  it('single is exactly 1 card', () => {
    expect(spreadById('single').cardCount).toBe(1);
  });

  it('past-present-future is 3 cards', () => {
    expect(spreadById('past-present-future').cardCount).toBe(3);
  });

  it('situation-action-outcome is 3 cards', () => {
    expect(spreadById('situation-action-outcome').cardCount).toBe(3);
  });

  it('celtic-cross has exactly 10 positions (Biddy Tarot standard)', () => {
    const cc = spreadById('celtic-cross');
    expect(cc.cardCount).toBe(10);
    expect(cc.positions.length).toBe(10);
  });

  it('relationship is a 5-7 card love spread', () => {
    const r = spreadById('relationship');
    expect(r.category).toBe('love');
    expect(r.cardCount).toBeGreaterThanOrEqual(5);
    expect(r.cardCount).toBeLessThanOrEqual(7);
  });

  it('career-path is a 5-card career spread', () => {
    const c = spreadById('career-path');
    expect(c.category).toBe('career');
    expect(c.cardCount).toBe(5);
  });

  it('year-ahead is a 12-or-13 card time spread', () => {
    const y = spreadById('year-ahead');
    expect(y.category).toBe('time');
    expect([12, 13]).toContain(y.cardCount);
  });
});

describe('spreadById', () => {
  it('returns the matching spread', () => {
    expect(spreadById('single').id).toBe('single');
  });

  it('throws on unknown id', () => {
    expect(() => spreadById('does-not-exist')).toThrow(/Unknown spread id/);
  });
});

describe('drawForSpread', () => {
  it('returns one positioned card per position, in order', () => {
    for (const spread of SPREADS) {
      const reading = drawForSpread(spread, { rng: mulberry32(42) });
      expect(reading.length).toBe(spread.cardCount);
      reading.forEach((pc, i) => {
        expect(pc.position).toBe(spread.positions[i]);
        expect(pc.position.index).toBe(i);
        expect(pc.drawn.card).toBeDefined();
        expect(typeof pc.drawn.reversed).toBe('boolean');
      });
    }
  });

  it('draws unique cards (no duplicates) within a reading', () => {
    for (const spread of SPREADS) {
      const reading = drawForSpread(spread, { rng: mulberry32(7) });
      const ids = reading.map((pc) => pc.drawn.card.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('is deterministic for a fixed seed', () => {
    const a = drawForSpread(spreadById('celtic-cross'), { rng: mulberry32(123) });
    const b = drawForSpread(spreadById('celtic-cross'), { rng: mulberry32(123) });
    expect(a.map((pc) => pc.drawn.card.id)).toEqual(b.map((pc) => pc.drawn.card.id));
    expect(a.map((pc) => pc.drawn.reversed)).toEqual(b.map((pc) => pc.drawn.reversed));
  });

  it('respects reversals: false', () => {
    const reading = drawForSpread(spreadById('past-present-future'), {
      reversals: false,
      rng: mulberry32(1),
    });
    expect(reading.every((pc) => pc.drawn.reversed === false)).toBe(true);
  });
});
