/**
 * Tarot spreads as first-class engine objects.
 *
 * WHY this lives in `packages/tarot` and not the web layer:
 *   Previously a spread was just an ordered list of position labels hardcoded in
 *   the web UI (research doc Gap 1 + Gap 3). That made positions untestable, made
 *   the meanings impossible to reuse across surfaces (web / CLI / future API), and
 *   coupled divination semantics to a React component. A spread is *divination
 *   logic* — it belongs in the engine. So we model it here as a first-class,
 *   ordered list of positions, each carrying a position-semantic.
 *
 * Data model (from research doc, confirmed high-confidence):
 *   Spread = { id, name, category, positions: [ { index, label, meaning } ] }
 *
 * A spread's `cardCount` is ALWAYS equal to `positions.length`. We store it
 * explicitly anyway (rather than deriving it) so callers/UIs can cheaply read the
 * count without walking the array, and so the test suite can assert the two never
 * drift apart. `drawForSpread` draws exactly `cardCount` cards.
 *
 * ⚠️ POSITION-MEANING PROVENANCE (research doc CAVEAT — obey):
 *   The deep-research pass could NOT verify the exact position *meanings* for the
 *   Celtic Cross (3 competing position-list wordings were refuted because sources
 *   disagree). The COUNT (10 cards) is confirmed; the meanings are not. Per the
 *   research decision, we standardize the Celtic Cross's 10 positions on the
 *   **Biddy Tarot** reference (biddytarot.com Celtic Cross guide) and treat it as
 *   the single chosen authority — see the comment on CELTIC_CROSS below. We do NOT
 *   mix in wordings from other blogs.
 *
 *   For the themed spreads (Love / Career / Year-Ahead), the research confirmed the
 *   spread *names* exist in the benchmark (Labyrinthos) but flagged their
 *   per-position meanings as "need authoring" (open item). The meanings below are
 *   therefore **authored by us** in the common RWS idiom — they are a sensible,
 *   internally-consistent starter set, not transcriptions of a verified source.
 *   They are safe to revise; nothing downstream depends on the exact wording.
 */

import { drawCards, type DrawnCard, type DrawOptions } from './draw.js';

/** One slot in a spread. `index` is the 0-based draw order. */
export interface SpreadPosition {
  /** 0-based position in draw order. Contiguous 0..cardCount-1 within a spread. */
  readonly index: number;
  /** Short human label for the slot, e.g. "Past" or "Hopes & Fears". */
  readonly label: string;
  /** What this slot signifies in the reading — the position-semantic. */
  readonly meaning: string;
}

/**
 * Spread categories. Mirrors the benchmark's top-level grouping (research doc):
 *   - 'general' : non-themed layouts (single, PPF, SAO, Celtic Cross)
 *   - 'love'    : relationship-oriented
 *   - 'career'  : work / vocation-oriented
 *   - 'time'    : time-cycle layouts (year-ahead)
 * Kept deliberately small; the benchmark's Moon-Phase / Wheel-of-the-Year /
 * Major-Arcana families are NOT authored yet (future work).
 */
export type SpreadCategory = 'general' | 'love' | 'career' | 'time';

export interface Spread {
  /** Stable slug identifier, unique across SPREADS. */
  readonly id: string;
  readonly name: string;
  readonly category: SpreadCategory;
  /** Always === positions.length. Stored for cheap reads + drift detection. */
  readonly cardCount: number;
  readonly positions: readonly SpreadPosition[];
}

/**
 * Helper: build a Spread from an ordered list of (label, meaning) pairs.
 *
 * WHY a helper: it auto-assigns contiguous 0-based indexes and derives
 * `cardCount` from the list length, so the two can never drift apart by hand.
 * This is the only place `index` and `cardCount` are produced, which removes a
 * whole class of copy-paste errors from the catalogue below.
 */
function makeSpread(
  id: string,
  name: string,
  category: SpreadCategory,
  slots: readonly (readonly [label: string, meaning: string])[],
): Spread {
  const positions: SpreadPosition[] = slots.map(([label, meaning], index) => ({
    index,
    label,
    meaning,
  }));
  return { id, name, category, cardCount: positions.length, positions };
}

// ---------------------------------------------------------------------------
// General spreads
// ---------------------------------------------------------------------------

const SINGLE = makeSpread('single', 'Single Card', 'general', [
  ['The Card', 'A single focus card — the heart of the matter, a daily draw, or a yes/no nudge.'],
]);

const PAST_PRESENT_FUTURE = makeSpread(
  'past-present-future',
  'Past · Present · Future',
  'general',
  [
    ['Past', 'Forces and events that led here — the root of the situation.'],
    ['Present', 'Where things stand now — the current energy and what is in play.'],
    ['Future', 'The likely trajectory if the present course holds.'],
  ],
);

const SITUATION_ACTION_OUTCOME = makeSpread(
  'situation-action-outcome',
  'Situation · Action · Outcome',
  'general',
  [
    ['Situation', 'The circumstance as it actually is — the context to work with.'],
    ['Action', 'The advised move — what to do about the situation.'],
    ['Outcome', 'What that action tends to bring about.'],
  ],
);

/**
 * Celtic Cross — 10 cards.
 *
 * AUTHORITY: position meanings standardized on **Biddy Tarot**
 * (biddytarot.com, "The Celtic Cross Tarot Spread" guide), chosen per the
 * research doc's caveat as the single reference. Card *count* of 10 is the only
 * thing the research verified across sources; these *meanings* follow Biddy's
 * 10-slot ordering exactly (Present, Challenge, Past, Future, Above/conscious,
 * Below/subconscious, Advice, External influences, Hopes & Fears, Outcome).
 */
