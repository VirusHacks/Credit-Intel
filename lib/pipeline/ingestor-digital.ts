import { GoogleGenerativeAI } from '@google/generative-ai';
import type { PDFDocumentType } from '@/lib/types';

// Configurable — can override via env if model ID changes
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';

// ─── Per-document-type extraction prompts (Indian context) ───────────────────
const EXTRACTION_PROMPTS: Record<PDFDocumentType, string> = {
  bank_statement: `You are an expert Indian banking analyst reviewing a corporate bank statement.
Extract the following and respond with a single JSON object:
{
  "account_holder": "string",
  "bank_name": "string",
  "account_number_last4": "string",
  "period": "MM/YYYY to MM/YYYY",
  "monthly_series": [
    { "month": "MM/YYYY", "opening_balance": 0, "credits": 0, "debits": 0, "closing_balance": 0 }
  ],
  "avg_monthly_balance": 0,
  "total_credits_12m": 0,
  "emi_payments": [{ "lender": "string", "monthly_emi": 0 }],
  "large_cash_withdrawals": [{ "date": "string", "amount": 0, "percent_of_monthly_credits": 0 }],
  "circular_transaction_flag": false,
  "circular_transaction_details": "string or null",
  "currency": "INR",
  "confidence": 0.0
}
All amounts in INR lakhs. Flag circular transactions (same amount HDFC→ICICI→HDFC within same month).
Return ONLY valid JSON, no markdown.`,

  gst_return: `You are an expert in Indian GST compliance reviewing GSTR-3B and/or GSTR-2A filings.
Extract the following and respond with a single JSON object:
{
  "gstin": "string",
  "taxpayer_name": "string",
  "filing_period": "FY YYYY-YY",
  "monthly_3b": [
    { "month": "MM/YYYY", "taxable_turnover": 0, "total_tax_paid": 0, "itc_claimed": 0 }
  ],
  "monthly_2a": [
    { "month": "MM/YYYY", "matched_itc": 0 }
  ],
  "total_declared_revenue": 0,
  "total_itc_claimed": 0,
  "total_matched_itc_2a": 0,
  "itc_mismatch_percent": 0,
  "nil_filer_months": ["MM/YYYY"],
  "fake_invoice_flag": false,
  "fake_invoice_details": "string or null",
  "currency": "INR",
  "confidence": 0.0
}
IMPORTANT: GSTR-3B is self-declared; GSTR-2A is reconciled from supplier filings.
ITC mismatch >10% between 3B and 2A is a fake invoice signal.
Return ONLY valid JSON, no markdown.`,

  itr: `You are an expert in Indian corporate taxation reviewing an ITR (Income Tax Return) filing.
Extract the following and respond with a single JSON object:
{
  "company_name": "string",
  "pan": "string",
  "assessment_year": "AY YYYY-YY",
  "gross_turnover": 0,
  "net_profit_loss": 0,
  "total_income": 0,
  "tax_paid": 0,
  "sundry_debtors": 0,
  "sundry_creditors": 0,
  "directors_remuneration": 0,
  "directors_loans": 0,
  "secured_loans": [{ "lender": "string", "amount": 0 }],
  "unsecured_loans": [{ "lender": "string", "amount": 0 }],
  "related_party_transactions": [{ "party_name": "string", "amount": 0, "nature": "string" }],
  "related_party_percent_of_revenue": 0,
  "contingent_liabilities": 0,
  "cwip": 0,
  "section8_entities_found": ["company names if any"],
  "related_party_flag": false,
  "currency": "INR",
  "confidence": 0.0
}
CRITICAL: Flag related_party_flag=true if related party transactions >20% of revenue.
Section 8 companies in related party list = shell company signal.
Return ONLY valid JSON, no markdown.`,

  financial_statement: `You are an expert Indian CA reviewing a corporate financial statement / balance sheet.
Extract the following and respond with a single JSON object:
{
  "company_name": "string",
  "period": "FY YYYY-YY",
  "total_assets": 0,
  "total_liabilities": 0,
  "net_worth": 0,
  "total_revenue": 0,
  "gross_profit": 0,
  "ebitda": 0,
  "pat": 0,
  "debt_equity_ratio": 0,
  "current_ratio": 0,
  "operating_cash_flow": 0,
  "sundry_debtors_days": 0,
  "sundry_creditors_days": 0,
  "inventory_days": 0,
  "cwip": 0,
  "auditor_remarks": "string or null",
  "going_concern_flag": false,
  "currency": "INR",
  "confidence": 0.0
}
Return ONLY valid JSON, no markdown.`,

  annual_report: `You are an expert analyst reviewing an Indian corporate Annual Report.
Extract the following and respond with a single JSON object:
{
  "company_name": "string",
  "fiscal_year": "FY YYYY-YY",
  "revenue": 0,
  "ebit": 0,
  "pat": 0,
  "total_assets": 0,
  "total_debt": 0,
  "net_worth": 0,
  "debt_equity_ratio": 0,
  "current_ratio": 0,
  "promoter_holding_percent": 0,
  "promoter_pledge_percent": 0,
  "key_risks_mentioned": ["string"],
  "auditor_name": "string",
  "auditor_qualification": "string or null",
  "board_composition": { "independent_directors": 0, "total_directors": 0 },
  "currency": "INR",
  "confidence": 0.0
}
Return ONLY valid JSON, no markdown.`,

  cibil_report: `You are an expert credit analyst interpreting an Indian CIBIL Commercial Report.
CRITICAL: The CIBIL Commercial Rank (CMR) is on a scale of 1–10 where 1=LOWEST RISK and 10=HIGHEST RISK.
This is NOT the consumer CIBIL score (300–900).
Extract the following and respond with a single JSON object:
{
  "company_name": "string",
  "report_date": "DD/MM/YYYY",
  "cmr_rank": 0,
  "cmr_risk_category": "Low Risk|Moderate Risk|High Risk",
  "total_credit_exposure": 0,
  "active_credit_facilities": [{ "lender": "string", "facility_type": "string", "sanctioned_amount": 0, "outstanding": 0, "overdue": 0 }],
  "npa_accounts": [{ "lender": "string", "amount": 0, "date_of_npa": "string" }],
  "days_past_due_worst": 0,
  "credit_inquiries_6m": 0,
  "currency": "INR",
  "confidence": 0.0
}
CMR 1-3 = Low Risk. CMR 4-6 = Moderate Risk. CMR 7-10 = High Risk (auto RED FLAG on Character score).
Return ONLY valid JSON, no markdown.`,

  sanction_letter: `You are an expert banker reviewing a loan sanction letter from an Indian bank/NBFC.
Extract the following and respond with a single JSON object:
{
  "lender_name": "string",
  "borrower_name": "string",
  "sanction_date": "DD/MM/YYYY",
  "facility_type": "Term Loan|Working Capital|CC|OD|other",
  "sanctioned_amount": 0,
  "interest_rate_percent": 0,
  "tenure_months": 0,
  "repayment_frequency": "Monthly|Quarterly|Bullet",
  "collateral": [{ "type": "string", "description": "string", "value": 0 }],
  "conditions_precedent": ["string"],
  "outstanding_balance": 0,
  "currency": "INR",
  "confidence": 0.0
}
Return ONLY valid JSON, no markdown.`,

  other: `You are an expert financial analyst. Extract all key financial and business information
from this document and respond with a JSON object containing the most relevant data points.
Include a "confidence" field (0.0–1.0).
Return ONLY valid JSON, no markdown.`,
};

