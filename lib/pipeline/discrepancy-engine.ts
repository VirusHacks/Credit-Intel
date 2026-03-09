/**
 * discrepancy-engine.ts
 * 7-check triangulation engine that cross-validates signals from multiple agents.
 *
 * Reads from Redis blackboard (`signals:{appId}`) and computes discrepancies
 * between document sources to detect manipulation, inflation or suppression.
 */

import { redis, redisKeys } from '@/lib/redis';
import type { DiscrepancyResult, DiscrepancyVerdict } from '@/lib/types';

// ─── Redis signal reader ───────────────────────────────────────────────────────

async function getSignals(appId: string): Promise<Record<string, string>> {
  if (!redis) return {};
  try {
    const raw = await redis.hgetall(redisKeys.signals(appId));
    if (!raw) return {};
    // hgetall returns Record<string, unknown> in some SDK versions; cast safely
    const result: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw)) {
      result[k] = typeof v === 'string' ? v : JSON.stringify(v);
    }
    return result;
  } catch {
    return {};
  }
}

function parseSignalValue(raw: string | null | undefined): number | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const v = parsed?.value ?? parsed;
    const n = Number(v);
    return isNaN(n) ? null : n;
  } catch {
    const n = Number(raw);
    return isNaN(n) ? null : n;
  }
}

function parseSignalBool(raw: string | null | undefined): boolean | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const v = parsed?.value ?? parsed;
    if (v === 'true' || v === true) return true;
    if (v === 'false' || v === false) return false;
    return null;
  } catch {
    return null;
  }
}

function verdict(val: number, flagThreshold: number, redThreshold: number): DiscrepancyVerdict {
  if (val >= redThreshold) return 'RED_FLAG';
  if (val >= flagThreshold) return 'FLAG';
  return 'PASS';
}

// ─── The 7 checks ─────────────────────────────────────────────────────────────

