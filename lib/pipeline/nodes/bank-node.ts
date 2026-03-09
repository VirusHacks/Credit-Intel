/**
 * nodes/bank-node.ts
 * LangGraph node: runs the bank statement analysis agent.
 */

import { runBankStatementAgent } from '@/lib/agents/bank-statement-agent';
import { publishPipelineEvent } from '@/lib/agents/base-agent';
import type { CreditPipelineState } from '../pipeline-types';

export async function bankNode(
  state: CreditPipelineState,
): Promise<Partial<CreditPipelineState>> {
  const result = state.ingestResultMap?.['bank_statement'];
  if (!result) {
    console.log('[bank-node] No bank statement — skipped');
    await publishPipelineEvent(state.appId, 'bank_statement', 'done', { message: 'No bank statement — skipped' });
    return {
      errors: [...(state.errors ?? []), 'bank_statement document not found — skipping bank analysis'],
    };
  }

  try {
    console.log('[bank-node] Starting bank statement analysis...');
    await publishPipelineEvent(state.appId, 'bank_statement', 'processing', { message: 'Analyzing bank statement' });
    const analysis = await runBankStatementAgent(state.appId, result);
    console.log('[bank-node] ✓ Bank statement analysis complete');
    await publishPipelineEvent(state.appId, 'bank_statement', 'done', { message: 'Bank analysis complete' });
    return { bankAnalysis: analysis };
  } catch (e) {
    console.error('[bank-node] ✗ Bank agent failed:', (e as Error).message);
    await publishPipelineEvent(state.appId, 'bank_statement', 'failed', { message: (e as Error).message });
    return {
      errors: [...(state.errors ?? []), `Bank agent failed: ${(e as Error).message}`],
    };
  }
}