export interface DigitalExtractionResult {
  documentType: PDFDocumentType;
  extractedData: Record<string, unknown>;
  confidence: number;
  rawText: string;
  pageCount: number;
  modelUsed: string;
}

/**
 * Ingest a digital (text-embedded) PDF using Gemini 2.5 Flash native PDF mode.
 * No OCR — Gemini reads the raw PDF bytes directly, preserving layout.
 */
export async function ingestDigital(
  buffer: Buffer,
  documentType: PDFDocumentType,
  pageCount: number,
): Promise<DigitalExtractionResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

  const genai = new GoogleGenerativeAI(apiKey);
  const model = genai.getGenerativeModel({ model: GEMINI_MODEL });

  const prompt = EXTRACTION_PROMPTS[documentType] ?? EXTRACTION_PROMPTS.other;
  const base64 = buffer.toString('base64');

  const result = await model.generateContent([
    { inlineData: { mimeType: 'application/pdf', data: base64 } },
    { text: prompt },
  ]);

  const rawText = result.response.text();

  // ── Parse JSON from the model response ─────────────────────────────────────
  let extractedData: Record<string, unknown> = {};
  let confidence = 0.5;

  try {
    // Try to extract a JSON block (some models wrap in ```json ... ```)
    const fencedMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const jsonStr = fencedMatch ? fencedMatch[1] : rawText.trim();
    const parsed = JSON.parse(jsonStr) as Record<string, unknown>;

    confidence = typeof parsed.confidence === 'number' ? (parsed.confidence as number) : 0.82;
    // Remove the confidence field from data (we store it separately)
    const { confidence: _c, ...data } = parsed;
    void _c;
    extractedData = data;
  } catch {
    // Could not parse as JSON — return raw text as a fallback signal
    extractedData = { raw_text: rawText };
    confidence = 0.45;
  }

  return {
    documentType,
    extractedData,
    confidence,
    rawText,
    pageCount,
    modelUsed: GEMINI_MODEL,
  };
}
