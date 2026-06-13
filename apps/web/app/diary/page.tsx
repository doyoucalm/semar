'use client';
import { useState, useEffect, useMemo } from 'react';
import { getEntries, getEntryDates, type WebDiaryEntry } from '@/lib/diary-store';
import { todayLocal } from '@/lib/profile';
import { WeeklyDigest } from '@/components/WeeklyDigest';
import {
  DECK,
  mirrorStats,
  SUIT_ELEMENT,
  type ReadingRecord,
  type Suit,
} from '@semar/tarot';

// Card name → canonical deck id (diary stores the display name, mirror needs the id).
const NAME_TO_ID: Record<string, string> = Object.fromEntries(
  DECK.map((c) => [c.name, c.id]),
);

type TarotPayload = Array<{ position: string; card: string; reversed: boolean }>;

/** Build flat ReadingRecord[] from every saved entry carrying a tarot payload. */
function buildReadingRecords(entries: WebDiaryEntry[]): ReadingRecord[] {
  const records: ReadingRecord[] = [];
  for (const e of entries) {
    const tarot = e.payload['tarot'] as TarotPayload | undefined;
    if (!tarot || tarot.length === 0) continue;
    for (const t of tarot) {
      const cardId = NAME_TO_ID[t.card];
      if (!cardId) continue; // skip names not in the 78-card deck
      records.push({ cardId, reversed: !!t.reversed, date: e.localDate });
    }
  }
  return records;
}

const SUIT_LABEL: Record<Suit, string> = {
  wands: 'Wands', cups: 'Cups', swords: 'Swords', pentacles: 'Pentacles',
};

