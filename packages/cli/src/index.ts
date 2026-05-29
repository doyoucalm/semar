#!/usr/bin/env -S npx tsx

/**
 * Semar CLI dispatcher.
 *
 * Usage:
 *   semar profile init                   create default profile
 *   semar profile show                   print saved profile
 *   semar chart                          natal: BaZi + ZWDS + Astrology
 *   semar today [question...]            daily ritual (interactive 2-step)
 *   semar log [n|full]                   last n entries (default 10)
 *   semar log --from YYYY-MM-DD [--to YYYY-MM-DD]
 *   semar stats                          frequency stats + streak
 *   semar cal [YYYY-MM]                  calendar view of reading days
 *   semar note "text"                    add a standalone note for today
 */

import {
  loadProfile, saveProfile, LUCKY_PROFILE, profilePath, diaryPath,
} from './profile.js';
import { natalChartSummary } from './daily.js';
import { runDailyInteractive } from './interactive.js';
import { readEntries, appendEntry, makeId, localDateString, type DiaryEntry } from './diary-log.js';
import { computeStats, renderStats } from './stats.js';
import { renderCalendar, parseYearMonth } from './calendar.js';

function usage(): never {
  console.log(`Semar CLI

  semar profile init                     create default profile at ${profilePath()}
  semar profile show                     print saved profile
  semar chart                            natal: BaZi + ZWDS + Astrology summary

  semar today [question...]              daily ritual (2-step interactive)
  semar note "catatan..."                add a standalone note for today

  semar log [n|full]                     last n entries (default 10)
  semar log --from YYYY-MM-DD            entries from date
  semar log --from YYYY-MM-DD --to ...   entries in date range

  semar stats                            frequency stats, streak, top cards
  semar cal [YYYY-MM]                    calendar view of reading days

  State: ${diaryPath()} (append-only JSONL).
`);
  process.exit(0);
}

