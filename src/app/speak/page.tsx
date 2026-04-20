'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { translateStem } from '@/lib/bazi-utils';

function Typewriter({ text, speed = 15 }: { text: string, speed?: number }) {
  const [displayedText, setDisplayedText] = useState('');
  useEffect(() => {
    setDisplayedText('');
    let i = 0;
    const timer = setInterval(() => {
      setDisplayedText(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(timer);
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);
  return <div className="whitespace-pre-wrap leading-relaxed">{displayedText}</div>;
}

function SpeakContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('id');
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasIntention, setHasIntention] = useState(false);
  const [intention, setIntention] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sessionId) return;
    fetch(`/langit/semar/api/session?id=${sessionId}`)
      .then(res => {
        if (!res.ok) throw new Error('Session not found');
        return res.json();
      })
      .then(data => {
        setSession(data);
        setMessages(data.history || []);
        
        // If intention exists in session, skip the declaration step
        if (data.intention && data.intention !== 'General reflection') {
          setHasIntention(true);
          setIntention(data.intention);
        }

        // Handle preset question from URL
        const q = searchParams.get('q');
        if (q) {
          const msgs: any = {
            wealth_2026: "How will my financial flow be in this 2026 Fire Horse year?",
            career_cycle: "What is the core lesson of my current 10-year luck pillar cycle?",
            love_harmony: "How does this year (2026) affect my interpersonal harmony and relationships?"
          };
          if (msgs[q]) {
            setInput(msgs[q]);
            setHasIntention(true); // Presets count as intention
          }
        }
      });
  }, [sessionId, searchParams]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const submitIntention = (e: React.FormEvent) => {
    e.preventDefault();
    if (!intention.trim()) return;
    setHasIntention(true);
    // We could call an API to update the case intention here if needed,
    // but for now, we'll just pass it in the first message.
    sendMessage(undefined, intention);
  };

  const handlePreset = (msg: string) => {
    setInput(msg);
  };

  const sendMessage = async (e?: React.FormEvent, manualMsg?: string) => {
    if (e) e.preventDefault();
    const messageToSend = manualMsg || input;
    if (!messageToSend.trim() || loading) return;
    
    const userMsg = { role: 'user', content: messageToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/langit/semar/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: messageToSend }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.content, isNew: true }]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!session) return (
    <div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center">
      <div className="text-[#D32F2F] font-black italic uppercase flex items-center gap-2">
        <span className="material-symbols-outlined animate-spin">progress_activity</span>
        CONNECTING...
      </div>
    </div>
  );

  const dm = translateStem(session.chart.日主);

  return (
    <div className="min-h-screen pb-20 md:pb-0 flex flex-col relative">
      {/* Halftone Background Pattern */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        backgroundImage: `radial-gradient(#dadada 1px, transparent 0)`,
        backgroundSize: '20px 20px'
      }} />

      {/* Top App Bar */}
      <header className="flex justify-between items-center w-full px-6 py-4 border-b-4 border-[#1a1c1c] bg-[#f9f9f9] z-50 relative">
        <button onClick={() => router.push(`/chart?id=${sessionId}`)} className="text-[#1a1a1c] active:scale-95">
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </button>
        <div className="flex flex-col items-center flex-grow">
          <h1 className="text-[#d32f2f] italic -skew-x-10 uppercase font-black tracking-tighter text-xl">KINETIC ORACLE</h1>
        </div>
        <div className="w-10 h-10 bg-[#1a1c1c] text-white flex items-center justify-center font-black text-lg">
          {session.chart.日主}
        </div>
      </header>
      <div className="bg-[#1a1c1c] h-1.5 w-full z-50 relative"></div>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center p-6 relative z-10 w-full max-w-4xl mx-auto">

        {!hasIntention ? (
          /* Initial Intention Declaration Step */
          <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-[#1a1c1c] text-white py-3 px-8 kinetic-skew inline-block mb-8">
              <h2 className="font-black italic text-2xl uppercase transform skewX(10deg)">Declare Your Intention</h2>
            </div>
            
            <div className="panel-rebel bg-white p-8">
               <p className="font-bold text-lg mb-6 leading-tight">
                 "Before the pillars speak, the seeker must speak. What area of your existence requires the Oracle's light today?"
               </p>
               <form onSubmit={submitIntention} className="space-y-6">
                  <textarea 
                    autoFocus
                    className="input-rebel min-h-[120px] text-xl resize-none"
                    placeholder="e.g. My career path in 2026, my current relationship tension..."
                    value={intention}
                    onChange={(e) => setIntention(e.target.value)}
                  />
                  <button 
                    type="submit"
                    className="btn-primary w-full text-xl"
                  >
                    <span className="kinetic-skew-reverse flex items-center justify-center gap-2">
                      OPEN THE GATES <span className="material-symbols-outlined">key</span>
                    </span>
                  </button>
               </form>
            </div>
          </div>
        ) : (
          /* The Oracle Chat Interface */
          <>
            {/* Header */}
            <div className="w-full mb-12 flex justify-start -ml-4 relative z-20">
              <div className="bg-[#1a1c1c] text-white py-3 px-8 kinetic-skew inline-block shadow-[8px_8px_0px_0px_rgba(175,16,26,1)]">
                <h2 className="font-black italic text-3xl uppercase tracking-tighter transform skewX(10deg)">THE ORACLE SPEAKS</h2>
              </div>
            </div>

            {/* Oracle Response Area */}
            <div className="w-full relative mb-12 z-10">
              <div className="absolute inset-0 bg-[#e8e8e8]" style={{ clipPath: 'polygon(3% 0, 100% 0, 97% 100%, 0 100%)', transform: 'translate(8px, 8px)' }}></div>
              <div className="bg-white border-4 border-[#D32F2F] p-8 shadow-[12px_12px_0px_0px_rgba(26,28,28,1)]" style={{ clipPath: 'polygon(5% 0, 100% 0, 95% 100%, 0 100%)' }}>
                {messages.length === 0 ? (
                  <div className="kinetic-skew transform skewX(10deg)">
                    <p className="font-bold text-2xl text-[#1a1a1c] leading-tight uppercase tracking-tight">
                      <span className="text-[#D32F2F] block mb-2 text-xl">&gt;&gt;&gt; ORACLE INITIALIZED</span>
                      "Welcome, {session.personName}. Your {dm.english} {dm.element} soul awaits guidance. What wisdom do you seek?"
                    </p>
                  </div>
                ) : (
                  <div className="space-y-8 max-h-64 overflow-y-auto">
                    {messages.filter(m => m.role === 'assistant').slice(-1).map((m, i) => (
                      <div key={i} className="kinetic-skew transform skewX(10deg)">
                        {m.isNew ? (
                          <Typewriter text={m.content} />
                        ) : (
                          <p className="font-bold text-xl text-[#1a1a1c] leading-tight uppercase tracking-tight whitespace-pre-wrap">{m.content}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* User Input Area */}
            <div className="w-full max-w-2xl bg-[#e8e8e8] p-8 kinetic-skew shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] relative z-20">
              <form onSubmit={sendMessage} className="transform skewX(10deg) flex flex-col space-y-6">
                <div className="relative w-full">
                  <input
                    className="w-full py-4 text-xl font-bold text-[#1a1c1c] uppercase bg-transparent border-b-4 border-[#1a1c1c] outline-none transition-all"
                    style={{ borderRadius: 0 }}
                    placeholder=" "
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                  />
                  <label className="absolute left-0 top-4 text-lg font-black text-[#5b403d] uppercase transition-all pointer-events-none origin-left">
                    ASK YOUR DESTINY...
                  </label>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-2">
                   {['wealth_2026', 'career_cycle', 'love_harmony'].map(q => {
                     const labels: any = { wealth_2026: 'Wealth 2026', career_cycle: 'Career Cycle', love_harmony: 'Love' };
                     const msgs: any = { 
                       wealth_2026: "How will my financial flow be in this 2026 Fire Horse year?",
                       career_cycle: "What is the core lesson of my current 10-year luck pillar cycle?",
                       love_harmony: "How does this year (2026) affect my interpersonal harmony and relationships?"
                     };
                     return (
                       <button 
                         key={q}
                         type="button"
                         onClick={() => setInput(msgs[q])}
                         className="text-[9px] font-black uppercase px-2 py-1 bg-white border border-[#1a1c1c] hover:bg-[#D32F2F] hover:text-white transition-colors"
                       >
                         {labels[q]}
                       </button>
                     );
                   })}
                </div>

                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="bg-gradient-to-br from-[#D32F2F] to-[#b71c1c] text-white py-4 px-8 self-end flex items-center gap-3 hover:shadow-[8px_8px_0px_0px_#1a1a1c] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ borderRadius: 0 }}
                >
                  <span className="font-black italic text-xl uppercase tracking-wider">CONSULT</span>
                  <span className="material-symbols-outlined text-2xl">bolt</span>
                </button>
              </form>
            </div>
          </>
        )}
      </main>

      {/* Loading Indicator */}
      {loading && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[#D32F2F] text-white px-6 py-3 kinetic-skew shadow-[4px_4px_0px_0px_#1a1a1c] z-50">
          <span className="transform skewX(10deg) inline-flex items-center gap-2 font-black italic uppercase">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            ORACLE PROCESSING...
          </span>
        </div>
      )}

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 bg-[#f9f9f9] border-t-4 border-[#1a1c1c] shadow-[8px_8px_0px_0px_rgba(26,28,28,1)]">
        <a className="text-[#1a1c1c] p-3 flex items-center justify-center hover:bg-[#1a1c1c] hover:text-white active:scale-95 w-1/4" href="#">
          <span className="material-symbols-outlined text-2xl">auto_awesome</span>
        </a>
        <a className="bg-[#D32F2F] text-white -skew-x-12 p-3 flex items-center justify-center active:scale-95 w-1/4 shadow-[inset_4px_0px_0px_0px_rgba(26,28,28,1)]" href="#">
          <span className="material-symbols-outlined text-2xl transform skewX(12deg)">bolt</span>
        </a>
        <a className="text-[#1a1c1c] p-3 flex items-center justify-center hover:bg-[#1a1c1c] hover:text-white active:scale-95 w-1/4" href="#">
          <span className="material-symbols-outlined text-2xl">history</span>
        </a>
        <a className="text-[#1a1c1c] p-3 flex items-center justify-center hover:bg-[#1a1c1c] hover:text-white active:scale-95 w-1/4" href="#">
          <span className="material-symbols-outlined text-2xl">person</span>
        </a>
      </nav>
    </div>
  );
}

export default function SpeakPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center">
        <div className="text-[#D32F2F] font-black italic uppercase">LOADING...</div>
      </div>
    }>
      <SpeakContent />
    </Suspense>
  );
}
