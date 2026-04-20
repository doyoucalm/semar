import { NextResponse } from 'next/server';
import { listCases, getCase } from '@/lib/case-store';

export async function GET() {
  const allCases = await listCases();
  const reviewedCases = allCases.filter(c => c.status === 'reviewed');

  let totalQuality = 0;
  let totalAccuracy = 0;
  let totalLessons = 0;
  let totalConfirmed = 0;

  for (const c of reviewedCases) {
    const fullCase = await getCase(c.id);
    if (fullCase) {
      if (fullCase.masterReview) {
        totalQuality += fullCase.masterReview.overallQuality;
        totalAccuracy += (fullCase.masterReview as any).accuracyScore || 0;
      }
      totalLessons += (fullCase.lessonsLearned || []).length;
      totalConfirmed += (fullCase.patternsConfirmed || []).length;
    }
  }

  const stats = {
    totalSessions: allCases.length,
    reviewedSessions: reviewedCases.length,
    pendingReview: allCases.filter(c => c.status === 'closed' || c.status === 'active').length,
    averageQuality: reviewedCases.length > 0
      ? (totalQuality / reviewedCases.length).toFixed(1) : 'N/A',
    averageAccuracy: reviewedCases.length > 0
      ? (totalAccuracy / reviewedCases.length).toFixed(1) : 'N/A',
    totalLessonsLearned: totalLessons,
    patternsConfirmed: totalConfirmed,
    dayMasterDistribution: countByField(allCases, 'dayMaster'),
  };

  return NextResponse.json(stats);
}

function countByField(cases: any[], field: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const c of cases) {
    const val = c[field] || 'unknown';
    counts[val] = (counts[val] || 0) + 1;
  }
  return counts;
}
