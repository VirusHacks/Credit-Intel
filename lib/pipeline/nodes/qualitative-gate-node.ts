/**
 * nodes/qualitative-gate-node.ts
 * LangGraph node: checks whether the qualitative underwriter input gate
 * has been completed.  If yes → returns 'continue'; if no → returns 'wait'.
 *
 * This is a conditional router — the graph calls it and branches on the
 * returned string value.
 */

import { db } from '@/lib/db/config';
import { applications } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { publishPipelineEvent } from '@/lib/agents/base-agent';
import type { CreditPipelineState } from '../pipeline-types';

export async function qualitativeGateNode(
  state: CreditPipelineState,
): Promise<Partial<CreditPipelineState> & { __next?: string }> {
  const { appId } = state;

  try {
    console.log('[qualitative-gate] Checking gate status for', appId);
    const rows = await db
      .select({ qualitativeGateDone: applications.qualitativeGateDone })
      .from(applications)
      .where(eq(applications.id, appId))
      .limit(1);

    const done = rows[0]?.qualitativeGateDone ?? false;

    if (!done) {
      console.log('[qualitative-gate] Awaiting underwriter input');
      await publishPipelineEvent(appId, 'qualitative_gate', 'processing', {
        message: 'Waiting for underwriter qualitative input',
      });
      return { awaitingQualitative: true, __next: 'wait' };
    }

    console.log('[qualitative-gate] ✓ Qualitative input complete');
    await publishPipelineEvent(appId, 'qualitative_gate', 'done', {
      message: 'Qualitative input complete',
    });
    return { awaitingQualitative: false, __next: 'continue' };
  } catch (e) {
    return {
      errors: [...(state.errors ?? []), `Qualitative gate check failed: ${(e as Error).message}`],
      __next: 'continue',   // Don't block pipeline on DB error
    };
  }
}
