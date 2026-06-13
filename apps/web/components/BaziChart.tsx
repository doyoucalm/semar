'use client';

import {
  type Element, ELEMENT_EN, ELEMENT_COLOR, STEM_ELEMENT, BRANCH_ELEMENT,
  BRANCH_ANIMAL, BRANCH_PINYIN, STEM_PINYIN, TEN_GOD_EN, colorOf,
} from '@/lib/bazi-display';

// ── API response shape ──────────────────────────────────────────────────────

interface HiddenStem { stem: string; cnRole: string; tenGod: string; weight: number }
interface PillarA {
  slot: 'year' | 'month' | 'day' | 'hour';
  name: string; stem: string; branch: string;
  stemTenGod: string | null;
  hiddenStems: HiddenStem[];
  nayin: { cn: string; element: string; en: string };
}
export interface BaziResult {
  eightCharacters: string;
  dayMaster: { stem: string; element: string; polarity: string };
  solarTime: { correctedLocal: { hour: number; minute: number } } | null;
  pillars: Record<'year' | 'month' | 'day' | 'hour', PillarA>;
  elements: Record<Element, number>;
  dayMasterStrength: { supporting: number; draining: number; verdict: string };
  usefulGod: {
    dayMasterElement: string; strength: string; confidence: string;
    favorableElements: string[]; unfavorableElements: string[];
    favorableGroups: string[]; reasoning: string;
  };
  branchInteractions: { name: string; branches: string[]; element?: string | null }[];
  stemInteractions: { name: string; stems: string[]; element?: string | null }[];
  shenSha: { cn: string; en: string; category: string; slot: string; branch: string }[];
  luckPillars: {
    forward: boolean; startAgeYM: { years: number; months: number };
    pillars: { index: number; pillar: { name: string; stem: string; branch: string };
               startAge: number; startYear: number; stemTenGod: string }[];
  } | null;
}

// ── Small shared bits ────────────────────────────────────────────────────────

function Glyph({ char, size = 'text-4xl' }: { char: string; size?: string }) {
  return <span className={`cn ${size} leading-none`} style={{ color: colorOf(char) }}>{char}</span>;
}

function SectionTitle({ cn, en }: { cn: string; en: string }) {
  return (
    <div className="flex items-baseline gap-2 mb-3">
      <span className="cn text-gold text-lg">{cn}</span>
      <span className="text-xs text-muted font-mono tracking-widest uppercase">{en}</span>
    </div>
  );
}

const VERDICT_ID: Record<string, string> = { strong: 'Kuat', balanced: 'Seimbang', weak: 'Lemah' };

// ── Four Pillars ─────────────────────────────────────────────────────────────

const COL_LABEL: { slot: PillarA['slot']; cn: string; id: string }[] = [
  { slot: 'hour',  cn: '时', id: 'Jam' },
  { slot: 'day',   cn: '日', id: 'Hari' },
  { slot: 'month', cn: '月', id: 'Bulan' },
  { slot: 'year',  cn: '年', id: 'Tahun' },
];

