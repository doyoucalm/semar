'use client';
import { TarotCard } from './TarotCard';
import type { TarotDraw } from '@/lib/engines-client';

interface Props {
  draws: TarotDraw[];
  question?: string;
}

export function TarotSpread({ draws, question }: Props) {
  return (
    <div className="flex flex-col gap-4 animate-fade-up">
      {question && (
        <p className="text-center text-sm text-muted italic font-serif px-4">
          &ldquo;{question}&rdquo;
        </p>
      )}

      {/* 3-card spread */}
      <div className="flex justify-center gap-4 px-2">
        {draws.map((d) => (
          <TarotCard key={d.position} draw={d} />
        ))}
      </div>

      <p className="text-center text-xs text-muted/60 font-mono">
        ketuk setiap kartu untuk membuka
      </p>
    </div>
  );
}
