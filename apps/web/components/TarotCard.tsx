'use client';
import Image from 'next/image';
import { useState } from 'react';
import type { TarotDraw } from '@/lib/engines-client';
import { TAROT_MEANINGS } from '@/lib/meanings';

interface Props {
  draw: TarotDraw;
  autoReveal?: boolean;
}

const POSITION_LABEL: Record<TarotDraw['position'], string> = {
  past: 'Masa Lalu',
  present: 'Sekarang',
  future: 'Akan Datang',
};

export function TarotCard({ draw, autoReveal = false }: Props) {
  const [flipped, setFlipped] = useState(autoReveal);

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Position label */}
      <span className="text-xs text-muted font-mono tracking-widest uppercase">
        {POSITION_LABEL[draw.position]}
      </span>

      {/* Card */}
      <div
        className="card-scene w-24 h-40 cursor-pointer"
        onClick={() => setFlipped(true)}
        role="button"
        aria-label={flipped ? draw.cardName : 'Ketuk untuk buka'}
      >
        <div className={`card-inner w-full h-full ${flipped ? 'flipped' : ''}`}>

          {/* BACK FACE */}
          <div className="card-face card-back-face w-full h-full rounded-xl overflow-hidden
                          border border-gold/30 bg-elevated
                          flex items-center justify-center">
            <div className="w-16 h-28 rounded-lg border border-gold/20
                            bg-gradient-to-b from-elevated to-card
                            flex items-center justify-center">
              <span className="cn text-gold/40 text-2xl select-none">天</span>
            </div>
          </div>

          {/* FRONT FACE */}
          <div className="card-face card-front-face w-full h-full rounded-xl overflow-hidden
                          border border-gold/40 bg-card">
            {draw.artPath ? (
              <div className={`relative w-full h-full ${draw.reversed ? 'rotate-180' : ''}`}>
                <Image
                  src={draw.artPath}
                  alt={draw.cardName}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>
            ) : (
              /* Placeholder when art not yet generated */
              <div className={`w-full h-full flex flex-col items-center justify-center gap-2 p-2
                               ${draw.reversed ? 'rotate-180' : ''}`}>
                <div className="w-10 h-10 rounded-full border border-gold/30
                                flex items-center justify-center text-gold/50 text-lg">
                  {draw.deckIndex % 22 === 0 ? '○' : draw.deckIndex % 22}
                </div>
                <span className="text-[10px] text-center text-parchment/70 leading-tight font-serif">
                  {draw.cardName}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Name + meaning shown after flip */}
      <div className={`text-center transition-opacity duration-300 max-w-[96px] ${flipped ? 'opacity-100' : 'opacity-0'}`}>
        <p className="text-sm text-parchment leading-tight font-serif">
          {draw.cardName}
        </p>
        {draw.reversed && (
          <p className="text-xs text-ember/80 font-mono mb-1">reversed</p>
        )}
        {flipped && (() => {
          const meaning = TAROT_MEANINGS[draw.cardName];
          const keywords = draw.reversed ? meaning?.reversed : meaning?.upright;
          return keywords ? (
            <p className="text-[10px] text-muted/70 font-mono leading-tight mt-1">
              {keywords}
            </p>
          ) : null;
        })()}
      </div>

      {/* Tap hint */}
      {!flipped && (
        <p className="text-[10px] text-muted font-mono animate-pulse">ketuk</p>
      )}
    </div>
  );
}
