/**
 * GET /api/applications
 * Returns paginated list of applications joined with company name + latest pipeline status.
 * Query params: page (default 1), limit (default 20), status (filter)
 *
 * POST /api/applications
 * Create a new application + company record.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/config';
import { applications, companies, documents } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
  const statusFilter = searchParams.get('status');
  const offset = (page - 1) * limit;

  const query = db
    .select({
      id: applications.id,
      status: applications.status,
      industry: applications.industry,
      pipelineStatus: applications.pipelineStatus,
      qualitativeGateDone: applications.qualitativeGateDone,
      analysisProgress: applications.analysisProgress,
      requestedAmountInr: applications.requestedAmountInr,
      cmrRank: applications.cmrRank,
      createdAt: applications.createdAt,
      companyName: companies.name,
      companyId: companies.id,
      cin: applications.cin,
      gstin: applications.gstin,
    })
    .from(applications)
    .leftJoin(companies, eq(applications.companyId, companies.id))
    .orderBy(desc(applications.createdAt))
    .limit(limit)
    .offset(offset);

  const rows = statusFilter
    ? await query.where(eq(applications.pipelineStatus, statusFilter as typeof applications.pipelineStatus._.data))
    : await query;

  // Total count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(applications);

  return NextResponse.json({
    data: rows,
    pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
  });
}

export async function POST(request: NextRequest) {
  let body: {
    companyName?: string;
    industry?: string;
    cin?: string;
    gstin?: string;
    pan?: string;
    promoterDin?: string;
    requestedAmountInr?: string;
    city?: string;
    state?: string;
    createdBy?: string;
    uploadedDocuments?: Array<{
      blobUrl: string;
      fileName: string;
      fileSize: number;
      documentType: string;
    }>;
  };

  try {
    body = await request.json() as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.companyName?.trim()) {
    return NextResponse.json({ error: 'companyName is required' }, { status: 400 });
  }
  // Resolve createdBy from auth cookie if not provided in body
  if (!body.createdBy) {
    const token = request.cookies.get('auth-token')?.value;
    if (token) {
      const payload = verifyToken(token);
      if (payload) body.createdBy = payload.userId;
    }
  }
  if (!body.createdBy) {
    return NextResponse.json(
      { error: 'Authentication required. Please log in to submit applications.' },
      { status: 401 },
    );
  }

  // Insert company (always new — no unique conflict on name alone)
  const [company] = await db
    .insert(companies)
    .values({
      name: body.companyName.trim(),
      city: body.city,
      state: body.state,
    })
    .returning({ id: companies.id });

  // Create application with not_started — pipeline will be triggered by client
  const [app] = await db
    .insert(applications)
    .values({
      companyId: company.id,
      createdBy: body.createdBy,
      industry: body.industry,
      cin: body.cin,
      gstin: body.gstin,
      pan: body.pan,
      promoterDin: body.promoterDin,
      requestedAmountInr: body.requestedAmountInr,
      status: 'draft',
      pipelineStatus: 'not_started',
    })
    .returning({ id: applications.id });

  const appId = app.id;
  const companyName = body.companyName!.trim();

  // Insert document records so ingest-node can find them when pipeline runs
  const validDocTypes = [
    'bank_statement', 'gst_return', 'itr', 'annual_report',
    'cibil_report', 'financial_statement', 'sanction_letter', 'other',
  ] as const;

  if (body.uploadedDocuments?.length) {
    const docRows = body.uploadedDocuments
      .filter((d) => d.blobUrl && validDocTypes.includes(d.documentType as typeof validDocTypes[number]))
      .map((d) => ({
        applicationId: appId,
        fileName: d.fileName,
        fileType: 'application/pdf',
        documentType: d.documentType as typeof validDocTypes[number],
        fileSize: d.fileSize,
        s3Path: d.blobUrl,
      }));

    if (docRows.length > 0) {
      await db.insert(documents).values(docRows);
    }
  }

  return NextResponse.json({ id: appId, companyId: company.id, companyName }, { status: 201 });
}
