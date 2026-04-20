import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'MiniMax-M2.7';

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({
      apiKey: process.env.MINIMAX_API_KEY!,
      baseURL: 'https://api.minimax.io/anthropic',
    });
  }
  return client;
}

export interface MinimaxResponse {
  content: string;
  tokensUsed: number;
  model: string;
}

export async function askMinimax(
  systemPrompt: string,
  userMessage: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<MinimaxResponse> {
  const messages: Anthropic.MessageParam[] = [
    ...history.slice(-20).map(h => ({
      role: h.role,
      content: h.content,
    })),
    { role: 'user', content: userMessage },
  ];

  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 4096,
    temperature: 0.7,
    system: systemPrompt,
    messages,
  });

  const content = response.content
    .filter(b => b.type === 'text')
    .map(b => (b as Anthropic.TextBlock).text)
    .join('');

  return {
    content: content || '...',
    tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
    model: MODEL,
  };
}
