#!/usr/bin/env -S npx tsx

/**
 * One-shot "complete sample" reader.
 *
 * Loads Lucky's verified profile from packages/cli/src/profile.ts, runs
 * every engine that exists today, and writes a markdown report to
 * /workspace/semar/samples/<localDate>-<name>.md.
 *
 * The output is descriptive only — no prescriptive language, no advice.
 * Codex describes; Codex does not prescribe.
 *
 * Run: pnpm tsx scripts/sample-lucky.ts
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import {
  computeBazi, analyzeChart as analyzeBazi,
  STEMS, BRANCHES, stemElement, branchElement,
  type Stem, type Branch,
} from '@semar/bazi';

const stemEl = (s: string): string => {
  const idx = STEMS.indexOf(s as Stem);
  return idx === -1 ? '?' : stemElement(idx as Parameters<typeof stemElement>[0]);
};
const branchEl = (b: string): string => {
  const idx = BRANCHES.indexOf(b as Branch);
  return idx === -1 ? '?' : branchElement(idx as Parameters<typeof branchElement>[0]);
};
import { computeZWDSChart, renderZWDSMarkdown } from '@semar/zwds';
import {
  computeChart as computeAstrology,
  computeTransits,
  renderChartMarkdown,
  renderTransitsMarkdown,
} from '@semar/astrology';
import { buildChart as buildNumerology } from '@semar/numerology';
import { castHexagram, mulberry32 as ichingRng } from '@semar/iching';
import { drawCards, mulberry32 as tarotRng } from '@semar/tarot';
import {
  computePawukonChart,
  renderPawukonMarkdown,
  renderSasihMarkdown,
  renderWetonMarkdown,
} from '@semar/pawukon';
import { LUCKY_PROFILE } from '../src/profile.js';

// ---------- helpers ----------

function hash32(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h;
}

function pad2(n: number): string { return String(n).padStart(2, '0'); }

function localDateString(utcMs: number, offsetMinutes: number): string {
  const local = new Date(utcMs + offsetMinutes * 60_000);
  return `${local.getUTCFullYear()}-${pad2(local.getUTCMonth() + 1)}-${pad2(local.getUTCDate())}`;
}

// ---------- main ----------

function main(): void {
  const profile = LUCKY_PROFILE;
  const nowMs = Date.now();
  const localDate = localDateString(nowMs, profile.birth.utcOffsetMinutes);

  // ----- BaZi (natal + today) -----
  const natalBazi = computeBazi({
    year: profile.birth.year, month: profile.birth.month, day: profile.birth.day,
    hour: profile.birth.hour, minute: profile.birth.minute,
    utcOffsetMinutes: profile.birth.utcOffsetMinutes,
    longitude: profile.birth.longitude,
  });
  const baziAnalysis = analyzeBazi(natalBazi);

  const today = new Date(nowMs);
  const todayBazi = computeBazi({
    year: today.getUTCFullYear(),
    month: today.getUTCMonth() + 1,
    day: today.getUTCDate(),
    hour: 12, minute: 0,
    utcOffsetMinutes: 0,
    longitude: profile.birth.longitude,
  });

  // ----- ZWDS (using lunarOverride to avoid known lunar.ts bugs) -----
  const zwds = profile.lunarOverride
    ? computeZWDSChart({
        year: profile.birth.year, month: profile.birth.month, day: profile.birth.day,
        hour: profile.birth.hour, minute: profile.birth.minute,
        utcOffsetMinutes: profile.birth.utcOffsetMinutes,
        gender: profile.birth.gender,
        lunarOverride: profile.lunarOverride,
      })
    : null;

  // ----- Western Astrology (natal) -----
  const astro = computeAstrology({
    year: profile.birth.year, month: profile.birth.month, day: profile.birth.day,
    hour: profile.birth.hour, minute: profile.birth.minute,
    utcOffsetMinutes: profile.birth.utcOffsetMinutes,
    latitude: profile.birth.latitude, longitude: profile.birth.longitude,
  });

  // ----- Transits today -----
  const transits = computeTransits(astro, nowMs);

  // ----- Numerology -----
  const num = buildNumerology(profile.name, {
    year: profile.birth.year, month: profile.birth.month, day: profile.birth.day,
  });

  // ----- I-Ching (deterministic seed) -----
  const ichingSeed = hash32(`${localDate}:${profile.name}:iching`);
  const hex = castHexagram(ichingRng(ichingSeed));

  // ----- Tarot 3-card spread (deterministic seed) -----
  const tarotSeed = hash32(`${localDate}:${profile.name}:tarot`);
  const spread = drawCards(3, { reversals: true, rng: tarotRng(tarotSeed) });
  const tarotPositions = ['past', 'present', 'future'] as const;

  // ----- Pawukon (Javanese weton + Balinese wuku/wewaran) -----
  const pawukonNatal = computePawukonChart({
    year: profile.birth.year,
    month: profile.birth.month,
    day: profile.birth.day,
  });
  const todayLocal = new Date(nowMs + profile.birth.utcOffsetMinutes * 60_000);
  const pawukonToday = computePawukonChart({
    year: todayLocal.getUTCFullYear(),
    month: todayLocal.getUTCMonth() + 1,
    day: todayLocal.getUTCDate(),
  });

  // ----- Write markdown -----
  const lines: string[] = [];
  const push = (s = '') => lines.push(s);

  push(`# Sample Reading — ${profile.name}`);
  push();
  push(`> *Codex tidak memberi jawaban. Codex memberi mata.*`);
  push();
  push(`**Generated:** ${new Date(nowMs).toISOString()} (local date ${localDate})`);
  push();
  push(`## Profile`);
  push();
  push(`| Field | Value |`);
  push(`|---|---|`);
  push(`| Name | ${profile.name} |`);
  push(`| Birth (Gregorian) | ${profile.birth.year}-${pad2(profile.birth.month)}-${pad2(profile.birth.day)} ${pad2(profile.birth.hour)}:${pad2(profile.birth.minute)} (UTC+${profile.birth.utcOffsetMinutes / 60}) |`);
  push(`| Birth (lunar) | ${profile.lunarOverride ? `${profile.lunarOverride.year}-${pad2(profile.lunarOverride.month)}-${pad2(profile.lunarOverride.day)}${profile.lunarOverride.isLeapMonth ? ' (leap)' : ''}` : '—'} |`);
  push(`| Coordinates | ${profile.birth.latitude.toFixed(2)}°N, ${profile.birth.longitude.toFixed(2)}°E (Bandung) |`);
  push(`| Gender | ${profile.birth.gender} |`);
  push();

  // BaZi
  push(`## 八字 BaZi — Four Pillars of Destiny`);
  push();
  push(`Natal: **${natalBazi.year.name} · ${natalBazi.month.name} · ${natalBazi.day.name} · ${natalBazi.hour.name}**`);
  push();
  push(`| Pillar | Stem | Element | Branch | Element | Ten God (stem) | Nayin |`);
  push(`|---|---|---|---|---|---|---|`);
  for (const slot of ['year', 'month', 'day', 'hour'] as const) {
    const p = baziAnalysis.pillars[slot];
    push(`| ${slot} | ${p.stem} | ${stemEl(p.stem)} | ${p.branch} | ${branchEl(p.branch)} | ${p.stemTenGod ?? '(day master)'} | ${p.nayin.cn} (${p.nayin.en}) |`);
  }
  push();

  push(`**Day Master:** ${natalBazi.day.stem} (${stemEl(natalBazi.day.stem)}) — strength: **${baziAnalysis.dayMasterStrength.verdict}** (supporting ${baziAnalysis.dayMasterStrength.supporting.toFixed(1)}, draining ${baziAnalysis.dayMasterStrength.draining.toFixed(1)})`);
  push();

  push(`**Element distribution (across stems + hidden):**`);
  push();
  push(`| Element | Count |`);
  push(`|---|---|`);
  for (const [el, count] of Object.entries(baziAnalysis.elements)) {
    push(`| ${el} | ${count} |`);
  }
  push();

  if (baziAnalysis.branchInteractions.length > 0) {
    push(`**Branch interactions:**`);
    push();
    for (const bi of baziAnalysis.branchInteractions) {
      push(`- ${bi.kind}: ${bi.branches.join(' / ')} (${bi.slots.join(' + ')})`);
    }
    push();
  }
  if (baziAnalysis.stemInteractions.length > 0) {
    push(`**Stem interactions:**`);
    push();
    for (const si of baziAnalysis.stemInteractions) {
      push(`- ${si.kind}: ${si.stems.join(' / ')} (${si.slots.join(' + ')})`);
    }
    push();
  }
  if (baziAnalysis.shenSha.length > 0) {
    push(`**Shen Sha (symbolic stars):**`);
    push();
    for (const star of baziAnalysis.shenSha) {
      push(`- **${star.cn}** (${star.en}) — ${star.slot} pillar, branch ${star.branch}, category: ${star.category}${star.note ? ` — ${star.note}` : ''}`);
    }
    push();
  }

  push(`### Today's BaZi day pillar`);
  push();
  push(`- Today (${localDate}): **${todayBazi.day.stem}${todayBazi.day.branch}** — ${stemEl(todayBazi.day.stem)} stem, ${branchEl(todayBazi.day.branch)} branch.`);
  push(`- Natal day: **${natalBazi.day.stem}${natalBazi.day.branch}**.`);
  push();

  // ZWDS
  push(`## 紫微斗数 ZWDS — Purple Star Astrology`);
  push();
  if (zwds) {
    push(`- **Bureau (五行局):** ${zwds.bureau.cn} (${zwds.bureau.element}, ${zwds.bureau.number}局)`);
    push(`- **Self palace (命宫):** ${zwds.selfPalaceBranch}`);
    push(`- **Body palace (身宫):** ${zwds.bodyPalaceBranch}`);
    push(`- **紫微 Ziwei:** ${zwds.ziweiBranch} · **天府 Tianfu:** ${zwds.tianfuBranch}`);
    push();
    push(`### 12-Palace chart`);
    push();
    push(renderZWDSMarkdown(zwds));
    push();
  } else {
    push(`*(ZWDS unavailable — lunar override missing on profile)*`);
    push();
  }

  // Western Astrology natal
  push(`## ♈ Western Astrology — Natal Chart`);
  push();
  push(`- **Ascendant:** ${astro.ascendant.sign} ${astro.ascendant.degreeInSign.toFixed(2)}°`);
  push(`- **Midheaven:** ${astro.midheaven.sign} ${astro.midheaven.degreeInSign.toFixed(2)}°`);
  push(`- **House system:** ${astro.houseSystem}`);
  push();
  push(renderChartMarkdown(astro));
  push();

  // Transits
  push(`## ☄ Transits today (${new Date(nowMs).toISOString().slice(0, 10)})`);
  push();
  push(renderTransitsMarkdown(transits));
  push();

  // Numerology
  push(`## 🔢 Numerology (Pythagorean)`);
  push();
  push(`| Number | Value | Master? |`);
  push(`|---|---|---|`);
  const masterMark = (n: number) => ([11, 22, 33].includes(n) ? '✓' : '');
  push(`| Life Path | ${num.lifePath} | ${masterMark(num.lifePath as number)} |`);
  push(`| Birthday | ${num.birthday} | ${masterMark(num.birthday as number)} |`);
  push(`| Expression | ${num.expression} | ${masterMark(num.expression as number)} |`);
  push(`| Soul Urge | ${num.soulUrge === 0 ? '—' : num.soulUrge} | ${num.soulUrge !== 0 ? masterMark(num.soulUrge as number) : ''} |`);
  push(`| Personality | ${num.personality} | ${masterMark(num.personality as number)} |`);
  push();

  // I-Ching
  push(`## ䷀ I-Ching — Daily Hexagram`);
  push();
  push(`*(Deterministic cast seeded with date+name, so this re-runs identically today.)*`);
  push();
  push(`**Primary:** ${hex.primary.number}. ${hex.primary.cn} (${hex.primary.pinyin}) — *${hex.primary.en}*`);
  if (hex.relating) {
    push(`**Relating:** ${hex.relating.number}. ${hex.relating.cn} (${hex.relating.pinyin}) — *${hex.relating.en}*`);
  }
  if (hex.changingPositions.length > 0) {
    push(`**Changing lines:** ${hex.changingPositions.map((n) => `line ${n + 1}`).join(', ')}`);
  } else {
    push(`**No changing lines** — primary stands.`);
  }
  push();

  // Tarot
  push(`## 🃏 Tarot — Three-card Spread`);
  push();
  push(`*(Deterministic spread seeded with date+name.)*`);
  push();
  push(`| Position | Card | Orientation |`);
  push(`|---|---|---|`);
  for (let i = 0; i < spread.length; i++) {
    const c = spread[i]!;
    push(`| ${tarotPositions[i]} | ${c.card.name} | ${c.reversed ? 'reversed' : 'upright'} |`);
  }
  push();

  // Pawukon — Javanese weton (natal) + Balinese wuku/wewaran (natal + today)
  push(`## 🪔 Pawukon — Javanese & Balinese Calendars`);
  push();
  push(`### Natal weton`);
  push();
  push(renderWetonMarkdown(pawukonNatal));
  push();
  push(`### Natal Pawukon (Bali)`);
  push();
  push(renderPawukonMarkdown(pawukonNatal));
  push();
  push(`### Today's wuku (${localDate})`);
  push();
  push(`- Weton: **${pawukonToday.weton.idLabel}** (neptu ${pawukonToday.weton.neptu})`);
  push(`- Wuku: **${pawukonToday.pawukon.wuku}** (#${pawukonToday.pawukon.wukuIndex + 1}), pawukon day ${pawukonToday.pawukon.day}/210`);
  push(`- Wewaran today: Triwara ${pawukonToday.wewaran.triwara} · Sadwara ${pawukonToday.wewaran.sadwara} · Astawara ${pawukonToday.wewaran.astawara} · Dasawara ${pawukonToday.wewaran.dasawara}`);
  push();

  // Sasih natal + today (Balinese lunar / Saka year)
  push(`### Natal Sasih (Balinese lunar)`);
  push();
  push(renderSasihMarkdown(pawukonNatal));
  push();
  push(`### Today's Sasih`);
  push();
  push(renderSasihMarkdown(pawukonToday));
  push();

  // Footer
  push(`---`);
  push();
  push(`*Engines voted: BaZi · ZWDS${zwds ? '' : ' (skipped)'} · Western Astrology · Transits · Numerology · I-Ching · Tarot · Pawukon.*`);
  push(`*Source seeds: iching ${ichingSeed.toString(16)} · tarot ${tarotSeed.toString(16)}.*`);
  push();

  // Write file
  const outPath = resolve(`/workspace/semar/samples/${localDate}-lucky.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, lines.join('\n'), 'utf8');
  console.log(`Wrote ${outPath}`);
  console.log(`(${lines.length} lines, ${lines.join('\n').length} chars)`);
}

main();
