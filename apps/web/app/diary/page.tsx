'use client';
import { useState, useEffect } from 'react';
import { getEntries, getEntryDates, type WebDiaryEntry } from '@/lib/diary-store';
import { todayLocal } from '@/lib/profile';
import { WeeklyDigest } from '@/components/WeeklyDigest';

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
          className={`flex-none w-9 h-10 rounded-lg flex flex-col items-center
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

  useEffect(() => {
    setEntries(getEntries().slice().reverse());
    setDates(getEntryDates());
  }, []);

  return (
    <div className="px-6 pt-8 pb-6 flex flex-col gap-6">
      <h1 className="font-serif text-lg text-parchment">Diary</h1>

      {/* 14-day strip */}
      <CalendarStrip dates={dates} />

      {/* Entry list */}
      <div className="flex flex-col">
        {entries.length === 0 ? (
          <p className="text-center text-muted text-sm font-mono py-8">
            kosong — mulai dengan Daily atau Cast
          </p>
        ) : (
          entries.map((e) => <EntryRow key={e.id} e={e} />)
        )}
      </div>

      {/* Weekly / multi-day convergence digest */}
      <WeeklyDigest />
    </div>
  );
}
