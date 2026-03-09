/**
 * nodes/scout-node.ts
 * LangGraph node: runs the OSINT scout agent using Tavily web searches.
 * Reads company name + promoter name from the graph state (set during pipeline init).
 */

import { runScoutAgent } from '@/lib/agents/scout-agent';
import { publishPipelineEvent } from '@/lib/agents/base-agent';
import type { CreditPipelineState } from '../pipeline-types';

export async function scoutNode(
  state: CreditPipelineState,
): Promise<Partial<CreditPipelineState>> {
  const { appId, companyName, promoterName } = state;

  if (!companyName) {
    console.log('[scout-node] No company name — skipped');
    await publishPipelineEvent(appId, 'scout', 'done', { message: 'No company name — skipped' });
    return {
      errors: [...(state.errors ?? []), 'companyName missing — skipping scout search'],
    };
  }

  try {
    console.log('[scout-node] Starting OSINT scout for', companyName);
    await publishPipelineEvent(appId, 'scout', 'processing', { message: `Searching for ${companyName}` });
    const analysis = await runScoutAgent(appId, companyName, promoterName);
    console.log('[scout-node] ✓ Scout complete');
    await publishPipelineEvent(appId, 'scout', 'done', { message: 'Scout analysis complete' });
    return { scoutAnalysis: analysis };
  } catch (e) {
    console.error('[scout-node] ✗ Scout failed:', (e as Error).message);
    await publishPipelineEvent(appId, 'scout', 'failed', { message: (e as Error).message });
    return {
      errors: [...(state.errors ?? []), `Scout agent failed: ${(e as Error).message}`],
    };
  }
}
