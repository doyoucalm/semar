'use client';
import { useState, useCallback } from 'react';
import { HexagramDisplay } from './HexagramDisplay';
import { castLine, buildResult } from '@/lib/engines-client';
import type { LineType } from '@/lib/engines-client';
import { HEXAGRAM_GUIDANCE } from '@/lib/meanings';

interface Props {
  question?: string;
  onComplete?: (result: ReturnType<typeof buildResult>) => void;
  onReset?: () => void;
}

interface CoinState {
  heads: boolean;
  flipping: boolean;
}

type Phase = 'idle' | 'casting' | 'done';

export function CoinCast({ question, onComplete, onReset }: Props) {
  const [phase,       setPhase]       = useState<Phase>('idle');
  const [lines,       setLines]       = useState<LineType[]>([]);
  const [coins,       setCoins]       = useState<CoinState[]>([
    { heads: true, flipping: false },
    { heads: true, flipping: false },
    { heads: true, flipping: false },
  ]);
  const [result, setResult] = useState<ReturnType<typeof buildResult> | null>(null);

  const throwCoins = useCallback(() => {
    // Guard via the functional updater so a stale `phase` closure can't
    // double-add lines after the hexagram is already complete.
    setPhase((p) => (p === 'done' ? p : 'casting'));

    // Animate all 3 coins flipping
    setCoins((c) => c.map((coin) => ({ ...coin, flipping: true })));

    setTimeout(() => {
      const { line, coins: newHeads } = castLine();

      setCoins(newHeads.map((heads) => ({ heads, flipping: false })));

      setLines((prev) => {
        if (prev.length >= 6) return prev;   // already complete — ignore
        const next = [...prev, line];
        if (next.length === 6) {
          const r = buildResult(next);
          setResult(r);
          setPhase('done');
          onComplete?.(r);
        }
        return next;
      });
    }, 600);
  }, [onComplete]);

  const reset = () => {
    setPhase('idle');
    setLines([]);
    setResult(null);
    setCoins([
      { heads: true, flipping: false },
      { heads: true, flipping: false },
      { heads: true, flipping: false },
    ]);
    onReset?.();
  };

  const lineLabel = lines.length === 0
    ? 'Lempar koin untuk mulai'
    : lines.length < 6
    ? `Baris ${lines.length + 1} dari 6`
    : 'Selesai';

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {question && (
        <p className="text-center text-sm text-muted italic font-serif px-6">
          &ldquo;{question}&rdquo;
        </p>
      )}

      {/* Hexagram building */}
      <div className="min-h-[168px] flex items-center justify-center">
        {lines.length > 0 ? (
          <HexagramDisplay
            lines={lines}
            changingLines={result?.changingLines}
            animateFrom={lines.length - 1}
          />
        ) : (
          <div className="flex flex-col gap-2 w-32 mx-auto">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-5 flex items-center">
                <div className="flex-1 h-px border-t border-dashed border-muted/20" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Coins */}
      <div className="flex gap-5">
        {coins.map((coin, i) => (
          <div
            key={i}
            className={`w-12 h-12 rounded-full border-2 flex items-center justify-center
                        text-base font-serif transition-all duration-100 select-none
                        ${coin.flipping
                          ? 'animate-flip-coin border-gold/60 text-gold'
                          : coin.heads
                          ? 'border-gold/70 text-gold bg-elevated'
                          : 'border-muted/50 text-muted bg-card'}`}
          >
            {coin.flipping ? '◎' : coin.heads ? '陽' : '陰'}
          </div>
        ))}
      </div>

      {/* Status */}
      <p className="text-xs text-muted font-mono tracking-wide">{lineLabel}</p>

      {/* Action button */}
      {phase !== 'done' ? (
        <button
          onClick={throwCoins}
          disabled={coins.some((c) => c.flipping)}
          aria-busy={coins.some((c) => c.flipping)}
          className="px-8 py-3 rounded-full border border-gold/40 text-gold
                     font-serif text-sm tracking-wide
                     hover:bg-gold/10 active:scale-95
                     disabled:opacity-40 disabled:cursor-not-allowed
                     transition-all duration-150"
        >
          {lines.length === 0 ? '⊕  Lempar' : '⊕  Lempar lagi'}
        </button>
      ) : (
        <button
          onClick={reset}
          aria-label="Cast ulang"
          className="text-xs text-muted/60 font-mono hover:text-muted transition-colors"
        >
          ↺ cast ulang
        </button>
      )}

      {/* Result */}
      {result?.hexagram && (
        <div className="w-full border-t border-gold/10 pt-5 mt-2 animate-fade-up">
          <div className="text-center space-y-1">
            <p className="cn text-gold text-3xl">{result.hexagram.cn}</p>
            <p className="text-lg font-serif text-parchment">{result.hexagram.en}</p>
            <p className="text-xs text-muted font-mono">
              #{result.hexagram.number}  ·  {result.hexagram.pinyin}
            </p>
            {result.changingLines.length > 0 && result.relating && (
              <p className="text-xs text-ember/80 font-mono pt-1">
                {result.changingLines.length} garis berubah
                → {result.relating.number} {result.relating.cn}
              </p>
            )}
          </div>
          {/* Guidance */}
          {HEXAGRAM_GUIDANCE[result.hexagram.number] && (
            <p className="mt-4 text-sm text-parchment/80 font-serif text-center leading-relaxed px-2 italic">
              &ldquo;{HEXAGRAM_GUIDANCE[result.hexagram.number]}&rdquo;
            </p>
          )}
          {result.relating && HEXAGRAM_GUIDANCE[result.relating.number] && (
            <div className="mt-3 border-t border-gold/10 pt-3">
              <p className="text-xs text-muted font-mono text-center mb-1">
                hexagram berubah → {result.relating.cn} {result.relating.en}
              </p>
              <p className="text-xs text-ember/70 font-serif text-center leading-relaxed italic">
                &ldquo;{HEXAGRAM_GUIDANCE[result.relating.number]}&rdquo;
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
