import { describe, it, expect } from 'vitest';
import { drawCards, shuffle, mulberry32 } from '../src/draw.js';
import { DECK } from '../src/cards.js';

describe('drawCards', () => {
  it('draws the requested number of cards', () => {
    expect(drawCards(1)).toHaveLength(1);
    expect(drawCards(3)).toHaveLength(3);
    expect(drawCards(10)).toHaveLength(10);
    expect(drawCards(78)).toHaveLength(78);
  });

  it('cards drawn in a single call are unique', () => {
    const draw = drawCards(78);
    const ids = new Set(draw.map((d) => d.card.id));
    expect(ids.size).toBe(78);
  });

  it('rejects invalid counts', () => {
    expect(() => drawCards(0)).toThrow();
    expect(() => drawCards(-1)).toThrow();
    expect(() => drawCards(79)).toThrow();
    expect(() => drawCards(1.5)).toThrow();
  });

  it('reversals disabled → every card upright', () => {
    const draw = drawCards(78, { reversals: false, rng: mulberry32(42) });
    expect(draw.every((d) => !d.reversed)).toBe(true);
  });

  it('reversals enabled → roughly 50/50 over a full deck', () => {
    const draw = drawCards(78, { reversals: true, rng: mulberry32(2026) });
    const reversed = draw.filter((d) => d.reversed).length;
    // Loose envelope: 78 cards, expected ~39 reversed, allow ±20.
    expect(reversed).toBeGreaterThan(19);
    expect(reversed).toBeLessThan(59);
  });
});

describe('drawCards with seeded rng', () => {
  it('is deterministic for a given seed', () => {
    const a = drawCards(5, { rng: mulberry32(7) });
    const b = drawCards(5, { rng: mulberry32(7) });
    expect(a.map((x) => x.card.id)).toEqual(b.map((x) => x.card.id));
    expect(a.map((x) => x.reversed)).toEqual(b.map((x) => x.reversed));
  });

  it('different seeds usually produce different draws', () => {
    const a = drawCards(5, { rng: mulberry32(1) });
    const b = drawCards(5, { rng: mulberry32(2) });
    expect(a.map((x) => x.card.id)).not.toEqual(b.map((x) => x.card.id));
  });
});

describe('shuffle', () => {
  it('preserves length and elements', () => {
    const shuffled = shuffle([...DECK], mulberry32(99));
    expect(shuffled).toHaveLength(78);
    expect(new Set(shuffled.map((c) => c.id)).size).toBe(78);
  });

  it('actually reorders (very high probability)', () => {
    const shuffled = shuffle([...DECK], mulberry32(123));
    const sameOrder = shuffled.every((c, i) => c.id === DECK[i]!.id);
    expect(sameOrder).toBe(false);
  });
});
