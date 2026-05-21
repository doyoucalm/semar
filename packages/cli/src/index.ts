#!/usr/bin/env -S npx tsx

/**
 * Semar CLI dispatcher.
 *
 * Usage:
 *   semar profile init                   create default Lucky profile at ~/.semar/profile.json
 *   semar profile show                   print the saved profile
 *   semar chart                          natal: BaZi + ZWDS + Astrology summary
 *   semar today [question...]            daily ritual: 3-card tarot + transits + BaZi day + I-Ching
 *   semar log [n]                        last n diary entries (default 10)
 *   semar log full                       all diary entries
 *
 * State location: $SEMAR_HOME or ~/.semar/.
 *   - profile.json   (gitignored where applicable)
 *   - diary.jsonl    (append-only)
 */

import {
  loadProfile, saveProfile, LUCKY_PROFILE, profilePath, diaryPath,
} from './profile.js';
import { runDaily, natalChartSummary } from './daily.js';
import { readEntries } from './diary-log.js';

function usage(): never {
  console.log(`Semar CLI

  semar profile init                   create default profile at ${profilePath()}
  semar profile show                   print the saved profile
  semar chart                          natal: BaZi + ZWDS + Astrology summary
  semar today [question...]            daily ritual: 3-card tarot + transits + BaZi day + I-Ching
  semar log [n|full]                   last n diary entries (default 10)

  State: ${diaryPath()} (append-only JSONL).
`);
  process.exit(0);
}

function main(): void {
  const [cmd, ...rest] = process.argv.slice(2);
  if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h') usage();

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
      } catch (err) {
        console.error(`No profile saved. Run 'semar profile init' first.`);
        process.exit(1);
      }
      return;
    }
    console.error(`Unknown profile sub-command: ${sub}`);
    process.exit(1);
  }

  if (cmd === 'chart') {
    const p = loadProfile();
    const s = natalChartSummary(p);
    console.log(`── Natal chart — ${p.name} ──`);
    console.log(`BaZi:       ${s.bazi}`);
    console.log(`Astrology:  ${s.astrology}`);
    console.log(`ZWDS:       ${s.zwds}`);
    return;
  }

  if (cmd === 'today') {
    const p = loadProfile();
    const question = rest.join(' ').trim() || undefined;
    const { summary } = runDaily(p, question ? { question } : {});
    console.log(summary);
    if (question) console.log(`\n(Logged with question: "${question}")`);
    return;
  }

  if (cmd === 'log') {
    const entries = readEntries();
    if (entries.length === 0) {
      console.log('Diary is empty. Run "semar today" to make the first entry.');
      return;
    }
    const arg = rest[0];
    const slice = arg === 'full' ? entries : entries.slice(-(parseInt(arg ?? '10', 10) || 10));
    for (const e of slice) {
      const tarot = (e.payload.tarot as Array<{ position: string; card: string; reversed: boolean }> | undefined);
      const tarotLine = tarot
        ? tarot.map((t) => `${t.position}=${t.card}${t.reversed ? 'R' : ''}`).join(' · ')
        : '';
      const iching = (e.payload.iching as { primary: { number: number; cn: string } } | undefined);
      const ichingLine = iching ? `${iching.primary.number} ${iching.primary.cn}` : '';
      console.log(`${e.localDate} ${e.kind}${e.question ? ` "${e.question}"` : ''}${tarotLine ? `  ${tarotLine}` : ''}${ichingLine ? `  [${ichingLine}]` : ''}`);
    }
    return;
  }

  console.error(`Unknown command: ${cmd}`);
  usage();
}

function pad2(n: number): string { return String(n).padStart(2, '0'); }

main();