async function main(): Promise<void> {
  const [cmd, ...rest] = process.argv.slice(2);
  if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h') usage();

  // ── profile ────────────────────────────────────────────────────────────────
  if (cmd === 'profile') {
    const sub = rest[0];
    if (sub === 'init') {
      saveProfile(LUCKY_PROFILE);
      console.log(`Wrote default profile to ${profilePath()}`);
      console.log(`Name: ${LUCKY_PROFILE.name}`);
      console.log(`Birth: ${LUCKY_PROFILE.birth.year}-${pad2(LUCKY_PROFILE.birth.month)}-${pad2(LUCKY_PROFILE.birth.day)} ${pad2(LUCKY_PROFILE.birth.hour)}:${pad2(LUCKY_PROFILE.birth.minute)} UTC+${LUCKY_PROFILE.birth.utcOffsetMinutes / 60}`);
      return;
    }
    if (sub === 'show' || !sub) {
      try {
        const p = loadProfile();
        console.log(JSON.stringify(p, null, 2));
      } catch {
        console.error(`No profile saved. Run 'semar profile init' first.`);
        process.exit(1);
      }
      return;
    }
    console.error(`Unknown profile sub-command: ${sub}`);
    process.exit(1);
  }

  // ── chart ──────────────────────────────────────────────────────────────────
  if (cmd === 'chart') {
    const p = loadProfile();
    const s = natalChartSummary(p);
    console.log(`── Natal chart — ${p.name} ──`);
    console.log(`BaZi:       ${s.bazi}`);
    console.log(`Astrology:  ${s.astrology}`);
    console.log(`ZWDS:       ${s.zwds}`);
    return;
  }

  // ── today ──────────────────────────────────────────────────────────────────
  if (cmd === 'today') {
    const p = loadProfile();
    const question = rest.join(' ').trim() || undefined;
    await runDailyInteractive(p, question ? { question } : {});
    return;
  }

  // ── note ───────────────────────────────────────────────────────────────────
  if (cmd === 'note') {
    const p = loadProfile();
    const text = rest.join(' ').trim();
    if (!text) {
      console.error('Usage: semar note "teks catatan kamu"');
      process.exit(1);
    }
    const nowMs = Date.now();
    const localDate = localDateString(nowMs, p.birth.utcOffsetMinutes);
    const entry: DiaryEntry = {
      id: makeId(),
      createdAt: new Date(nowMs).toISOString(),
      localDate,
      kind: 'note',
      notes: text,
      payload: {},
    };
    appendEntry(entry);
    console.log(`(Catatan disimpan — ${localDate})`);
    return;
  }

  // ── log ────────────────────────────────────────────────────────────────────
  if (cmd === 'log') {
    const entries = readEntries();
    if (entries.length === 0) {
      console.log('Diary kosong. Mulai dengan "semar today".');
      return;
    }

    // Parse flags: --from YYYY-MM-DD --to YYYY-MM-DD
    const fromIdx = rest.indexOf('--from');
    const toIdx   = rest.indexOf('--to');
    const from    = fromIdx !== -1 ? rest[fromIdx + 1] : undefined;
    const to      = toIdx   !== -1 ? rest[toIdx   + 1] : undefined;

    let slice: DiaryEntry[];

    if (from || to) {
      slice = entries.filter((e) => {
        if (from && e.localDate < from) return false;
        if (to   && e.localDate > to)   return false;
        return true;
      });
    } else {
      const arg = rest.find((r) => !r.startsWith('--'));
      slice = arg === 'full'
        ? entries
        : entries.slice(-(parseInt(arg ?? '10', 10) || 10));
    }

    if (slice.length === 0) {
      console.log('Tidak ada entry dalam rentang tersebut.');
      return;
    }

    for (const e of slice) {
      if (e.kind === 'note') {
        console.log(`${e.localDate}  📝  "${e.notes ?? ''}"`);
        continue;
      }

      const weton = e.payload['weton'] as { hari?: string; pasaran?: string } | undefined;
      const wetonStr = weton?.hari ? `  ${weton.hari} ${weton.pasaran}` : '';

      const bazi = e.payload['bazi'] as { today?: string } | undefined;
      const baziStr = bazi?.today ? `  ${bazi.today}` : '';

      const tarot = e.payload['tarot'] as Array<{ position: string; card: string; reversed: boolean }> | undefined;
      const tarotStr = tarot
        ? `  ${tarot.map((t) => `${t.position}=${t.card}${t.reversed ? 'R' : ''}`).join(' · ')}`
        : '';

      const iching = e.payload['iching'] as { primary: { number: number; cn: string } } | undefined;
      const ichingStr = iching ? `  [${iching.primary.number} ${iching.primary.cn}]` : '';

      const qStr = e.question ? `  "${e.question}"` : '';
      const noteStr = e.notes ? `\n  📝 "${e.notes}"` : '';

      console.log(`${e.localDate}${baziStr}${wetonStr}${qStr}${tarotStr}${ichingStr}${noteStr}`);
    }
    return;
  }

  // ── stats ──────────────────────────────────────────────────────────────────
  if (cmd === 'stats') {
    const entries = readEntries();
    const p = loadProfile();
    const todayLocal = localDateString(Date.now(), p.birth.utcOffsetMinutes);
    const stats = computeStats(entries, todayLocal);
    console.log(renderStats(stats));
    return;
  }

  // ── cal ────────────────────────────────────────────────────────────────────
  if (cmd === 'cal') {
    const entries = readEntries();
    const p = loadProfile();
    const { year, month } = parseYearMonth(rest[0]);
    const entryDates = new Set(
      entries
        .filter((e) => e.kind === 'today')
        .map((e) => e.localDate),
    );
    const todayLocal = localDateString(Date.now(), p.birth.utcOffsetMinutes);
    console.log(renderCalendar(year, month, entryDates, todayLocal));
    return;
  }

  console.error(`Unknown command: ${cmd}`);
  usage();
}

function pad2(n: number): string { return String(n).padStart(2, '0'); }

main().catch((err) => { console.error(err); process.exit(1); });
