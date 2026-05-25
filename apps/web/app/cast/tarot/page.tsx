'use client';
import { useState } from 'react';
import { TarotSpread } from '@/components/TarotSpread';
import { drawFreshTarot } from '@/lib/engines-client';
import { appendEntry, makeId } from '@/lib/diary-store';
import { todayLocal } from '@/lib/profile';

export default function TarotPage() {
  const [question, setQuestion] = useState('');
  const [draws,    setDraws]    = useState<ReturnType<typeof drawFreshTarot> | null>(null);
  const [saved,    setSaved]    = useState(false);

  function cast() {
    setDraws(drawFreshTarot());
    setSaved(false);
  }

  function save() {
    if (!draws || saved) return;
    appendEntry({
      id: makeId(),
      createdAt: new Date().toISOString(),
      localDate: todayLocal(),
      kind: 'cast',
      question: question || undefined,
      payload: {
        engine: 'tarot',
        tarot: draws.map((d) => ({
          position: d.position,
          card: d.cardName,
          reversed: d.reversed,
        })),
      },
    });
    setSaved(true);
  }

  return (
    <div className="px-6 pt-8 pb-6 flex flex-col gap-6">
      {/* Header */}
      <div className="text-center">
        <p className="text-gold text-5xl mb-1">🂡</p>
        <h1 className="font-serif text-lg text-parchment">Tarot Cast</h1>
        <p className="text-xs text-muted font-mono mt-1">tiga kartu · past / present / future</p>
      </div>

      {/* Question */}
      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Pertanyaan yang dibawa..."
        className="w-full bg-elevated border border-gold/15 rounded-lg px-4 py-2.5
                   text-sm text-parchment placeholder-muted/50 font-serif
                   focus:border-gold/40 outline-none transition-colors"
      />

      {/* Draw button */}
      {!draws && (
        <button
          onClick={cast}
          className="py-3 rounded-full border border-gold/40 text-gold font-serif
                     text-sm tracking-wide hover:bg-gold/10 active:scale-95
                     transition-all duration-150"
        >
          ✦ Tarik Kartu
        </button>
      )}

      {/* Spread */}
      {draws && (
        <>
          <TarotSpread draws={draws} question={question || undefined} />

          <div className="flex gap-3 justify-center mt-2">
            <button
              onClick={cast}
              className="text-xs text-muted/60 font-mono hover:text-muted transition-colors"
            >
              ↺ tarik ulang
            </button>
            {!saved && (
              <button
                onClick={save}
                className="text-xs text-sage/70 font-mono border border-sage/20
                           px-4 py-1.5 rounded-full hover:border-sage/40 transition-colors"
              >
                simpan diary
              </button>
            )}
          </div>

          {saved && (
            <p className="text-center text-xs text-sage/70 font-mono animate-fade-up">
              ✓ tersimpan di diary
            </p>
          )}
        </>
      )}
    </div>
  );
}
