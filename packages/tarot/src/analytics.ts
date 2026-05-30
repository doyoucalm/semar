/**
 * "Mirror" reading analytics — the aggregate-over-history engine.
 *
 * This powers Labyrinthos-style "Mirror" stats (research Gap 4): given a flat
 * list of past readings, compute most-common card, suit distribution,
 * Major/Minor ratio, reversal %, and elemental balance — sliceable by a small
 * set of preset time buckets.
 *
 * DESIGN — why a decoupled input record:
 *   The web/diary layer persists readings in its own shape (Supabase rows,
 *   localStorage blobs, whatever). We deliberately do NOT import any web/db
 *   type here. Instead callers map their storage down to the minimal
 *   `ReadingRecord` ({ cardId, reversed, date }) and feed us that. Keeps the
 *   engine pure, dependency-free, and unit-testable with plain fixtures.
 *
 * DESIGN — one DrawnCard becomes one ReadingRecord:
 *   A reading/spread of N cards flattens to N records. The analytics treat
 *   every card pull as an independent observation; we do NOT group by
 *   reading/session here. (If per-session stats are wanted later, that's a
 *   separate aggregation on top of these records.)
 *
 * Dates are compared as YYYY-MM-DD *strings*. Lexicographic order on a
 * zero-padded ISO date equals chronological order, so bucket cutoffs are plain
 * string comparisons — no Date/timezone surprises. The "today" reference is
 * always passed in (`todayYmd`) rather than read from the system clock, so the
 * engine stays deterministic and the caller owns the notion of "now".
 */

import { cardById, type Suit } from './cards.js';
import { SUIT_ELEMENT, elementOf, type TarotElement } from './elements.js';

/**
 * One observed card pull from history.
 *
 *   cardId   — canonical deck slug (e.g. "the-fool", "wands-ace").
 *   reversed — orientation as drawn.
 *   date     — YYYY-MM-DD (the day the reading happened). Zero-padded.
 *
 * Intentionally minimal: no position, no spread, no reading id. Those live in
 * the storage layer; the Mirror only needs these three fields.
 */
export interface ReadingRecord {
  readonly cardId: string;
  readonly reversed: boolean;
  readonly date: string;
}

/**
 * Preset time windows, matching Labyrinthos' Mirror (research Gap 4, confirmed
 * exact set). 'alltime' is the no-op bucket (everything). The rest are
 * relative to a supplied `todayYmd`.
 *
 * NOTE: the research also lists "specific year" (pick an arbitrary year). That
 * needs a parameter (which year), so it does NOT fit this parameterless enum —
 * filter for an explicit year with a one-line predicate at the call site
 * (r.date.startsWith('2026-')) rather than overloading this bucket set.
 */
export type TimeBucket =
  | 'alltime'
  | 'thisYear'
  | 'last6mo'
  | 'last3mo'
  | 'last30d'
  | 'last7d';

/** Count of a single card across the filtered records. */
export interface CardCount {
  readonly cardId: string;
  readonly count: number;
}

/**
 * The Mirror payload.
 *
 *   total            — number of records considered.
 *   mostCommonCard   — the single top card, or null when there are no records.
 *   suitDistribution — count per minor suit (majors do not contribute).
 *   majorMinorRatio  — raw counts (NOT a normalized fraction); caller can
 *                      derive a percentage if it wants.
 *   reversalPct      — % of records drawn reversed, 0..100, one decimal.
 *   topCards         — most-common cards, descending, tie-broken by cardId.
 *   elementBalance   — count per TarotElement (majors excluded; see note).
 */
export interface MirrorStats {
  readonly total: number;
  readonly mostCommonCard: CardCount | null;
  readonly suitDistribution: Record<Suit, number>;
  readonly majorMinorRatio: { readonly major: number; readonly minor: number };
  readonly reversalPct: number;
  readonly topCards: readonly CardCount[];
  readonly elementBalance: Record<TarotElement, number>;
}

/** How many top cards `mirrorStats` returns in `topCards`. */
const TOP_CARDS_LIMIT = 5;

/**
 * Subtract `months` calendar months from a YYYY-MM-DD string, returning a new
 * YYYY-MM-DD cutoff. Day-of-month is preserved where possible; if the target
 * month is shorter (e.g. Jan 31 − 1mo → Feb 31), JS Date clamps forward into
 * the next month. For an inclusive ">= cutoff" comparison that minor clamp is
 * acceptable — the buckets are approximate human windows, not legal deadlines.
 *
 * We parse the parts ourselves and build a UTC date to avoid local-timezone
 * drift shifting the day across a boundary.
 */
function minusMonths(ymd: string, months: number): string {
  const [y, m, d] = splitYmd(ymd);
  // Month is 0-indexed in Date; subtracting can underflow the year, which the
  // Date constructor normalizes correctly (e.g. month -1 → previous December).
  const dt = new Date(Date.UTC(y, m - 1 - months, d));
  return toYmd(dt);
}

/**
 * Subtract `days` from a YYYY-MM-DD string, returning a new YYYY-MM-DD cutoff.
 * Pure day arithmetic via UTC epoch — unaffected by DST or timezone.
 */
function minusDays(ymd: string, days: number): string {
  const [y, m, d] = splitYmd(ymd);
  const dt = new Date(Date.UTC(y, m - 1, d - days));
  return toYmd(dt);
}

