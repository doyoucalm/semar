'use client';
import { useState, useEffect } from 'react';
import type { CoreData }       from '@/lib/engines-server';
import { drawDailyTarot }      from '@/lib/engines-client';
import { TarotSpread }         from './TarotSpread';
import { CoinCast }            from './CoinCast';
import { appendEntry, makeId, getTodayEntry } from '@/lib/diary-store';
import { BAZI_STEM, BAZI_BRANCH, NEPTU_BRIEF, WUKU_BRIEF, TRANSIT_ASPECT, PLANET_BRIEF } from '@/lib/meanings';

type Engine = 'tarot' | 'iching' | 'both' | null;

const ASPECT_SYMBOL: Record<string, string> = {
  conjunction: '☌', opposition: '☍', trine: '△',
  square: '□', sextile: '⚹',
};

function buildSynthesis(core: CoreData): string {
  const { bazi, transit, weton } = core;
  const stem   = bazi.today[0] ?? '';
  const branch = bazi.today[1] ?? '';
  const stemMeaning   = BAZI_STEM[stem]?.split(' — ')[1]   ?? '';
  const branchMeaning = BAZI_BRANCH[branch]?.split(' — ')[1] ?? '';
  const neptuMeaning  = NEPTU_BRIEF[weton.neptu]            ?? '';

  const parts: string[] = [];
  if (stemMeaning && branchMeaning)
    parts.push(`Hari ${bazi.today} membawa energi ${stemMeaning}, berpadu dengan ${branchMeaning}.`);
  if (neptuMeaning)
    parts.push(`Weton ${weton.hari} ${weton.pasaran} (neptu ${weton.neptu}): ${neptuMeaning}.`);
  if (transit) {
    const aspectBrief  = TRANSIT_ASPECT[transit.kind]  ?? transit.kind;
    const planetBrief  = PLANET_BRIEF[transit.planet]  ?? transit.planet;
    const natalBrief   = PLANET_BRIEF[transit.natal]   ?? transit.natal;
    parts.push(`Transit ${transit.planet} ke ${transit.natal} — ${aspectBrief}; area: ${planetBrief} bertemu ${natalBrief}.`);
  }
  return parts.join(' ');
}

