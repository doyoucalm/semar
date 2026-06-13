/**
 * POST /api/bazi
 *
 * Full BaZi (八字) calculation for arbitrary birth data — the engine
 * (@semar/bazi) is server-only (reads HKO solar-term data via node:fs),
 * so the calculator page calls this route.
 *
 * Body: { year, month, day, hour, minute, gender, utcOffsetMinutes, longitude? }
 * Returns: four pillars + ten gods + hidden stems + na yin + element
 *          distribution + day-master strength + useful god + interactions +
 *          shen sha + luck pillars (大运).
 */

import { NextResponse } from 'next/server';
import { computeBazi, analyzeChart } from '@semar/bazi';

interface Body {
  year?: number; month?: number; day?: number;
  hour?: number; minute?: number;
  gender?: 'male' | 'female';
  utcOffsetMinutes?: number;
  longitude?: number;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 });
  }

  const {
    year, month, day, hour = 12, minute = 0,
    gender, utcOffsetMinutes = 7 * 60, longitude,
  } = body;

  // Validation — HKO solar-term data covers 1900–2100.
  const errs: string[] = [];
  if (!Number.isInteger(year) || year! < 1900 || year! > 2100) errs.push('year 1900–2100');
  if (!Number.isInteger(month) || month! < 1 || month! > 12) errs.push('month 1–12');
  if (!Number.isInteger(day) || day! < 1 || day! > 31) errs.push('day 1–31');
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) errs.push('hour 0–23');
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) errs.push('minute 0–59');
  if (gender && gender !== 'male' && gender !== 'female') errs.push('gender male|female');
  if (errs.length) {
    return NextResponse.json({ error: `Invalid input: ${errs.join('; ')}` }, { status: 400 });
  }

  try {
    const chart = computeBazi({
      year: year!, month: month!, day: day!,
      hour, minute,
      utcOffsetMinutes,
      gender,
      ...(longitude != null && Number.isFinite(longitude) ? { longitude } : {}),
    });
    const analysis = analyzeChart(chart, gender ? { gender } : {});

    return NextResponse.json({
      eightCharacters: chart.eightCharacters,
      dayMaster:       chart.dayMaster,
      solarTime:       chart.solarTime ?? null,
      pillars:         analysis.pillars,
      elements:        analysis.elements,
      dayMasterStrength: analysis.dayMasterStrength,
      usefulGod:       analysis.usefulGod,
      branchInteractions: analysis.branchInteractions,
      stemInteractions:   analysis.stemInteractions,
      shenSha:         analysis.shenSha,
      luckPillars:     analysis.luckPillars ?? null,
    });
  } catch (err) {
    console.error('[bazi API] compute error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'compute failed' },
      { status: 500 },
    );
  }
}
