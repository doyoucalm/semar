import { NextRequest, NextResponse } from 'next/server';
import { saveMasterReview } from '@/lib/case-store';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const review = await req.json();
  const caseId = params.id;

  try {
    // Save the review to the case — this is where learning happens
    await saveMasterReview(caseId, review);

    return NextResponse.json({
      success: true,
      message: 'Semar has learned from this case.',
    });

  } catch (error) {
    console.error('Review save error:', error);
    return NextResponse.json({ error: 'Failed to save review' }, { status: 500 });
  }
}
