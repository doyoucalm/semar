import { describe, it, expect } from 'vitest';
import {
  SUIT_ELEMENT,
  elementOf,
  dignity,
  dignitiesOf,
  TAROT_TO_WUXING,
  type TarotElement,
} from '../src/elements.js';
import { cardById } from '../src/cards.js';

const ELEMENTS: readonly TarotElement[] = ['fire', 'water', 'air', 'earth'];

describe('SUIT_ELEMENT', () => {
  it('follows the RWS/Golden Dawn convention', () => {
    expect(SUIT_ELEMENT).toEqual({
      wands: 'fire',
      cups: 'water',
      swords: 'air',
      pentacles: 'earth',
    });
  });
});

describe('elementOf', () => {
  it('maps a minor card to its suit element', () => {
    expect(elementOf(cardById('wands-ace'))).toBe('fire');
    expect(elementOf(cardById('cups-10'))).toBe('water');
    expect(elementOf(cardById('swords-queen'))).toBe('air');
    expect(elementOf(cardById('pentacles-5'))).toBe('earth');
  });

  it('returns null for a major card (no authored attribution yet)', () => {
    expect(elementOf(cardById('the-fool'))).toBeNull();
    expect(elementOf(cardById('the-world'))).toBeNull();
  });
});

describe('dignity matrix', () => {
  it('amplifies same element', () => {
    for (const e of ELEMENTS) {
      expect(dignity(e, e)).toBe('amplify');
    }
  });

  it('encodes the verified support relations', () => {
    expect(dignity('fire', 'air')).toBe('support');
    expect(dignity('water', 'earth')).toBe('support');
  });

  it('encodes the verified weaken (enemy) relations', () => {
    expect(dignity('fire', 'water')).toBe('weaken');
    expect(dignity('air', 'earth')).toBe('weaken');
  });

  it('encodes the verified neutral relations', () => {
    expect(dignity('fire', 'earth')).toBe('neutral');
    expect(dignity('water', 'air')).toBe('neutral');
  });

  it('is symmetric over all 16 ordered pairs', () => {
    for (const a of ELEMENTS) {
      for (const b of ELEMENTS) {
        expect(dignity(a, b)).toBe(dignity(b, a));
      }
    }
  });
});

describe('dignitiesOf', () => {
  it('returns each unordered pair once, skipping self-pairs', () => {
    const result = dignitiesOf(['fire', 'air', 'water']);
    // 3 elements → C(3,2) = 3 pairs
    expect(result).toHaveLength(3);
    expect(result).toEqual([
      { a: 'fire', b: 'air', dignity: 'support' },
      { a: 'fire', b: 'water', dignity: 'weaken' },
      { a: 'air', b: 'water', dignity: 'neutral' },
    ]);
  });

  it('returns no pairs for fewer than two elements', () => {
    expect(dignitiesOf([])).toEqual([]);
    expect(dignitiesOf(['fire'])).toEqual([]);
  });
});

describe('TAROT_TO_WUXING (documented best-effort default)', () => {
  it('maps the three direct elements', () => {
    expect(TAROT_TO_WUXING.fire).toBe('火');
    expect(TAROT_TO_WUXING.water).toBe('水');
    expect(TAROT_TO_WUXING.earth).toBe('土');
  });

  it('maps air to a single Wu Xing glyph (design default: Metal)', () => {
    // This is the open-question slot; assert it resolves to one of the two
    // defensible glyphs so the test documents the decision without freezing
    // it as canonical fact.
    expect(['金', '木']).toContain(TAROT_TO_WUXING.air);
  });
});
