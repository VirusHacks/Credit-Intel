/**
 * gst-agent.ts
 * Analyses a GSTR-3B / GST return IngestResult.
 *
 * Computes: annual GST turnover, GSTR-3B vs 2A mismatch, ITC lapse,
 * filing compliance, e-way bill reconciliation, YoY revenue growth.
 * Flags: large 3B-vs-2A variance, significant ITC lapse, late filings.
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
export interface GSTAnalysis {
  gst_annual_turnover_lakh: number | null;
  gst_avg_monthly_turnover_lakh: number | null;
  gst_total_tax_paid_lakh: number | null;
  effective_gst_rate_pct: number | null;
  gst_3b_vs_2a_variance_lakh: number | null;
  gst_3b_vs_2a_variance_pct: number | null;
  itc_available_lakh: number | null;
  itc_claimed_lakh: number | null;
  itc_lapse_lakh: number | null;
  itc_lapse_pct: number | null;
  months_filed_on_time: number;           // out of 12
  nil_returns_count: number;              // months with ₹0 outward supply
  eway_bill_reconciled: boolean | null;
  gst_revenue_growth_pct: number | null;  // vs prior year (if available)
  seasonal_months: string[];              // months with >20% above-avg turnover
  confidence: number;
  flags: AgentFlag[];
}

const SIGNAL_SCHEMA = `{
  "gst_annual_turnover_lakh": <number|null>,
  "gst_avg_monthly_turnover_lakh": <number|null>,
  "gst_total_tax_paid_lakh": <number|null>,
  "effective_gst_rate_pct": <number|null — total_tax / turnover * 100>,
  "gst_3b_vs_2a_variance_lakh": <number|null>,
  "gst_3b_vs_2a_variance_pct": <number|null — variance / 2A * 100>,
  "itc_available_lakh": <number|null>,
  "itc_claimed_lakh": <number|null>,
  "itc_lapse_lakh": <number|null>,
  "itc_lapse_pct": <number|null — lapse / available * 100>,
  "months_filed_on_time": <integer 0-12>,
  "nil_returns_count": <integer>,
  "eway_bill_reconciled": <boolean|null>,
  "gst_revenue_growth_pct": <number|null>,
  "seasonal_months": [<string "Mon-YY">],
  "confidence": <number 0.0-1.0>,
  "flags": [{"key": <string>, "severity": "INFO"|"FLAG"|"RED_FLAG", "message": <string>}]
}`;

const INDIAN_CONTEXT = `
Key Indian GST underwriting norms:
- GST turnover is the most reliable revenue proxy (unmanipulated by Indian promoters vs ITR).
- GSTR-3B is declared by the taxpayer; GSTR-2A/2B is auto-populated from supplier filings.
- 3B vs 2A variance > 5% → FLAG; > 15% → RED_FLAG (ITC fraud risk, supplier non-compliance).
- ITC lapse > 5% of available ITC → FLAG (working capital inefficiency or vendor issues).
- Any monthly return filed late (after the 20th of following month) → note in flags.
- Nil returns in trading months = suspicious (revenue suppression for bank turnover disparity).
- Annual GST turnover should broadly match bank credit turnover (within 20–30%).
- E-way bill mismatch with GSTR-1 > 0.5% → FLAG.
- Effective GST rate below sector norms (textile: ~5–12%) could indicate exempt supply or evasion.
`;

export async function runGSTAgent(
  appId: string,
  ingestResult: IngestResult,
): Promise<AgentOutput<GSTAnalysis>> {
  await publishPipelineEvent(appId, 'agent_gst', 'processing');

  const data = extractedData(ingestResult);
  const prompt = buildAnalysisPrompt(
    'a senior GST-specialist credit analyst familiar with Indian indirect tax compliance',
    JSON.stringify(data, null, 2),
    SIGNAL_SCHEMA,
    INDIAN_CONTEXT,
  );

  const analysis = await callGeminiForAnalysis<GSTAnalysis>(prompt);

  const conf = analysis.confidence ?? 0.8;
  const rawSignals = [
    { key: 'gst_annual_turnover_lakh',         value: analysis.gst_annual_turnover_lakh,         confidence: conf },
    { key: 'gst_avg_monthly_turnover_lakh',    value: analysis.gst_avg_monthly_turnover_lakh,    confidence: conf },
    { key: 'gst_total_tax_paid_lakh',          value: analysis.gst_total_tax_paid_lakh,          confidence: conf },
    { key: 'effective_gst_rate_pct',           value: analysis.effective_gst_rate_pct,           confidence: conf },
    { key: 'gst_3b_vs_2a_variance_pct',        value: analysis.gst_3b_vs_2a_variance_pct,        confidence: conf },
    { key: 'itc_lapse_pct',                    value: analysis.itc_lapse_pct,                    confidence: conf },
    { key: 'months_filed_on_time',             value: analysis.months_filed_on_time,             confidence: conf },
    { key: 'nil_returns_count',                value: analysis.nil_returns_count,                confidence: conf },
    { key: 'eway_bill_reconciled',             value: String(analysis.eway_bill_reconciled),     confidence: conf },
    { key: 'gst_revenue_growth_pct',           value: analysis.gst_revenue_growth_pct,           confidence: conf },
    { key: 'seasonal_months_json',             value: analysis.seasonal_months,                  confidence: conf },
  ].filter((s) => s.value !== null && s.value !== undefined);

  const signals = await persistSignals(appId, 'gst_analyzer', rawSignals);
  await publishPipelineEvent(appId, 'agent_gst', 'done', {
    confidence: conf,
    flagCount: analysis.flags.length,
  });

  return {
    agentName: 'gst_analyzer',
    appId,
    signals,
    analysis,
    confidence: conf,
    flags: analysis.flags ?? [],
    modelUsed: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
  };
}
