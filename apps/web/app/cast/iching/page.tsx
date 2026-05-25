'use client';
import { useState } from 'react';
import { CoinCast } from '@/components/CoinCast';
import { appendEntry, makeId } from '@/lib/diary-store';
import { todayLocal } from '@/lib/profile';

export default function IChingPage() {
  const [question, setQuestion] = useState('');
  const [saved,    setSaved]    = useState(false);

  return (
    <div className="px-6 pt-8 pb-6 flex flex-col gap-6">
      {/* Header */}
      <div className="text-center">
        <p className="cn text-gold text-5xl mb-1">易</p>
        <h1 className="font-serif text-lg text-parchment">I-Ching Cast</h1>
        <p className="text-xs text-muted font-mono mt-1">
          enam lemparan · hexagram terbentuk
        </p>
      </div>

      {/* Question input */}
      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Pertanyaan yang dibawa..."
        className="w-full bg-elevated border border-gold/15 rounded-lg px-4 py-2.5
                   text-sm text-parchment placeholder-muted/50 font-serif
                   focus:border-gold/40 outline-none transition-colors"
      />

      {/* Casting */}
      <CoinCast
        question={question}
        onComplete={(r) => {
          if (saved) return;
          appendEntry({
            id: makeId(),
            createdAt: new Date().toISOString(),
            localDate: todayLocal(),
            kind: 'cast',
            question: question || undefined,
            payload: {
              engine: 'iching',
              iching: {
                primary:  { number: r.hexagram?.number, cn: r.hexagram?.cn, en: r.hexagram?.en },
                relating: r.relating ? { number: r.relating.number, cn: r.relating.cn } : null,
                changingLines: r.changingLines,
              },
            },
          });
          setSaved(true);
        }}
      />

      {saved && (
        <p className="text-center text-xs text-sage/70 font-mono animate-fade-up">
          ✓ tersimpan di diary
        </p>
      )}
    </div>
  );
}