export async function runDiscrepancyEngine(appId: string): Promise<DiscrepancyResult[]> {
  const signals = await getSignals(appId);

  const results: DiscrepancyResult[] = [];

  // Pull all needed signals --------------------------------------------------

  // Bank signals
  const bankAnnualCreditLakh  = parseSignalValue(signals['bank_statement:annual_credit_turnover_lakh']);
  const bankAvgMonthlyCredit  = bankAnnualCreditLakh != null ? bankAnnualCreditLakh / 12 : null;
  const cashWithdrawalPct     = parseSignalValue(signals['bank_statement:cash_withdrawal_pct']);
  const circularFlag          = parseSignalBool(signals['bank_statement:circular_transaction_flag']);
  const circularPct           = parseSignalValue(signals['bank_statement:circular_transaction_pct']);
  const bankingHealthScore    = parseSignalValue(signals['bank_statement:banking_health_score']);
  const dscrProxy             = parseSignalValue(signals['bank_statement:dscr_proxy']);

  // GST signals
  const gstAnnualTurnoverLakh = parseSignalValue(signals['gst_analyzer:gst_annual_turnover_lakh']);
  const gstAvgMonthlyTurnover = gstAnnualTurnoverLakh != null ? gstAnnualTurnoverLakh / 12 : null;
  const gst3b2aVariancePct    = parseSignalValue(signals['gst_analyzer:gst_3b_vs_2a_variance_pct']);
  const nilReturnsCount       = parseSignalValue(signals['gst_analyzer:nil_returns_count']);
  const monthsFiledOnTime     = parseSignalValue(signals['gst_analyzer:months_filed_on_time']);

  // ITR / Balance sheet signals
  const revenueLakh           = parseSignalValue(signals['itr_balancesheet:revenue_lakh']);
  const patLakh               = parseSignalValue(signals['itr_balancesheet:pat_lakh']);
  const relatedPartyPct       = parseSignalValue(signals['itr_balancesheet:related_party_pct']);
  const section8Flag          = parseSignalBool(signals['itr_balancesheet:section_8_company']);
  const bfLosses              = parseSignalBool(signals['itr_balancesheet:brought_forward_losses']);

  // CIBIL signals
  const cmrRank               = parseSignalValue(signals['cibil_cmr:cmr_rank']);
  const dpd30Count            = parseSignalValue(signals['cibil_cmr:dpd_30_count']);

  // Scout signals
  const rbiDefaultFlag        = parseSignalBool(signals['scout:rbi_default_flag']);
  const wilfulDefaulterFlag   = parseSignalBool(signals['scout:wilful_defaulter_flag']);

  // ── Check 1: GST Turnover vs Bank Credits (revenue inflation) ─────────────
  {
    let v: DiscrepancyVerdict = 'PASS';
    let actual = 'Insufficient data';
    let confidence = 0.5;

    if (gstAvgMonthlyTurnover != null && bankAvgMonthlyCredit != null && bankAvgMonthlyCredit > 0) {
      const variancePct = Math.abs((gstAvgMonthlyTurnover - bankAvgMonthlyCredit) / bankAvgMonthlyCredit) * 100;
      actual = `GST avg ₹${gstAvgMonthlyTurnover.toFixed(1)}L vs Bank avg ₹${bankAvgMonthlyCredit.toFixed(1)}L — variance ${variancePct.toFixed(1)}%`;
      v = verdict(variancePct, 15, 30);
      confidence = 0.85;
    }

    results.push({
      checkName: 'GST Turnover vs Bank Credits',
      threshold: '>15% avg monthly variance = FLAG; >30% = RED_FLAG',
      actualValue: actual,
      verdict: v,
      confidence,
    });
  }

  // ── Check 2: GSTR-3B vs GSTR-2A ITC Mismatch (fake invoice chain) ─────────
  {
    let v: DiscrepancyVerdict = 'PASS';
    let actual = 'Insufficient data';
    let confidence = 0.5;

    if (gst3b2aVariancePct != null) {
      actual = `3B vs 2A ITC variance: ${gst3b2aVariancePct.toFixed(1)}%`;
      v = verdict(gst3b2aVariancePct, 5, 15);
      confidence = 0.8;
    }

    results.push({
      checkName: 'GSTR-3B vs GSTR-2A ITC Mismatch',
      threshold: '>5% mismatch = FLAG; >15% = RED_FLAG (fake invoice indicator)',
      actualValue: actual,
      verdict: v,
      confidence,
    });
  }

  // ── Check 3: ITR Net Profit vs Bank Balance Trend ─────────────────────────
  // If PAT is positive but DSCR proxy < 1 → cash flow manipulation signal
  {
    let v: DiscrepancyVerdict = 'PASS';
    let actual = 'Insufficient data';
    let confidence = 0.5;

    if (patLakh != null && dscrProxy != null) {
      const profitable = patLakh > 0;
      const dscrPoor   = dscrProxy < 1.0;
      if (profitable && dscrPoor) {
        v = 'FLAG';
        actual = `PAT ₹${patLakh.toFixed(1)}L (positive) but DSCR proxy ${dscrProxy.toFixed(2)} (<1.0) — possible BS manipulation`;
      } else if (patLakh > 0 && dscrProxy >= 1.0) {
        actual = `PAT ₹${patLakh.toFixed(1)}L, DSCR proxy ${dscrProxy.toFixed(2)} — consistent`;
      } else {
        actual = `PAT ₹${patLakh.toFixed(1)}L, DSCR proxy ${dscrProxy.toFixed(2)}`;
      }
      confidence = 0.75;
    }

    results.push({
      checkName: 'ITR Net Profit vs Bank Cash Flow',
      threshold: 'Positive PAT + DSCR<1.0 = FLAG (balance sheet window-dressing)',
      actualValue: actual,
      verdict: v,
      confidence,
    });
  }

  // ── Check 4: CIBIL CMR vs Repayment Behaviour ────────────────────────────
  // CMR 7+ with zero DPD = hidden defaults (score may be stale or manipulated)
  {
    let v: DiscrepancyVerdict = 'PASS';
    let actual = 'Insufficient data';
    let confidence = 0.5;

    if (cmrRank != null && dpd30Count != null) {
      const poorCMR   = cmrRank >= 7;
      const cleanDPD  = dpd30Count === 0;
      if (poorCMR && cleanDPD) {
        v = 'FLAG';
        actual = `CMR ${cmrRank} (poor) but 0 DPD on record — possible hidden defaults or stale data`;
      } else {
        actual = `CMR ${cmrRank}, DPD-30 count: ${dpd30Count}`;
      }
      confidence = 0.8;
    }

    results.push({
      checkName: 'CIBIL CMR vs Recorded DPD',
      threshold: 'CMR≥7 + zero DPD = FLAG (inconsistency suggests hidden exposure)',
      actualValue: actual,
      verdict: v,
      confidence,
    });
  }

  // ── Check 5: Related Party % of Revenue ──────────────────────────────────
  {
    let v: DiscrepancyVerdict = 'PASS';
    let actual = 'Insufficient data';
    let confidence = 0.5;

    if (relatedPartyPct != null) {
      actual = `Related party transactions: ${relatedPartyPct.toFixed(1)}% of revenue`;
      v = verdict(relatedPartyPct, 15, 25);
      confidence = 0.75;
    }

    results.push({
      checkName: 'Related Party Transactions',
      threshold: '>15% of revenue = FLAG; >25% = RED_FLAG (circular trading risk)',
      actualValue: actual,
      verdict: v,
      confidence,
    });
  }

  // ── Check 6: GST Nil-Filer Months vs Bank Activity ────────────────────────
  // Filed nil GST returns but had active bank credits = revenue suppression
  {
    let v: DiscrepancyVerdict = 'PASS';
    let actual = 'Insufficient data';
    let confidence = 0.5;

    if (nilReturnsCount != null && bankAnnualCreditLakh != null) {
      const hasActivity = bankAnnualCreditLakh > 10; // more than ₹10L annual credits
      if (nilReturnsCount >= 3 && hasActivity) {
        v = 'RED_FLAG';
        actual = `${nilReturnsCount} nil GST months but bank shows ₹${bankAnnualCreditLakh.toFixed(1)}L annual credits — suppression risk`;
      } else if (nilReturnsCount >= 1 && hasActivity) {
        v = 'FLAG';
        actual = `${nilReturnsCount} nil GST month(s) but bank active`;
      } else {
        actual = `Nil months: ${nilReturnsCount ?? 0}, Bank credits: ₹${bankAnnualCreditLakh?.toFixed(1) ?? '?'}L`;
      }
      confidence = 0.8;
    }

    results.push({
      checkName: 'GST Nil-Filer vs Bank Activity',
      threshold: 'Nil GST months with active bank = FLAG/RED_FLAG (revenue suppression)',
      actualValue: actual,
      verdict: v,
      confidence,
    });
  }

  // ── Check 7: Section 8 / Shell Company in Related Party ──────────────────
  {
    let v: DiscrepancyVerdict = 'PASS';
    let actual = 'No Section 8 entities detected in related parties';
    let confidence = 0.7;

    if (section8Flag === true) {
      v = 'RED_FLAG';
      actual = 'Section 8 (non-profit) entities found in related party list — shell structure risk';
      confidence = 0.85;
    } else if (wilfulDefaulterFlag === true || rbiDefaultFlag === true) {
      v = 'RED_FLAG';
      actual = `Wilful defaulter: ${wilfulDefaulterFlag}, RBI defaulter list: ${rbiDefaultFlag}`;
      confidence = 0.9;
    } else if (section8Flag === false) {
      actual = 'No Section 8 entities. No RBI default flags.';
    }

    results.push({
      checkName: 'Section 8 / Shell Entity / RBI Watch List',
      threshold: 'Any Section 8 in related party or RBI/Wilful defaulter = RED_FLAG',
      actualValue: actual,
      verdict: v,
      confidence,
    });
  }

  return results;
}
