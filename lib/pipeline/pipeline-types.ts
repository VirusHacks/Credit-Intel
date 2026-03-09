/**
 * types.ts
 * Shared type definitions for the credit pipeline graph.
 * Kept in a separate file to prevent circular imports between
 * graph.ts and the node files.
 */

import type { IngestResult } from '@/lib/pipeline/ingestor';
import type { BankStatementAnalysis } from '@/lib/agents/bank-statement-agent';
import type { GSTAnalysis } from '@/lib/agents/gst-agent';
import type { ITRBalancesheetAnalysis } from '@/lib/agents/itr-balancesheet-agent';
import type { CIBILAnalysis } from '@/lib/agents/cibil-agent';
import type { ScoutResult } from '@/lib/agents/scout-agent';
import type { AgentOutput } from '@/lib/agents/base-agent';
import type { PDFDocumentType } from '@/lib/types';

export interface CreditPipelineState {
  appId: string;
  companyName: string;
  promoterName?: string;

  // Ingest outputs: one per document type
  ingestResultMap: Partial<Record<PDFDocumentType, IngestResult>>;

  // Agent analysis outputs
  bankAnalysis: AgentOutput<BankStatementAnalysis> | null;
  gstAnalysis: AgentOutput<GSTAnalysis> | null;
  itrAnalysis: AgentOutput<ITRBalancesheetAnalysis> | null;
  cibilAnalysis: AgentOutput<CIBILAnalysis> | null;
  scoutAnalysis: ScoutResult | null;

  // Control flags
  awaitingQualitative: boolean;
  errors: string[];
}
