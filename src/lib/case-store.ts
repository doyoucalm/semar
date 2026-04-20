// ============================================================
// Case Store — CRUD for Semar's growing case library
//
// Now using Prisma for persistence (SQLite).
// ============================================================

import { SemarCase, MasterReview, PersonFeedback, Observation } from '@/types/case';
import { prisma } from './prisma';

// ---- CREATE ----

export async function createCase(caseData: SemarCase): Promise<string> {
  const newCase = await prisma.case.create({
    data: {
      id: caseData.id,
      personId: caseData.personId,
      personName: caseData.personName,
      intention: caseData.intention,
      status: caseData.status,
      chart: JSON.stringify(caseData.chart),
      chartSummary: JSON.stringify(caseData.chartSummary),
      observations: JSON.stringify(caseData.observations || []),
      lessonsLearned: JSON.stringify(caseData.lessonsLearned || []),
      patternsConfirmed: JSON.stringify(caseData.patternsConfirmed || []),
      patternsCorrected: JSON.stringify(caseData.patternsCorrected || []),
      tags: JSON.stringify(caseData.tags || []),
      overallResonance: caseData.personFeedback?.overallResonance || 0,
      reflection: caseData.personFeedback?.reflection || '',
      // masterReview is not initially set on creation usually
    }
  });

  return newCase.id;
}

// ---- READ ----

export async function getCase(id: string): Promise<SemarCase | null> {
  const c = await prisma.case.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  if (!c) return null;

  const masterReview = c.lessonsLearned ? {
    overallQuality: c.overallResonance, // Rough mapping
    whatWentWell: '',
    whatWentWrong: '',
    correctedInterpretations: [],
    reinforcePatterns: [],
    lessonsForSemar: JSON.parse(c.lessonsLearned || '[]'),
    masterReflection: ''
  } : undefined;

  return {
    id: c.id,
    personId: c.personId,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    chart: JSON.parse(c.chart),
    chartSummary: JSON.parse(c.chartSummary),
    personName: c.personName,
    intention: c.intention || '',
    messages: c.messages.map(m => ({
      role: m.role as any,
      content: m.content,
      timestamp: m.createdAt.toISOString()
    })),
    observations: JSON.parse(c.observations || '[]'),
    personFeedback: {
      overallResonance: c.overallResonance,
      confirmations: [], 
      corrections: [],
      groundTruth: [],
      reflection: c.reflection || ''
    },
    masterReview: masterReview as any, // Full mapping would need extra fields in DB
    lessonsLearned: JSON.parse(c.lessonsLearned || '[]'),
    patternsConfirmed: JSON.parse(c.patternsConfirmed || '[]'),
    patternsCorrected: JSON.parse(c.patternsCorrected || '[]'),
    status: c.status as any,
    tags: JSON.parse(c.tags || '[]'),
    similarCaseIds: []
  };
}

export async function listCases(
  filter?: { status?: string; dayMaster?: string }
) {
  const cases = await prisma.case.findMany({
    orderBy: { createdAt: 'desc' }
  });

  // Basic filtering in JS for simplicity, or could be in Prisma
  let filtered = cases;
  if (filter?.status) {
    filtered = filtered.filter(c => c.status === filter.status);
  }
  if (filter?.dayMaster) {
    filtered = filtered.filter(c => JSON.parse(c.chartSummary).dayMaster === filter.dayMaster);
  }

  return filtered.map(c => {
    const summary = JSON.parse(c.chartSummary);
    return {
      id: c.id,
      createdAt: c.createdAt.toISOString(),
      status: c.status as any,
      dayMaster: summary.dayMaster,
      dayMasterElement: summary.dayMasterElement,
      dayBranch: summary.dayBranch,
      monthBranch: summary.monthBranch,
      intention: c.intention || '',
      tags: JSON.parse(c.tags || '[]'),
      lessonsLearned: JSON.parse(c.lessonsLearned || '[]'),
    };
  });
}

// ---- UPDATE ----

export async function updateCase(
  id: string,
  updates: Partial<SemarCase>
): Promise<void> {
  await prisma.case.update({
    where: { id },
    data: {
      status: updates.status,
      intention: updates.intention,
      overallResonance: updates.personFeedback?.overallResonance,
      reflection: updates.personFeedback?.reflection,
      observations: updates.observations ? JSON.stringify(updates.observations) : undefined,
      lessonsLearned: updates.lessonsLearned ? JSON.stringify(updates.lessonsLearned) : undefined,
      patternsConfirmed: updates.patternsConfirmed ? JSON.stringify(updates.patternsConfirmed) : undefined,
      tags: updates.tags ? JSON.stringify(updates.tags) : undefined,
    }
  });
}

// ---- ADD MESSAGES ----

export async function addMessage(
  caseId: string,
  role: 'semar' | 'person' | 'system',
  content: string
): Promise<void> {
  await prisma.message.create({
    data: {
      caseId,
      role,
      content
    }
  });
}

// ---- ADD OBSERVATION ----

export async function addObservation(
  caseId: string,
  observation: Observation
): Promise<void> {
  const caseData = await getCase(caseId);
  if (!caseData) throw new Error(`Case ${caseId} not found`);

  const observations = [...caseData.observations, observation];
  await updateCase(caseId, { observations });
}

// ---- SAVE MASTER REVIEW ----

export async function saveMasterReview(
  caseId: string,
  review: MasterReview
): Promise<void> {
  const caseData = await getCase(caseId);
  if (!caseData) throw new Error(`Case ${caseId} not found`);

  // Extract lessons from the review
  const lessons = [
    ...(review.lessonsForSemar || []),
    ...(review.correctedInterpretations?.map(c =>
      `When seeing ${c.chartBasis}: instead of "${c.original}", the reading should be "${c.correction}" because ${c.reason}`
    ) || []),
  ];

  await prisma.case.update({
    where: { id: caseId },
    data: {
      lessonsLearned: JSON.stringify(lessons),
      patternsConfirmed: JSON.stringify(review.reinforcePatterns
        ?.filter(p => p.confirmed)
        .map(p => `${p.pattern}: ${p.observation} → ${p.realWorldOutcome}`) || []),
      patternsCorrected: JSON.stringify(review.reinforcePatterns
        ?.filter(p => !p.confirmed)
        .map(p => `${p.pattern}: expected "${p.observation}" but actually "${p.realWorldOutcome}"`) || []),
      status: 'reviewed',
      overallResonance: review.overallQuality,
    }
  });
}
