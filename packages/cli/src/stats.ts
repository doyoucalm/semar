/**
 * Stats computation + rendering for "semar stats".
 *
 * Works entirely from the JSONL diary — no network, no extra state.
 */

import type { DiaryEntry } from './diary-log.js';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CardCount {
  card: string;
  count: number;
  reversedCount: number;
}

export interface HexCount {
  number: number;
  cn: string;
  en: string;
  pinyin: string;
  count: number;
}

export interface SemarStats {
  totalEntries: number;
  dateRange: { first: string; last: string } | null;
  streak: { current: number; longest: number };
  engines: {
    tarotOnly: number;
    ichingOnly: number;
    both: number;
    coreOnly: number;
  };
  tarot: {
    sessions: number;
    topCards: CardCount[];
    byPosition: {
      past: CardCount[];
      present: CardCount[];
      future: CardCount[];
    };
  };
  iching: {
    sessions: number;
    topHexagrams: HexCount[];
  };
  weton: Array<{ label: string; count: number }>;
}

// ── Compute ───────────────────────────────────────────────────────────────────

/**
 * @param entries   All diary entries (from readEntries()).
 * @param todayLocal Today's date as YYYY-MM-DD in the profile's local time.
 *                   Defaults to current UTC date (close enough for streak).
 */
export function computeStats(entries: DiaryEntry[], todayLocal?: string): SemarStats {
  const today = todayLocal ?? new Date(Date.now()).toISOString().slice(0, 10);
  // Derive yesterday FROM today so a caller-supplied todayLocal stays internally
  // consistent (otherwise streak compares against the real wall-clock yesterday).
  const yesterday = new Date(new Date(`${today}T00:00:00Z`).getTime() - 86_400_000)
    .toISOString()
    .slice(0, 10);

  const daily = entries.filter((e) => e.kind === 'today');
  if (daily.length === 0) return emptyStats(entries.length);

  const uniqueDates = [...new Set(daily.map((e) => e.localDate))].sort();
  const dateRange = { first: uniqueDates.at(0)!, last: uniqueDates.at(-1)! };
  const streak = computeStreak(uniqueDates, today, yesterday);

  let tarotOnly = 0, ichingOnly = 0, both = 0, coreOnly = 0;

  const cardMap = new Map<string, { count: number; reversedCount: number }>();
  const posMap: Record<string, Map<string, number>> = {
    past: new Map(), present: new Map(), future: new Map(),
  };
  const hexMap = new Map<number, HexCount>();
  const wetonMap = new Map<string, number>();

  for (const e of daily) {
    const hasTarot = Array.isArray(e.payload['tarot']);
    const hasIching = e.payload['iching'] != null;

    if (hasTarot && hasIching)     both++;
    else if (hasTarot)             tarotOnly++;
    else if (hasIching)            ichingOnly++;
    else                           coreOnly++;

    if (hasTarot) {
      const spread = e.payload['tarot'] as Array<{ position: string; card: string; reversed: boolean }>;
      for (const draw of spread) {
        const rec = cardMap.get(draw.card) ?? { count: 0, reversedCount: 0 };
        rec.count++;
        if (draw.reversed) rec.reversedCount++;
        cardMap.set(draw.card, rec);
        const pm = posMap[draw.position];
        if (pm) pm.set(draw.card, (pm.get(draw.card) ?? 0) + 1);
      }
    }

    if (hasIching) {
      const ic = e.payload['iching'] as {
        primary: { number: number; cn: string; en: string; pinyin: string };
      };
      const p = ic.primary;
      const rec = hexMap.get(p.number) ?? { number: p.number, cn: p.cn, en: p.en, pinyin: p.pinyin, count: 0 };
      rec.count++;
      hexMap.set(p.number, rec);
    }

    const wt = e.payload['weton'] as { hari?: string; pasaran?: string } | undefined;
    if (wt?.hari && wt.pasaran) {
      const label = `${wt.hari} ${wt.pasaran}`;
      wetonMap.set(label, (wetonMap.get(label) ?? 0) + 1);
    }
  }

  const topN = <T extends { count: number }>(arr: T[], n: number): T[] =>
    [...arr].sort((a, b) => b.count - a.count).slice(0, n);

  const posTop = (pos: string): CardCount[] =>
    topN(
      [...(posMap[pos]?.entries() ?? [])].map(([card, count]) => ({ card, count, reversedCount: 0 })),
      3,
    );

  return {
    totalEntries: entries.length,
    dateRange,
    streak,
    engines: { tarotOnly, ichingOnly, both, coreOnly },
    tarot: {
      sessions: tarotOnly + both,
      topCards: topN(
        [...cardMap.entries()].map(([card, v]) => ({ card, ...v })),
        5,
      ),
      byPosition: { past: posTop('past'), present: posTop('present'), future: posTop('future') },
    },
    iching: {
      sessions: ichingOnly + both,
      topHexagrams: topN([...hexMap.values()], 5),
    },
    weton: topN(
      [...wetonMap.entries()].map(([label, count]) => ({ label, count })),
      5,
    ),
  };
}