const CELTIC_CROSS = makeSpread('celtic-cross', 'Celtic Cross', 'general', [
  ['Present', 'The present — the current situation and its central energy.'],
  ['Challenge', 'The challenge — what crosses you, the immediate obstacle or tension.'],
  ['Past', 'The past — recent events or root causes still shaping the matter.'],
  ['Future', 'The future — what is coming into being in the near term.'],
  ['Above (Conscious)', 'Your conscious aim — goals, ideals, what you are aware of wanting.'],
  ['Below (Subconscious)', 'The subconscious — underlying feelings and drivers beneath the surface.'],
  ['Advice', 'Your advice — the recommended attitude or approach to take.'],
  ['External Influences', 'External influences — people and environment acting on the situation.'],
  ['Hopes & Fears', 'Hopes and fears — what you most desire and most dread (often two sides of one coin).'],
  ['Outcome', 'The outcome — the likely resolution if the current path continues.'],
]);

// ---------------------------------------------------------------------------
// Love / relationship spread (authored by us — see provenance note at top)
// ---------------------------------------------------------------------------

const RELATIONSHIP = makeSpread('relationship', 'Relationship', 'love', [
  ['You', 'You — your role, needs, and energy in this connection.'],
  ['The Other', 'The other person — their role, needs, and energy.'],
  ['The Bond', 'The bond — the dynamic that exists between you right now.'],
  ['Foundation', 'The foundation — what genuinely supports the relationship.'],
  ['Tension', 'The tension — the friction or unmet need to address.'],
  ['Guidance', 'Guidance — how to nurture the connection from here.'],
  ['Potential', 'Potential — where the relationship is heading on its current course.'],
]);

// ---------------------------------------------------------------------------
// Career spread (authored by us — see provenance note at top)
// ---------------------------------------------------------------------------

const CAREER_PATH = makeSpread('career-path', 'Career Path', 'career', [
  ['Where You Stand', 'Your current position — the reality of your work situation now.'],
  ['Strengths', 'Strengths — the skills and assets you can lean on.'],
  ['Obstacles', 'Obstacles — what is blocking progress or holding you back.'],
  ['Action', 'Action — the concrete step that moves things forward.'],
  ['Direction', 'Direction — where this path leads if you commit to the action.'],
]);

// ---------------------------------------------------------------------------
// Year-ahead spread (time cycle — authored by us)
// ---------------------------------------------------------------------------

/**
 * Year Ahead — 13 cards: one card per calendar month (positions 0–11, labelled
 * Month 1..12) plus a 13th "theme" card capturing the overarching energy of the
 * whole year. The 12+1 variant (vs a flat 12) is the common reading practice; we
 * pick it deliberately so a querent always gets a synthesizing card.
 */
const YEAR_AHEAD = makeSpread('year-ahead', 'Year Ahead', 'time', [
  ['Month 1', 'The energy and focus of the first month of the cycle.'],
  ['Month 2', 'The energy and focus of the second month of the cycle.'],
  ['Month 3', 'The energy and focus of the third month of the cycle.'],
  ['Month 4', 'The energy and focus of the fourth month of the cycle.'],
  ['Month 5', 'The energy and focus of the fifth month of the cycle.'],
  ['Month 6', 'The energy and focus of the sixth month of the cycle.'],
  ['Month 7', 'The energy and focus of the seventh month of the cycle.'],
  ['Month 8', 'The energy and focus of the eighth month of the cycle.'],
  ['Month 9', 'The energy and focus of the ninth month of the cycle.'],
  ['Month 10', 'The energy and focus of the tenth month of the cycle.'],
  ['Month 11', 'The energy and focus of the eleventh month of the cycle.'],
  ['Month 12', 'The energy and focus of the twelfth month of the cycle.'],
  ['Year Theme', 'The overarching theme — the through-line that ties the whole year together.'],
]);

/**
 * The starter catalogue. Order here is the order presented to users.
 * 8 spreads spanning all four categories.
 */
export const SPREADS: readonly Spread[] = [
  SINGLE,
  PAST_PRESENT_FUTURE,
  SITUATION_ACTION_OUTCOME,
  CELTIC_CROSS,
  RELATIONSHIP,
  CAREER_PATH,
  YEAR_AHEAD,
];

const BY_ID: ReadonlyMap<string, Spread> = new Map(
  SPREADS.map((s) => [s.id, s] as const),
);

/** Look up a spread by its stable id. Throws on unknown id (fail loud). */
export function spreadById(id: string): Spread {
  const s = BY_ID.get(id);
  if (!s) throw new Error(`Unknown spread id: ${id}`);
  return s;
}

/** One card bound to the position it was drawn into. */
export interface PositionedCard {
  readonly position: SpreadPosition;
  readonly drawn: DrawnCard;
}

/**
 * Draw a full reading for a spread.
 *
 * Draws exactly `spread.cardCount` UNIQUE cards (drawCards shuffles a fresh deck,
 * so the cards are guaranteed distinct) and binds each to its position in draw
 * order. The Nth drawn card fills the Nth position — i.e. result[i].position is
 * spread.positions[i].
 *
 * `opts` is forwarded verbatim to drawCards, so callers control reversals and the
 * RNG (pass mulberry32(seed) for a deterministic, replayable reading).
 */
export function drawForSpread(
  spread: Spread,
  opts: DrawOptions = {},
): readonly PositionedCard[] {
  const cards = drawCards(spread.cardCount, opts);
  return spread.positions.map((position, i) => ({
    position,
    drawn: cards[i]!,
  }));
}
