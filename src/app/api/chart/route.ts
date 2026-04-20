import { NextRequest, NextResponse } from 'next/server';
import { getBaziChart } from '@/lib/bazi-mcp-client';
import { createCase } from '@/lib/case-store';
import { upsertPerson, getPersonId } from '@/lib/person-store';
import { SemarCase, ChartSummary } from '@/types/case';
import { v4 as uuidv4 } from 'uuid';
import { 
  translateElement, 
  translatePolarity, 
  translateTenGod,
  translateStem,
  translateBranch,
  translateSymbolicStar
} from '@/lib/bazi-utils';

export async function POST(req: NextRequest) {
  try {
    const { solarDatetime, gender, timezone, name, intention } = await req.json();

    if (!solarDatetime || !gender) {
      return NextResponse.json({ error: 'Missing solarDatetime or gender' }, { status: 400 });
    }

    // Call MCP
    const mcpResponse = await getBaziChart(solarDatetime, gender);
    const chart = JSON.parse((mcpResponse as any).content[0].text);

    // Extract Chart Summary for matching and prompt
    const chartSummary: ChartSummary = {
      dayMaster: translateStem(chart.日主 || '').english,
      dayMasterElement: translateElement(chart.日柱?.天干?.五行 || ''),
      dayMasterPolarity: translatePolarity(chart.日柱?.天干?.阴阳 || ''),
      dayBranch: translateBranch(chart.日柱?.地支?.地支 || '').english,
      monthBranch: translateBranch(chart.月柱?.地支?.地支 || '').english,
      yearBranch: translateBranch(chart.年柱?.地支?.地支 || '').english,
      hourBranch: translateBranch(chart.时柱?.地支?.地支 || '').english,
      dayMasterStrength: 'Balanced', // Default as not explicitly in basic output
      dominantElement: '',           // To be calculated if needed
      weakestElement: '',            // To be calculated if needed
      tenGodProfile: [
        translateTenGod(chart.年柱?.天干?.十神),
        translateTenGod(chart.月柱?.天干?.十神),
        translateTenGod(chart.时柱?.天干?.十神)
      ].filter(Boolean),
      symbolicStars: [
        ...(chart.神煞?.年柱 || []),
        ...(chart.神煞?.月柱 || []),
        ...(chart.神煞?.日柱 || []),
        ...(chart.神煞?.时柱 || [])
      ].map(translateSymbolicStar),
      interactionTypes: [], // Complex extraction
      currentLuckPillar: chart.大运?.大运?.[0]?.干支 || '', // Simplified
      currentYear: new Date().getFullYear().toString(),
    };

    const sessionId = uuidv4();
    const personId = getPersonId(name || 'Seeker', solarDatetime);

    // Update or create permanent person profile
    await upsertPerson({
      id: personId,
      name: name || 'Seeker',
      gender,
      solarDatetime,
      timezone: timezone || 'Asia/Jakarta',
      chart,
      chartSummary,
      caseIds: [sessionId]
    });

    const newCase: SemarCase = {
      id: sessionId,
      personId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      chart,
      chartSummary,
      personName: name || 'Seeker',
      intention: intention || 'General reflection',
      messages: [],
      observations: [],
      personFeedback: {
        overallResonance: 0,
        confirmations: [],
        corrections: [],
        groundTruth: [],
        reflection: '',
      },
      lessonsLearned: [],
      patternsConfirmed: [],
      patternsCorrected: [],
      status: 'active',
      tags: [
        chartSummary.dayMaster,
        chartSummary.dayMasterElement,
        ...chartSummary.tenGodProfile,
      ],
      similarCaseIds: [],
    };

    await createCase(newCase);

    return NextResponse.json({
      sessionId,
      chart
    });
  } catch (err: any) {
    console.error('Chart API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
