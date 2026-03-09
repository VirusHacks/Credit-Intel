/**
 * app/api/pipeline/run-agent/route.ts
 * Thin testing/debugging route to invoke a single analysis agent directly
 * without running the full LangGraph pipeline.
 *
 * POST body:
 * {
 *   agentName: 'bank_statement' | 'gst_analyzer' | 'itr_balancesheet' | 'cibil_cmr' | 'scout'
 *   appId: string
 *   ingestResult?: IngestResult        (for bank_statement, gst_analyzer, cibil_cmr)
 *   itrIngestResult?: IngestResult     (for itr_balancesheet)
 *   bsIngestResult?: IngestResult      (for itr_balancesheet)
 *   companyName?: string               (for scout)
 *   promoterName?: string              (for scout)
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { runBankStatementAgent } from '@/lib/agents/bank-statement-agent';
import { runGSTAgent } from '@/lib/agents/gst-agent';
import { runITRBalancesheetAgent } from '@/lib/agents/itr-balancesheet-agent';
import { runCIBILAgent } from '@/lib/agents/cibil-agent';
import { runScoutAgent } from '@/lib/agents/scout-agent';
import type { IngestResult } from '@/lib/pipeline/ingestor';

type AgentName = 'bank_statement' | 'gst_analyzer' | 'itr_balancesheet' | 'cibil_cmr' | 'scout';

interface RunAgentBody {
  agentName: AgentName;
  appId: string;
  ingestResult?: IngestResult;
  itrIngestResult?: IngestResult;
  bsIngestResult?: IngestResult;
  companyName?: string;
  promoterName?: string;
}

export async function POST(request: NextRequest) {
  let body: RunAgentBody;
  try {
    body = (await request.json()) as RunAgentBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { agentName, appId } = body;

  if (!agentName || !appId) {
    return NextResponse.json(
      { error: 'Missing required fields: agentName, appId' },
      { status: 400 },
    );
  }

  const VALID_AGENTS: AgentName[] = [
    'bank_statement', 'gst_analyzer', 'itr_balancesheet', 'cibil_cmr', 'scout',
  ];

  if (!VALID_AGENTS.includes(agentName)) {
    return NextResponse.json(
      { error: `Invalid agentName. Valid: ${VALID_AGENTS.join(', ')}` },
      { status: 400 },
    );
  }

  try {
    let result: unknown;

    switch (agentName) {
      case 'bank_statement': {
        if (!body.ingestResult) {
          return NextResponse.json({ error: 'ingestResult required for bank_statement' }, { status: 400 });
        }
        result = await runBankStatementAgent(appId, body.ingestResult);
        break;
      }

      case 'gst_analyzer': {
        if (!body.ingestResult) {
          return NextResponse.json({ error: 'ingestResult required for gst_analyzer' }, { status: 400 });
        }
        result = await runGSTAgent(appId, body.ingestResult);
        break;
      }

      case 'itr_balancesheet': {
        result = await runITRBalancesheetAgent(
          appId,
          body.itrIngestResult ?? null,
          body.bsIngestResult ?? null,
        );
        break;
      }

      case 'cibil_cmr': {
        if (!body.ingestResult) {
          return NextResponse.json({ error: 'ingestResult required for cibil_cmr' }, { status: 400 });
        }
        result = await runCIBILAgent(appId, body.ingestResult);
        break;
      }

      case 'scout': {
        if (!body.companyName) {
          return NextResponse.json({ error: 'companyName required for scout' }, { status: 400 });
        }
        result = await runScoutAgent(appId, body.companyName, body.promoterName);
        break;
      }
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error(`[run-agent] ${agentName} failed:`, err);
    return NextResponse.json(
      { error: `Agent ${agentName} failed`, detail: (err as Error).message },
      { status: 500 },
    );
  }
}
