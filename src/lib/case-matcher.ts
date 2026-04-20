// ============================================================
// Case Matcher — Finds similar past cases for context injection
//
// When Semar reads a new chart, we search the case library
// for similar charts that have been reviewed. The lessons from
// those cases get injected into Semar's prompt.
//
// This is how Semar LEARNS. Not through fine-tuning.
// Through accumulated experience, exactly like a human master.
// ============================================================

import { listCases, getCase } from './case-store';
import { ChartSummary, CaseMatch } from '@/types/case';

interface MatchWeights {
  dayMaster: number;         // Same DM = very relevant
  dayMasterElement: number;  // Same element = somewhat relevant
  dayBranch: number;
  monthBranch: number;       // Same season = relevant
  tenGodOverlap: number;     // Similar ten god profile
  starOverlap: number;       // Same symbolic stars
  interactionOverlap: number;// Similar interactions
  intentionSimilarity: number;// Similar life question
}

const DEFAULT_WEIGHTS: MatchWeights = {
  dayMaster: 30,
  dayMasterElement: 15,
  dayBranch: 10,
  monthBranch: 15,
  tenGodOverlap: 10,
  starOverlap: 5,
  interactionOverlap: 10,
  intentionSimilarity: 5,
};

export async function findSimilarCases(
  chartSummary: ChartSummary,
  intention: string,
  maxResults: number = 5,
): Promise<CaseMatch[]> {
  // Only search reviewed cases — unreviewed cases haven't been validated
  const allCases = await listCases({ status: 'reviewed' });

  const matches: CaseMatch[] = [];

  for (const indexEntry of allCases) {
    let score = 0;
    const reasons: string[] = [];

    // Day Master match (most important)
    if (indexEntry.dayMaster === chartSummary.dayMaster) {
      score += DEFAULT_WEIGHTS.dayMaster;
      reasons.push(`Same Day Master: ${chartSummary.dayMaster}`);
    } else if (indexEntry.dayMasterElement === chartSummary.dayMasterElement) {
      score += DEFAULT_WEIGHTS.dayMasterElement;
      reasons.push(`Same DM element: ${chartSummary.dayMasterElement}`);
    }

    // Day Branch match
    if (indexEntry.dayBranch === chartSummary.dayBranch) {
      score += DEFAULT_WEIGHTS.dayBranch;
      reasons.push(`Same Day Branch: ${chartSummary.dayBranch}`);
    }

    // Month Branch match (seasonal context)
    if (indexEntry.monthBranch === chartSummary.monthBranch) {
      score += DEFAULT_WEIGHTS.monthBranch;
      reasons.push(`Same birth season`);
    }

    // Tag overlap (ten gods, stars, interactions are in tags)
    const tagOverlap = indexEntry.tags.filter(t =>
      chartSummary.tenGodProfile.includes(t) ||
      chartSummary.symbolicStars.includes(t) ||
      chartSummary.interactionTypes.includes(t)
    );
    if (tagOverlap.length > 0) {
      score += (tagOverlap.length / Math.max(indexEntry.tags.length, 1)) *
               (DEFAULT_WEIGHTS.tenGodOverlap + DEFAULT_WEIGHTS.starOverlap + DEFAULT_WEIGHTS.interactionOverlap);
      reasons.push(`Shared patterns: ${tagOverlap.join(', ')}`);
    }

    // Simple intention keyword matching
    const intentionWords = intention.toLowerCase().split(/\s+/);
    const caseIntentionWords = indexEntry.intention.toLowerCase().split(/\s+/);
    const wordOverlap = intentionWords.filter(w =>
      caseIntentionWords.includes(w) && w.length > 3
    );
    if (wordOverlap.length > 0) {
      score += DEFAULT_WEIGHTS.intentionSimilarity;
      reasons.push(`Similar intention keywords: ${wordOverlap.join(', ')}`);
    }

    if (score > 0) {
      matches.push({
        caseId: indexEntry.id,
        similarityScore: score / 100,
        matchReasons: reasons,
        keyLessons: indexEntry.lessonsLearned,
      });
    }
  }

  // Sort by similarity score, return top N
  return matches
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, maxResults);
}

/**
 * Build the "learning context" string that gets injected into Semar's prompt.
 * This is the accumulated wisdom from past cases.
 */
export async function buildLearningContext(
  chartSummary: ChartSummary,
  intention: string,
): Promise<string> {
  const matches = await findSimilarCases(chartSummary, intention, 3);

  if (matches.length === 0) {
    return `You have not yet seen a chart similar to this one. Read carefully from first principles. Be honest about what you see and what you are unsure about.`;
  }

  let context = `## Wisdom from Past Cases\n\n`;
  context += `You have seen ${matches.length} similar chart(s) before. Here is what you learned:\n\n`;

  for (const match of matches) {
    const fullCase = await getCase(match.caseId);
    if (!fullCase || !fullCase.masterReview) continue;

    context += `### Case: ${fullCase.chartSummary.dayMaster} ${fullCase.chartSummary.dayMasterElement} Day Master`;
    context += ` (similarity: ${Math.round(match.similarityScore * 100)}%)\n`;
    context += `Matched because: ${match.matchReasons.join('; ')}\n\n`;

    // What the master said you did well
    if (fullCase.masterReview.whatWentWell) {
      context += `**What worked:** ${fullCase.masterReview.whatWentWell}\n`;
    }

    // What the master corrected
    if (fullCase.masterReview.whatWentWrong) {
      context += `**What to avoid:** ${fullCase.masterReview.whatWentWrong}\n`;
    }

    // Specific corrections
    for (const correction of fullCase.masterReview.correctedInterpretations) {
      context += `**Correction:** When seeing ${correction.chartBasis}, `;
      context += `you said "${correction.original}" — `;
      context += `but the correct reading was "${correction.correction}" `;
      context += `because ${correction.reason}\n`;
    }

    // Confirmed patterns
    for (const pattern of fullCase.patternsConfirmed) {
      context += `**Confirmed pattern:** ${pattern}\n`;
    }

    // Corrected patterns
    for (const pattern of fullCase.patternsCorrected) {
      context += `**Corrected pattern:** ${pattern}\n`;
    }

    // Master's lessons
    if (fullCase.masterReview.lessonsForSemar.length > 0) {
      context += `**Master's teaching:** ${fullCase.masterReview.lessonsForSemar.join('; ')}\n`;
    }

    context += `\n---\n\n`;
  }

  context += `Apply these lessons to the current reading. Do not repeat past mistakes. `;
  context += `Build on confirmed patterns. When unsure, ask — do not guess.\n`;

  return context;
}
