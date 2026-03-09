/**
 * nodes/cibil-node.ts
 * LangGraph node: runs the CIBIL CMR analysis agent.
 */

import { runCIBILAgent } from '@/lib/agents/cibil-agent';
import { publishPipelineEvent } from '@/lib/agents/base-agent';
import type { CreditPipelineState } from '../pipeline-types';

export async function cibilNode(
  state: CreditPipelineState,
): Promise<Partial<CreditPipelineState>> {
  const result = state.ingestResultMap?.['cibil_report'];
  if (!result) {
    console.log('[cibil-node] No CIBIL report — skipped');
    await publishPipelineEvent(state.appId, 'cibil_cmr', 'done', { message: 'No CIBIL report — skipped' });
    return {
      errors: [...(state.errors ?? []), 'cibil_report document not found — skipping CIBIL analysis'],
    };
  }

  try {
    console.log('[cibil-node] Starting CIBIL analysis...');
    await publishPipelineEvent(state.appId, 'cibil_cmr', 'processing', { message: 'Analyzing CIBIL report' });
    const analysis = await runCIBILAgent(state.appId, result);
    console.log('[cibil-node] ✓ CIBIL analysis complete');
    await publishPipelineEvent(state.appId, 'cibil_cmr', 'done', { message: 'CIBIL analysis complete' });
    return { cibilAnalysis: analysis };
  } catch (e) {
    console.error('[cibil-node] ✗ CIBIL agent failed:', (e as Error).message);
    await publishPipelineEvent(state.appId, 'cibil_cmr', 'failed', { message: (e as Error).message });
    return {
      errors: [...(state.errors ?? []), `CIBIL agent failed: ${(e as Error).message}`],
    };
  }
}
