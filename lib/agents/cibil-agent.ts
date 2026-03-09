/**
 * cibil-agent.ts
 * Analyses a CIBIL TransUnion commercial report (CMR) IngestResult.
 *
 * IMPORTANT: CMR Rank is 1–10 (1 = best), NOT a credit score (300–900).
 *
 * Computes: CMR rank, DPD history, bounce count, wilful defaulter check,
 * restructured accounts, total exposure, promoter personal CIBIL score.
 * Flags: CMR > 6, any DPD 30+, bounce > 0, wilful defaulter, restructured.
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
export interface CIBILAnalysis {
  cmr_rank: number | null;                   // 1–10 (NOT 300–900)
  cmr_description: string | null;            // e.g. "LOW-TO-MEDIUM RISK"
  probability_of_default_pct: number | null; // 12-month PD from CIBIL

  total_sanctioned_lakh: number | null;
  total_outstanding_lakh: number | null;
  total_exposure_lakh: number | null;
  active_loan_count: number;
  closed_loan_count: number;

  dpd_30_count: number;   // number of months with 30+ DPD in last 24m
  dpd_60_count: number;
  dpd_90_count: number;
  max_dpd_observed: number;

  bounce_count_24m: number;           // cheque / ECS bounces
  wilful_defaulter_flag: boolean;
  rbi_defaulter_flag: boolean;
  suit_filed_flag: boolean;
  written_off_flag: boolean;
  restructured_accounts_flag: boolean;

  promoter_cibil_score: number | null;      // personal score 300–900
  promoter_dpd_flag: boolean;
  co_guarantor_cibil_score: number | null;

  enquiries_last_6m: number;               // credit enquiries (hunger index)
  new_lender_enquiries: string[];

  overdue_amount_lakh: number | null;

  confidence: number;
  flags: AgentFlag[];
}

const SIGNAL_SCHEMA = `{
  "cmr_rank": <integer 1-10 or null — IMPORTANT: range is 1-10, not 300-900>,
  "cmr_description": <string|null>,
  "probability_of_default_pct": <number|null>,
  "total_sanctioned_lakh": <number|null>,
  "total_outstanding_lakh": <number|null>,
  "total_exposure_lakh": <number|null>,
  "active_loan_count": <integer>,
  "closed_loan_count": <integer>,
  "dpd_30_count": <integer — months with 30+ DPD in last 24 months>,
  "dpd_60_count": <integer>,
  "dpd_90_count": <integer>,
  "max_dpd_observed": <integer — maximum DPD value seen>,
  "bounce_count_24m": <integer>,
  "wilful_defaulter_flag": <boolean>,
  "rbi_defaulter_flag": <boolean>,
  "suit_filed_flag": <boolean>,
  "written_off_flag": <boolean>,
  "restructured_accounts_flag": <boolean>,
  "promoter_cibil_score": <integer 300-900 or null>,
  "promoter_dpd_flag": <boolean>,
  "co_guarantor_cibil_score": <integer 300-900 or null>,
  "enquiries_last_6m": <integer>,
  "new_lender_enquiries": [<string — lender name>],
  "overdue_amount_lakh": <number|null>,
  "confidence": <number 0.0-1.0>,
  "flags": [{"key": <string>, "severity": "INFO"|"FLAG"|"RED_FLAG", "message": <string>}]
}`;

const INDIAN_CONTEXT = `
Critical Indian CIBIL / CMR norms:

**CMR RANK SCALE (CRITICAL):**
- CMR (CIBIL MSME Rank) is 1 to 10. 1 = BEST (lowest risk). 10 = WORST (highest risk).
- This is COMPLETELY DIFFERENT from the personal CIBIL score (300-900).
- CMR 1–3: Low risk (generally approvable).
- CMR 4–5: Low-to-medium risk (approve with conditions).
- CMR 6–7: Medium-to-high risk (enhanced due diligence required).
- CMR 8–10: High risk (exceptional justification needed → RED_FLAG).
- CMR rank NOT AVAILABLE → treat as medium risk, note as unverified.

**DPD (Days Past Due) norms:**
- 0 DPD in last 24 months → excellent.
- Any 30+ DPD → FLAG. Any 60+ DPD → RED_FLAG. 90+ DPD (NPA territory) → RED_FLAG.

**Other red lines:**
- Wilful defaulter listed → RED_FLAG (do not lend).
- RBI defaulter list → RED_FLAG.
- Suit filed (DRT/NCLT) → RED_FLAG.
- Written-off accounts (ever) → RED_FLAG.
- Restructured loans (OTS / MSME scheme) → FLAG.
- > 3 credit enquiries in 6 months → FLAG (credit hunger, multiple applications).

**Promoter personal score:**
- Below 650 → FLAG. Below 600 → RED_FLAG.
- Personal guarantee is standard for MSME/SME — DPD on personal accounts counts.
`;

export async function runCIBILAgent(
  appId: string,
  ingestResult: IngestResult,
): Promise<AgentOutput<CIBILAnalysis>> {
  await publishPipelineEvent(appId, 'agent_cibil', 'processing');

  const data = extractedData(ingestResult);
  const prompt = buildAnalysisPrompt(
    'a CIBIL-certified credit risk analyst at an Indian commercial bank',
    JSON.stringify(data, null, 2),
    SIGNAL_SCHEMA,
    INDIAN_CONTEXT,
  );

  const analysis = await callGeminiForAnalysis<CIBILAnalysis>(prompt);

  const conf = analysis.confidence ?? 0.85;
  const rawSignals = [
    { key: 'cmr_rank',                    value: analysis.cmr_rank,                    confidence: conf },
    { key: 'cmr_description',             value: analysis.cmr_description,             confidence: conf },
    { key: 'probability_of_default_pct',  value: analysis.probability_of_default_pct,  confidence: conf },
    { key: 'total_outstanding_lakh',      value: analysis.total_outstanding_lakh,      confidence: conf },
    { key: 'total_exposure_lakh',         value: analysis.total_exposure_lakh,          confidence: conf },
    { key: 'active_loan_count',           value: analysis.active_loan_count,            confidence: conf },
    { key: 'dpd_30_count',                value: analysis.dpd_30_count,                confidence: conf },
    { key: 'dpd_90_count',                value: analysis.dpd_90_count,                confidence: conf },
    { key: 'max_dpd_observed',            value: analysis.max_dpd_observed,            confidence: conf },
    { key: 'bounce_count_24m',            value: analysis.bounce_count_24m,            confidence: conf },
    { key: 'wilful_defaulter_flag',       value: String(analysis.wilful_defaulter_flag), confidence: conf },
    { key: 'rbi_defaulter_flag',          value: String(analysis.rbi_defaulter_flag),  confidence: conf },
    { key: 'suit_filed_flag',             value: String(analysis.suit_filed_flag),     confidence: conf },
    { key: 'restructured_accounts_flag',  value: String(analysis.restructured_accounts_flag), confidence: conf },
    { key: 'promoter_cibil_score',        value: analysis.promoter_cibil_score,        confidence: conf },
    { key: 'promoter_dpd_flag',           value: String(analysis.promoter_dpd_flag),   confidence: conf },
    { key: 'enquiries_last_6m',           value: analysis.enquiries_last_6m,           confidence: conf },
    { key: 'overdue_amount_lakh',         value: analysis.overdue_amount_lakh,         confidence: conf },
  ].filter((s) => s.value !== null && s.value !== undefined);

  const signals = await persistSignals(appId, 'cibil_cmr', rawSignals);
  await publishPipelineEvent(appId, 'agent_cibil', 'done', {
    confidence: conf,
    flagCount: analysis.flags.length,
  });

  return {
    agentName: 'cibil_cmr',
    appId,
    signals,
    analysis,
    confidence: conf,
    flags: analysis.flags ?? [],
    modelUsed: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
  };
}
