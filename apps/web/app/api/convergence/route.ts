/**
 * POST /api/convergence
 *
 * Accepts raw diary entries, pre-aggregates them server-side,
 * then sends a structured prompt to MiniMax M2.7.
 * Returns a 3-block Convergence Digest in Bahasa Indonesia.
 *
 * The LLM never sees raw chat history — only pre-aggregated symbol lists.
 * This structurally bounds hallucination to symbols that actually appeared.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { WebDiaryEntry } from '@/lib/diary-types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface TarotRow {
  date: string;
  position: string;
  card: string;
  reversed: boolean;
  question?: string;
}

interface IChingRow {
  date: string;
  number: number;
  cn: string;
  en?: string;
  changingLines: number[];
  relating: { number: number; cn: string } | null;
  question?: string;
}

interface TransitRow {
  planet: string;
  natal: string;
  kind: string;
}

interface WeekSummary {
  dateRange: { from: string; to: string };
  totalEntries: number;
  tarot: TarotRow[];
  iching: IChingRow[];
  baziPillars: string[];
  wetonDays: string[];
  transits: TransitRow[];
}

// ── Aggregation ───────────────────────────────────────────────────────────────

function aggregate(entries: WebDiaryEntry[]): WeekSummary {
  const dates = [...entries.map(e => e.localDate)].sort();
  const summary: WeekSummary = {
    dateRange: { from: dates[0] ?? '', to: dates[dates.length - 1] ?? '' },
    totalEntries: entries.length,
    tarot: [],
    iching: [],
    baziPillars: [],
    wetonDays: [],
    transits: [],
  };

  const seenTransits = new Set<string>();

  for (const e of entries) {
    const p = e.payload;

    // Tarot
    const tarotArr = p['tarot'] as Array<{ position: string; card: string; reversed: boolean }> | undefined;
    if (tarotArr) {
      for (const t of tarotArr) {
        if (t.card) {
          summary.tarot.push({ date: e.localDate, position: t.position, card: t.card, reversed: t.reversed, question: e.question });
        }
      }
    }

    // I-Ching
    const ichingObj = p['iching'] as {
      primary?: { number: number; cn: string; en?: string };
      relating?: { number: number; cn: string } | null;
      changingLines?: number[];
    } | undefined;
    if (ichingObj?.primary?.cn) {
      summary.iching.push({
        date: e.localDate,
        number: ichingObj.primary.number,
        cn: ichingObj.primary.cn,
        en: ichingObj.primary.en,
        changingLines: (ichingObj.changingLines ?? []),
        relating: ichingObj.relating ?? null,
        question: e.question,
      });
    }

    // BaZi day pillar
    const bazi = p['bazi'] as { today?: string } | undefined;
    if (bazi?.today) summary.baziPillars.push(bazi.today);

    // Weton
    const weton = p['weton'] as { hari?: string; pasaran?: string; neptu?: number } | undefined;
    if (weton?.hari && weton?.pasaran) {
      summary.wetonDays.push(`${weton.hari} ${weton.pasaran}${weton.neptu != null ? ` (neptu ${weton.neptu})` : ''}`);
    }

    // Transit (deduplicate by planet+kind+natal)
    const transit = p['transit'] as { planet?: string; natal?: string; kind?: string } | undefined;
    if (transit?.planet && transit?.natal && transit?.kind) {
      const key = `${transit.planet}|${transit.kind}|${transit.natal}`;
      if (!seenTransits.has(key)) {
        seenTransits.add(key);
        summary.transits.push({ planet: transit.planet, natal: transit.natal, kind: transit.kind });
      }
    }
  }

  return summary;
}

// ── Prompt builder ────────────────────────────────────────────────────────────

function buildPrompt(s: WeekSummary): string {
  const lines: string[] = [];

  lines.push(
    `Kamu adalah Semar — mesin sintesis lintas sistem divinasi. Suaramu: ringkas, kontemplatif, non-preskriptif. Codex tidak memberi jawaban — Codex memberi mata.`,
    ``,
    `Di bawah ini adalah ringkasan terstruktur dari ${s.totalEntries} catatan divinasi antara ${s.dateRange.from} hingga ${s.dateRange.to}.`,
    `Hasilkan TIGA blok berlabel persis seperti format di bawah. Setiap blok adalah prosa padat, tanpa sub-list. Bahasa Indonesia.`,
    ``,
    `=== DATA AKTUAL ===`,
  );

  // BaZi
  if (s.baziPillars.length) {
    const unique = [...new Set(s.baziPillars)];
    lines.push(`BaZi hari (${s.baziPillars.length} hari): ${unique.join(', ')}`);
  }

  // Weton
  if (s.wetonDays.length) {
    const unique = [...new Set(s.wetonDays)];
    lines.push(`Weton: ${unique.join(' · ')}`);
  }

  // Transits
  if (s.transits.length) {
    lines.push(`Transit aktif: ${s.transits.map(t => `${t.planet} ${t.kind} ${t.natal}`).join(', ')}`);
  }

  // Tarot
  if (s.tarot.length) {
    lines.push(``, `Tarot (${s.tarot.length} kartu):`);
    for (const d of s.tarot) {
      lines.push(`  ${d.date} · ${d.position}: ${d.card}${d.reversed ? ' ↓terbalik' : ''}${d.question ? ` | q: "${d.question}"` : ''}`);
    }
  }

  // I-Ching
  if (s.iching.length) {
    lines.push(``, `I-Ching (${s.iching.length} lemparan):`);
    for (const h of s.iching) {
      let row = `  ${h.date} · #${h.number} ${h.cn}${h.en ? ` (${h.en})` : ''}`;
      if (h.changingLines.length) row += ` — ${h.changingLines.length} garis berubah`;
      if (h.relating) row += ` → #${h.relating.number} ${h.relating.cn}`;
      if (h.question) row += ` | q: "${h.question}"`;
      lines.push(row);
    }
  }

  // Format instructions
  lines.push(
    ``,
    `=== FORMAT OUTPUT (ikuti persis) ===`,
    ``,
    `**HITUNGAN**`,
    `[angka saja: berapa kartu tarot, berapa lemparan I-Ching, berapa hari BaZi tercatat. Simbol yang paling sering muncul (jika ada). TANPA interpretasi.]`,
    ``,
    `**KONVERGENSI**`,
    `[Satu paragraf, maks 90 kata: di mana simbol-simbol ini menunjuk ke tema yang sama? Deskripsikan secara orang ketiga, observatif. Hanya boleh menyebut simbol yang ada di DATA AKTUAL di atas.]`,
    ``,
    `**NEGASI**`,
    `[Satu paragraf, maks 90 kata: apa yang *tidak* hadir minggu ini — apa yang hening, tidak ditegaskan, atau bertentangan? Ini adalah penyeimbang terhadap bias konfirmasi.]`,
    ``,
    `---`,
    `_${[
      s.tarot.length && 'Tarot',
      s.iching.length && 'I-Ching',
      s.baziPillars.length && 'BaZi',
      s.wetonDays.length && 'Weton',
      s.transits.length && 'Astrology',
    ].filter(Boolean).join(' · ')} · ${s.totalEntries} catatan · ${s.dateRange.from} – ${s.dateRange.to}_`,
  );

  return lines.join('\n');
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: { entries?: WebDiaryEntry[] };
  try {
    body = await req.json() as { entries?: WebDiaryEntry[] };
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 });
  }

  const { entries } = body;
  if (!entries || entries.length === 0) {
    return NextResponse.json({ error: 'no entries provided' }, { status: 400 });
  }

  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'MINIMAX_API_KEY not configured' }, { status: 500 });
  }

  const summary = aggregate(entries);
  const prompt = buildPrompt(summary);

  let mmRes: Response;
  try {
    mmRes = await fetch('https://api.minimax.io/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.7',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,   // thinking tokens + output; M2.7 reasoning needs headroom
        temperature: 0.35,
      }),
    });
  } catch (err) {
    console.error('[convergence] fetch error:', err);
    return NextResponse.json({ error: 'MiniMax unreachable' }, { status: 502 });
  }

  if (!mmRes.ok) {
    const errText = await mmRes.text();
    console.error('[convergence] MiniMax error:', mmRes.status, errText);
    return NextResponse.json({ error: 'synthesis failed' }, { status: 500 });
  }

  const data = await mmRes.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  let content = data.choices?.[0]?.message?.content ?? '';
  // Strip MiniMax thinking tags (closed blocks)
  content = content.replace(/<think>[\s\S]*?<\/think>/g, '');
  // Strip unclosed think block (model hit max_tokens mid-think — no closing tag)
  content = content.replace(/<think>[\s\S]*$/g, '');
  content = content.trim();

  return NextResponse.json({
    digest: content,
    meta: {
      entries: entries.length,
      from: summary.dateRange.from,
      to: summary.dateRange.to,
    },
  });
}
