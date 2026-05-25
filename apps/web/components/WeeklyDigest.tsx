'use client';
import { useState } from 'react';
import { getEntries } from '@/lib/diary-store';
import { todayLocal } from '@/lib/profile';

type Phase = 'idle' | 'loading' | 'done' | 'error';

interface DigestMeta {
  entries: number;
  from: string;
  to: string;
}

interface Block {
  label: string;
  body: string;
}

/** Parse MiniMax output into 3 named blocks */
function parseBlocks(raw: string): Block[] {
  const LABELS = ['HITUNGAN', 'KONVERGENSI', 'NEGASI'] as const;
  const blocks: Block[] = [];

  for (let i = 0; i < LABELS.length; i++) {
    const label = LABELS[i]!;
    const next  = LABELS[i + 1];

    // Match **LABEL** heading (with or without markdown bold)
    const startPat = new RegExp(`\\*{0,2}${label}\\*{0,2}`, 'i');
    const startMatch = raw.search(startPat);
    if (startMatch === -1) continue;

    // Body starts after the heading line
    const afterHeading = raw.indexOf('\n', startMatch);
    if (afterHeading === -1) continue;

    let body: string;
    if (next) {
      const endPat = new RegExp(`\\*{0,2}${next}\\*{0,2}`, 'i');
      const endMatch = raw.search(endPat);
      body = endMatch === -1
        ? raw.slice(afterHeading)
        : raw.slice(afterHeading, endMatch);
    } else {
      // NEGASI — take until footer separator (---) or end
      const footerIdx = raw.indexOf('---', afterHeading);
      body = footerIdx === -1 ? raw.slice(afterHeading) : raw.slice(afterHeading, footerIdx);
    }

    blocks.push({ label, body: body.trim() });
  }

  // Extract footer line (_..._ italics at the end)
  const footerMatch = raw.match(/_[^_\n]+_\s*$/m);
  if (footerMatch) {
    blocks.push({ label: 'footer', body: footerMatch[0].replace(/_/g, '').trim() });
  }

  return blocks;
}

function subtractDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() - n + 1);
  return d.toISOString().slice(0, 10);
}

export function WeeklyDigest() {
  const [phase,   setPhase]   = useState<Phase>('idle');
  const [blocks,  setBlocks]  = useState<Block[]>([]);
  const [meta,    setMeta]    = useState<DigestMeta | null>(null);
  const [window,  setWindow]  = useState<7 | 14 | 30>(7);
  const [errMsg,  setErrMsg]  = useState('');

  async function generate() {
    setPhase('loading');
    setBlocks([]);
    setErrMsg('');

    const today = todayLocal();
    const from  = subtractDays(today, window);
    const entries = getEntries({ from, to: today });

    if (entries.length === 0) {
      setErrMsg('Belum ada catatan di periode ini.');
      setPhase('error');
      return;
    }

    try {
      const res = await fetch('/api/convergence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries }),
      });

      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      const data = await res.json() as { digest: string; meta: DigestMeta };
      setBlocks(parseBlocks(data.digest));
      setMeta(data.meta);
      setPhase('done');
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'Terjadi kesalahan.');
      setPhase('error');
    }
  }

  return (
    <div className="mt-2 border-t border-gold/10 pt-6">

      {/* Header row */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <p className="text-xs text-muted font-mono tracking-widest">KONVERGENSI</p>
          <p className="text-sm text-parchment/60 font-serif">Sintesis lintas mesin</p>
        </div>

        {/* Window selector */}
        <div className="flex gap-1.5">
          {([7, 14, 30] as const).map((n) => (
            <button
              key={n}
              onClick={() => setWindow(n)}
              className={`text-[10px] font-mono px-2 py-1 rounded transition-colors
                          ${window === n
                            ? 'bg-gold/15 text-gold border border-gold/30'
                            : 'text-muted/50 border border-muted/20 hover:text-muted'}`}
            >
              {n}h
            </button>
          ))}
        </div>
      </div>

      {/* Idle / button */}
      {(phase === 'idle' || phase === 'error') && (
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={generate}
            className="px-6 py-2.5 rounded-full border border-gold/30 text-gold
                       font-serif text-sm tracking-wide
                       hover:bg-gold/10 active:scale-95 transition-all duration-150"
          >
            ✦ Rangkum {window} hari terakhir
          </button>
          {phase === 'error' && (
            <p className="text-xs text-ember/70 font-mono">{errMsg}</p>
          )}
        </div>
      )}

      {/* Loading */}
      {phase === 'loading' && (
        <div className="flex flex-col items-center gap-3 py-6">
          <p className="cn text-gold/50 text-3xl animate-pulse">天</p>
          <p className="text-xs text-muted/60 font-mono">Merangkum pola…</p>
        </div>
      )}

      {/* Result */}
      {phase === 'done' && blocks.length > 0 && (
        <div className="flex flex-col gap-5 animate-fade-up">

          {blocks.map((b) => {
            if (b.label === 'footer') return (
              <p key="footer" className="text-[10px] text-muted/40 font-mono text-center pt-2 border-t border-gold/8">
                {b.body}
              </p>
            );

            const colors: Record<string, string> = {
              HITUNGAN:   'text-muted/60',
              KONVERGENSI: 'text-gold/70',
              NEGASI:     'text-ember/60',
            };

            return (
              <div key={b.label}>
                <p className={`text-[10px] font-mono tracking-widest mb-2 ${colors[b.label] ?? 'text-muted/60'}`}>
                  {b.label}
                </p>
                <p className="text-sm text-parchment/80 font-serif leading-relaxed">
                  {b.body}
                </p>
              </div>
            );
          })}

          {/* Re-generate */}
          <button
            onClick={() => setPhase('idle')}
            className="text-xs text-muted/40 font-mono hover:text-muted transition-colors self-center pt-1"
          >
            ↺ rangkum ulang
          </button>
        </div>
      )}
    </div>
  );
}
