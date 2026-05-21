/**
 * The 78-card Rider-Waite-Smith tarot deck.
 *
 *   22 Major Arcana   (0–21, "the-fool" through "the-world")
 *   56 Minor Arcana    (4 suits × 14 ranks)
 *
 * IDs are stable slugs; use them as the canonical identifier.
 */

export type Arcana = 'major' | 'minor';
export type Suit = 'wands' | 'cups' | 'swords' | 'pentacles';
export type CourtRank = 'page' | 'knight' | 'queen' | 'king';
export type Rank = 'ace' | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | CourtRank;

interface MajorCard {
  readonly id: string;
  readonly arcana: 'major';
  readonly name: string;
  /** Roman-numeral position 0–21. */
  readonly number: number;
}

interface MinorCard {
  readonly id: string;
  readonly arcana: 'minor';
  readonly name: string;
  readonly suit: Suit;
  readonly rank: Rank;
}

export type Card = MajorCard | MinorCard;

const MAJOR_NAMES: readonly string[] = [
  'The Fool',           // 0
  'The Magician',       // 1
  'The High Priestess', // 2
  'The Empress',        // 3
  'The Emperor',        // 4
  'The Hierophant',     // 5
  'The Lovers',         // 6
  'The Chariot',        // 7
  'Strength',           // 8
  'The Hermit',         // 9
  'Wheel of Fortune',   // 10
  'Justice',            // 11
  'The Hanged Man',     // 12
  'Death',              // 13
  'Temperance',         // 14
  'The Devil',          // 15
  'The Tower',          // 16
  'The Star',           // 17
  'The Moon',           // 18
  'The Sun',            // 19
  'Judgement',          // 20
  'The World',          // 21
];

const SUITS: readonly Suit[] = ['wands', 'cups', 'swords', 'pentacles'];
const RANKS: readonly Rank[] = [
  'ace', 2, 3, 4, 5, 6, 7, 8, 9, 10, 'page', 'knight', 'queen', 'king',
];

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}

function rankLabel(rank: Rank): string {
  return typeof rank === 'number' ? String(rank) : rank;
}

function buildDeck(): readonly Card[] {
  const cards: Card[] = [];

  MAJOR_NAMES.forEach((name, i) => {
    cards.push({ id: slugify(name), arcana: 'major', name, number: i });
  });

  for (const suit of SUITS) {
    for (const rank of RANKS) {
      const label = rankLabel(rank);
      const titleRank = typeof rank === 'string'
        ? rank[0]!.toUpperCase() + rank.slice(1)
        : label;
      const titleSuit = suit[0]!.toUpperCase() + suit.slice(1);
      cards.push({
        id: `${suit}-${label}`,
        arcana: 'minor',
        name: `${titleRank} of ${titleSuit}`,
        suit,
        rank,
      });
    }
  }

  return cards;
}

export const DECK: readonly Card[] = buildDeck();

const BY_ID: ReadonlyMap<string, Card> = new Map(DECK.map((c) => [c.id, c] as const));

export function cardById(id: string): Card {
  const c = BY_ID.get(id);
  if (!c) throw new Error(`Unknown card id: ${id}`);
  return c;
}
