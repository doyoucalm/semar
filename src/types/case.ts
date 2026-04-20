// ============================================================
// SEMAR CASE SYSTEM — How the practitioner learns
//
// Every session becomes a case. Every case teaches Semar.
// This is Case-Based Reasoning (CBR) applied to BaZi reading.
// ============================================================

export interface SemarCase {
  id: string;
  createdAt: string;              // ISO datetime
  updatedAt: string;

  // ---- THE CHART ----
  chart: BaziMCPChart;            // Full JSON from bazi-mcp
  chartSummary: ChartSummary;     // Condensed for matching

  // ---- THE SESSION ----
  personId?: string;              // Link to the permanent Person profile
  personName?: string;            // The name/alias provided
  intention: string;              // What brought the person
  messages: CaseMessage[];        // Full conversation

  // ---- SEMAR'S OBSERVATIONS ----
  // Tagged interpretations Semar made during the session
  observations: Observation[];

  // ---- PERSON'S FEEDBACK ----
  // What the person confirmed, corrected, or revealed
  personFeedback: PersonFeedback;

  // ---- MASTER'S REVIEW (Lucky) ----
  masterReview?: MasterReview;

  // ---- LEARNING OUTCOME ----
  lessonsLearned: string[];       // What this case taught Semar
  patternsConfirmed: string[];    // Patterns that proved true
  patternsCorrected: string[];    // Patterns that were wrong

  // ---- METADATA ----
  status: 'active' | 'closed' | 'reviewed';
  tags: string[];                 // For retrieval: elements, stars, etc.
  similarCaseIds: string[];       // Cases that are similar
}

export interface BaziMCPChart {
  // The raw JSON returned by cantian-ai/bazi-mcp
  // We store it exactly as received — single source of truth
  [key: string]: unknown;
}

export interface ChartSummary {
  // Condensed chart data for fast matching
  dayMaster: string;              // e.g., "Jia"
  dayMasterElement: string;       // e.g., "Wood"
  dayMasterPolarity: string;      // "Yang" or "Yin"
  dayBranch: string;              // e.g., "Chen"
  monthBranch: string;            // e.g., "Chen" (for seasonal strength)
  yearBranch: string;
  hourBranch: string;
  dayMasterStrength: string;      // "Strong" / "Weak" / etc.

  // Key features for matching
  dominantElement: string;
  weakestElement: string;
  tenGodProfile: string[];        // Which ten gods are prominent
  symbolicStars: string[];        // Key stars present
  interactionTypes: string[];     // What conflicts/combinations exist
  currentLuckPillar: string;      // e.g., "Ren Chen"
  currentYear: string;            // e.g., "Bing Wu 2026"
}

export interface CaseMessage {
  role: 'semar' | 'person' | 'system';
  content: string;
  timestamp: string;
  // ★ Messages can be tagged after the fact during review
  tags?: MessageTag[];
}

export interface MessageTag {
  type: 'observation' | 'prediction' | 'timing' | 'pattern' |
        'question' | 'confirmation' | 'correction' | 'ground-truth' |
        'insight' | 'missed';
  label: string;
  confidence?: number;           // How confident was Semar (0-1)
  accuracy?: number;             // How accurate was it (0-1, set in review)
}

export interface Observation {
  id: string;
  type: 'personality' | 'relationship' | 'career' | 'health' |
        'timing' | 'pattern' | 'spiritual' | 'family' | 'wealth';
  content: string;               // What Semar said
  chartBasis: string;            // Which chart element this came from
  // e.g., "Jia DM + Geng in Month = Seven Killings pressure from authority"

  // Feedback loop
  personResponse?: 'confirmed' | 'partially' | 'denied' | 'no-response';
  personComment?: string;        // What they actually said
  masterAccuracy?: number;       // Lucky's assessment (0-1)
  masterNote?: string;           // Lucky's correction/deepening
}

export interface PersonFeedback {
  overallResonance: number;      // 1-5: how much did this resonate?
  confirmations: string[];       // What they said "yes" to
  corrections: string[];         // What they corrected
  groundTruth: string[];         // Real life events they shared
  reflection: string;            // Their closing journal entry
}

export interface MasterReview {
  reviewedAt: string;
  reviewedBy: string;            // "Lucky" (for now, always you)

  // Quality assessment
  overallQuality: number;        // 1-5 reading quality
  accuracyScore: number;         // 1-5 how accurate were the observations
  depthScore: number;            // 1-5 did Semar go deep enough
  characterScore: number;        // 1-5 did Semar stay in character
  sensitivityScore: number;      // 1-5 did Semar handle emotions well

  // Specific feedback
  whatWentWell: string;
  whatWentWrong: string;
  missedPatterns: string[];      // Patterns Semar should have caught
  overinterpretations: string[]; // Where Semar stretched too far
  correctedInterpretations: CorrectedInterpretation[];

  // Teaching notes — these become learning data
  practitionerNotes: string;     // Free-form master's notes
  lessonsForSemar: string[];     // Specific things Semar should learn

  // Pattern reinforcement
  reinforcePatterns: PatternReinforcement[];
}

export interface CorrectedInterpretation {
  original: string;              // What Semar said
  correction: string;            // What it should have been
  reason: string;                // Why the correction
  chartBasis: string;            // Which chart element
}

export interface PatternReinforcement {
  pattern: string;               // e.g., "Jia DM + Geng 7K in Month"
  observation: string;           // What this pattern means
  confirmed: boolean;            // Was it confirmed in this case?
  realWorldOutcome: string;      // What actually happened
  weight: number;                // How much to trust this (grows over time)
  caseIds: string[];             // All cases where this appeared
}

// ============================================================
// CASE MATCHING — Finding similar past cases
// ============================================================

export interface CaseMatchCriteria {
  dayMaster?: string;
  dayMasterElement?: string;
  dayBranch?: string;
  monthBranch?: string;
  tenGodProfile?: string[];
  symbolicStars?: string[];
  interactionTypes?: string[];
  intention?: string;            // Semantic similarity on intention
}

export interface CaseMatch {
  caseId: string;
  similarityScore: number;       // 0-1
  matchReasons: string[];        // Why this case matched
  keyLessons: string[];          // What was learned from this case
}
