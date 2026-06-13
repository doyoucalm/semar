'use client';

import { useState } from 'react';
import { BaziChart, type BaziResult } from '@/components/BaziChart';

type Phase = 'idle' | 'loading' | 'done' | 'error';
type Gender = 'male' | 'female';

const TZ_OPTIONS = [
  { label: 'WIB / China−1 (UTC+7)', minutes: 7 * 60 },
  { label: 'WITA (UTC+8)',          minutes: 8 * 60 },
  { label: 'China (UTC+8)',         minutes: 8 * 60 },
  { label: 'WIT (UTC+9)',           minutes: 9 * 60 },
  { label: 'UTC+0',                 minutes: 0 },
  { label: 'UTC−5 (EST)',           minutes: -5 * 60 },
  { label: 'UTC−8 (PST)',           minutes: -8 * 60 },
];

export default function CalculatorPage() {
  const [gender,   setGender]   = useState<Gender>('male');
  const [date,     setDate]     = useState('');         // YYYY-MM-DD
  const [time,     setTime]     = useState('12:00');    // HH:MM
  const [unknownHour, setUnknownHour] = useState(false);
  const [tz,       setTz]       = useState(7 * 60);
  const [longitude, setLongitude] = useState('');       // optional
  const [advanced, setAdvanced] = useState(false);

  const [phase,  setPhase]  = useState<Phase>('idle');
  const [data,   setData]   = useState<BaziResult | null>(null);
  const [errMsg, setErrMsg] = useState('');

  async function calculate() {
    if (!date) { setErrMsg('Masukkan tanggal lahir.'); setPhase('error'); return; }

    const [y, m, d] = date.split('-').map(Number);
    const [hh, mm] = (unknownHour ? '12:00' : time).split(':').map(Number);

    setPhase('loading');
    setErrMsg('');

    try {
      const res = await fetch('/api/bazi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: y, month: m, day: d,
          hour: hh, minute: mm,
          gender,
          utcOffsetMinutes: tz,
          longitude: longitude.trim() ? Number(longitude) : undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      setData(await res.json() as BaziResult);
      setPhase('done');
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'Terjadi kesalahan.');
      setPhase('error');
    }
  }

  return (
    <div className="px-6 pt-8 pb-6 flex flex-col gap-6">
      {/* Header */}
      <div className="text-center">
        <p className="cn text-gold text-5xl mb-1">命</p>
        <h1 className="font-serif text-lg text-parchment">Kalkulator BaZi</h1>
        <p className="text-xs text-muted font-mono mt-1">八字 · empat pilar dengan solar-term sejati</p>
      </div>

      {/* Form */}
      <div className="flex flex-col gap-4">
        {/* Gender */}
        <div className="grid grid-cols-2 gap-2">
          {(['male', 'female'] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGender(g)}
              className={`py-2.5 rounded-lg border text-sm font-serif transition-colors
                          ${gender === g
                            ? 'border-gold/50 text-gold bg-gold/10'
                            : 'border-gold/15 text-muted hover:border-gold/30'}`}
            >
              {g === 'male' ? 'Pria 乾' : 'Wanita 坤'}
            </button>
          ))}
        </div>

        {/* Date */}
        <div>
          <label htmlFor="bazi-date" className="text-[10px] text-muted/60 font-mono uppercase">Tanggal lahir</label>
          <input
            id="bazi-date" type="date" value={date} min="1900-01-01" max="2100-12-31"
            onChange={(e) => setDate(e.target.value)}
            className="w-full mt-1 bg-elevated border border-gold/15 rounded-lg px-4 py-2.5
                       text-sm text-parchment font-serif focus:border-gold/40 outline-none transition-colors
                       [color-scheme:dark]"
          />
        </div>

        {/* Time */}
        <div>
          <label htmlFor="bazi-time" className="text-[10px] text-muted/60 font-mono uppercase">Jam lahir</label>
          <input
            id="bazi-time" type="time" value={time} disabled={unknownHour}
            onChange={(e) => setTime(e.target.value)}
            className="w-full mt-1 bg-elevated border border-gold/15 rounded-lg px-4 py-2.5
                       text-sm text-parchment font-serif focus:border-gold/40 outline-none transition-colors
                       disabled:opacity-40 [color-scheme:dark]"
          />
          <label className="flex items-center gap-2 mt-2 text-xs text-muted font-mono cursor-pointer">
            <input type="checkbox" checked={unknownHour} onChange={(e) => setUnknownHour(e.target.checked)}
                   className="accent-gold" />
            Jam tidak diketahui (pilar jam dilewati, pakai siang)
          </label>
        </div>

        {/* Advanced */}
        <button onClick={() => setAdvanced((a) => !a)}
                className="text-xs text-muted/60 font-mono self-start hover:text-muted transition-colors">
          {advanced ? '− ' : '+ '}Lanjutan (zona waktu · bujur)
        </button>
        {advanced && (
          <div className="flex flex-col gap-3 -mt-1 pl-1 border-l border-gold/10">
            <div className="pl-3">
              <label htmlFor="bazi-tz" className="text-[10px] text-muted/60 font-mono uppercase">Zona waktu lahir</label>
              <select
                id="bazi-tz" value={tz} onChange={(e) => setTz(Number(e.target.value))}
                className="w-full mt-1 bg-elevated border border-gold/15 rounded-lg px-3 py-2.5
                           text-sm text-parchment font-serif focus:border-gold/40 outline-none [color-scheme:dark]"
              >
                {TZ_OPTIONS.map((o, i) => <option key={i} value={o.minutes}>{o.label}</option>)}
              </select>
            </div>
            <div className="pl-3">
              <label htmlFor="bazi-lng" className="text-[10px] text-muted/60 font-mono uppercase">
                Bujur lahir (opsional · 真太阳时)
              </label>
              <input
                id="bazi-lng" type="number" step="0.1" placeholder="cth. 107.6 (Bandung)"
                value={longitude} onChange={(e) => setLongitude(e.target.value)}
                className="w-full mt-1 bg-elevated border border-gold/15 rounded-lg px-4 py-2.5
                           text-sm text-parchment placeholder-muted/50 font-serif
                           focus:border-gold/40 outline-none transition-colors"
              />
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={calculate}
          disabled={phase === 'loading'}
          className="mt-1 py-3 rounded-full border border-gold/40 text-gold font-serif text-sm
                     tracking-wide hover:bg-gold/10 active:scale-95 transition-all duration-150
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {phase === 'loading' ? 'Menghitung…' : '✦ Hitung BaZi'}
        </button>

        {phase === 'error' && (
          <p className="text-xs text-ember/70 font-mono text-center">{errMsg}</p>
        )}
      </div>

      {/* Loading */}
      {phase === 'loading' && (
        <div className="flex flex-col items-center gap-2 py-6">
          <p className="cn text-gold/50 text-3xl animate-pulse">命</p>
          <p className="text-xs text-muted/60 font-mono">Membaca solar-term…</p>
        </div>
      )}

      {/* Result */}
      {phase === 'done' && data && (
        <div className="border-t border-gold/10 pt-6">
          <BaziChart data={data} />
        </div>
      )}
    </div>
  );
}
