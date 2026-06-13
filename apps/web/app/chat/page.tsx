'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { getEntries } from '@/lib/diary-store';
import { todayLocal } from '@/lib/profile';
import type { ChatMessage } from '@/app/api/chat/route';

type Status = 'idle' | 'thinking' | 'error';

const GREETING = `慧 — selamat datang. Tanyakan apa yang perlu dilihat hari ini.`;

export default function ChatPage() {
  const [messages,  setMessages]  = useState<ChatMessage[]>([]);
  const [input,     setInput]     = useState('');
  const [status,    setStatus]    = useState<Status>('idle');
  const [errMsg,    setErrMsg]    = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  // Auto-resize textarea
  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  }

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || status === 'thinking') return;

    const newMessages: ChatMessage[] = [
      ...messages,
      { role: 'user', content: text },
    ];
    setMessages(newMessages);
    setInput('');
    setStatus('thinking');
    setErrMsg('');

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    // Get diary context (last 7 days)
    const today = todayLocal();
    const sevenDaysAgo = new Date(today + 'T12:00:00Z');
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);
    const from = sevenDaysAgo.toISOString().slice(0, 10);
    const diary = getEntries({ from, to: today });

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, diary }),
      });

      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      const data = await res.json() as { reply: string };
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      setStatus('idle');
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'Terjadi kesalahan.');
      setStatus('error');
    }
  }, [input, messages, status]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">

      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-gold/10 flex-none">
        <div className="flex items-baseline gap-2">
          <span className="cn text-gold text-2xl">語</span>
          <h1 className="font-serif text-base text-parchment">Chat</h1>
        </div>
        <p className="text-xs text-muted/50 font-mono mt-0.5">konteks hari ini aktif</p>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">

        {/* Greeting */}
        <div className="flex gap-2">
          <span className="cn text-gold/60 text-base flex-none mt-0.5">天</span>
          <p className="text-sm text-parchment/70 font-serif leading-relaxed">
            {GREETING}
          </p>
        </div>

        {/* Messages */}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}>
            {m.role === 'assistant' && (
              <span className="cn text-gold/60 text-base flex-none mt-0.5">天</span>
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed font-serif
                          ${m.role === 'user'
                            ? 'bg-gold/10 text-parchment/90 border border-gold/20'
                            : 'text-parchment/80'}`}
            >
              {m.content.split('\n').map((line, j, arr) => (
                <span key={j}>
                  {line}
                  {j < arr.length - 1 && <br />}
                </span>
              ))}
            </div>
          </div>
        ))}

        {/* Thinking indicator */}
        {status === 'thinking' && (
          <div className="flex gap-2">
            <span className="cn text-gold/40 text-base flex-none mt-0.5">天</span>
            <div className="flex gap-1.5 items-center py-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gold/40 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-gold/40 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-gold/40 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="flex gap-2">
            <span className="text-ember/60 text-base flex-none">✕</span>
            <p className="text-xs text-ember/70 font-mono py-1">{errMsg}</p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="flex-none px-4 pb-4 pt-2 border-t border-gold/10">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Tanya Semar…"
            rows={1}
            disabled={status === 'thinking'}
            className="flex-1 bg-elevated border border-gold/15 rounded-lg px-4 py-2.5
                       text-sm text-parchment placeholder-muted/50 font-serif resize-none
                       focus:border-gold/40 outline-none transition-colors
                       disabled:opacity-50"
          />
          <button
            onClick={() => void send()}
            disabled={!input.trim() || status === 'thinking'}
            className="w-11 h-11 rounded-full border border-gold/25 bg-elevated
                       flex items-center justify-center text-gold/70
                       hover:border-gold/50 hover:text-gold
                       active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed
                       transition-all duration-150"
            aria-label="Kirim"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 13V3M3 8l5-5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <p className="text-[10px] text-muted/50 font-mono text-center mt-1.5">
          Enter kirim · Shift+Enter baris baru
        </p>
      </div>
    </div>
  );
}
