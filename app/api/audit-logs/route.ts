/**
 * GET /api/audit-logs
 * Returns real audit logs from the database with optional filters.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/config';
import { auditLogs, users } from '@/lib/db/schema';
import { desc, eq, and, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get('entityType');
  const action = searchParams.get('action');
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 200);
  const offset = parseInt(searchParams.get('offset') ?? '0', 10);

  const conditions = [];
  if (entityType) conditions.push(eq(auditLogs.entityType, entityType));
  if (action) conditions.push(eq(auditLogs.action, action));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const logs = await db
    .select({
      id: auditLogs.id,
      userId: auditLogs.userId,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      action: auditLogs.action,
      changes: auditLogs.changes,
      ipAddress: auditLogs.ipAddress,
      userAgent: auditLogs.userAgent,
      createdAt: auditLogs.createdAt,
      userEmail: users.email,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .where(whereClause)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset(offset);

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(auditLogs)
    .where(whereClause);

  // Get available filter values
  const entityTypes = await db
    .selectDistinct({ entityType: auditLogs.entityType })
    .from(auditLogs);
  const actions = await db
    .selectDistinct({ action: auditLogs.action })
    .from(auditLogs);

  return NextResponse.json({
    logs,
    total: count,
    filters: {
      entityTypes: entityTypes.map(e => e.entityType),
      actions: actions.map(a => a.action),
    },
  });
}