function MirrorSection({ entries }: { entries: WebDiaryEntry[] }) {
  const records = useMemo(() => buildReadingRecords(entries), [entries]);
  const stats = useMemo(() => mirrorStats(records), [records]);

  if (stats.total === 0) return null;

  const topName = stats.mostCommonCard
    ? DECK.find((c) => c.id === stats.mostCommonCard!.cardId)?.name ?? stats.mostCommonCard.cardId
    : null;

  return (
    <div className="flex flex-col gap-3 mt-2">
      <h2 className="font-serif text-base text-parchment">Mirror</h2>
      <p className="text-[10px] text-muted/50 font-mono">
        agregat {stats.total} kartu dari riwayat tarot
      </p>

      <div className="grid grid-cols-2 gap-2">
        <div className="border border-gold/15 rounded-lg px-3 py-2">
          <p className="text-[10px] text-muted/60 font-mono uppercase">total kartu</p>
          <p className="text-lg text-gold font-serif">{stats.total}</p>
        </div>
        <div className="border border-gold/15 rounded-lg px-3 py-2">
          <p className="text-[10px] text-muted/60 font-mono uppercase">reversed</p>
          <p className="text-lg text-ember/80 font-serif">{stats.reversalPct}%</p>
        </div>
        <div className="border border-gold/15 rounded-lg px-3 py-2 col-span-2">
          <p className="text-[10px] text-muted/60 font-mono uppercase">paling sering</p>
          <p className="text-sm text-parchment font-serif">
            {topName}
            {stats.mostCommonCard && (
              <span className="text-muted/50 font-mono"> ×{stats.mostCommonCard.count}</span>
            )}
          </p>
        </div>
        <div className="border border-gold/15 rounded-lg px-3 py-2">
          <p className="text-[10px] text-muted/60 font-mono uppercase">major / minor</p>
          <p className="text-sm text-parchment font-mono">
            {stats.majorMinorRatio.major} / {stats.majorMinorRatio.minor}
          </p>
        </div>
        <div className="border border-gold/15 rounded-lg px-3 py-2">
          <p className="text-[10px] text-muted/60 font-mono uppercase">elemen dominan</p>
          <p className="text-sm text-parchment font-mono">
            {(() => {
              const eb = stats.elementBalance;
              const top = (Object.keys(eb) as (keyof typeof eb)[])
                .reduce((a, b) => (eb[b] > eb[a] ? b : a));
              return eb[top] > 0 ? `${top} ${eb[top]}` : '—';
            })()}
          </p>
        </div>
      </div>

      {/* Suit distribution */}
      <div className="flex flex-col gap-1">
        <p className="text-[10px] text-muted/60 font-mono uppercase">sebaran suit</p>
        {(Object.keys(stats.suitDistribution) as Suit[]).map((suit) => {
          const n = stats.suitDistribution[suit];
          const pct = stats.total > 0 ? (n / stats.total) * 100 : 0;
          return (
            <div key={suit} className="flex items-center gap-2">
              <span className="text-xs text-muted/70 font-mono w-20">
                {SUIT_LABEL[suit]}
                <span className="text-muted/40"> · {SUIT_ELEMENT[suit]}</span>
              </span>
              <div className="flex-1 h-2 rounded-full bg-elevated overflow-hidden">
                <div className="h-full bg-gold/40" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs text-parchment/70 font-mono w-6 text-right">{n}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Simple calendar
function CalendarStrip({ dates }: { dates: Set<string> }) {
  const todayStr = todayLocal();
  const todayUtc = new Date(todayStr + 'T12:00:00Z');
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(todayUtc);
    d.setUTCDate(todayUtc.getUTCDate() - 13 + i);
    const str = d.toISOString().slice(0, 10);
    const has = dates.has(str);
    const isToday = str === todayStr;
    return { str, day: d.getUTCDate(), has, isToday };
  });

  return (
    <div className="flex gap-1.5 overflow-x-auto px-1 py-1">
      {days.map((d) => (
        <div
          key={d.str}
          className={`flex-none w-11 h-11 rounded-lg flex flex-col items-center
                      justify-center text-xs gap-0.5 transition-colors
                      ${d.isToday ? 'border border-gold/60' : ''}
                      ${d.has ? 'bg-gold/15 text-gold' : 'text-muted/50'}`}
        >
          <span className="font-mono text-[10px]">{d.day}</span>
          {d.has && <span className="w-1 h-1 rounded-full bg-gold/80" />}
        </div>
      ))}
    </div>
  );
}

const POS_SHORT: Record<string, string> = { past: 'lalu', present: 'skrg', future: 'dtng' };

function EntryRow({ e }: { e: WebDiaryEntry }) {
  const tarot  = e.payload['tarot']  as Array<{ position: string; card: string; reversed: boolean }> | undefined;
  const iching = e.payload['iching'] as { primary: { number: number; cn: string; en?: string }; relating?: { number: number; cn: string } | null } | undefined;
  const bazi   = e.payload['bazi']   as { today?: string } | undefined;
  const engine = e.payload['engine'] as string | undefined;

  return (
    <div className="border-b border-gold/8 py-3 px-1">
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        {bazi?.today && <span className="cn text-gold text-base">{bazi.today}</span>}
        <span className="text-xs text-muted font-mono">{e.localDate}</span>
        {engine && <span className="text-[10px] text-muted/40 font-mono uppercase">{engine}</span>}
        {e.kind === 'note' && <span className="text-[10px] text-muted/50 font-mono">[note]</span>}
      </div>
      {e.question && (
        <p className="text-xs text-muted/70 italic font-serif mb-1">&ldquo;{e.question}&rdquo;</p>
      )}
      {e.notes && e.kind === 'note' && (
        <p className="text-sm text-parchment/80 font-serif">{e.notes}</p>
      )}
      {tarot && tarot.length > 0 && tarot[0]?.card && (
        <div className="flex flex-col gap-0.5 mt-1">
          {tarot.map((t) => (
            <p key={t.position} className="text-xs text-parchment/60 font-mono">
              <span className="text-muted/50">{POS_SHORT[t.position] ?? t.position[0]}:</span>
              {' '}{t.card}{t.reversed ? ' ®' : ''}
            </p>
          ))}
        </div>
      )}
      {iching?.primary?.cn && (
        <p className="text-xs text-gold/70 font-mono mt-1">
          {iching.primary.number} {iching.primary.cn}
          {iching.primary.en ? ` · ${iching.primary.en}` : ''}
          {iching.relating ? ` → ${iching.relating.number} ${iching.relating.cn}` : ''}
        </p>
      )}
    </div>
  );
}

export default function DiaryPage() {
  const [entries, setEntries] = useState<WebDiaryEntry[]>([]);
  const [dates,   setDates]   = useState<Set<string>>(new Set());
  const [loaded,  setLoaded]  = useState(false);

  useEffect(() => {
    setEntries(getEntries().slice().reverse());
    setDates(getEntryDates());
    setLoaded(true);
  }, []);

  return (
    <div className="px-6 pt-8 pb-6 flex flex-col gap-6">
      <h1 className="font-serif text-lg text-parchment">Diary</h1>

      {/* 14-day strip */}
      <CalendarStrip dates={dates} />

      {/* Entry list */}
      <div className="flex flex-col">
        {!loaded ? (
          <p className="text-center text-muted/40 text-sm font-mono py-8">memuat…</p>
        ) : entries.length === 0 ? (
          <p className="text-center text-muted text-sm font-mono py-8">
            kosong — mulai dengan Daily atau Cast
          </p>
        ) : (
          entries.map((e) => <EntryRow key={e.id} e={e} />)
        )}
      </div>

      {/* Mirror — aggregate tarot stats over saved history */}
      <MirrorSection entries={entries} />

      {/* Weekly / multi-day convergence digest */}
      <WeeklyDigest />
    </div>
  );
}
