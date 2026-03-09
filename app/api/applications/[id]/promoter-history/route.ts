/**
 * GET /api/applications/[id]/promoter-history
 * Returns mem0 promoter DNA for the application's promoter (by DIN).
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/config';
import { applications } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAllPromoterMemories, searchPromoterHistory, isMem0Available } from '@/lib/mem0/promoter-dna';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  if (!isMem0Available()) {
    return NextResponse.json({
      available: false,
      memories: [],
      message: 'mem0 is not configured — set MEM0_API_KEY to enable Promoter DNA',
    });
  }

  // Get the promoter DIN from the application
  const [app] = await db
    .select({ promoterDin: applications.promoterDin })
    .from(applications)
    .where(eq(applications.id, id))
    .limit(1);

  if (!app) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  if (!app.promoterDin) {
    return NextResponse.json({
      available: true,
      memories: [],
      din: null,
      message: 'No promoter DIN on file — promoter history requires a DIN',
    });
  }

  const [allMemories, searchResults] = await Promise.all([
    getAllPromoterMemories(app.promoterDin),
    searchPromoterHistory(app.promoterDin),
  ]);

  return NextResponse.json({
    available: true,
    din: app.promoterDin,
    memories: allMemories,
    searchResults,
  });
}
