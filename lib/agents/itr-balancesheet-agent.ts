/**
 * itr-balancesheet-agent.ts
 * Analyses ITR-6 + audited Balance Sheet / P&L IngestResult.
 *
 * Computes: PAT, EBITDA, net profit margin, D/E ratio, current ratio,
 * ICR, DSCR, related-party exposure, revenue growth YoY.
 * Flags: related party > 20%, Section 8, ICR < 1.5, D/E > 3.
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
export interface ITRBalancesheetAnalysis {
  // Income Statement
  revenue_lakh: number | null;
  ebitda_lakh: number | null;
  ebitda_margin_pct: number | null;
  pbt_lakh: number | null;
  tax_lakh: number | null;
  pat_lakh: number | null;
  net_profit_margin_pct: number | null;
  finance_costs_lakh: number | null;
  depreciation_lakh: number | null;

  // Balance Sheet
  total_assets_lakh: number | null;
  total_debt_lakh: number | null;
  equity_lakh: number | null;
  current_assets_lakh: number | null;
  current_liabilities_lakh: number | null;

  // Ratios
  debt_to_equity: number | null;
  current_ratio: number | null;
  icr: number | null;           // EBIT / Finance Costs
  dscr: number | null;          // (PAT + Depreciation) / (Principal + Interest)
  roce_pct: number | null;      // EBIT / Capital Employed * 100

  // India-specific
  related_party_pct: number | null;     // related-party expenses as % of total expenses
  related_party_lakh: number | null;
  section_8_company: boolean;           // charitable purpose — blocks commercial lending
  mat_applicable: boolean;
  brought_forward_losses: boolean;
  revenue_growth_pct: number | null;    // YoY revenue growth

  // YoY comparison
  prev_year_revenue_lakh: number | null;
  prev_year_pat_lakh: number | null;

  confidence: number;
  flags: AgentFlag[];
}

const SIGNAL_SCHEMA = `{
  "revenue_lakh": <number|null>,
  "ebitda_lakh": <number|null>,
  "ebitda_margin_pct": <number|null>,
  "pbt_lakh": <number|null>,
  "tax_lakh": <number|null>,
  "pat_lakh": <number|null>,
  "net_profit_margin_pct": <number|null>,
  "finance_costs_lakh": <number|null>,
  "depreciation_lakh": <number|null>,
  "total_assets_lakh": <number|null>,
  "total_debt_lakh": <number|null>,
  "equity_lakh": <number|null>,
  "current_assets_lakh": <number|null>,
  "current_liabilities_lakh": <number|null>,
  "debt_to_equity": <number|null>,
  "current_ratio": <number|null>,
  "icr": <number|null — EBIT / Finance Costs>,
  "dscr": <number|null — (PAT + Depreciation) / (Principal Repayment + Interest)>,
  "roce_pct": <number|null>,
  "related_party_pct": <number|null>,
  "related_party_lakh": <number|null>,
  "section_8_company": <boolean>,
  "mat_applicable": <boolean>,
  "brought_forward_losses": <boolean>,
  "revenue_growth_pct": <number|null>,
  "prev_year_revenue_lakh": <number|null>,
  "prev_year_pat_lakh": <number|null>,
  "confidence": <number 0.0-1.0>,
  "flags": [{"key": <string>, "severity": "INFO"|"FLAG"|"RED_FLAG", "message": <string>}]
}`;

const INDIAN_CONTEXT = `
Key Indian credit norms for ITR / Balance Sheet analysis:
- DSCR (Debt Service Coverage Ratio): (PAT + Depreciation) / (Principal + Interest due in year).
  Minimum acceptable DSCR: 1.25. Below 1.0 → RED_FLAG.
- ICR (Interest Coverage Ratio): EBIT / Finance Costs. Below 1.5 → FLAG; below 1.0 → RED_FLAG.
- D/E (Debt-to-Equity): above 3.0 → FLAG for MSME; above 4.0 → RED_FLAG.
- Current Ratio < 1.0 → RED_FLAG (working capital stress).
- Related-party transactions u/s 40A(2)(b): > 20% of expenses → RED_FLAG (profit tunnelling).
- Section 8 companies (charitable) → RED_FLAG for commercial credit.
- Brought-forward losses → negative retained earnings → FLAG.
- MAT (Minimum Alternate Tax) applicability: note it; does not by itself trigger a flag.
- Revenue growth < 0% (declining) → FLAG; < -10% → RED_FLAG.
- Auditor qualification in audit report → RED_FLAG (if mentioned in extracted data).
- Depreciation spikes y-o-y > 30% without capex explanation → FLAG.
- Finance costs growing faster than revenue → FLAG.
`;

export async function runITRBalancesheetAgent(
  appId: string,
  itrResult: IngestResult | null,
  bsResult: IngestResult | null,
): Promise<AgentOutput<ITRBalancesheetAnalysis>> {
  await publishPipelineEvent(appId, 'agent_itr', 'processing');

  // Merge data from ITR and Balance Sheet if both available
  const combinedData = {
    ...(itrResult ? extractedData(itrResult) : {}),
    ...(bsResult ? extractedData(bsResult) : {}),
    _sources: [
      itrResult ? 'itr' : null,
      bsResult ? 'financial_statement' : null,
    ].filter(Boolean),
  };

  const prompt = buildAnalysisPrompt(
    'a chartered accountant and credit analyst specialising in Indian MSME / mid-corporate financial analysis',
    JSON.stringify(combinedData, null, 2),
    SIGNAL_SCHEMA,
    INDIAN_CONTEXT,
  );

  const analysis = await callGeminiForAnalysis<ITRBalancesheetAnalysis>(prompt);

  const conf = analysis.confidence ?? 0.8;
  const rawSignals = [
    { key: 'revenue_lakh',             value: analysis.revenue_lakh,             confidence: conf },
    { key: 'ebitda_lakh',              value: analysis.ebitda_lakh,              confidence: conf },
    { key: 'ebitda_margin_pct',        value: analysis.ebitda_margin_pct,        confidence: conf },
    { key: 'pat_lakh',                 value: analysis.pat_lakh,                 confidence: conf },
    { key: 'net_profit_margin_pct',    value: analysis.net_profit_margin_pct,    confidence: conf },
    { key: 'finance_costs_lakh',       value: analysis.finance_costs_lakh,       confidence: conf },
    { key: 'total_debt_lakh',          value: analysis.total_debt_lakh,          confidence: conf },
    { key: 'equity_lakh',              value: analysis.equity_lakh,              confidence: conf },
    { key: 'debt_to_equity',           value: analysis.debt_to_equity,           confidence: conf },
    { key: 'current_ratio',            value: analysis.current_ratio,            confidence: conf },
    { key: 'icr',                      value: analysis.icr,                      confidence: conf },
    { key: 'dscr',                     value: analysis.dscr,                     confidence: conf },
    { key: 'roce_pct',                 value: analysis.roce_pct,                 confidence: conf },
    { key: 'related_party_pct',        value: analysis.related_party_pct,        confidence: conf },
    { key: 'section_8_company',        value: String(analysis.section_8_company), confidence: conf },
    { key: 'brought_forward_losses',   value: String(analysis.brought_forward_losses), confidence: conf },
    { key: 'revenue_growth_pct',       value: analysis.revenue_growth_pct,       confidence: conf },
    { key: 'mat_applicable',           value: String(analysis.mat_applicable),   confidence: conf },
  ].filter((s) => s.value !== null && s.value !== undefined);

  const signals = await persistSignals(appId, 'itr_balancesheet', rawSignals);
  await publishPipelineEvent(appId, 'agent_itr', 'done', {
    confidence: conf,
    flagCount: analysis.flags.length,
  });

  return {
    agentName: 'itr_balancesheet',
    appId,
    signals,
    analysis,
    confidence: conf,
    flags: analysis.flags ?? [],
    modelUsed: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
  };
}
