/**
 * bank-statement-agent.ts
 * Analyses a 12-month bank statement IngestResult.
 *
 * Computes: ABB, credit turnover, OD utilisation, circular-transaction risk,
 * cash-withdrawal ratio, EMI obligations, bounce count, DSCR proxy.
 * Flags: circular credits > 10%, cash > 25%, OD > 90%, any bounces.
 */

import type { IngestResult } from '@/lib/pipeline/ingestor';
import {
  buildAnalysisPrompt,
  callGeminiForAnalysis,
  persistSignals,
  publishPipelineEvent,
  extractedData,
  type AgentOutput,
  type AgentFlag,
} from './base-agent';

// ─── Output type ──────────────────────────────────────────────────────────────
export interface BankStatementAnalysis {
  avg_bank_balance_lakh: number | null;
  annual_credit_turnover_lakh: number | null;
  avg_monthly_credit_lakh: number | null;
  od_limit_lakh: number | null;
  od_utilization_pct: number | null;
  cash_withdrawal_pct: number | null;
  circular_transaction_flag: boolean;
  circular_transaction_pct: number | null;
  circular_transaction_parties: string[];
  emi_obligations_monthly_lakh: number | null;
  bounce_count_12m: number;
  monthly_credits: Array<{ month: string; credit: number }>;
  credit_cv_pct: number | null;           // coefficient of variation (seasonality)
  dscr_proxy: number | null;              // ABB / EMI — rough proxy
  banking_health_score: number;           // 0–100 computed by model
  confidence: number;
  flags: AgentFlag[];
}

const SIGNAL_SCHEMA = `{
  "avg_bank_balance_lakh": <number|null>,
  "annual_credit_turnover_lakh": <number|null>,
  "avg_monthly_credit_lakh": <number|null>,
  "od_limit_lakh": <number|null>,
  "od_utilization_pct": <number|null — percent 0-100>,
  "cash_withdrawal_pct": <number|null — % of total debits>,
  "circular_transaction_flag": <boolean>,
  "circular_transaction_pct": <number|null — % of total credits>,
  "circular_transaction_parties": [<string>],
  "emi_obligations_monthly_lakh": <number|null>,
  "bounce_count_12m": <integer — 0 if none>,
  "monthly_credits": [{"month": "MM/YYYY", "credit": <number in lakh>}],
  "credit_cv_pct": <number|null — std_dev/mean * 100>,
  "dscr_proxy": <number|null — avg_bank_balance / (12 * monthly_emi) >,
  "banking_health_score": <integer 0-100>,
  "confidence": <number 0.0-1.0>,
  "flags": [{"key": <string>, "severity": "INFO"|"FLAG"|"RED_FLAG", "message": <string>}]
}`;

const INDIAN_CONTEXT = `
Key Indian banking norms to apply:
- ABB (Average Bank Balance) should comfortably cover 1 EMI cycle (≥ 1x monthly EMI).
- Annual bank credits ≥ 3x the requested loan amount is generally expected.
- OD utilisation persistently > 90% → FLAG (stress indicator).
- Circular transactions: credits from related parties. > 10% of total credits → FLAG; > 20% → RED_FLAG.
- Cash withdrawals > 25% of total debits → FLAG (cash economy, tax evasion concern).
- Any EMI / cheque bounce (ECS return) → RED_FLAG (even 1 in 12 months is serious).
- Credit Variance (CV%): SD/Mean * 100. < 30% = stable, 30–60% = seasonal, > 60% = erratic → FLAG.
- DSCR proxy = ABB / (12-month EMI burden). < 1.1 → concern.
`;

export async function runBankStatementAgent(
  appId: string,
  ingestResult: IngestResult,
): Promise<AgentOutput<BankStatementAnalysis>> {
  await publishPipelineEvent(appId, 'agent_bank', 'processing');

  const data = extractedData(ingestResult);
  const prompt = buildAnalysisPrompt(
    'a senior bank credit analyst specialising in MSME cash-flow underwriting',
    JSON.stringify(data, null, 2),
    SIGNAL_SCHEMA,
    INDIAN_CONTEXT,
  );

  const analysis = await callGeminiForAnalysis<BankStatementAnalysis>(prompt);

  // ── Map analysis fields → AgentSignal rows ────────────────────────────────
  const conf = analysis.confidence ?? 0.8;
  const rawSignals = [
    { key: 'avg_bank_balance_lakh',           value: analysis.avg_bank_balance_lakh,           confidence: conf },
    { key: 'annual_credit_turnover_lakh',      value: analysis.annual_credit_turnover_lakh,      confidence: conf },
    { key: 'avg_monthly_credit_lakh',          value: analysis.avg_monthly_credit_lakh,          confidence: conf },
    { key: 'od_limit_lakh',                    value: analysis.od_limit_lakh,                    confidence: conf },
    { key: 'od_utilization_pct',               value: analysis.od_utilization_pct,               confidence: conf },
    { key: 'cash_withdrawal_pct',              value: analysis.cash_withdrawal_pct,              confidence: conf },
    { key: 'circular_transaction_flag',        value: String(analysis.circular_transaction_flag), confidence: conf },
    { key: 'circular_transaction_pct',         value: analysis.circular_transaction_pct,         confidence: conf },
    { key: 'circular_transaction_parties',     value: analysis.circular_transaction_parties,     confidence: conf },
    { key: 'emi_obligations_monthly_lakh',     value: analysis.emi_obligations_monthly_lakh,     confidence: conf },
    { key: 'bounce_count_12m',                 value: analysis.bounce_count_12m,                 confidence: conf },
    { key: 'credit_cv_pct',                    value: analysis.credit_cv_pct,                    confidence: conf },
    { key: 'dscr_proxy',                       value: analysis.dscr_proxy,                       confidence: conf },
    { key: 'banking_health_score',             value: analysis.banking_health_score,             confidence: conf },
    { key: 'monthly_credits_json',             value: analysis.monthly_credits,                  confidence: conf },
  ].filter((s) => s.value !== null && s.value !== undefined);

  const signals = await persistSignals(appId, 'bank_statement', rawSignals);
  await publishPipelineEvent(appId, 'agent_bank', 'done', {
    confidence: conf,
    flagCount: analysis.flags.length,
  });

  return {
    agentName: 'bank_statement',
    appId,
    signals,
    analysis,
    confidence: conf,
    flags: analysis.flags ?? [],
    modelUsed: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
  };
}
