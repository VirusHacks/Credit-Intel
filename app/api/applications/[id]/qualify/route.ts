/**
 * app/api/applications/[id]/qualify/route.ts
 * POST — Submit qualitative underwriter notes for an application.
 * Stores notes in qualitative_notes table, flips qualitativeGateDone = true.
 *
 * Body: {
 *   notes: Array<{
 *     category: QualitativeCategory,
 *     fiveCDimension: FiveCDimension,
 *     noteText: string,
 *     scoreDelta?: number,   // +/- impact on 5C score
 *   }>,
 *   submittedBy: string,  // userId of credit officer
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/config';
import { qualitativeNotes, applications } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { redis, redisKeys } from '@/lib/redis';
import { verifyToken } from '@/lib/auth';
import { generateCAM } from '@/lib/agents/cam-generator';
import type { QualitativeCategory, FiveCDimension } from '@/lib/types';

const VALID_CATEGORIES = new Set<string>([
  'factory_operations', 'management_quality', 'collateral_inspection',
  'customer_relationships', 'industry_context',
]);

const VALID_DIMENSIONS = new Set<string>([
  'character', 'capacity', 'capital', 'collateral', 'conditions',
]);

interface NoteInput {
  category: QualitativeCategory;
  fiveCDimension: FiveCDimension;
  noteText: string;
  scoreDelta?: number;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: appId } = await context.params;

  let body: { notes?: NoteInput[]; submittedBy?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { notes, submittedBy } = body;

  if (!notes || !Array.isArray(notes) || notes.length === 0) {
    return NextResponse.json(
      { error: 'notes[] array is required and must not be empty' },
      { status: 400 },
    );
  }

  // Resolve userId: prefer auth cookie, fall back to submittedBy field
  let userId = submittedBy;
  const token = request.cookies.get('auth-token')?.value;
  if (token) {
    const payload = verifyToken(token);
    if (payload) userId = payload.userId;
  }
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // Validate application exists
  const rows = await db
    .select({ id: applications.id })
    .from(applications)
    .where(eq(applications.id, appId))
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  // Validate note fields
  for (const note of notes) {
    if (!VALID_CATEGORIES.has(note.category)) {
      return NextResponse.json(
        { error: `Invalid category: ${note.category}. Valid: ${[...VALID_CATEGORIES].join(', ')}` },
        { status: 400 },
      );
    }
    if (!VALID_DIMENSIONS.has(note.fiveCDimension)) {
      return NextResponse.json(
        { error: `Invalid fiveCDimension: ${note.fiveCDimension}` },
        { status: 400 },
      );
    }
    if (!note.noteText || note.noteText.trim().length < 10) {
      return NextResponse.json(
        { error: 'noteText must be at least 10 characters' },
        { status: 400 },
      );
    }
  }

  // Insert notes
  await db.insert(qualitativeNotes).values(
    notes.map((n) => ({
      applicationId: appId,
      category: n.category,
      fiveCDimension: n.fiveCDimension,
      noteText: n.noteText.trim(),
      scoreDelta: n.scoreDelta ?? null,
      createdBy: userId,
    })),
  );

  // Flip qualitative gate done
  await db
    .update(applications)
    .set({ qualitativeGateDone: true, updatedAt: new Date() })
    .where(eq(applications.id, appId));

  // Publish event to Redis pipeline channel
  if (redis) {
    await redis
      .publish(
        redisKeys.pipelineEvents(appId),
        JSON.stringify({
          appId,
          stage: 'qualitative_gate',
          status: 'done',
          noteCount: notes.length,
          ts: Date.now(),
        }),
      )
      .catch(() => {/* non-fatal */});
  }

  // Auto-trigger reconciler + CAM generation (fire-and-forget)
  console.log(`[qualify] Triggering CAM generation for ${appId}`);
  db.update(applications)
    .set({ pipelineStatus: 'reconciling' })
    .where(eq(applications.id, appId))
    .then(() => generateCAM(appId))
    .then(() => console.log(`[qualify] CAM generation complete for ${appId}`))
    .catch(async (err: unknown) => {
      console.error(`[qualify] CAM generation failed for ${appId}:`, err);
      await db.update(applications)
        .set({ pipelineStatus: 'failed' })
        .where(eq(applications.id, appId))
        .catch(() => {});
    });

  return NextResponse.json({
    success: true,
    appId,
    notesInserted: notes.length,
    qualitativeGateDone: true,
    camTriggered: true,
  });
}

// GET — fetch existing qualitative notes for an application
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: appId } = await context.params;

  const notes = await db
    .select()
    .from(qualitativeNotes)
    .where(eq(qualitativeNotes.applicationId, appId));

  return NextResponse.json({ appId, notes });
}
