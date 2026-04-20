import { NextRequest, NextResponse } from 'next/server';
import { getCase } from '@/lib/case-store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing session ID' }, { status: 400 });
  }

  const caseData = await getCase(id);
  if (!caseData) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  }

  return NextResponse.json(caseData);
}