export function DailyBrief({ core }: { core: CoreData }) {
  const { bazi, transit, weton, localDate } = core;
  const [engine,   setEngine]   = useState<Engine>(null);
  const [question, setQuestion] = useState('');
  const [saved,    setSaved]    = useState(false);

  useEffect(() => {
    if (getTodayEntry(localDate)) setSaved(true);
  }, [localDate]);

  const [y, m, d] = localDate.split('-');
  const aspectSym   = transit ? (ASPECT_SYMBOL[transit.kind] ?? '·') : '';
  const stem        = bazi.today[0] ?? '';
  const branch      = bazi.today[1] ?? '';
  const stemBrief   = BAZI_STEM[stem]   ?? '';
  const branchBrief = BAZI_BRANCH[branch] ?? '';
  const neptuBrief  = NEPTU_BRIEF[weton.neptu] ?? '';
  const wukuBrief   = WUKU_BRIEF[weton.wuku]   ?? '';
  const synthesis   = buildSynthesis(core);

  function save(payload: Record<string, unknown>) {
    if (saved) return;
    appendEntry({ id: makeId(), createdAt: new Date().toISOString(), localDate, kind: 'today', question: question || undefined, payload });
    setSaved(true);
  }

  return (
    <div className="flex flex-col">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="px-6 pt-8 pb-6">
        <h1 className="flex items-baseline gap-2 mb-1">
          <span className="cn text-gold text-4xl leading-none">{bazi.today}</span>
          <span className="text-muted text-xs font-mono">{d} · {m} · {y}</span>
        </h1>

        <p className="text-parchment/80 font-serif text-base">
          {weton.hari} {weton.pasaran}
          <span className="text-muted text-sm"> · neptu {weton.neptu} · wuku {weton.wuku}</span>
        </p>
        {(neptuBrief || wukuBrief) && (
          <p className="text-xs text-muted/60 font-mono mt-0.5">
            {neptuBrief}{neptuBrief && wukuBrief ? ' · ' : ''}{wukuBrief}
          </p>
        )}

        {(stemBrief || branchBrief) && (
          <p className="text-xs text-gold/60 font-mono mt-1.5">
            {stemBrief}{stemBrief && branchBrief ? ' · ' : ''}{branchBrief}
          </p>
        )}

        {transit && (
          <div className="mt-3 flex flex-col gap-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-muted">Transit</span>
              <span className="text-sm font-serif">
                <span className="text-parchment/90">{transit.planet}</span>
                <span className="text-gold mx-1">{aspectSym}</span>
                <span className="text-parchment/90">{transit.natal}</span>
                <span className="text-muted text-xs ml-2">{transit.orb.toFixed(2)}°</span>
                {transit.motion === 'applying' && (
                  <span className="text-sage text-xs ml-1">applying</span>
                )}
              </span>
            </div>
            {TRANSIT_ASPECT[transit.kind] && (
              <p className="text-xs text-muted/60 font-mono">
                {TRANSIT_ASPECT[transit.kind]}
              </p>
            )}
          </div>
        )}

        {synthesis && (
          <div className="mt-4 pt-4 border-t border-gold/10">
            <p className="text-xs text-muted font-mono mb-1 tracking-widest">KONVERGENSI</p>
            <p className="text-sm text-parchment/70 font-serif leading-relaxed">{synthesis}</p>
          </div>
        )}
      </div>

      <div className="mx-6 border-t border-gold/10" />

      {/* ── Chooser ─────────────────────────────────────────────── */}
      {engine === null && (
        <div className="px-6 py-6 flex flex-col gap-4 animate-fade-up">
          <label htmlFor="daily-question" className="sr-only">Pertanyaan hari ini</label>
          <input
            id="daily-question"
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Pertanyaan hari ini... (opsional)"
            className="w-full bg-elevated border border-gold/15 rounded-lg px-4 py-2.5
                       text-sm text-parchment placeholder-muted/50 font-serif
                       focus:border-gold/40 outline-none transition-colors"
          />
          <div className="grid grid-cols-3 gap-3">
            {([
              ['tarot',  '🂡', 'Tarot'],
              ['iching', '☰',  'I-Ching'],
              ['both',   '✦',  'Keduanya'],
            ] as const).map(([id, icon, label]) => (
              <button key={id} onClick={() => setEngine(id)}
                className="flex flex-col items-center gap-1.5 py-4 rounded-xl
                           border border-gold/20 bg-elevated/50
                           hover:border-gold/50 hover:bg-elevated
                           active:scale-95 transition-all duration-150">
                <span className="text-xl">{icon}</span>
                <span className="text-xs font-mono text-muted">{label}</span>
              </button>
            ))}
          </div>
          {saved && <p className="text-center text-xs text-sage/70 font-mono">✓ sudah di-log hari ini</p>}
        </div>
      )}

      {/* ── Tarot ───────────────────────────────────────────────── */}
      {(engine === 'tarot' || engine === 'both') && (
        <div className="px-4 py-4 border-t border-gold/10">
          <p className="text-xs text-muted font-mono mb-4 text-center tracking-widest">TAROT</p>
          <TarotSpread draws={drawDailyTarot(localDate)} question={question || undefined} />
          {!saved && engine === 'tarot' && (
            <button onClick={() => save({ engine: 'tarot', tarot: drawDailyTarot(localDate).map(d => ({ position: d.position, card: d.cardName, reversed: d.reversed })) })}
              className="mt-5 w-full py-1.5 text-xs font-mono text-sage/70
                         border border-sage/20 rounded-lg hover:border-sage/40 transition-colors">
              simpan ke diary
            </button>
          )}
        </div>
      )}

      {/* ── I-Ching ─────────────────────────────────────────────── */}
      {(engine === 'iching' || engine === 'both') && (
        <div className="px-4 py-4 border-t border-gold/10">
          <p className="text-xs text-muted font-mono mb-2 text-center tracking-widest">I-CHING</p>
          <CoinCast question={question || undefined}
            onComplete={(r) => {
              if (!saved && engine !== 'both') {
                save({ engine: 'iching', iching: {
                  primary:  r.hexagram,
                  relating: r.relating,
                  changingLines: r.changingLines,
                }});
              }
            }} />
        </div>
      )}

      {engine !== null && (
        <button onClick={() => setEngine(null)}
          className="mx-6 mb-4 text-xs text-muted/50 font-mono hover:text-muted transition-colors">
          ← kembali
        </button>
      )}
    </div>
  );
}
