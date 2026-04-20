import { NextRequest, NextResponse } from 'next/server';
import { askMinimax } from '@/lib/minimax';
import { getCase, addMessage } from '@/lib/case-store';
import { buildSemarPrompt } from '@/lib/semar-prompt';

export async function POST(req: NextRequest) {
  try {
    const { sessionId, message } = await req.json();

    if (!sessionId || !message) {
      return NextResponse.json({ error: 'Missing sessionId or message' }, { status: 400 });
    }

    const caseData = await getCase(sessionId);
    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    // Prepare system prompt with learning and knowledge
    const systemPrompt = await buildSemarPrompt(
      JSON.stringify(caseData.chart),
      caseData.chartSummary,
      caseData.intention
    );
    
    // Convert CaseMessage to askMinimax history format
    const history = caseData.messages.map(m => ({
      role: m.role === 'semar' ? 'assistant' as const : 'user' as const,
      content: m.content
    }));

    const response = await askMinimax(systemPrompt, message, history);

    // Persist messages to the case
    await addMessage(sessionId, 'person', message);
    await addMessage(sessionId, 'semar', response.content);

    return NextResponse.json({
      content: response.content,
      sessionId: caseData.id
    });
  } catch (err: any) {
    console.error('Chat API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
