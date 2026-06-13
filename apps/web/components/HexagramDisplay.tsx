'use client';
import type { LineType } from '@/lib/engines';

interface Props {
  lines: LineType[];       // bottom-to-top, length 0–6
  changingLines?: number[];
  animateFrom?: number;   // index of first new line (triggers animation)
}

function Line({ type, index, changing, animate }: {
  type: LineType; index: number; changing: boolean; animate: boolean;
}) {
  const isYang    = type === 7 || type === 9;
  const color     = changing ? '#c44a30' : '#c9a84c';
  const animClass = animate ? 'animate-line-grow' : '';

  if (isYang) {
    // Solid line
    return (
      <div className="flex items-center h-5 gap-1" style={{ animationDelay: `${index * 80}ms` }}>
        <div
          className={`hex-line flex-1 ${animClass}`}
          style={{ background: color }}
        />
        {changing && <span className="text-ember text-xs font-mono w-3 text-center">○</span>}
      </div>
    );
  } else {
    // Broken line
    return (
      <div className="flex items-center h-5 gap-1" style={{ animationDelay: `${index * 80}ms` }}>
        <div className={`hex-line flex-[2] ${animClass}`} style={{ background: color }} />
        <div className="w-4" /> {/* gap */}
        <div className={`hex-line flex-[2] ${animClass}`} style={{ background: color }} />
        {changing && <span className="text-ember text-xs font-mono w-3 text-center">●</span>}
      </div>
    );
  }
}

export function HexagramDisplay({ lines, changingLines = [], animateFrom }: Props) {
  // Display top-to-bottom (line[5] on top, line[0] at bottom)
  const displayed = [...lines].reverse();
  const topIndex  = lines.length - 1;

  // Text alternative: describe each placed line bottom-to-top for screen readers.
  const summary = lines.length === 0
    ? 'Hexagram belum terbentuk'
    : 'Hexagram: ' + lines.map((t, i) => {
        const yang = t === 7 || t === 9;
        const changing = changingLines.includes(i);
        return `garis ${i + 1} ${yang ? 'yang' : 'yin'}${changing ? ' berubah' : ''}`;
      }).join(', ');

  return (
    <div className="flex flex-col gap-2 w-32 mx-auto" role="img" aria-label={summary}>
      {/* Placeholders at top — so cast lines build upward from the bottom */}
      {Array.from({ length: 6 - lines.length }).map((_, i) => (
        <div key={`ph-${i}`} className="h-5 flex items-center">
          <div className="flex-1 h-px border-t border-dashed border-muted/30" />
        </div>
      ))}

      {displayed.map((type, displayIdx) => {
        const lineIdx = topIndex - displayIdx;
        return (
          <Line
            key={lineIdx}
            type={type}
            index={lineIdx}
            changing={changingLines.includes(lineIdx)}
            animate={animateFrom !== undefined && lineIdx >= animateFrom}
          />
        );
      })}
    </div>
  );
}
