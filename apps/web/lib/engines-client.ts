/**
 * CLIENT-SAFE engine helpers.
 * I-Ching + Tarot only — no node: deps.
 */
'use client';

import {
  drawCards,
  mulberry32 as tarotRng,
  DECK,
  SPREADS,
  spreadById,
  drawForSpread,
  type Spread,
} from '@semar/tarot';
import { castHexagram, hexagramByBinary, mulberry32 as ichingRng } from '@semar/iching';
import { PROFILE } from './profile';

export type { CoreData } from './engines-server';

// ── Seed ─────────────────────────────────────────────────────────────────────
function hash32(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h;
}

// ── Tarot ─────────────────────────────────────────────────────────────────────
export interface TarotDraw {
  /** Stable key for React lists — the position label (unique within a spread). */
  position: string;
  /** Human-facing label for the position slot, e.g. "Past" or "Hopes & Fears". */
  positionLabel: string;
  cardName: string;
  /** Canonical deck slug, e.g. "the-fool" / "wands-ace". */
  cardId: string;
  /** 0-based index of the card within DECK (0..77). */
  deckIndex: number;
  reversed: boolean;
  artPath: string | null;
}

const ART_SLUGS: Record<number, string> = {
  0: '00-fool', 1: '01-magician', 2: '02-high-priestess',
  3: '03-empress', 4: '04-emperor',
};

function artPath(deckIndex: number): string | null {
  const slug = ART_SLUGS[deckIndex];
  return slug ? `/card-art/${slug}.png` : null;
}

/** Real deck index for a card id, by lookup in DECK (not a slug heuristic). */
function deckIndexOf(cardId: string): number {
  return DECK.findIndex((c) => c.id === cardId);
}

function toDraw(
  d: ReturnType<typeof drawCards>[number],
  position: string,
  positionLabel: string,
): TarotDraw {
  const idx = deckIndexOf(d.card.id);
  return {
    position,
    positionLabel,
    cardName: d.card.name,
    cardId: d.card.id,
    deckIndex: idx,
    reversed: d.reversed,
    artPath: idx >= 0 ? artPath(idx) : null,
  };
}

export const TAROT_SPREADS = SPREADS;
export const DEFAULT_SPREAD_ID = 'past-present-future';
export type { Spread };

/** Draw a fresh reading bound to the positions of the given spread. */
export function drawFreshSpread(spreadId: string = DEFAULT_SPREAD_ID): TarotDraw[] {
  const spread = spreadById(spreadId);
  const seed = hash32(`${Date.now()}:fresh:${Math.random()}:${spreadId}`);
  const positioned = drawForSpread(spread, { reversals: true, rng: tarotRng(seed) });
  return positioned.map((p) => toDraw(p.drawn, p.position.label, p.position.label));
}

export function drawDailyTarot(localDate: string): TarotDraw[] {
  const spread = spreadById(DEFAULT_SPREAD_ID);
  const seed = hash32(`${localDate}:${PROFILE.name}:tarot`);
  const positioned = drawForSpread(spread, { reversals: true, rng: tarotRng(seed) });
  return positioned.map((p) => toDraw(p.drawn, p.position.label, p.position.label));
}

export function drawFreshTarot(): TarotDraw[] {
  return drawFreshSpread(DEFAULT_SPREAD_ID);
}

// ── I-Ching ───────────────────────────────────────────────────────────────────
export type LineType = 6 | 7 | 8 | 9;

export interface IChingResult {
  lines: LineType[];
  hexagram: { number: number; cn: string; en: string; pinyin: string } | null;
  relating: { number: number; cn: string; en: string } | null;
  changingLines: number[];
}

/** Cast one line: 3 coins (H=3, T=2) → sum 6/7/8/9 */
export function castLine(): { line: LineType; coins: boolean[] } {
  const coins = [Math.random() < 0.5, Math.random() < 0.5, Math.random() < 0.5];
  const sum = (coins.reduce((acc, h) => acc + (h ? 3 : 2), 0)) as unknown as LineType;
  return { line: sum, coins };
}

export function buildResult(lines: LineType[]): IChingResult {
  const primaryBits  = lines.map((l) => (l === 7 || l === 9 ? 1 : 0));
  const relatingBits = lines.map((l, i) => {
    if (l === 9) return 0;
    if (l === 6) return 1;
    return primaryBits[i]!;
  });
  const changingLines = lines.map((l, i) => (l === 6 || l === 9 ? i : -1)).filter((i) => i !== -1);

  type Bin6 = `${'0'|'1'}${'0'|'1'}${'0'|'1'}${'0'|'1'}${'0'|'1'}${'0'|'1'}`;
  const toBin = (bits: number[]): Bin6 => [...bits].reverse().join('') as Bin6;

  const primary  = hexagramByBinary(toBin(primaryBits));
  const relating = changingLines.length > 0 ? hexagramByBinary(toBin(relatingBits)) : null;

  return {
    lines,
    hexagram: primary  ? { number: primary.number,  cn: primary.cn,  en: primary.en,  pinyin: primary.pinyin }  : null,
    relating: relating ? { number: relating.number, cn: relating.cn, en: relating.en } : null,
    changingLines,
  };
}

export function castDailyIching(localDate: string): IChingResult {
  const seed = hash32(`${localDate}:${PROFILE.name}:iching`);
  const result = castHexagram(ichingRng(seed));
  // castHexagram returns a pre-built result — reconstruct lines as all stable yang for now
  // (the daily cast is deterministic, full ritual uses castLine×6 instead)
  return {
    lines: [7, 7, 7, 7, 7, 7],
    hexagram: result.primary ? {
      number: result.primary.number, cn: result.primary.cn,
      en: result.primary.en, pinyin: result.primary.pinyin,
    } : null,
    relating: result.relating ? {
      number: result.relating.number, cn: result.relating.cn,
      en: result.relating.en,
    } : null,
    changingLines: [],
  };
}
