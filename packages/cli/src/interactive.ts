/**
 * Two-step interactive daily ritual for "semar today".
 *
 * Step 1 (always):  BaZi day pillar  ·  top transit  ·  weton
 * Step 2 (prompt):  [T]arot  [I]ching  [B]oth  [Enter] skip
 */

import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { computeBazi } from '@semar/bazi';
import { computeChart, computeTransits } from '@semar/astrology';
import { computePawukonChart } from '@semar/pawukon';
import { drawCards, mulberry32 as tarotRng } from '@semar/tarot';
import { castHexagram, mulberry32 as ichingRng } from '@semar/iching';
import type { Profile } from './profile.js';
import { appendEntry, localDateString, makeId } from './diary-log.js';

export interface InteractiveOptions {
  readonly question?: string;
  readonly nowMs?: number;
}

const POSITIONS = ['past', 'present', 'future'] as const;

export async function runDailyInteractive(profile: Profile, opts: InteractiveOptions = {}): Promise<void> {
  const nowMs = opts.nowMs ?? Date.now();
  const localDate = localDateString(nowMs, profile.birth.utcOffsetMinutes);

  // ── Core engines ──────────────────────────────────────────────────────────

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

  const todayUtc = new Date(nowMs);
  const todayBazi = computeBazi({
    year: todayUtc.getUTCFullYear(), month: todayUtc.getUTCMonth() + 1, day: todayUtc.getUTCDate(),
    hour: 12, minute: 0, utcOffsetMinutes: 0,
    longitude: profile.birth.longitude,
  });

  const transits = computeTransits(natalAstro, nowMs);

  const [ly, lm, ld] = localDate.split('-').map(Number);
  const pChart = computePawukonChart({ year: ly!, month: lm!, day: ld! });

  // ── Step 1 print ──────────────────────────────────────────────────────────

  const tight = transits.aspectsToNatal[0];
  const transitStr = tight
    ? `t.${tight.transit} ${tight.kind} n.${tight.natal}  (${tight.orb.toFixed(2)}°, ${tight.motion})`
    : 'none within tight orb';

  console.log(`\n── Semar  ${localDate}${opts.question ? `  "${opts.question}"` : ''} ──\n`);
  console.log(`BaZi     ${todayBazi.day.stem}${todayBazi.day.branch}  ·  natal ${pillarStr(natalBazi)}`);
  console.log(`Transit  ${transitStr}`);
  console.log(`Weton    ${pChart.weton.hari} ${pChart.weton.pasaran}  ·  neptu ${pChart.weton.neptu}  ·  wuku ${pChart.pawukon.wuku}\n`);

  // ── Step 2 prompt ─────────────────────────────────────────────────────────

  const rl = createInterface({ input: stdin, output: stdout });
  let raw: string;
  try {
    raw = await rl.question('Lanjut?  [T]arot  [I]ching  [B]oth  [Enter] skip: ');
  } finally {
    rl.close();
  }
  const ans = raw.trim().toLowerCase();
  const doTarot = ans === 't' || ans === 'b';
  const doIching = ans === 'i' || ans === 'b';

  // ── Optional engines ──────────────────────────────────────────────────────

  const tarotSeed = hash32(`${localDate}:${profile.name}:tarot`);
  const ichingSeed = hash32(`${localDate}:${profile.name}:iching`);

  const spread = doTarot
    ? drawCards(3, { reversals: true, rng: tarotRng(tarotSeed) }).map((c, i) => ({
        position: POSITIONS[i]!,
        card: c.card.name,
        reversed: c.reversed,
      }))
    : null;

  const hex = doIching ? castHexagram(ichingRng(ichingSeed)) : null;

  // ── Print optional results ────────────────────────────────────────────────

  if (spread) {
    console.log(`\nTarot    ${spread.map((s) => `${s.position}=${s.card}${s.reversed ? 'R' : ''}`).join(' · ')}`);
  }
  if (hex) {
    const h = hex.primary;
    const rel = hex.relating ? `  → ${hex.relating.number} ${hex.relating.cn}` : '';
    console.log(`${spread ? '' : '\n'}I-Ching  ${h.number} ${h.cn}  ${h.en}${rel}`);
  }

  // ── Step 3: optional note ─────────────────────────────────────────────────

  const rl2 = createInterface({ input: stdin, output: stdout });
  let noteRaw: string;
  try {
    noteRaw = await rl2.question('\nCatatan? (Enter untuk skip): ');
  } finally {
    rl2.close();
  }
  const notes = noteRaw.trim() || undefined;
  if (notes) console.log('(Catatan tersimpan)');

  // ── Persist ───────────────────────────────────────────────────────────────

  const entry = {
    id: makeId(),
    createdAt: new Date(nowMs).toISOString(),
    localDate,
    kind: 'today',
    ...(opts.question !== undefined ? { question: opts.question } : {}),
    ...(notes !== undefined ? { notes } : {}),
    payload: {
      bazi: {
        natal: pillarStr(natalBazi),
        today: `${todayBazi.day.stem}${todayBazi.day.branch}`,
      },
      transits: {
        moment: new Date(nowMs).toISOString(),
        aspectsToNatal: transits.aspectsToNatal.slice(0, 5).map((a) => ({
          transit: a.transit, natal: a.natal, kind: a.kind, orb: a.orb, motion: a.motion,
        })),
      },
      weton: {
        hari: pChart.weton.hari,
        pasaran: pChart.weton.pasaran,
        neptu: pChart.weton.neptu,
        wuku: pChart.pawukon.wuku,
      },
      ...(spread ? { tarot: spread } : {}),
      ...(hex ? {
        iching: {
          primary: { number: hex.primary.number, cn: hex.primary.cn, en: hex.primary.en, pinyin: hex.primary.pinyin },
          relating: hex.relating
            ? { number: hex.relating.number, cn: hex.relating.cn, en: hex.relating.en, pinyin: hex.relating.pinyin }
            : null,
        },
      } : {}),
    },
  };

  appendEntry(entry);
  console.log(`\n(Logged — ${localDate})\n`);
}

function pillarStr(b: ReturnType<typeof computeBazi>): string {
  return `${b.year.stem}${b.year.branch} ${b.month.stem}${b.month.branch} ${b.day.stem}${b.day.branch} ${b.hour.stem}${b.hour.branch}`;
}

function hash32(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h;
}
