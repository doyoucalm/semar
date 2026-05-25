/**
 * POST /api/chat
 *
 * Semar conversational interface backed by MiniMax M2.7.
 * System prompt is grounded in today's CoreData (BaZi, Weton, transit)
 * + optional last-N-days diary context from client.
 *
 * The model stays in voice canon: observational, non-prescriptive.
 * It references actual chart symbols — never invents.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDailyCore } from '@/lib/engines-server';
import type { WebDiaryEntry } from '@/lib/diary-types';
import { BAZI_STEM, BAZI_BRANCH, NEPTU_BRIEF, WUKU_BRIEF, TRANSIT_ASPECT } from '@/lib/meanings';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ── System prompt builder ─────────────────────────────────────────────────────

function buildSystemPrompt(diary: WebDiaryEntry[]): string {
  const core = getDailyCore();
  const { bazi, transit, weton, localDate } = core;

  const stem   = bazi.today[0] ?? '';
  const branch = bazi.today[1] ?? '';
  const stemBrief   = BAZI_STEM[stem]?.split(' — ')[1]   ?? stem;
  const branchBrief = BAZI_BRANCH[branch]?.split(' — ')[1] ?? branch;
  const neptuBrief  = NEPTU_BRIEF[weton.neptu]  ?? '';
  const wukuBrief   = WUKU_BRIEF[weton.wuku]    ?? '';
  const aspectBrief = transit ? (TRANSIT_ASPECT[transit.kind] ?? transit.kind) : '';

  const lines: string[] = [
    `Kamu adalah Semar — sistem sintesis divinasi multi-mesin. Suaramu: ringkas, kontemplatif, tidak preskriptif.`,
    `Prinsip: "Codex tidak memberi jawaban. Codex memberi mata."`,
    ``,
    `Konteks hari ini (${localDate}):`,
    `- Pilar BaZi: ${bazi.today} — ${stemBrief}; ${branchBrief}`,
    `- Weton: ${weton.hari} ${weton.pasaran}, neptu ${weton.neptu} (${neptuBrief}), wuku ${weton.wuku} (${wukuBrief})`,
  ];

  if (transit) {
    lines.push(`- Transit aktif: ${transit.planet} ${transit.kind} ${transit.natal}, orb ${transit.orb.toFixed(1)}° ${transit.motion} — ${aspectBrief}`);
  }

  lines.push(`- Natal: ${bazi.natal}`);

  // Diary context (last few entries)
  if (diary.length > 0) {
    lines.push(``, `Bacaan terkini dari diary:`);
    for (const e of diary.slice(-6)) { // last 6 entries max
      const tarot = e.payload['tarot'] as Array<{ position: string; card: string; reversed: boolean }> | undefined;
      const iching = e.payload['iching'] as { primary?: { number: number; cn: string; en?: string }; relating?: { number: number; cn: string } | null; changingLines?: number[] } | undefined;

      if (tarot?.length) {
        const cards = tarot.map(t => `${t.position}: ${t.card}${t.reversed ? ' ↓' : ''}`).join(', ');
        lines.push(`  [${e.localDate}] Tarot — ${cards}${e.question ? ` ("${e.question}")` : ''}`);
      }
      if (iching?.primary?.cn) {
        let row = `  [${e.localDate}] I-Ching — #${iching.primary.number} ${iching.primary.cn}${iching.primary.en ? ` (${iching.primary.en})` : ''}`;
        if (iching.relating) row += ` → #${iching.relating.number} ${iching.relating.cn}`;
        if (e.question) row += ` ("${e.question}")`;
        lines.push(row);
      }
    }
  }

  lines.push(
    ``,
    `Aturan respons (PENTING — ikuti ketat):`,
    `- JANGAN gunakan markdown (##, **, tabel, bullet list). Tulis prosa mengalir.`,
    `- JANGAN saran langsung ("kamu harus...", "sebaiknya kamu..."). Bahasa observatif saja ("pola ini menunjukkan...", "simbol ini menyiratkan...").`,
    `- JANGAN sebut simbol, planet, atau hexagram yang TIDAK ada di konteks di atas.`,
    `- Jawab Bahasa Indonesia. Boleh sisipkan nama kartu / hexagram dalam Inggris/Mandarin.`,
    `- Ringkas: 2-4 kalimat untuk pertanyaan biasa. Maks 200 kata untuk pertanyaan mendalam.`,
    `- Boleh tanya satu pertanyaan klarifikasi jika pertanyaan terlalu luas.`,
  );

  return lines.join('\n');
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: { messages?: ChatMessage[]; diary?: WebDiaryEntry[] };
  try {
    body = await req.json() as typeof body;
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 });
  }

  const { messages = [], diary = [] } = body;

  if (messages.length === 0 || messages[messages.length - 1]?.role !== 'user') {
    return NextResponse.json({ error: 'last message must be user' }, { status: 400 });
  }

  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'MINIMAX_API_KEY not configured' }, { status: 500 });
  }

  const systemPrompt = buildSystemPrompt(diary);

  // Keep last 20 turns to avoid ballooning context
  const trimmed = messages.slice(-20);

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
        messages: [
          { role: 'system', content: systemPrompt },
          ...trimmed,
        ],
        max_tokens: 1200,
        temperature: 0.5,
      }),
    });
  } catch (err) {
    console.error('[chat] fetch error:', err);
    return NextResponse.json({ error: 'MiniMax unreachable' }, { status: 502 });
  }

  if (!mmRes.ok) {
    const errText = await mmRes.text();
    console.error('[chat] MiniMax error:', mmRes.status, errText);
    return NextResponse.json({ error: 'chat failed' }, { status: 500 });
  }

  const data = await mmRes.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  let reply = data.choices?.[0]?.message?.content ?? '';
  // Strip thinking tags (closed and unclosed)
  reply = reply.replace(/<think>[\s\S]*?<\/think>/g, '');
  reply = reply.replace(/<think>[\s\S]*$/g, '');
  reply = reply.trim();

  if (!reply) {
    return NextResponse.json({ error: 'empty reply' }, { status: 500 });
  }

  return NextResponse.json({ reply });
}