function PillarsTable({ pillars }: { pillars: BaziResult['pillars'] }) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {COL_LABEL.map(({ slot, cn, id }) => {
        const p = pillars[slot];
        const isDay = slot === 'day';
        return (
          <div
            key={slot}
            className={`flex flex-col items-center gap-2 rounded-lg py-3 px-1
                        ${isDay ? 'bg-gold/10 border border-gold/30' : 'bg-elevated/50 border border-gold/10'}`}
          >
            {/* column label */}
            <div className="text-center leading-tight">
              <p className="cn text-xs text-muted">{cn}</p>
              <p className="text-[10px] text-muted/60 font-mono">{id}</p>
            </div>

            {/* ten god of stem (or 日主 for day) */}
            <p className="text-[10px] font-mono text-center min-h-[26px] leading-tight"
               style={{ color: isDay ? '#c9a84c' : '#9a8672' }}>
              {isDay ? '日主' : p.stemTenGod ?? ''}
              {!isDay && p.stemTenGod && (
                <><br /><span className="text-muted/50">{TEN_GOD_EN[p.stemTenGod]}</span></>
              )}
              {isDay && <><br /><span className="text-gold/60">Day Master</span></>}
            </p>

            {/* stem */}
            <Glyph char={p.stem} />
            {/* branch */}
            <div className="flex flex-col items-center">
              <Glyph char={p.branch} />
              <span className="text-[9px] text-muted/50 font-mono mt-0.5">{BRANCH_ANIMAL[p.branch]}</span>
            </div>

            {/* hidden stems */}
            <div className="flex flex-col items-center gap-0.5 mt-1 min-h-[40px]">
              {p.hiddenStems.map((h, i) => (
                <div key={i} className="flex items-center gap-1 leading-none">
                  <span className="cn text-sm" style={{ color: colorOf(h.stem) }}>{h.stem}</span>
                  <span className="text-[9px] text-muted/50 font-mono">{h.tenGod}</span>
                </div>
              ))}
            </div>

            {/* na yin */}
            <p className="text-[9px] text-muted/50 font-mono text-center leading-tight border-t border-gold/8 pt-1.5 w-full">
              <span className="cn text-muted/70">{p.nayin.cn}</span>
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ── Five Elements distribution ───────────────────────────────────────────────

function ElementsBar({ elements }: { elements: BaziResult['elements'] }) {
  const order: Element[] = ['木', '火', '土', '金', '水'];
  const total = order.reduce((s, e) => s + elements[e], 0) || 1;
  return (
    <div className="flex flex-col gap-2">
      {order.map((e) => {
        const n = elements[e];
        const pct = Math.round((n / total) * 100);
        return (
          <div key={e} className="flex items-center gap-2">
            <span className="cn text-base w-6 text-center" style={{ color: ELEMENT_COLOR[e] }}>{e}</span>
            <span className="text-[10px] text-muted/60 font-mono w-12">{ELEMENT_EN[e]}</span>
            <div className="flex-1 h-2.5 rounded-full bg-elevated overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: ELEMENT_COLOR[e] }} />
            </div>
            <span className="text-xs text-parchment/70 font-mono w-12 text-right">{n.toFixed(1)}</span>
            <span className="text-[10px] text-muted/50 font-mono w-9 text-right">{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Day-master strength ──────────────────────────────────────────────────────

function StrengthBar({ s }: { s: BaziResult['dayMasterStrength'] }) {
  const total = s.supporting + s.draining || 1;
  const supPct = Math.round((s.supporting / total) * 100);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-sage">Mendukung {s.supporting.toFixed(1)}</span>
        <span className="text-gold uppercase tracking-wide">{VERDICT_ID[s.verdict] ?? s.verdict}</span>
        <span className="text-ember/80">Menguras {s.draining.toFixed(1)}</span>
      </div>
      <div className="flex h-3 rounded-full overflow-hidden bg-elevated">
        <div className="h-full bg-sage/70" style={{ width: `${supPct}%` }} />
        <div className="h-full bg-ember/60" style={{ width: `${100 - supPct}%` }} />
      </div>
    </div>
  );
}

// ── Luck pillars (大运) ───────────────────────────────────────────────────────

function LuckPillarsRow({ lp }: { lp: NonNullable<BaziResult['luckPillars']> }) {
  const nowYear = new Date().getFullYear();
  return (
    <div>
      <p className="text-[10px] text-muted/60 font-mono mb-2">
        起运 {lp.startAgeYM.years} tahun {lp.startAgeYM.months} bulan · {lp.forward ? '顺行 maju' : '逆行 mundur'}
      </p>
      <div className="flex gap-1.5 overflow-x-auto pb-2">
        {lp.pillars.map((p) => {
          const next = lp.pillars.find((q) => q.index === p.index + 1);
          const isCurrent = nowYear >= p.startYear && (!next || nowYear < next.startYear);
          return (
            <div
              key={p.index}
              className={`flex-none w-16 flex flex-col items-center gap-1 rounded-lg py-2 px-1
                          ${isCurrent ? 'bg-gold/15 border border-gold/40' : 'bg-elevated/40 border border-gold/8'}`}
            >
              <span className="text-[9px] text-muted/50 font-mono">{p.startAge}th</span>
              <span className="cn text-xl leading-none" style={{ color: colorOf(p.pillar.stem) }}>{p.pillar.stem}</span>
              <span className="cn text-xl leading-none" style={{ color: colorOf(p.pillar.branch) }}>{p.pillar.branch}</span>
              <span className="text-[8px] text-muted/50 font-mono text-center leading-none">{p.stemTenGod}</span>
              <span className="text-[8px] text-muted/40 font-mono">{p.startYear}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export function BaziChart({ data }: { data: BaziResult }) {
  const dm = data.dayMaster;
  const dmEl = dm.element as Element;

  return (
    <div className="flex flex-col gap-7 animate-fade-up">

      {/* Eight characters */}
      <div className="text-center">
        <p className="cn text-2xl tracking-wide flex justify-center gap-3 flex-wrap">
          {data.eightCharacters.split(' ').map((pair, i) => (
            <span key={i}>
              {pair.split('').map((ch, j) => (
                <span key={j} style={{ color: colorOf(ch) }}>{ch}</span>
              ))}
            </span>
          ))}
        </p>
        <p className="text-xs text-muted/60 font-mono mt-2">
          日主 Day Master:{' '}
          <span style={{ color: ELEMENT_COLOR[dmEl] }}>{dm.stem} · {dm.polarity} {ELEMENT_EN[dmEl]}</span>
        </p>
        {data.solarTime && (
          <p className="text-[10px] text-muted/40 font-mono mt-1">
            真太阳时 {String(data.solarTime.correctedLocal.hour).padStart(2, '0')}:
            {String(data.solarTime.correctedLocal.minute).padStart(2, '0')}
          </p>
        )}
      </div>

      {/* Four Pillars */}
      <section>
        <SectionTitle cn="四柱" en="Four Pillars" />
        <PillarsTable pillars={data.pillars} />
      </section>

      {/* Day-master strength */}
      <section>
        <SectionTitle cn="日主强弱" en="Day Master" />
        <StrengthBar s={data.dayMasterStrength} />
      </section>

      {/* Five elements */}
      <section>
        <SectionTitle cn="五行" en="Five Elements" />
        <ElementsBar elements={data.elements} />
      </section>

      {/* Useful god */}
      <section>
        <SectionTitle cn="用神" en="Useful God (扶抑)" />
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex gap-2 items-center flex-wrap">
            <span className="text-xs text-muted font-mono">Menguntungkan:</span>
            {data.usefulGod.favorableElements.map((e) => (
              <span key={e} className="cn text-base px-2 py-0.5 rounded"
                    style={{ color: ELEMENT_COLOR[e as Element], background: 'rgba(255,255,255,0.03)' }}>
                {e} {ELEMENT_EN[e as Element]}
              </span>
            ))}
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <span className="text-xs text-muted font-mono">Kurang baik:</span>
            {data.usefulGod.unfavorableElements.map((e) => (
              <span key={e} className="cn text-base px-2 py-0.5 rounded text-muted/60">
                {e} {ELEMENT_EN[e as Element]}
              </span>
            ))}
          </div>
          <p className="text-xs text-parchment/60 font-serif leading-relaxed mt-1">
            {data.usefulGod.reasoning}
            {data.usefulGod.confidence === 'low' && (
              <span className="text-muted/50"> (chart seimbang — 用神 kurang pasti)</span>
            )}
          </p>
        </div>
      </section>

      {/* Interactions */}
      {(data.stemInteractions.length > 0 || data.branchInteractions.length > 0) && (
        <section>
          <SectionTitle cn="刑冲合害" en="Interactions" />
          <div className="flex flex-col gap-1.5">
            {data.stemInteractions.map((it, i) => (
              <p key={`s${i}`} className="text-xs font-mono text-parchment/70">
                <span className="cn text-sm text-gold/80">{it.stems.join('')}</span>
                <span className="text-muted/60"> · {it.name}</span>
                {it.element && <span style={{ color: colorOf(it.element) }}> → {it.element}</span>}
              </p>
            ))}
            {data.branchInteractions.map((it, i) => (
              <p key={`b${i}`} className="text-xs font-mono text-parchment/70">
                <span className="cn text-sm text-gold/80">{it.branches.join('')}</span>
                <span className="text-muted/60"> · {it.name}</span>
                {it.element && <span style={{ color: colorOf(it.element) }}> → {it.element}</span>}
              </p>
            ))}
          </div>
        </section>
      )}

      {/* Symbolic stars */}
      {data.shenSha.length > 0 && (
        <section>
          <SectionTitle cn="神煞" en="Symbolic Stars" />
          <div className="flex flex-wrap gap-1.5">
            {data.shenSha.map((s, i) => (
              <span key={i}
                className="text-[11px] font-mono px-2 py-1 rounded border border-gold/15 text-parchment/70">
                <span className="cn text-gold/80">{s.cn}</span>
                <span className="text-muted/50"> {s.en}</span>
                <span className="text-muted/40"> · {s.branch}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Luck pillars */}
      {data.luckPillars && (
        <section>
          <SectionTitle cn="大运" en="Luck Pillars" />
          <LuckPillarsRow lp={data.luckPillars} />
        </section>
      )}

      <p className="text-[10px] text-muted/30 font-mono text-center pt-2 border-t border-gold/8">
        天人合一 Codex · perhitungan 八字 dengan solar-term sejati (HKO 1900–2100)
      </p>
    </div>
  );
}
