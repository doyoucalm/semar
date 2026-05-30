import { describe, it, expect } from 'vitest';

import { DECK } from '../src/cards.js';
import { MEANINGS, meaningOf, type CardMeaning } from '../src/meanings.js';

describe('meanings', () => {
  it('resolves every one of the 78 deck cards without throwing', () => {
    // The whole point of the structural-key mapping: zero gaps, zero special
    // cases. If the vendored corpora file is swapped for an incomplete one this
    // loop is the canary.
    for (const card of DECK) {
      expect(() => meaningOf(card.id)).not.toThrow();
    }
    expect(DECK.length).toBe(78);
    expect(MEANINGS.size).toBe(78);
  });

  it('gives every card non-empty keywords, upright, and reversed text', () => {
    for (const card of DECK) {
      const m = meaningOf(card.id);
      expect(m.id).toBe(card.id);
      expect(m.keywords.length).toBeGreaterThan(0);
      expect(m.upright.length).toBeGreaterThan(0);
      expect(m.reversed.length).toBeGreaterThan(0);
    }
  });

  it('throws on an unknown card id', () => {
    expect(() => meaningOf('not-a-card')).toThrow(/Unknown card id/);
  });

  it('spot-checks the-fool (major, keyed by number 0)', () => {
    const fool: CardMeaning = meaningOf('the-fool');
    expect(fool.keywords).toContain('freedom');
    // light -> upright
    expect(fool.upright.toLowerCase()).toContain('leap of faith');
    // shadow -> reversed
    expect(fool.reversed.toLowerCase()).toContain('naive');
    expect(fool.fortuneTelling.length).toBeGreaterThan(0);
  });

  it('spot-checks wands-ace (minor, ace<->corpora rank 1)', () => {
    const ace: CardMeaning = meaningOf('wands-ace');
    expect(ace.id).toBe('wands-ace');
    expect(ace.keywords.length).toBeGreaterThan(0);
    expect(ace.upright.length).toBeGreaterThan(0);
    expect(ace.reversed.length).toBeGreaterThan(0);
  });

  it('maps pentacles to corpora "coins" (suit-name divergence)', () => {
    // If the coins->pentacles remap regressed, this would throw at build time;
    // assert the data actually flowed through.
    const m = meaningOf('pentacles-king');
    expect(m.keywords.length).toBeGreaterThan(0);
  });
});
