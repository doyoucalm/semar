import { describe, it, expect } from 'vitest';
import { DECK, cardById } from '../src/cards.js';

describe('deck composition', () => {
  it('has exactly 78 cards', () => {
    expect(DECK).toHaveLength(78);
  });

  it('has 22 Major Arcana', () => {
    expect(DECK.filter((c) => c.arcana === 'major')).toHaveLength(22);
  });

  it('has 56 Minor Arcana', () => {
    expect(DECK.filter((c) => c.arcana === 'minor')).toHaveLength(56);
  });

  it('each suit has 14 cards (Ace, 2-10, Page, Knight, Queen, King)', () => {
    for (const suit of ['wands', 'cups', 'swords', 'pentacles'] as const) {
      const cards = DECK.filter((c) => c.arcana === 'minor' && c.suit === suit);
      expect(cards).toHaveLength(14);
    }
  });

  it('every card has a unique id', () => {
    const ids = new Set(DECK.map((c) => c.id));
    expect(ids.size).toBe(78);
  });

  it('canonical anchors look right', () => {
    expect(cardById('the-fool').name).toBe('The Fool');
    expect(cardById('the-world').name).toBe('The World');
    const ace = cardById('wands-ace');
    expect(ace.arcana).toBe('minor');
    if (ace.arcana === 'minor') {
      expect(ace.suit).toBe('wands');
      expect(ace.rank).toBe('ace');
    }
    expect(cardById('pentacles-king').name).toBe('King of Pentacles');
  });

  it('throws on unknown id', () => {
    expect(() => cardById('not-a-card')).toThrow();
  });
});
