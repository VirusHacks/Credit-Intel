/**
 * nodes/itr-node.ts
 * LangGraph node: runs ITR + balance sheet analysis agent.
 * Passes both `itr` and `financial_statement` IngestResults (either may be null).
 */

import { runITRBalancesheetAgent } from '@/lib/agents/itr-balancesheet-agent';
import { publishPipelineEvent } from '@/lib/agents/base-agent';
import type { CreditPipelineState } from '../pipeline-types';

export async function itrNode(
  state: CreditPipelineState,
): Promise<Partial<CreditPipelineState>> {
  const itrResult = state.ingestResultMap?.['itr'] ?? null;
  const bsResult = state.ingestResultMap?.['financial_statement'] ?? null;

  if (!itrResult && !bsResult) {
    console.log('[itr-node] No ITR/BS documents — skipped');
    await publishPipelineEvent(state.appId, 'itr_balancesheet', 'done', { message: 'No ITR/BS documents — skipped' });
    return {
      errors: [...(state.errors ?? []), 'Neither itr nor financial_statement found — skipping ITR/BS analysis'],
    };
  }

  try {
    console.log('[itr-node] Starting ITR/Balance Sheet analysis...');
    await publishPipelineEvent(state.appId, 'itr_balancesheet', 'processing', { message: 'Analyzing ITR / Balance Sheet' });
    const analysis = await runITRBalancesheetAgent(state.appId, itrResult, bsResult);
    console.log('[itr-node] ✓ ITR/BS analysis complete');
    await publishPipelineEvent(state.appId, 'itr_balancesheet', 'done', { message: 'ITR/BS analysis complete' });
    return { itrAnalysis: analysis };
  } catch (e) {
    console.error('[itr-node] ✗ ITR/BS agent failed:', (e as Error).message);
    await publishPipelineEvent(state.appId, 'itr_balancesheet', 'failed', { message: (e as Error).message });
    return {
      errors: [...(state.errors ?? []), `ITR/BS agent failed: ${(e as Error).message}`],
    };
  }
}
