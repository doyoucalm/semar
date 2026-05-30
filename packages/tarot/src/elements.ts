/**
 * Elemental layer for the tarot engine.
 *
 * Two distinct jobs live here:
 *
 *  1. **Suit → element mapping** (RWS / Golden Dawn convention) and the
 *     **elemental-dignities** interaction matrix. This is *settled* esoteric
 *     theory — the Golden Dawn codified it, RWS inherited it, and the
 *     dignity relations below are reproduced verbatim from the verified
 *     research doc (docs/research/tarot-reader-gaps-2026-05-30.md, Gap 4).
 *
 *  2. **Tarot-element → BaZi Wu Xing correspondence** (TAROT_TO_WUXING).
 *     This is *NOT* settled — tarot has 4 elements, BaZi has 5, and no source
 *     surveyed in the research addressed the normalization. The mapping below
 *     is an explicitly-flagged design decision to revisit, not received fact.
 *
 * WHY a separate module: elemental balance is the bridge between the tarot
 * reader and Semar's cross-engine moat (tarot ↔ BaZi/ZWDS). Keeping the
 * correspondence honest and isolated here means we can swap the BaZi mapping
 * later without touching draw/card logic.
 */

import type { Card, Suit } from './cards.js';

/**
 * The four classical Western elements as used in tarot.
 * (Distinct from BaZi's five Wu Xing — see TAROT_TO_WUXING.)
 */
export type TarotElement = 'fire' | 'water' | 'air' | 'earth';

/**
 * Suit → element, RWS / Golden Dawn convention.
 *
 *   Wands = Fire · Cups = Water · Swords = Air · Pentacles = Earth
 *
 * NOTE: a minority of decks (and the older "elemental weapons" debate) swap
 * Swords↔Wands — i.e. Swords=Fire, Wands=Air — tying the suit to the *act* of
 * wielding rather than the tool. We follow the dominant RWS/Golden Dawn
 * assignment used by Labyrinthos and most modern decks. If we ever support a
 * deck that swaps, this constant is the single point to override.
 */
export const SUIT_ELEMENT: Record<Suit, TarotElement> = {
  wands: 'fire',
  cups: 'water',
  swords: 'air',
  pentacles: 'earth',
} as const;

/**
 * The element of a card.
 *
 * Minor arcana → its suit's element (well-defined, RWS/Golden Dawn).
 *
 * Major arcana → `null`. The Major Arcana DO have traditional elemental and
 * astrological attributions in the Golden Dawn system (e.g. The Emperor=Aries
 * → Fire, The Moon=Pisces → Water, The Fool=Air, etc.), but those are a
 * separate authored dataset we have NOT yet built and which sources disagree
 * on at the edges. Rather than assert an unverified table, we return null and
 * leave Major-arcana elements for a future, sourced correspondence layer.
 */
export function elementOf(card: Card): TarotElement | null {
  if (card.arcana === 'minor') {
    return SUIT_ELEMENT[card.suit];
  }
  return null;
}

/**
 * How two elements interact, per Golden Dawn elemental dignities.
 *
 *   amplify  — same element; intensifies (for good or ill)
 *   support  — friendly/complementary; reinforces
 *   weaken   — enemy/opposed; cancels or undermines
 *   neutral  — neither friend nor enemy; passes
 */
export type Dignity = 'amplify' | 'support' | 'weaken' | 'neutral';

/**
 * The 4×4 elemental-dignities matrix (verified, RWS/Golden Dawn).
 *
 *   same element              → amplify
 *   Fire+Air, Water+Earth     → support   (active pair, passive pair)
 *   Fire-Water, Air-Earth     → weaken    (true elemental enemies)
 *   Fire-Earth, Water-Air     → neutral   (neither friendly nor opposed)
 *
 * Symmetric by construction: dignity(a,b) === dignity(b,a). The test suite
 * enforces this over all 16 ordered pairs.
 */
const DIGNITY_MATRIX: Record<TarotElement, Record<TarotElement, Dignity>> = {
  fire: { fire: 'amplify', air: 'support', water: 'weaken', earth: 'neutral' },
  air: { air: 'amplify', fire: 'support', earth: 'weaken', water: 'neutral' },
  water: { water: 'amplify', earth: 'support', fire: 'weaken', air: 'neutral' },
  earth: { earth: 'amplify', water: 'support', air: 'weaken', fire: 'neutral' },
} as const;

/**
 * The dignity relation between two elements. Order-independent.
 */
export function dignity(a: TarotElement, b: TarotElement): Dignity {
  return DIGNITY_MATRIX[a][b];
}

/**
 * Pairwise-dignities helper: every unordered pair of elements in `elements`,
 * with its dignity. Useful for scoring a spread's elemental coherence
 * (e.g. many `amplify`/`support` pairs → a focused reading; many `weaken`
 * pairs → internal tension).
 *
 * Returns each unordered pair once (i < j); same-index pairs are skipped
 * (a card does not dignify itself). Order of the input is preserved in the
 * `a`/`b` fields for traceability back to positions.
 */
export interface ElementPairDignity {
  readonly a: TarotElement;
  readonly b: TarotElement;
  readonly dignity: Dignity;
}

export function dignitiesOf(
  elements: readonly TarotElement[],
): ElementPairDignity[] {
  const out: ElementPairDignity[] = [];
  for (let i = 0; i < elements.length; i++) {
    for (let j = i + 1; j < elements.length; j++) {
      const a = elements[i]!;
      const b = elements[j]!;
      out.push({ a, b, dignity: dignity(a, b) });
    }
  }
  return out;
}

/**
 * Tarot 4-element → BaZi Wu Xing (5-element) correspondence.
 *
 * ⚠️ DESIGN DECISION, NOT SETTLED FACT — revisit. ⚠️
 *
 * The research (Gap 4, OPEN QUESTION) found NO canonical mapping: tarot's
 * Western four elements do not align 1:1 with BaZi's five Wu Xing
 * (木 Wood / 火 Fire / 土 Earth / 金 Metal / 水 Water). Three of four map
 * intuitively by shared name/quality:
 *
 *   fire  → 火 (Fire)   — direct
 *   water → 水 (Water)  — direct
 *   earth → 土 (Earth)  — direct
 *
 * The hard one is AIR, which has no Wu Xing counterpart. Two defensible
 * choices, both arguable:
 *
 *   air → 金 (Metal)  ← OUR DEFAULT.
 *        Rationale: in the Golden Dawn dignity scheme Air is the *active/yang*
 *        partner of Fire (Fire+Air = support); Metal is the yang counterpart
 *        in the Wu Xing productive/controlling cycles, and Western "air =
 *        intellect/sword/cutting" resonates with Metal (金 = blades, clarity,
 *        the Swords suit). This leaves Wood (木) unmapped from the tarot side.
 *
 *   air → 木 (Wood)  ← the alternative.
 *        Rationale: Wood = growth, wind, movement, the breath of spring; some
 *        correspond Air↔Wood on the "moving, expansive" quality. This instead
 *        leaves Metal (金) unmapped.
 *
 * Neither is canonical. We pick 金 (Metal) as the default because the Swords→Air
 * suit's imagery (blades, cutting clarity) maps most concretely onto Metal, and
 * note loudly that the cross-engine balance layer should treat the unmapped
 * fifth element (Wood) as a known gap, not silently zero it out. When we build
 * the real tarot↔BaZi balance normalizer, reconsider this whole table.
 */
export const TAROT_TO_WUXING: Record<TarotElement, string> = {
  fire: '火',
  water: '水',
  earth: '土',
  air: '金', // Metal — design default; alternative is 木 (Wood). See comment above.
} as const;