/** Start of the calendar year for a YYYY-MM-DD: "YYYY-01-01". */
function startOfYear(ymd: string): string {
  return `${ymd.slice(0, 4)}-01-01`;
}

function splitYmd(ymd: string): [number, number, number] {
  const parts = ymd.split('-');
  if (parts.length !== 3) {
    throw new Error(`Invalid YYYY-MM-DD date: ${ymd}`);
  }
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) {
    throw new Error(`Invalid YYYY-MM-DD date: ${ymd}`);
  }
  return [y, m, d];
}

function toYmd(dt: Date): string {
  const y = String(dt.getUTCFullYear()).padStart(4, '0');
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dt.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * The inclusive cutoff for a bucket: a record is kept iff `record.date >=
 * cutoff` (and `<= todayYmd`, see filterByBucket). 'alltime' has no lower
 * bound, signalled by returning null.
 */
function bucketCutoff(bucket: TimeBucket, todayYmd: string): string | null {
  switch (bucket) {
    case 'alltime':
      return null;
    case 'thisYear':
      return startOfYear(todayYmd);
    case 'last6mo':
      return minusMonths(todayYmd, 6);
    case 'last3mo':
      return minusMonths(todayYmd, 3);
    case 'last30d':
      return minusDays(todayYmd, 30);
    case 'last7d':
      return minusDays(todayYmd, 7);
    default: {
      // Exhaustiveness guard: adding a TimeBucket without a case is a compile error.
      const _never: never = bucket;
      throw new Error(`Unhandled time bucket: ${String(_never)}`);
    }
  }
}

/**
 * Keep only the records that fall inside `bucket`, measured against
 * `todayYmd`.
 *
 * Window is **inclusive on both ends**: `cutoff <= record.date <= todayYmd`.
 * Future-dated records (date > today) are dropped for every bucket including
 * 'alltime' — a reading "tomorrow" is bad data and should not skew stats. The
 * comparison is pure lexicographic string comparison on zero-padded ISO dates.
 */
export function filterByBucket(
  records: readonly ReadingRecord[],
  bucket: TimeBucket,
  todayYmd: string,
): ReadingRecord[] {
  const cutoff = bucketCutoff(bucket, todayYmd);
  return records.filter((r) => {
    if (r.date > todayYmd) return false; // drop future-dated noise
    if (cutoff !== null && r.date < cutoff) return false;
    return true;
  });
}

function emptySuitDistribution(): Record<Suit, number> {
  return { wands: 0, cups: 0, swords: 0, pentacles: 0 };
}

function emptyElementBalance(): Record<TarotElement, number> {
  return { fire: 0, water: 0, air: 0, earth: 0 };
}

/**
 * Round to one decimal place (e.g. 33.333… → 33.3). Avoids float dust in the
 * reversalPct surface.
 */
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Compute the Mirror payload for a set of records.
 *
 * Pass an already-bucketed slice (via `filterByBucket`) if you want a windowed
 * view; this function does no time filtering of its own — it aggregates
 * exactly the records handed to it.
 *
 * Unknown card ids throw (via `cardById`): a record referencing a slug not in
 * the 78-card deck is a data-integrity bug we want surfaced, not silently
 * dropped. Callers persisting user history should validate ids on write.
 *
 * elementBalance EXCLUDES Major Arcana: `elementOf` returns null for majors
 * (their elemental attributions are an unbuilt, sourced dataset — see
 * elements.ts). So elementBalance counts only minors and will sum to the minor
 * total, not `total`. This is intentional and documented rather than guessed.
 */
export function mirrorStats(records: readonly ReadingRecord[]): MirrorStats {
  const total = records.length;

  const suitDistribution = emptySuitDistribution();
  const elementBalance = emptyElementBalance();
  const counts = new Map<string, number>();
  let major = 0;
  let minor = 0;
  let reversedCount = 0;

  for (const r of records) {
    const card = cardById(r.cardId); // throws on unknown id — see doc above

    counts.set(r.cardId, (counts.get(r.cardId) ?? 0) + 1);
    if (r.reversed) reversedCount++;

    if (card.arcana === 'major') {
      major++;
    } else {
      minor++;
      suitDistribution[card.suit]++;
      // elementOf is null for majors; minors always resolve via SUIT_ELEMENT.
      const el = elementOf(card) ?? SUIT_ELEMENT[card.suit];
      elementBalance[el]++;
    }
  }

  // Rank all cards by count desc, tie-break by cardId asc for stable output.
  const ranked: CardCount[] = [...counts.entries()]
    .map(([cardId, count]) => ({ cardId, count }))
    .sort((a, b) => (b.count - a.count) || (a.cardId < b.cardId ? -1 : a.cardId > b.cardId ? 1 : 0));

  const mostCommonCard = ranked.length > 0 ? ranked[0]! : null;
  const topCards = ranked.slice(0, TOP_CARDS_LIMIT);
  const reversalPct = total > 0 ? round1((reversedCount / total) * 100) : 0;

  return {
    total,
    mostCommonCard,
    suitDistribution,
    majorMinorRatio: { major, minor },
    reversalPct,
    topCards,
    elementBalance,
  };
}
