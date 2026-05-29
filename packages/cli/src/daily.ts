/**
 * "semar today" — the daily ritual. Composes a single entry containing:
 *   - today's BaZi day pillar (and how it interacts with the natal pillars)
 *   - today's transit chart vs the natal astrology
 *   - today's Javanese weton (weton + wuku)
 *   - a 3-card tarot spread (past / present / future)   [optional]
 *   - one I-Ching hexagram                              [optional]
 *
 * Saves to JSONL diary. Returns a compact human-readable summary.
 *
 * For the interactive 2-step CLI flow, see interactive.ts.
 */

import { computeBazi } from '@semar/bazi';
import { computeChart, computeTransits } from '@semar/astrology';
import { computeZWDSChart } from '@semar/zwds';
import { computePawukonChart } from '@semar/pawukon';
import { drawCards, mulberry32 as tarotMulberry } from '@semar/tarot';
import { castHexagram, mulberry32 as ichingMulberry } from '@semar/iching';
import type { Profile } from './profile.js';
import {
  appendEntry, localDateString, makeId, type DiaryEntry,
} from './diary-log.js';

export interface DailyResult {
  readonly entry: DiaryEntry;
  readonly summary: string;
}

export interface DailyOptions {
  readonly question?: string;
  readonly notes?: string;
  /** When provided, use this UTC ms instead of "now" (for tests + replays). */
  readonly nowMs?: number;
  /** When provided, use this RNG seed for tarot + iching (for deterministic replay). */
  readonly seed?: number;
}

const TAROT_POSITIONS = ['past', 'present', 'future'] as const;

export function runDaily(profile: Profile, opts: DailyOptions = {}): DailyResult {
  const nowMs = opts.nowMs ?? Date.now();
  const localDate = localDateString(nowMs, profile.birth.utcOffsetMinutes);
  const seed = opts.seed ?? hash32(`${localDate}:${profile.name}:tarot`);

  // 1. Natal cores — recomputed each call but cheap.
  const natalBazi = computeBazi({
    year: profile.birth.year, month: profile.birth.month, day: profile.birth.day,
    hour: profile.birth.hour, minute: profile.birth.minute,
    utcOffsetMinutes: profile.birth.utcOffsetMinutes,
    longitude: profile.birth.longitude,
  });
  const natalAstro = computeChart({
    year: profile.birth.year, month: profile.birth.month, day: profile.birth.day,
    hour: profile.birth.hour, minute: profile.birth.minute,
    utcOffsetMinutes: profile.birth.utcOffsetMinutes,
    latitude: profile.birth.latitude, longitude: profile.birth.longitude,
  });

  // 2. Today's BaZi (just the day pillar — using noon of today as a stable anchor).
  const today = new Date(nowMs);
  const todayBazi = computeBazi({
    year: today.getUTCFullYear(),
    month: today.getUTCMonth() + 1,
    day: today.getUTCDate(),
    hour: 12, minute: 0,
    utcOffsetMinutes: 0,
    longitude: profile.birth.longitude,
  });

  // 3. Transits.
  const transits = computeTransits(natalAstro, nowMs);

  // 3b. Weton — today's Javanese/Balinese day cycle.
  const [ly, lm, ld] = localDate.split('-').map(Number);
  const pawukonToday = computePawukonChart({ year: ly!, month: lm!, day: ld! });
  const wetonLabel = `${pawukonToday.weton.hari} ${pawukonToday.weton.pasaran}  ·  neptu ${pawukonToday.weton.neptu}  ·  wuku ${pawukonToday.pawukon.wuku}`;

  // 4. Tarot — 3-card spread, deterministic for the (date, profile) pair.
  const cards = drawCards(3, { reversals: true, rng: tarotMulberry(seed) });
  const spread = cards.map((c, i) => ({
    position: TAROT_POSITIONS[i]!,
    card: c.card.name,
    reversed: c.reversed,
  }));

  // 5. I-Ching — one hexagram, separate seed from tarot.
  const hex = castHexagram(ichingMulberry(hash32(`${localDate}:${profile.name}:iching`)));
  const hexInfo = hex.primary;

  // 6. Summary line.
  const tightestAspect = transits.aspectsToNatal[0];
  const transitLine = tightestAspect
    ? `t.${tightestAspect.transit} ${tightestAspect.kind} n.${tightestAspect.natal} (orb ${tightestAspect.orb.toFixed(2)}°, ${tightestAspect.motion})`
    : 'no transits within tight orb';
  const baziLine = `Day pillar today: ${todayBazi.day.stem}${todayBazi.day.branch}, natal day: ${natalBazi.day.stem}${natalBazi.day.branch}`;
  const tarotLine = spread
    .map((s) => `${s.position}=${s.card}${s.reversed ? ' R' : ''}`)
    .join(' · ');
  const ichingLine = `${hexInfo.number} ${hexInfo.cn} (${hexInfo.en})` +
    (hex.relating ? ` → ${hex.relating.number} ${hex.relating.cn}` : '');
  const summary = [
    `── Semar daily — ${localDate} ──`,
    `Transits: ${transitLine}`,
    baziLine,
    `Weton:    ${wetonLabel}`,
    `Tarot:    ${tarotLine}`,
    `I-Ching:  ${ichingLine}`,
  ].join('\n');

  // 7. Persist.
  const entry: DiaryEntry = {
    id: makeId(),
    createdAt: new Date(nowMs).toISOString(),
    localDate,
    kind: 'today',
    ...(opts.question !== undefined ? { question: opts.question } : {}),
    ...(opts.notes !== undefined ? { notes: opts.notes } : {}),
    payload: {
      bazi: {
        natal: pillarString(natalBazi),
        today: `${todayBazi.day.stem}${todayBazi.day.branch}`,
      },
      transits: {
        moment: new Date(nowMs).toISOString(),
        aspectsToNatal: transits.aspectsToNatal.slice(0, 5).map((a) => ({
          transit: a.transit,
          natal: a.natal,
          kind: a.kind,
          orb: a.orb,
          motion: a.motion,
        })),
      },
      weton: {
        hari: pawukonToday.weton.hari,
        pasaran: pawukonToday.weton.pasaran,
        neptu: pawukonToday.weton.neptu,
        wuku: pawukonToday.pawukon.wuku,
      },
      tarot: spread,
      iching: {
        primary: { number: hexInfo.number, cn: hexInfo.cn, en: hexInfo.en, pinyin: hexInfo.pinyin },
        relating: hex.relating ? {
          number: hex.relating.number, cn: hex.relating.cn,
          en: hex.relating.en, pinyin: hex.relating.pinyin,
        } : null,
      },
    },
  };
  appendEntry(entry);

  return { entry, summary };
}

