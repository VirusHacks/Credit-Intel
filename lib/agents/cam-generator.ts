/**
 * cam-generator.ts
 * Orchestrates the full CAM generation pipeline:
 *   1. Triggers reconciler → 5Cs + decision
 *   2. Loads all signals, discrepancies, research, notes
 *   3. Renders PDF via @react-pdf/renderer
 *   4. Uploads PDF to blob storage (Vercel Blob or local /tmp in dev)
 *   5. Updates cam_outputs.pdfBlobUrl + applications.pipelineStatus = 'complete'
 */

import fs from 'fs';
import path from 'path';
import { db } from '@/lib/db/config';
import { applications, camOutputs, companies, qualitativeNotes, researchFindings } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { runReconciler } from '@/lib/agents/reconciler-agent';
import { runDiscrepancyEngine } from '@/lib/pipeline/discrepancy-engine';
import { publishPipelineEvent } from '@/lib/agents/base-agent';
import { redis, redisKeys } from '@/lib/redis';
import type { DiscrepancyResult, ResearchFinding } from '@/lib/types';
import type { ReconcilerOutput } from '@/lib/agents/reconciler-agent';

// ─── Public CAM data type (used by PDF template) ──────────────────────────────
export interface CAMData {
  appId: string;
  companyName: string;
  cin: string;
  gstin: string;
  industry: string;
  requestedAmountInr: string;
  recommendation: ReconcilerOutput['recommendation'];
  fiveCsScores: ReconcilerOutput['fiveCsScores'];
  discrepancies: DiscrepancyResult[];
  researchFindings: ResearchFinding[];
  qualitativeNotes: Array<{
    category: string;
    fiveCDimension: string;
    noteText: string;
    scoreDelta: number | null;
  }>;
  thinkingTrace: string;
  generatedAt: Date;
}

// ─── Main orchestrator ────────────────────────────────────────────────────────
export async function generateCAM(appId: string): Promise<{ pdfUrl: string; camData: CAMData }> {
  await publishPipelineEvent(appId, 'cam_generator', 'processing', { message: 'Starting CAM generation' });

  // ── 1. Load app metadata ─────────────────────────────────────────────────────
  const [app] = await db
    .select({
      companyName: companies.name,
      cin: applications.cin,
      gstin: applications.gstin,
      industry: applications.industry,
      requestedAmountInr: applications.requestedAmountInr,
    })
    .from(applications)
    .innerJoin(companies, eq(applications.companyId, companies.id))
    .where(eq(applications.id, appId))
    .limit(1);

  if (!app) throw new Error(`Application ${appId} not found`);

  // ── 2. Run reconciler (DeepSeek-R1) ─────────────────────────────────────────
  const reconcilerResult = await runReconciler(appId);

  // ── 3. Load research findings ─────────────────────────────────────────────────
  const findings = await db
    .select()
    .from(researchFindings)
    .where(eq(researchFindings.applicationId, appId));

  const researchList: ResearchFinding[] = findings.map((f) => ({
    applicationId: appId,
    searchType: f.searchType,
    query: f.query ?? undefined,
    sourceUrl: f.sourceUrl ?? undefined,
    snippet: f.snippet,
    relevanceScore: f.relevanceScore ? parseFloat(f.relevanceScore) : undefined,
    isFraudSignal: f.isFraudSignal ?? false,
  }));

  // ── 4. Load qualitative notes ────────────────────────────────────────────────
  const notes = await db
    .select({
      category: qualitativeNotes.category,
      fiveCDimension: qualitativeNotes.fiveCDimension,
      noteText: qualitativeNotes.noteText,
      scoreDelta: qualitativeNotes.scoreDelta,
    })
    .from(qualitativeNotes)
    .where(eq(qualitativeNotes.applicationId, appId));

  // ── 5. Assemble CAM data ─────────────────────────────────────────────────────
  const camData: CAMData = {
    appId,
    companyName: app.companyName ?? 'Unknown',
    cin: app.cin ?? 'N/A',
    gstin: app.gstin ?? 'N/A',
    industry: app.industry ?? 'N/A',
    requestedAmountInr: app.requestedAmountInr ?? '0',
    recommendation: reconcilerResult.recommendation,
    fiveCsScores: reconcilerResult.fiveCsScores,
    discrepancies: reconcilerResult.discrepancies,
    researchFindings: researchList,
    qualitativeNotes: notes,
    thinkingTrace: reconcilerResult.thinkingTrace,
    generatedAt: new Date(),
  };

  // ── 6. Generate PDF ──────────────────────────────────────────────────────────
  await publishPipelineEvent(appId, 'cam_generator', 'processing', { message: 'Rendering CAM PDF' });
  const pdfUrl = await renderAndStorePDF(appId, camData);

  // ── 7. Update cam_outputs with PDF URL ───────────────────────────────────────
  await db
    .update(camOutputs)
    .set({ pdfBlobUrl: pdfUrl })
    .where(eq(camOutputs.applicationId, appId));

  // ── 8. Mark pipeline complete ────────────────────────────────────────────────
  await db
    .update(applications)
    .set({ pipelineStatus: 'complete', analysisProgress: 100 })
    .where(eq(applications.id, appId));

  await publishPipelineEvent(appId, 'cam_generator', 'done', { pdfUrl });

  return { pdfUrl, camData };
}

// ─── PDF rendering + storage ──────────────────────────────────────────────────
async function renderAndStorePDF(appId: string, data: CAMData): Promise<string> {
  // Dynamic import to avoid SSR issues with @react-pdf/renderer
  const { renderToBuffer } = await import('@react-pdf/renderer');
  const { CAMPdfTemplate } = await import('@/components/memo/cam-pdf-template');

  // React PDF needs createElement, not JSX here — we call it via a thin wrapper
  const React = (await import('react')).default;
  const doc = React.createElement(CAMPdfTemplate, { data });
  const buffer = await renderToBuffer(doc as Parameters<typeof renderToBuffer>[0]);

  // Try Vercel Blob in production; fall back to local /tmp in dev
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import('@vercel/blob');
    const filename = `cam/${appId}/cam_${Date.now()}.pdf`;
    const blob = await put(filename, buffer, { access: 'public', contentType: 'application/pdf' });
    return blob.url;
  }

  // Dev fallback: write to /tmp and return a local API URL
  const tmpDir = path.join(process.cwd(), 'tmp', 'cam');
  fs.mkdirSync(tmpDir, { recursive: true });
  const filename = `${appId}_${Date.now()}.pdf`;
  fs.writeFileSync(path.join(tmpDir, filename), buffer);
  return `/api/cam/download/${appId}?file=${filename}`;
}

// ─── Fetch the latest CAM output for an application (for frontend) ─────────────
export async function getLatestCAM(appId: string) {
  const [latest] = await db
    .select()
    .from(camOutputs)
    .where(eq(camOutputs.applicationId, appId))
    .orderBy(desc(camOutputs.generatedAt))
    .limit(1);

  return latest ?? null;
}
