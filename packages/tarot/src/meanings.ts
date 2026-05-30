/**
 * Rich per-card meaning layer, seeded from the CC0 `dariusk/corpora`
 * `tarot_interpretations.json` dataset (vendored under `../data/`).
 *
 * WHY a separate module: `cards.ts` owns the *structural* deck (78 stable slugs,
 * arcana/suit/rank). Meaning text is a separate concern with a separate data
 * source and a separate license/provenance story (see `../data/PROVENANCE.md`).
 * Keeping it out of `cards.ts` lets the deck stay tiny and dependency-free while
 * this layer carries the heavier prose.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * POLARITY MAPPING — light/shadow → upright/reversed (DELIBERATE, not identical)
 * ──────────────────────────────────────────────────────────────────────────
 * The corpora dataset models each card with a **light / shadow** polarity
 * (the card's constructive vs. destructive expression). Our deck instead draws
 * explicit **upright / reversed** orientations (see `draw.ts` -> `DrawnCard`).
 *
 * These are *related but not the same axis*: a reversed card is not strictly the
 * card's "shadow" — many readers treat reversal as blocked/internalized/delayed
 * energy rather than pure negativity. We nonetheless map:
 *
 *     meanings.light  -> upright
 *     meanings.shadow -> reversed
 *
 * because it is the closest faithful correspondence the open data affords, and
 * the research synthesis (tarot-reader-gaps-2026-05-30.md, Gap 2 "Polarity
 * nuance") explicitly directs us to do this mapping *deliberately* rather than
 * pretend the axes are identical. When we later author richer per-orientation
 * text ourselves, this seed layer can be superseded per-card.
 *
 * NOT YET AUTHORED (limitation, be honest): the research's full target schema
 * has per-dimension text (work / love / finance / health / mentality / advice),
 * Yes-No, element, and Fool's-Journey index. The corpora source carries none of
 * those, so this module exposes only what the data actually supports:
 * keywords + a single upright sentence + a single reversed sentence +
 * fortune-telling lines. The richer dimensions are a separate future task.
 */

// Vendored CC0 corpora dataset imported as an ESM JSON module (NOT read via
// node:fs). This keeps the module bundler-safe: @semar/tarot is imported by
// client React components (e.g. the cast page), and a node:fs/node:url read
// would break the webpack client bundle. JSON import works in Next, vitest, tsx.
import corporaData from '../data/tarot-interpretations.corpora.json';

import { DECK, type Card } from './cards.js';

/**
 * A single card's interpretation, keyed by OUR card id (the slug from cards.ts,
 * e.g. "the-fool", "wands-ace").
 *
 * `upright` / `reversed` are human-readable sentences assembled by joining the
 * corpora light/shadow phrase arrays (see polarity note at top of file).
 */
export interface CardMeaning {
  readonly id: string;
  readonly keywords: readonly string[];
  readonly upright: string;
  readonly reversed: string;
  readonly fortuneTelling: readonly string[];
}

// ── Raw corpora shape (only the fields we consume) ─────────────────────────

interface CorporaEntry {
  readonly name: string;
  /** "major" | "wands" | "cups" | "swords" | "coins" (note: coins, not pentacles). */
  readonly suit: string;
  /** 0–21 for majors; 1–10 or "page"/"knight"/"queen"/"king" for minors. */
  readonly rank: number | string;
  readonly keywords?: readonly string[];
  readonly meanings?: {
    readonly light?: readonly string[];
    readonly shadow?: readonly string[];
  };
  readonly fortune_telling?: readonly string[];
}

interface CorporaFile {
  readonly description?: string;
  readonly tarot_interpretations: readonly CorporaEntry[];
}

// ── Mapping tables: OUR conventions  →  corpora conventions ────────────────

/**
 * Our suit names vs. corpora's. The only divergence is Pentacles, which the
 * corpora calls "coins" (the older Marseille name for the same suit).
 */
const SUIT_TO_CORPORA: Readonly<Record<string, string>> = {
  wands: 'wands',
  cups: 'cups',
  swords: 'swords',
  pentacles: 'coins',
};

/**
 * Build the lookup key the SAME way for both sides so a card resolves purely by
 * STRUCTURE — never by fuzzy name matching. This sidesteps every naming
 * difference the dataset has:
 *   - majors: corpora uses "The Wheel"/"The Pope/Hierophant"/"The Papess/High
 *     Priestess"; we use "Wheel of Fortune"/"The Hierophant"/"The High Priestess".
 *     Both share the SAME numeric position (and crucially the same Strength=8 /
 *     Justice=11 RWS ordering), so we key majors on `number`, not name.
 *   - minors: corpora rank `1` == our rank `'ace'`; court ranks ("page"… "king")
 *     match verbatim; suit "coins" == our "pentacles" (handled above).
 */