function pillarString(b: ReturnType<typeof computeBazi>): string {
  return [
    `${b.year.stem}${b.year.branch}`,
    `${b.month.stem}${b.month.branch}`,
    `${b.day.stem}${b.day.branch}`,
    `${b.hour.stem}${b.hour.branch}`,
  ].join(' ');
}

/** A tiny FNV-1a-like hash → 32-bit unsigned integer. Deterministic. */
function hash32(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h;
}

// Re-export for chart command convenience.
export function natalChartSummary(profile: Profile): {
  readonly bazi: string;
  readonly astrology: string;
  readonly zwds: string;
} {
  const bazi = computeBazi({
    year: profile.birth.year, month: profile.birth.month, day: profile.birth.day,
    hour: profile.birth.hour, minute: profile.birth.minute,
    utcOffsetMinutes: profile.birth.utcOffsetMinutes,
    longitude: profile.birth.longitude,
  });
  const astrology = computeChart({
    year: profile.birth.year, month: profile.birth.month, day: profile.birth.day,
    hour: profile.birth.hour, minute: profile.birth.minute,
    utcOffsetMinutes: profile.birth.utcOffsetMinutes,
    latitude: profile.birth.latitude, longitude: profile.birth.longitude,
  });
  const zwds = profile.lunarOverride
    ? computeZWDSChart({
        year: profile.birth.year, month: profile.birth.month, day: profile.birth.day,
        hour: profile.birth.hour, minute: profile.birth.minute,
        utcOffsetMinutes: profile.birth.utcOffsetMinutes,
        gender: profile.birth.gender,
        lunarOverride: profile.lunarOverride,
      })
    : null;
  return {
    bazi: pillarString(bazi),
    astrology: `Asc ${astrology.ascendant.sign} · Sun ${astrology.placements.find((p) => p.planet === 'Sun')!.sign} · Moon ${astrology.placements.find((p) => p.planet === 'Moon')!.sign}`,
    zwds: zwds
      ? `${zwds.bureau.cn} · 命宫 ${zwds.selfPalaceBranch} · 紫微 ${zwds.ziweiBranch}`
      : '(needs lunarOverride for now)',
  };
}
