'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { P5Button } from '@/components/p5ui/P5Button';
import { P5Card } from '@/components/p5ui/P5Card';
import { SemarCase, MasterReview, CorrectedInterpretation } from '@/types/case';

function ReviewContent() {
  const { id } = useParams();
  const router = useRouter();
  const [caseData, setCaseData] = useState<SemarCase | null>(null);
  const [review, setReview] = useState<MasterReview>({
    reviewedAt: '',
    reviewedBy: 'Lucky',
    overallQuality: 3,
    accuracyScore: 3,
    depthScore: 3,
    characterScore: 3,
    sensitivityScore: 3,
    whatWentWell: '',
    whatWentWrong: '',
    missedPatterns: [],
    overinterpretations: [],
    correctedInterpretations: [],
    practitionerNotes: '',
    lessonsForSemar: [],
    reinforcePatterns: [],
  });

  const [newLesson, setNewLesson] = useState('');
  const [newCorrection, setNewCorrection] = useState<CorrectedInterpretation>({
    original: '', correction: '', reason: '', chartBasis: '',
  });

  useEffect(() => {
    fetch(`/langit/semar/api/session?id=${id}`).then(r => r.json()).then(setCaseData);
  }, [id]);

  const submitReview = async () => {
    const finalReview = {
      ...review,
      reviewedAt: new Date().toISOString(),
    };

    await fetch(`/langit/semar/api/session/${id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalReview),
    });

    alert('Review saved. Semar has learned.');
    router.push('/review');
  };

  if (!caseData) return <div className="p-8 text-semar-white/50">Loading case...</div>;

  return (
    <div className="min-h-screen bg-semar-black p5-bg-pattern p-8">
      <div className="max-w-4xl mx-auto pb-20">
        <div className="mb-8">
          <h1 className="font-expose text-4xl text-semar-red uppercase tracking-widest flicker">
            Master Review
          </h1>
          <p className="font-clean text-semar-white/50 mt-2">
            Case {caseData.id} — {caseData.chartSummary.dayMaster} {caseData.chartSummary.dayMasterElement} Day Master
          </p>
          <p className="font-clean text-semar-white/30 mt-1">
            Intention: "{caseData.intention}"
          </p>
        </div>

        <P5Card rotation={-0.5} accentColor="red" className="mb-8">
          <h2 className="font-expose text-xl text-semar-red mb-4 underline">Session Conversation</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2 scrollbar-hide">
            {caseData.messages.map((msg, i) => (
              <div key={i} className={msg.role === 'semar' ? 'pl-0 pr-8' : 'pl-8 pr-0'}>
                <div className="text-[10px] font-expose text-semar-white/30 mb-1 uppercase tracking-tighter">
                  {msg.role}
                </div>
                <div className={`p-4 ${
                  msg.role === 'semar' 
                  ? 'bg-semar-deep border-l-2 border-semar-red' 
                  : 'bg-black border-r-2 border-semar-white/20'
                }`}>
                  <p className="font-clean text-semar-white/80 text-sm whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </P5Card>

        <P5Card rotation={0.5} accentColor="magenta" className="mb-8">
          <h2 className="font-expose text-xl text-semar-magenta mb-4 underline">Quality Scores</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {(['overallQuality', 'accuracyScore', 'depthScore', 'characterScore', 'sensitivityScore'] as const).map(key => (
              <div key={key}>
                <label className="text-[10px] font-expose uppercase tracking-widest text-semar-white/50 block mb-2">
                  {key.replace(/([A-Z])/g, ' $1').replace('Score', '').trim()}
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => setReview(r => ({ ...r, [key]: n }))}
                      className={`w-8 h-8 text-xs font-bold border transition-colors ${
                        review[key] >= n
                          ? 'bg-semar-magenta text-black border-semar-magenta'
                          : 'bg-transparent text-semar-white/30 border-semar-white/10'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </P5Card>

        <P5Card rotation={-0.3} accentColor="cyan" className="mb-8">
          <h2 className="font-expose text-xl text-semar-cyan mb-4 underline">Assessment</h2>
          <div className="space-y-6">
            <div>
              <label className="text-xs font-expose uppercase tracking-widest text-semar-white/50 block mb-2">
                What Semar did well in this reading:
              </label>
              <textarea
                value={review.whatWentWell}
                onChange={e => setReview(r => ({ ...r, whatWentWell: e.target.value }))}
                rows={3}
                className="w-full bg-black border border-semar-cyan/20 p-4 font-clean text-semar-white text-sm focus:border-semar-cyan outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-expose uppercase tracking-widest text-semar-white/50 block mb-2">
                What Semar got wrong or could improve:
              </label>
              <textarea
                value={review.whatWentWrong}
                onChange={e => setReview(r => ({ ...r, whatWentWrong: e.target.value }))}
                rows={3}
                className="w-full bg-black border border-semar-red/20 p-4 font-clean text-semar-white text-sm focus:border-semar-red outline-none"
              />
            </div>
          </div>
        </P5Card>

        <P5Card rotation={0.2} accentColor="gold" className="mb-8">
          <h2 className="font-expose text-xl text-semar-gold mb-4 underline">Corrected Interpretations</h2>
          <div className="space-y-4 mb-6">
            {review.correctedInterpretations.map((c, i) => (
              <div key={i} className="p-4 border border-semar-gold/20 bg-semar-deep relative group">
                <p className="text-xs text-semar-red font-bold mb-1">SAID: {c.original}</p>
                <p className="text-xs text-semar-cyan font-bold mb-1">SHOULD BE: {c.correction}</p>
                <div className="flex gap-4 mt-2 text-[10px] text-semar-white/40 italic">
                  <span>Basis: {c.chartBasis}</span>
                  <span>Reason: {c.reason}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/50 p-4 border border-white/5">
            <input
              placeholder="What Semar said..."
              value={newCorrection.original}
              onChange={e => setNewCorrection(c => ({ ...c, original: e.target.value }))}
              className="bg-semar-deep border border-white/10 p-3 text-xs font-clean text-semar-white outline-none focus:border-semar-gold"
            />
            <input
              placeholder="What it should have been..."
              value={newCorrection.correction}
              onChange={e => setNewCorrection(c => ({ ...c, correction: e.target.value }))}
              className="bg-semar-deep border border-white/10 p-3 text-xs font-clean text-semar-white outline-none focus:border-semar-gold"
            />
            <input
              placeholder="Chart basis (e.g., Jia + Geng 7K)"
              value={newCorrection.chartBasis}
              onChange={e => setNewCorrection(c => ({ ...c, chartBasis: e.target.value }))}
              className="bg-semar-deep border border-white/10 p-3 text-xs font-clean text-semar-white outline-none focus:border-semar-gold"
            />
            <input
              placeholder="Why this correction..."
              value={newCorrection.reason}
              onChange={e => setNewCorrection(c => ({ ...c, reason: e.target.value }))}
              className="bg-semar-deep border border-white/10 p-3 text-xs font-clean text-semar-white outline-none focus:border-semar-gold"
            />
          </div>
          <P5Button
            variant="ghost" size="sm" accentColor="gold"
            className="mt-4"
            onClick={() => {
              if (newCorrection.original && newCorrection.correction) {
                setReview(r => ({
                  ...r,
                  correctedInterpretations: [...r.correctedInterpretations, newCorrection],
                }));
                setNewCorrection({ original: '', correction: '', reason: '', chartBasis: '' });
              }
            }}
          >
            + Add Correction
          </P5Button>
        </P5Card>

        <P5Card rotation={-0.4} accentColor="red" className="mb-8">
          <h2 className="font-expose text-xl text-semar-red mb-4 underline">Lessons for Semar</h2>
          <div className="space-y-2 mb-6">
            {review.lessonsForSemar.map((lesson, i) => (
              <div key={i} className="p-3 border-l-2 border-semar-red bg-semar-deep text-sm text-semar-white/80">
                {lesson}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              placeholder="New lesson to remember..."
              value={newLesson}
              onChange={e => setNewLesson(e.target.value)}
              className="flex-1 bg-black border border-white/10 p-3 text-sm font-clean text-semar-white outline-none focus:border-semar-red"
            />
            <P5Button
              variant="ghost" size="sm" accentColor="red"
              onClick={() => {
                if (newLesson.trim()) {
                  setReview(r => ({
                    ...r,
                    lessonsForSemar: [...r.lessonsForSemar, newLesson.trim()],
                  }));
                  setNewLesson('');
                }
              }}
            >
              + Add
            </P5Button>
          </div>
        </P5Card>

        <div className="flex justify-center mt-12">
          <P5Button onClick={submitReview} size="lg" className="px-20">
            Submit Review — Semar Learns
          </P5Button>
        </div>
      </div>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<div>Loading Review...</div>}>
      <ReviewContent />
    </Suspense>
  );
}
