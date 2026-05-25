/**
 * CLIENT-SAFE engine helpers.
 * I-Ching + Tarot only — no node: deps.
 */
'use client';

import { drawCards, mulberry32 as tarotRng } from '@semar/tarot';
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
  position: 'past' | 'present' | 'future';
  cardName: string;
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

function toDraw(d: ReturnType<typeof drawCards>[0], i: number, positions: TarotDraw['position'][]): TarotDraw {
  // deck index heuristic: use card arcana/rank to find index
  const raw = d.card.id !== undefined ? d.card.id : i;
  const idx = typeof raw === 'number' ? raw : i;
  return {
    position: positions[i]!,
    cardName: d.card.name,
    deckIndex: idx,
    reversed: d.reversed,
    artPath: artPath(idx),
  };
}

const POS: TarotDraw['position'][] = ['past', 'present', 'future'];

export function drawDailyTarot(localDate: string): TarotDraw[] {
  const seed = hash32(`${localDate}:${PROFILE.name}:tarot`);
  return drawCards(3, { reversals: true, rng: tarotRng(seed) }).map((d, i) => toDraw(d, i, POS));
}

export function drawFreshTarot(): TarotDraw[] {
  const seed = hash32(`${Date.now()}:fresh:${Math.random()}`);
  return drawCards(3, { reversals: true, rng: tarotRng(seed) }).map((d, i) => toDraw(d, i, POS));
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
