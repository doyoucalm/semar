'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { DECK, meaningOf, elementOf, type Card, type CardMeaning, type TarotElement } from '@semar/tarot';
import { cardArtPath } from '@/lib/engines-client';

// ── Element styling ──────────────────────────────────────────────────────────

const ELEMENT: Record<TarotElement, { label: string; color: string; glyph: string }> = {
  fire:  { label: 'Fire',  color: '#c44a30', glyph: '△' },
  water: { label: 'Water', color: '#5b85a8', glyph: '▽' },
  air:   { label: 'Air',   color: '#d9c9a8', glyph: '△' },
  earth: { label: 'Earth', color: '#6faf6f', glyph: '▽' },
};

const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
  'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];

function cap(s: string | number): string {
  const t = String(s);
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** "Major Arcana · 0" or "Wands · Ace". */
function typeLine(card: Card): string {
  if (card.arcana === 'major') return `Major Arcana · ${ROMAN[card.number] ?? card.number}`;
  return `${cap(card.suit)} · ${cap(card.rank)}`;
}

// ── Filters ──────────────────────────────────────────────────────────────────

type Filter = 'all' | 'major' | 'wands' | 'cups' | 'swords' | 'pentacles';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Semua' },
  { id: 'major', label: 'Major' },
  { id: 'wands', label: 'Wands' },
  { id: 'cups', label: 'Cups' },
  { id: 'swords', label: 'Swords' },
  { id: 'pentacles', label: 'Pentacles' },
];

interface Entry {
  card: Card;
  deckIndex: number;
  art: string | null;
  element: TarotElement | null;
  meaning: CardMeaning;
}

// ── Detail overlay ───────────────────────────────────────────────────────────

