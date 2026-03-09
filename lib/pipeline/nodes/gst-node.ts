/**
 * nodes/gst-node.ts
 * LangGraph node: runs the GST analysis agent.
 */

import { runGSTAgent } from '@/lib/agents/gst-agent';
import { publishPipelineEvent } from '@/lib/agents/base-agent';
import type { CreditPipelineState } from '../pipeline-types';

export async function gstNode(
  state: CreditPipelineState,
): Promise<Partial<CreditPipelineState>> {
  const result = state.ingestResultMap?.['gst_return'];
  if (!result) {
    console.log('[gst-node] No GST return — skipped');
    await publishPipelineEvent(state.appId, 'gst_analyzer', 'done', { message: 'No GST return — skipped' });
    return {
      errors: [...(state.errors ?? []), 'gst_return document not found — skipping GST analysis'],
    };
  }

  try {
    console.log('[gst-node] Starting GST analysis...');
    await publishPipelineEvent(state.appId, 'gst_analyzer', 'processing', { message: 'Analyzing GST filings' });
    const analysis = await runGSTAgent(state.appId, result);
    console.log('[gst-node] ✓ GST analysis complete');
    await publishPipelineEvent(state.appId, 'gst_analyzer', 'done', { message: 'GST analysis complete' });
    return { gstAnalysis: analysis };
  } catch (e) {
    console.error('[gst-node] ✗ GST agent failed:', (e as Error).message);
    await publishPipelineEvent(state.appId, 'gst_analyzer', 'failed', { message: (e as Error).message });
    return {
      errors: [...(state.errors ?? []), `GST agent failed: ${(e as Error).message}`],
    };
  }
}
