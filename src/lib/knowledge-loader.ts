// ============================================================
// Knowledge Loader — Loads relevant BaZi knowledge for the prompt
//
// The knowledge base is stored as Markdown files.
// We load only what's relevant to the current chart.
// This keeps the prompt focused and within token limits.
// ============================================================

import fs from 'fs/promises';
import path from 'path';
import { ChartSummary } from '@/types/case';

const KNOWLEDGE_DIR = path.join(process.cwd(), 'knowledge');

export async function loadRelevantKnowledge(
  chartSummary: ChartSummary
): Promise<string> {
  const sections: string[] = [];

  // 1. Day Master knowledge (always loaded)
  const dmFile = `${chartSummary.dayMaster.toLowerCase()}-${chartSummary.dayMasterElement.toLowerCase()}.md`;
  const dmKnowledge = await loadFile('day-masters', dmFile);
  if (dmKnowledge) {
    sections.push(`## Day Master: ${chartSummary.dayMaster} ${chartSummary.dayMasterElement}\n${dmKnowledge}`);
  }

  // 2. Prominent Ten Gods (load top 3)
  for (const tg of (chartSummary.tenGodProfile || []).slice(0, 3)) {
    const tgFile = `${tg.toLowerCase().replace(/\s+/g, '-')}.md`;
    const tgKnowledge = await loadFile('ten-gods', tgFile);
    if (tgKnowledge) {
      sections.push(`## Ten God: ${tg}\n${tgKnowledge}`);
    }
  }

  // 3. Symbolic Stars present
  for (const star of (chartSummary.symbolicStars || []).slice(0, 5)) {
    const starFile = `${star.toLowerCase().replace(/\s+/g, '-')}.md`;
    const starKnowledge = await loadFile('symbolic-stars', starFile);
    if (starKnowledge) {
      sections.push(`## Star: ${star}\n${starKnowledge}`);
    }
  }

  // 4. Relevant interactions
  for (const interaction of (chartSummary.interactionTypes || []).slice(0, 3)) {
    const intFile = `${interaction.toLowerCase().replace(/\s+/g, '-')}.md`;
    const intKnowledge = await loadFile('interactions', intFile);
    if (intKnowledge) {
      sections.push(`## Interaction: ${interaction}\n${intKnowledge}`);
    }
  }

  // 5. Element of the current year/luck pillar
  if (chartSummary.currentYear) {
    const yearElement = chartSummary.currentYear.split(' ')[0]; // e.g., "Bing" → Fire
    const elemFile = `${yearElement?.toLowerCase() || 'fire'}.md`;
    const elemKnowledge = await loadFile('elements', elemFile);
    if (elemKnowledge) {
      sections.push(`## Current Year Element Context\n${elemKnowledge}`);
    }
  }

  return sections.join('\n\n---\n\n');
}

async function loadFile(subdir: string, filename: string): Promise<string | null> {
  try {
    const filepath = path.join(KNOWLEDGE_DIR, subdir, filename);
    return await fs.readFile(filepath, 'utf-8');
  } catch {
    return null;
  }
}