function CardDetail({ entry, onClose }: { entry: Entry; onClose: () => void }) {
  const { card, art, element, meaning } = entry;
  const el = element ? ELEMENT[element] : null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-ink/90 backdrop-blur-sm flex justify-center overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg min-h-full px-6 py-8 animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Tutup"
          className="sticky top-0 ml-auto flex w-9 h-9 items-center justify-center rounded-full
                     border border-gold/30 text-gold/80 bg-card/80 hover:bg-gold/10 transition-colors"
        >
          ✕
        </button>

        {/* Art */}
        <div className="flex justify-center -mt-2 mb-5">
          <div className="card-scene w-40 h-64 rounded-xl overflow-hidden border border-gold/30 bg-card">
            {art ? (
              <Image src={art} alt={card.name} width={160} height={256} className="object-cover w-full h-full" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-3">
                <div className="w-14 h-14 rounded-full border border-gold/30 flex items-center justify-center text-gold/50 text-xl">
                  {card.arcana === 'major' ? (ROMAN[card.number] ?? card.number) : cap(card.rank).slice(0, 2)}
                </div>
                <span className="cn text-gold/30 text-2xl select-none">天</span>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-5">
          <h2 className="font-serif text-2xl text-parchment">{card.name}</h2>
          <p className="text-xs text-muted font-mono mt-1">{typeLine(card)}</p>
          {el && (
            <span
              className="inline-block mt-2 text-[11px] font-mono px-2.5 py-0.5 rounded-full"
              style={{ color: el.color, border: `1px solid ${el.color}55` }}
            >
              {el.glyph} {el.label}
            </span>
          )}
        </div>

        {/* Keywords */}
        {meaning.keywords.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5 mb-6">
            {meaning.keywords.map((k) => (
              <span key={k} className="text-[11px] font-mono px-2 py-0.5 rounded-full border border-gold/15 text-parchment/70">
                {k}
              </span>
            ))}
          </div>
        )}

        {/* Upright */}
        <section className="mb-5">
          <p className="text-[10px] font-mono tracking-widest text-sage/70 mb-1.5">TEGAK · UPRIGHT</p>
          <p className="text-sm text-parchment/80 font-serif leading-relaxed">{meaning.upright}</p>
        </section>

        {/* Reversed */}
        <section className="mb-5">
          <p className="text-[10px] font-mono tracking-widest text-ember/70 mb-1.5">TERBALIK · REVERSED</p>
          <p className="text-sm text-parchment/80 font-serif leading-relaxed">{meaning.reversed}</p>
        </section>

        {/* Fortune telling */}
        {meaning.fortuneTelling.length > 0 && (
          <section className="mb-6">
            <p className="text-[10px] font-mono tracking-widest text-gold/60 mb-2">PETUNJUK · FORTUNE-TELLING</p>
            <ul className="flex flex-col gap-1.5">
              {meaning.fortuneTelling.map((f, i) => (
                <li key={i} className="text-sm text-parchment/70 font-serif leading-relaxed flex gap-2">
                  <span className="text-gold/40 flex-none">·</span>{f}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export function CardLibrary() {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery]   = useState('');
  const [selected, setSelected] = useState<Entry | null>(null);

  // Build the full index once (meaningOf is a map lookup — cheap).
  const entries = useMemo<Entry[]>(() =>
    DECK.map((card, deckIndex) => ({
      card, deckIndex,
      art: cardArtPath(deckIndex),
      element: elementOf(card),
      meaning: meaningOf(card.id),
    })), []);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (filter === 'major' && e.card.arcana !== 'major') return false;
      if (filter !== 'all' && filter !== 'major' &&
          (e.card.arcana !== 'minor' || e.card.suit !== filter)) return false;
      if (q) {
        const hay = `${e.card.name} ${e.meaning.keywords.join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [entries, filter, query]);

  return (
    <div className="px-5 pt-8 pb-6 flex flex-col gap-5">
      {/* Header */}
      <div className="text-center">
        <p className="cn text-gold text-5xl mb-1">牌</p>
        <h1 className="font-serif text-lg text-parchment">Pustaka Kartu</h1>
        <p className="text-xs text-muted font-mono mt-1">78 kartu · arti tegak &amp; terbalik</p>
      </div>

      {/* Search */}
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari nama atau kata kunci…"
        aria-label="Cari kartu"
        className="w-full bg-elevated border border-gold/15 rounded-lg px-4 py-2.5
                   text-sm text-parchment placeholder-muted/50 font-serif
                   focus:border-gold/40 outline-none transition-colors"
      />

      {/* Filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`flex-none text-xs font-mono px-3 py-1.5 rounded-full border transition-colors
                        ${filter === f.id
                          ? 'border-gold/50 text-gold bg-gold/10'
                          : 'border-gold/15 text-muted hover:border-gold/30 hover:text-parchment'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <p className="text-[10px] text-muted/50 font-mono">{shown.length} kartu</p>

      {/* Grid */}
      {shown.length === 0 ? (
        <p className="text-center text-muted/60 text-sm font-mono py-10">tidak ada kartu cocok</p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {shown.map((e) => {
            const el = e.element ? ELEMENT[e.element] : null;
            return (
              <button
                key={e.card.id}
                onClick={() => setSelected(e)}
                className="flex flex-col items-center gap-1.5 group"
                aria-label={e.card.name}
              >
                <div className="w-full aspect-[2/3] rounded-lg overflow-hidden border border-gold/15
                                bg-elevated group-hover:border-gold/40 group-active:scale-95 transition-all">
                  {e.art ? (
                    <Image src={e.art} alt={e.card.name} width={120} height={180}
                           className="object-cover w-full h-full" sizes="120px" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 p-1.5">
                      <span className="text-gold/40 text-sm font-mono">
                        {e.card.arcana === 'major' ? (ROMAN[e.card.number] ?? e.card.number) : cap(e.card.rank).slice(0, 2)}
                      </span>
                      {el && <span style={{ color: el.color }} className="text-xs">{el.glyph}</span>}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-parchment/70 font-serif leading-tight text-center">
                  {e.card.name}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {selected && <CardDetail entry={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
