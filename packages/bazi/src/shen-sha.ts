/**
 * Shen Sha (神煞) — symbolic stars / auspicious-inauspicious markers.
 *
 * Each star has a lookup table keyed by some "anchor" of the chart (most
 * often the day stem or the year/day branch). Where it appears on the chart
 * is its presence; on which pillar reveals what life domain it touches.
 *
 * This module implements the rules with the broadest consensus. Less
 * canonical stars (variants between schools) are NOT included here —
 * they belong in a deeper analysis layer once schools are pinned down.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { Branch, Stem } from './constants.js';
import type { ChartPillars, PillarSlot } from './interactions.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export type StarCategory =
  | 'auspicious' | 'inauspicious' | 'mystical' | 'romance' | 'mobility' | 'structural';

export interface StarHit {
  readonly key: string;
  readonly cn: string;
  readonly en: string;
  readonly category: StarCategory;
  readonly slot: PillarSlot;
  readonly branch: Branch;
  readonly note?: string;
}

interface StarDef {
  readonly key: string;
  readonly cn: string;
  readonly en: string;
  readonly category: StarCategory;
  readonly anchor: 'dayStem' | 'yearOrDayBranch' | 'dayStemBranch';
  readonly rule: 'matchAnchorBranch' | 'voidPerXun';
  readonly table?: Record<string, readonly Branch[]>;
  readonly note?: string;
}

interface RawData {
  readonly stars: readonly StarDef[];
}

let cached: readonly StarDef[] | undefined;
function load(): readonly StarDef[] {
  if (!cached) {
    const path = join(__dirname, '..', 'data', 'shen-sha.json');
    cached = (JSON.parse(readFileSync(path, 'utf8')) as RawData).stars;
  }
  return cached;
}

const SLOTS: readonly PillarSlot[] = ['year', 'month', 'day', 'hour'];

export function findShenSha(pillars: ChartPillars): StarHit[] {
  const stars = load();
  const out: StarHit[] = [];

  for (const star of stars) {
    if (star.rule === 'matchAnchorBranch') {
      const targetBranches = resolveTargets(star, pillars);
      if (!targetBranches.length) continue;

      for (const slot of SLOTS) {
        const branch = pillars[slot].branch;
        if (targetBranches.includes(branch)) {
          out.push({
            key: star.key,
            cn: star.cn,
            en: star.en,
            category: star.category,
            slot,
            branch,
            ...(star.note ? { note: star.note } : {}),
          });
        }
      }
    } else if (star.rule === 'voidPerXun') {
      const voids = voidsForDay(pillars.day.stem, pillars.day.branch);
      for (const slot of SLOTS) {
        if (voids.includes(pillars[slot].branch)) {
          out.push({
            key: star.key,
            cn: star.cn,
            en: star.en,
            category: star.category,
            slot,
            branch: pillars[slot].branch,
          });
        }
      }
    }
  }

  return out;
}

function resolveTargets(star: StarDef, pillars: ChartPillars): readonly Branch[] {
  if (!star.table) return [];
  switch (star.anchor) {
    case 'dayStem': {
      return star.table[pillars.day.stem] ?? [];
    }
    case 'yearOrDayBranch': {
      const fromYear = star.table[pillars.year.branch] ?? [];
      const fromDay = star.table[pillars.day.branch] ?? [];
      return Array.from(new Set([...fromYear, ...fromDay]));
    }
    default:
      return [];
  }
}

/**
 * 空亡 (kong wang) — the two branches missing from the 10-day "xun" (旬)
 * cycle that contains the day pillar.
 *
 * The 10 xun and their voids:
 *   甲子 xun (indices 0–9):   void 戌亥
 *   甲戌 xun (10–19):         void 申酉
 *   甲申 xun (20–29):         void 午未
 *   甲午 xun (30–39):         void 辰巳
 *   甲辰 xun (40–49):         void 寅卯
 *   甲寅 xun (50–59):         void 子丑
 */
const XUN_VOIDS: ReadonlyArray<{ from: number; voids: readonly Branch[] }> = [
  { from: 0,  voids: ['戌', '亥'] },
  { from: 10, voids: ['申', '酉'] },
  { from: 20, voids: ['午', '未'] },
  { from: 30, voids: ['辰', '巳'] },
  { from: 40, voids: ['寅', '卯'] },
  { from: 50, voids: ['子', '丑'] },
];

import { sexagenaryIndexOf } from './sexagenary.js';
import { STEMS, BRANCHES, type StemIdx, type BranchIdx } from './constants.js';

function voidsForDay(dayStem: Stem, dayBranch: Branch): readonly Branch[] {
  const idx = sexagenaryIndexOf(
    STEMS.indexOf(dayStem) as StemIdx,
    BRANCHES.indexOf(dayBranch) as BranchIdx,
  );
  const xun = XUN_VOIDS.find((x) => idx >= x.from && idx < x.from + 10);
  return xun ? xun.voids : [];
}
