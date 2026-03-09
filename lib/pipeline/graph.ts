/**
 * graph.ts
 * LangGraph StateGraph that orchestrates the full credit decisioning pipeline.
 *
 * Graph flow:
 *
 *  START ──► ingest ─── fan-out parallel ──┬──► bank
 *                                           ├──► gst
 *                                           ├──► itr
 *                                           ├──► cibil
 *                                           └──► scout
 *                   fan-in ◄────────────────┘
 *                         │
 *                         ▼
 *                   qualitative_gate ──► (wait | continue)
 *                         │ continue
 *                         ▼
 *                       END
 *
 * The agents run in parallel after ingest.  The qualitative gate is a
 * conditional edge that halts the graph (returns 'wait') until an
 * underwriter marks the qualitative section complete.
 */

import { StateGraph, Annotation, START, END } from '@langchain/langgraph';
import type { IngestResult } from '@/lib/pipeline/ingestor';
import type { BankStatementAnalysis } from '@/lib/agents/bank-statement-agent';
import type { GSTAnalysis } from '@/lib/agents/gst-agent';
import type { ITRBalancesheetAnalysis } from '@/lib/agents/itr-balancesheet-agent';
import type { CIBILAnalysis } from '@/lib/agents/cibil-agent';
import type { ScoutResult } from '@/lib/agents/scout-agent';
import type { AgentOutput } from '@/lib/agents/base-agent';
import type { PDFDocumentType } from '@/lib/types';
export type { CreditPipelineState } from './pipeline-types';
import type { CreditPipelineState } from './pipeline-types';

import { ingestNode } from './nodes/ingest-node';
import { bankNode } from './nodes/bank-node';
import { gstNode } from './nodes/gst-node';
import { itrNode } from './nodes/itr-node';
import { cibilNode } from './nodes/cibil-node';
import { scoutNode } from './nodes/scout-node';
import { qualitativeGateNode } from './nodes/qualitative-gate-node';

// ─── Annotation (LangGraph state schema) ─────────────────────────────────────

const PipelineAnnotation = Annotation.Root({
  appId: Annotation<string>(),
  companyName: Annotation<string>(),
  promoterName: Annotation<string | undefined>({
    default: () => undefined,
    reducer: (_prev, next) => next,
  }),
  ingestResultMap: Annotation<Partial<Record<PDFDocumentType, IngestResult>>>({
    default: () => ({}),
    // merge dictionaries: later nodes can add more entries
    reducer: (prev, next) => ({ ...prev, ...next }),
  }),
  bankAnalysis: Annotation<AgentOutput<BankStatementAnalysis> | null>({
    default: () => null,
    reducer: (_prev, next) => next,
  }),
  gstAnalysis: Annotation<AgentOutput<GSTAnalysis> | null>({
    default: () => null,
    reducer: (_prev, next) => next,
  }),
  itrAnalysis: Annotation<AgentOutput<ITRBalancesheetAnalysis> | null>({
    default: () => null,
    reducer: (_prev, next) => next,
  }),
  cibilAnalysis: Annotation<AgentOutput<CIBILAnalysis> | null>({
    default: () => null,
    reducer: (_prev, next) => next,
  }),
  scoutAnalysis: Annotation<ScoutResult | null>({
    default: () => null,
    reducer: (_prev, next) => next,
  }),
  awaitingQualitative: Annotation<boolean>({
    default: () => false,
    reducer: (_prev, next) => next,
  }),
  errors: Annotation<string[]>({
    default: () => [],
    // merge error arrays from parallel branches
    reducer: (prev, next) => [...prev, ...next],
  }),
});

// ─── Conditional edge: qualitative gate ──────────────────────────────────────

function qualitativeGateRouter(
  state: typeof PipelineAnnotation.State,
): string {
  return state.awaitingQualitative ? 'wait' : 'continue';
}

// ─── Build graph ──────────────────────────────────────────────────────────────

const workflow = new StateGraph(PipelineAnnotation)
  // nodes
  .addNode('ingest', ingestNode)
  .addNode('bank', bankNode)
  .addNode('gst', gstNode)
  .addNode('itr', itrNode)
  .addNode('cibil', cibilNode)
  .addNode('scout', scoutNode)
  .addNode('qualitative_gate', qualitativeGateNode)

  // ingest → fan out to all agents in parallel
  .addEdge(START, 'ingest')
  .addEdge('ingest', 'bank')
  .addEdge('ingest', 'gst')
  .addEdge('ingest', 'itr')
  .addEdge('ingest', 'cibil')
  .addEdge('ingest', 'scout')

  // all agents → qualitative gate
  .addEdge('bank', 'qualitative_gate')
  .addEdge('gst', 'qualitative_gate')
  .addEdge('itr', 'qualitative_gate')
  .addEdge('cibil', 'qualitative_gate')
  .addEdge('scout', 'qualitative_gate')

  // conditional: wait (pause for underwriter) or continue to END
  .addConditionalEdges('qualitative_gate', qualitativeGateRouter, {
    wait: END,
    continue: END,
  });

export const creditGraph = workflow.compile();

// ─── Convenience runner ───────────────────────────────────────────────────────

export interface RunPipelineInput {
  appId: string;
  companyName: string;
  promoterName?: string;
}

export async function runCreditPipeline(input: RunPipelineInput): Promise<CreditPipelineState> {
  const finalState = await creditGraph.invoke({
    appId: input.appId,
    companyName: input.companyName,
    promoterName: input.promoterName,
  });
  return finalState as unknown as CreditPipelineState;
}