function computeStreak(
  sortedDates: string[],
  today: string,
  yesterday: string,
): { current: number; longest: number } {
  if (sortedDates.length === 0) return { current: 0, longest: 0 };

  let longest = 1;
  let run = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const d0 = new Date(sortedDates[i - 1]!).getTime();
    const d1 = new Date(sortedDates[i]!).getTime();
    if (Math.round((d1 - d0) / 86_400_000) === 1) {
      run++;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }

  const last = sortedDates.at(-1)!;
  const current = (last === today || last === yesterday) ? run : 0;
  return { current, longest };
}

function emptyStats(totalEntries: number): SemarStats {
  return {
    totalEntries,
    dateRange: null,
    streak: { current: 0, longest: 0 },
    engines: { tarotOnly: 0, ichingOnly: 0, both: 0, coreOnly: 0 },
    tarot: { sessions: 0, topCards: [], byPosition: { past: [], present: [], future: [] } },
    iching: { sessions: 0, topHexagrams: [] },
    weton: [],
  };
}

// ── Render ────────────────────────────────────────────────────────────────────

export function renderStats(stats: SemarStats): string {
  const out: string[] = [];
  out.push('── Semar Stats ─────────────────────────────────');

  if (!stats.dateRange) {
    out.push('Diary kosong. Mulai dengan "semar today".');
    out.push('────────────────────────────────────────────────');
    return out.join('\n');
  }

  out.push(`Entries    ${stats.totalEntries}   (${stats.dateRange.first} → ${stats.dateRange.last})`);

  const bar = '█'.repeat(Math.min(stats.streak.current, 30));
  const streakLabel = stats.streak.current > 0
    ? `${stats.streak.current} hari ${bar}`
    : '0 hari (belum ada entry hari ini / kemarin)';
  out.push(`Streak     ${streakLabel}  (terpanjang: ${stats.streak.longest})`);

  // Engine breakdown
  const { tarotOnly, ichingOnly, both, coreOnly } = stats.engines;
  const total = tarotOnly + ichingOnly + both + coreOnly;
  if (total > 0) {
    out.push('');
    out.push('Engine per sesi:');
    const row = (label: string, n: number) => {
      if (n === 0) return;
      const pct = Math.round((n / total) * 100);
      const minibar = '▪'.repeat(Math.round(pct / 5));
      out.push(`  ${label.padEnd(22)} ${String(n).padStart(3)}x  ${minibar} ${pct}%`);
    };
    row('Tarot + I-Ching', both);
    row('Tarot only', tarotOnly);
    row('I-Ching only', ichingOnly);
    row('Core only (skip)', coreOnly);
  }

  // Tarot
  if (stats.tarot.sessions > 0) {
    out.push('');
    out.push(`Tarot  (${stats.tarot.sessions} sesi)`);
    if (stats.tarot.topCards.length > 0) {
      out.push('  Top kartu:');
      for (const c of stats.tarot.topCards) {
        const rev = c.reversedCount > 0 ? `  [${c.reversedCount}× reversed]` : '';
        out.push(`    ${c.card.padEnd(28)} ${c.count}×${rev}`);
      }
    }
    out.push('  Per posisi:');
    for (const pos of ['past', 'present', 'future'] as const) {
      const top = stats.tarot.byPosition[pos];
      if (top.length > 0) {
        const line = top.map((c) => `${c.card} (${c.count}×)`).join(' · ');
        out.push(`    ${pos.padEnd(8)} ${line}`);
      }
    }
  }

  // I-Ching
  if (stats.iching.sessions > 0) {
    out.push('');
    out.push(`I-Ching  (${stats.iching.sessions} sesi)`);
    if (stats.iching.topHexagrams.length > 0) {
      out.push('  Top hexagram:');
      for (const h of stats.iching.topHexagrams) {
        out.push(`    ${String(h.number).padStart(2)} ${h.cn}  ${h.en.padEnd(26)} ${h.count}×`);
      }
    }
  }

  // Weton
  if (stats.weton.length > 0) {
    out.push('');
    out.push('Weton hari reading:');
    for (const w of stats.weton) {
      out.push(`  ${w.label.padEnd(20)} ${w.count}×`);
    }
  }

  out.push('────────────────────────────────────────────────');
  return out.join('\n');
}