function structuralKey(arcana: 'major', number: number): string;
function structuralKey(arcana: 'minor', suit: string, rank: string | number): string;
function structuralKey(
  arcana: 'major' | 'minor',
  a: number | string,
  b?: string | number,
): string {
  if (arcana === 'major') return `major:${a as number}`;
  return `minor:${a as string}:${b}`;
}

/** Normalize a corpora minor rank into our string form ("1" -> "ace"). */
function corporaRankKey(rank: number | string): string {
  if (rank === 1 || rank === '1') return 'ace';
  return String(rank);
}

/** Normalize one of OUR minor ranks into the same key space. */
function ourRankKey(rank: string | number): string {
  return rank === 'ace' ? 'ace' : String(rank);
}

// ── Sentence assembly ──────────────────────────────────────────────────────

/**
 * Join a list of short interpretation phrases into one readable sentence.
 * The corpora phrases are capitalized fragments ("Taking a leap of faith");
 * we lower-case the leading char of every phrase after the first and join with
 * "; ", then cap with a period. Defensive against empty/missing arrays.
 */
function joinPhrases(phrases: readonly string[] | undefined): string {
  const parts = (phrases ?? []).map((p) => p.trim()).filter((p) => p.length > 0);
  if (parts.length === 0) return '';
  const sentence = parts
    .map((p, i) => (i === 0 ? p : p.charAt(0).toLowerCase() + p.slice(1)))
    .join('; ');
  return sentence.endsWith('.') ? sentence : `${sentence}.`;
}

// ── Load + build ────────────────────────────────────────────────────────────

function loadCorpora(): readonly CorporaEntry[] {
  return (corporaData as unknown as CorporaFile).tarot_interpretations;
}

function buildMeanings(): ReadonlyMap<string, CardMeaning> {
  // Index corpora entries by structural key.
  const corpora = new Map<string, CorporaEntry>();
  for (const e of loadCorpora()) {
    if (e.suit === 'major') {
      corpora.set(structuralKey('major', Number(e.rank)), e);
    } else {
      corpora.set(structuralKey('minor', e.suit, corporaRankKey(e.rank)), e);
    }
  }

  const out = new Map<string, CardMeaning>();
  for (const card of DECK) {
    const key = keyForCard(card);
    const entry = corpora.get(key);
    if (!entry) {
      // Should never happen — all 78 verified to map (see PROVENANCE.md). If the
      // vendored data is ever swapped for an incomplete file, fail loud at load.
      throw new Error(`No corpora interpretation for card "${card.id}" (key ${key})`);
    }
    out.set(card.id, {
      id: card.id,
      keywords: Object.freeze([...(entry.keywords ?? [])]),
      upright: joinPhrases(entry.meanings?.light), // light  -> upright (deliberate)
      reversed: joinPhrases(entry.meanings?.shadow), // shadow -> reversed (deliberate)
      fortuneTelling: Object.freeze([...(entry.fortune_telling ?? [])]),
    });
  }
  return out;
}

/** Compute the corpora structural key for one of our cards. */
function keyForCard(card: Card): string {
  if (card.arcana === 'major') {
    return structuralKey('major', card.number);
  }
  const corporaSuit = SUIT_TO_CORPORA[card.suit];
  if (!corporaSuit) throw new Error(`Unmapped suit: ${card.suit}`);
  return structuralKey('minor', corporaSuit, ourRankKey(card.rank));
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * All 78 card meanings, keyed by our card id (slug). Immutable.
 *
 * Built eagerly at module load. The dataset is small (~100KB) and reading it
 * once at import time keeps consumers synchronous and avoids the lazy-init
 * branching that bloats every call site — mirroring how `cards.ts` builds its
 * deck at module load.
 */
export const MEANINGS: ReadonlyMap<string, CardMeaning> = buildMeanings();

/**
 * Look up the rich meaning for a card id (slug). Throws on unknown id, matching
 * the fail-loud contract of `cardById` in cards.ts.
 */
export function meaningOf(id: string): CardMeaning {
  const m = MEANINGS.get(id);
  if (!m) throw new Error(`Unknown card id: ${id}`);
  return m;
}
