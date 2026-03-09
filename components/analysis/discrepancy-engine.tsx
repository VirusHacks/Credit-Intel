'use client';

import { Card } from '@/components/ui/card';
import {
    AlertTriangle, CheckCircle2, ShieldAlert, ShieldCheck,
    ArrowRight, TrendingUp, TrendingDown, Activity,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────
export interface DiscrepancyCheck {
    id: string;
    checkName: string;
    description: string;
    source1: string;
    source2: string;
    threshold: string;
    actualValue: string;
    verdict: 'PASS' | 'FLAG' | 'RED_FLAG';
    confidence: number;
    detail: string;
}

interface Signal {
    agentName: string;
    signalKey: string;
    signalValue: string | null;
    confidence: string | null;
}

// ─── Discrepancy computation from agent signals ────────────────────────────
export function computeDiscrepancies(signalsByAgent: Record<string, Signal[]>): DiscrepancyCheck[] {
    const checks: DiscrepancyCheck[] = [];

    const findSignal = (key: string): string | null => {
        for (const sigs of Object.values(signalsByAgent)) {
            const found = sigs.find(s => s.signalKey === key);
            if (found?.signalValue) return found.signalValue;
        }
        return null;
    };

    const findConfidence = (key: string): number => {
        for (const sigs of Object.values(signalsByAgent)) {
            const found = sigs.find(s => s.signalKey === key);
            if (found?.confidence) return parseFloat(found.confidence);
        }
        return 0;
    };

    // ── Check 1: GSTR-3B Sales vs Bank Credits ────────────────────────
    const gstRevenue = findSignal('gst_revenue_monthly') ?? findSignal('total_turnover') ?? findSignal('gst_total_revenue');
    const bankCredits = findSignal('total_credits') ?? findSignal('bank_total_credits') ?? findSignal('total_credit_amount');
    if (gstRevenue && bankCredits) {
        const gstVal = parseNumeric(gstRevenue);
        const bankVal = parseNumeric(bankCredits);
        if (gstVal > 0 && bankVal > 0) {
            const variance = Math.abs(gstVal - bankVal) / Math.max(gstVal, bankVal) * 100;
            checks.push({
                id: 'gst_vs_bank',
                checkName: 'GSTR-3B Sales vs Bank Credits',
                description: 'Compares declared GST revenue against actual bank credit inflows to detect revenue inflation.',
                source1: 'GST Returns',
                source2: 'Bank Statement',
                threshold: '> 15% avg variance',
                actualValue: `${variance.toFixed(1)}% variance`,
                verdict: variance > 25 ? 'RED_FLAG' : variance > 15 ? 'FLAG' : 'PASS',
                confidence: Math.min(findConfidence('gst_revenue_monthly') || 0.85, findConfidence('total_credits') || 0.85),
                detail: variance > 15
                    ? `GST declared ₹${formatInr(gstVal)} vs Bank credits ₹${formatInr(bankVal)}. The ${variance.toFixed(1)}% gap suggests possible revenue inflation or undisclosed banking channels.`
                    : `GST and bank figures are within acceptable range (${variance.toFixed(1)}% variance).`,
            });
        }
    }

    // ── Check 2: GSTR-3B declared vs GSTR-2A matched ITC ─────────────
    const gst3b = findSignal('gstr_3b_itc') ?? findSignal('itc_claimed');
    const gst2a = findSignal('gstr_2a_itc') ?? findSignal('itc_matched');
    if (gst3b && gst2a) {
        const val3b = parseNumeric(gst3b);
        const val2a = parseNumeric(gst2a);
        if (val3b > 0 && val2a > 0) {
            const mismatch = Math.abs(val3b - val2a) / Math.max(val3b, val2a) * 100;
            checks.push({
                id: 'gst_itc_mismatch',
                checkName: 'GSTR-3B vs GSTR-2A ITC Mismatch',
                description: 'Detects fake invoice chains by comparing claimed input tax credits with matched supplier filings.',
                source1: 'GSTR-3B (claimed)',
                source2: 'GSTR-2A (matched)',
                threshold: '> 10% mismatch',
                actualValue: `${mismatch.toFixed(1)}% mismatch`,
                verdict: mismatch > 20 ? 'RED_FLAG' : mismatch > 10 ? 'FLAG' : 'PASS',
                confidence: 0.9,
                detail: mismatch > 10
                    ? `ITC claimed: ₹${formatInr(val3b)} vs matched: ₹${formatInr(val2a)}. ${mismatch.toFixed(1)}% gap indicates possible fake invoice chain.`
                    : `ITC reconciliation within tolerance (${mismatch.toFixed(1)}% gap).`,
            });
        }
    }

    // ── Check 3: ITR Profit Trend vs Bank Balance Trend ───────────────
    const itrProfit = findSignal('net_profit') ?? findSignal('profit_after_tax') ?? findSignal('itr_net_profit');
    const bankBalance = findSignal('average_balance') ?? findSignal('closing_balance') ?? findSignal('avg_monthly_balance');
    if (itrProfit && bankBalance) {
        const profitStr = itrProfit.toLowerCase();
        const balanceStr = bankBalance.toLowerCase();
        const profitTrend = profitStr.includes('declin') || profitStr.includes('loss') || profitStr.includes('negative') ? 'declining' : 'growing';
        const balanceTrend = balanceStr.includes('declin') || balanceStr.includes('decreas') ? 'declining' : 'stable/growing';
        const isOpposite = (profitTrend === 'growing' && balanceTrend === 'declining') || (profitTrend === 'declining' && balanceTrend === 'stable/growing');

        checks.push({
            id: 'itr_vs_bank_trend',
            checkName: 'ITR Profit vs Bank Balance Trend',
            description: 'Cross-checks ITR reported profit trajectory against banking balance patterns.',
            source1: 'ITR / Balance Sheet',
            source2: 'Bank Statement',
            threshold: 'Opposite directions',
            actualValue: isOpposite ? 'Contradicting' : 'Aligned',
            verdict: isOpposite ? 'FLAG' : 'PASS',
            confidence: 0.75,
            detail: isOpposite
                ? `ITR shows ${profitTrend} profit while bank balance is ${balanceTrend}. Contradicting trends may indicate balance sheet manipulation.`
                : `Both ITR profitability and bank balances move in consistent directions.`,
        });
    }

    // ── Check 4: CIBIL CMR vs Bank Repayment Behavior ─────────────────
    const cmrRank = findSignal('cmr_rank') ?? findSignal('cibil_cmr_rank') ?? findSignal('cmr_score');
    const repaymentHistory = findSignal('repayment_history') ?? findSignal('loan_repayment_status') ?? findSignal('emi_regularity');
    if (cmrRank) {
        const cmr = parseNumeric(cmrRank);
        const cleanRepayment = repaymentHistory ? !repaymentHistory.toLowerCase().includes('default') && !repaymentHistory.toLowerCase().includes('overdue') : true;
        if (cmr >= 7 && cleanRepayment) {
            checks.push({
                id: 'cmr_vs_repayment',
                checkName: 'CMR Rank vs Bank Repayment',
                description: 'Flags high CMR risk with clean bank repayments — may indicate hidden defaults with other lenders.',
                source1: 'CIBIL CMR Report',
                source2: 'Bank Statement',
                threshold: 'CMR 7+ with clean repayments',
                actualValue: `CMR ${cmr}, repayments clean`,
                verdict: 'FLAG',
                confidence: findConfidence('cmr_rank') || 0.85,
                detail: `CMR rank ${cmr}/10 (high risk) but bank repayments appear regular. This may indicate the applicant has defaults with other lenders not visible in their primary bank statement.`,
            });
        } else {
            checks.push({
                id: 'cmr_vs_repayment',
                checkName: 'CMR Rank vs Bank Repayment',
                description: 'Checks consistency between credit bureau score and banking repayment patterns.',
                source1: 'CIBIL CMR Report',
                source2: 'Bank Statement',
                threshold: 'CMR 7+ with clean repayments',
                actualValue: `CMR ${cmr || 'N/A'}${!cleanRepayment ? ', repayment issues' : ', clean'}`,
                verdict: cmr >= 7 ? 'RED_FLAG' : cmr >= 4 ? 'FLAG' : 'PASS',
                confidence: findConfidence('cmr_rank') || 0.85,
                detail: cmr >= 7
                    ? `CMR rank ${cmr}/10 is elevated, consistent with observed repayment issues.`
                    : `CMR rank ${cmr || 'N/A'}/10 and repayment behavior are consistent.`,
            });
        }
    }

    // ── Check 5: Related Party Transactions as % of Revenue ───────────
    const rptValue = findSignal('related_party_transactions') ?? findSignal('rpt_percentage') ?? findSignal('related_party_amount');
    const revenue = findSignal('total_revenue') ?? findSignal('gross_revenue') ?? gstRevenue;
    if (rptValue && revenue) {
        const rpt = parseNumeric(rptValue);
        const rev = parseNumeric(revenue);
        if (rev > 0) {
            const rptPct = rpt > 1 ? (rpt / rev * 100) : (rpt * 100); // handle if already a percentage
            const pct = Math.min(rptPct, 100);
            checks.push({
                id: 'rpt_revenue',
                checkName: 'Related Party Transactions % of Revenue',
                description: 'Flags circular trading risk when related party transactions form a large part of revenue.',
                source1: 'ITR / Balance Sheet',
                source2: 'GST Returns',
                threshold: '> 20% of revenue',
                actualValue: `${pct.toFixed(1)}%`,
                verdict: pct > 30 ? 'RED_FLAG' : pct > 20 ? 'FLAG' : 'PASS',
                confidence: 0.8,
                detail: pct > 20
                    ? `Related party transactions constitute ${pct.toFixed(1)}% of revenue. High RPT% is a circular trading risk signal.`
                    : `Related party transactions at ${pct.toFixed(1)}% of revenue — within acceptable limits.`,
            });
        }
    }

    // ── Check 6: Nil-filer GST months vs Bank Activity ────────────────
    const nilMonths = findSignal('nil_filing_months') ?? findSignal('gst_nil_months');
    const bankActivity = findSignal('active_months') ?? findSignal('months_with_transactions');
    if (nilMonths) {
        const nilCount = parseNumeric(nilMonths);
        checks.push({
            id: 'nil_filer_bank',
            checkName: 'Nil GST Filer Months vs Bank Activity',
            description: 'Detects revenue suppression by finding months with zero GST filing but active banking.',
            source1: 'GST Returns',
            source2: 'Bank Statement',
            threshold: 'Nil months with bank activity',
            actualValue: `${nilCount} nil month${nilCount !== 1 ? 's' : ''}`,
            verdict: nilCount >= 3 ? 'RED_FLAG' : nilCount >= 1 ? 'FLAG' : 'PASS',
            confidence: 0.88,
            detail: nilCount > 0
                ? `${nilCount} month(s) of nil GST filings detected${bankActivity ? ` while bank shows active transactions` : ''}. This is a revenue suppression signal.`
                : 'No nil-filing months detected.',
        });
    }

    // ── Check 7: Section 8 entities in related party list ─────────────
    const section8 = findSignal('section_8_entities') ?? findSignal('shell_company_indicators');
    if (section8) {
        const hasSection8 = section8.toLowerCase() !== 'none' && section8.toLowerCase() !== '0' && section8.toLowerCase() !== 'null';
        checks.push({
            id: 'section_8_rpt',
            checkName: 'Section 8 Entities in Related Parties',
            description: 'Flags shell company risk when Section 8 entities appear in the related party list.',
            source1: 'Balance Sheet',
            source2: 'MCA Records',
            threshold: 'Any Section 8 in RPT list',
            actualValue: hasSection8 ? 'Detected' : 'None',
            verdict: hasSection8 ? 'RED_FLAG' : 'PASS',
            confidence: 0.9,
            detail: hasSection8
                ? `Section 8 company detected in related party transactions: ${section8}. This is a shell company risk indicator.`
                : 'No Section 8 entities found in related party list.',
        });
    }

    // If no checks were computable, generate placeholder summaries
    if (checks.length === 0) {
        return getDefaultChecks();
    }

    return checks;
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function parseNumeric(value: string): number {
    try {
        const parsed = JSON.parse(value);
        if (typeof parsed === 'number') return parsed;
        if (typeof parsed === 'string') {
            const num = parseFloat(parsed.replace(/[^0-9.-]/g, ''));
            return isNaN(num) ? 0 : num;
        }
    } catch {
        const cleaned = value.replace(/[₹,\s]/g, '').replace(/cr$/i, '0000000').replace(/lakh$/i, '00000').replace(/L$/i, '00000');
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
    }
    return 0;
}

function formatInr(val: number): string {
    if (val >= 10000000) return `${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `${(val / 100000).toFixed(2)} L`;
    return val.toLocaleString('en-IN');
}

function getDefaultChecks(): DiscrepancyCheck[] {
    return [
        { id: 'gst_vs_bank', checkName: 'GSTR-3B Sales vs Bank Credits', description: 'Revenue inflation check', source1: 'GST', source2: 'Bank', threshold: '> 15%', actualValue: 'Pending', verdict: 'PASS', confidence: 0, detail: 'Awaiting agent data — run pipeline to compute.' },
        { id: 'gst_itc_mismatch', checkName: 'GSTR-3B vs GSTR-2A ITC', description: 'Fake invoice chain detection', source1: 'GSTR-3B', source2: 'GSTR-2A', threshold: '> 10%', actualValue: 'Pending', verdict: 'PASS', confidence: 0, detail: 'Awaiting agent data.' },
        { id: 'itr_vs_bank_trend', checkName: 'ITR Profit vs Bank Balance', description: 'Balance sheet manipulation check', source1: 'ITR', source2: 'Bank', threshold: 'Opposite trends', actualValue: 'Pending', verdict: 'PASS', confidence: 0, detail: 'Awaiting agent data.' },
        { id: 'cmr_vs_repayment', checkName: 'CMR Rank vs Repayment', description: 'Hidden default detection', source1: 'CIBIL', source2: 'Bank', threshold: 'CMR 7+ clean', actualValue: 'Pending', verdict: 'PASS', confidence: 0, detail: 'Awaiting agent data.' },
        { id: 'rpt_revenue', checkName: 'Related Party % of Revenue', description: 'Circular trading risk', source1: 'ITR', source2: 'GST', threshold: '> 20%', actualValue: 'Pending', verdict: 'PASS', confidence: 0, detail: 'Awaiting agent data.' },
        { id: 'nil_filer_bank', checkName: 'Nil GST vs Bank Activity', description: 'Revenue suppression', source1: 'GST', source2: 'Bank', threshold: 'Nil + active', actualValue: 'Pending', verdict: 'PASS', confidence: 0, detail: 'Awaiting agent data.' },
        { id: 'section_8_rpt', checkName: 'Section 8 in RPT', description: 'Shell company risk', source1: 'BS', source2: 'MCA', threshold: 'Any', actualValue: 'Pending', verdict: 'PASS', confidence: 0, detail: 'Awaiting agent data.' },
    ];
}

// ─── Verdict helpers ───────────────────────────────────────────────────────
function VerdictBadge({ verdict }: { verdict: 'PASS' | 'FLAG' | 'RED_FLAG' }) {
    if (verdict === 'RED_FLAG') {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">
                <ShieldAlert className="h-3.5 w-3.5" />
                RED FLAG
            </span>
        );
    }
    if (verdict === 'FLAG') {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5" />
                FLAG
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            PASS
        </span>
    );
}

// ─── Main component ────────────────────────────────────────────────────────
interface DiscrepancyEngineProps {
    checks: DiscrepancyCheck[];
}

export function DiscrepancyEngine({ checks }: DiscrepancyEngineProps) {
    const redFlags = checks.filter(c => c.verdict === 'RED_FLAG').length;
    const flags = checks.filter(c => c.verdict === 'FLAG').length;
    const passes = checks.filter(c => c.verdict === 'PASS').length;

    return (
        <div className="space-y-4">
            {/* Summary header */}
            <div className="grid grid-cols-3 gap-3">
                <Card className="p-3 text-center border-green-200 bg-green-50/50">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-green-600">{passes}</p>
                    <p className="text-xs text-green-700">Passed</p>
                </Card>
                <Card className="p-3 text-center border-amber-200 bg-amber-50/50">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-amber-600">{flags}</p>
                    <p className="text-xs text-amber-700">Flagged</p>
                </Card>
                <Card className="p-3 text-center border-red-200 bg-red-50/50">
                    <ShieldAlert className="h-5 w-5 text-red-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-red-600">{redFlags}</p>
                    <p className="text-xs text-red-700">Red Flags</p>
                </Card>
            </div>

            {/* Checks table */}
            <Card className="overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b flex items-center gap-2">
                    <Activity className="h-5 w-5 text-gray-600" />
                    <p className="font-bold text-gray-800">Cross-Document Discrepancy Checks ({checks.length})</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50/50 border-b">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Check</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Sources</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Threshold</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Actual</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Verdict</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {checks.map(check => (
                                <tr key={check.id} className={`hover:bg-gray-50 ${check.verdict === 'RED_FLAG' ? 'bg-red-50/30' : check.verdict === 'FLAG' ? 'bg-amber-50/30' : ''}`}>
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-gray-900">{check.checkName}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{check.description}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1 text-xs text-gray-600">
                                            <span className="rounded bg-blue-50 px-1.5 py-0.5 font-medium text-blue-700">{check.source1}</span>
                                            <ArrowRight className="h-3 w-3" />
                                            <span className="rounded bg-blue-50 px-1.5 py-0.5 font-medium text-blue-700">{check.source2}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-600">{check.threshold}</td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs font-medium ${check.verdict === 'RED_FLAG' ? 'text-red-700' : check.verdict === 'FLAG' ? 'text-amber-700' : 'text-green-700'}`}>
                                            {check.actualValue}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3"><VerdictBadge verdict={check.verdict} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Expanded detail cards for flagged items */}
            {checks.filter(c => c.verdict !== 'PASS').length > 0 && (
                <div className="space-y-3">
                    <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-red-500" />
                        Flagged Items — Detail
                    </p>
                    {checks
                        .filter(c => c.verdict !== 'PASS')
                        .sort((a, b) => (a.verdict === 'RED_FLAG' ? -1 : 1) - (b.verdict === 'RED_FLAG' ? -1 : 1))
                        .map(check => (
                            <Card key={check.id} className={`p-4 border-l-4 ${check.verdict === 'RED_FLAG' ? 'border-l-red-500 bg-red-50/30' : 'border-l-amber-400 bg-amber-50/30'}`}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-medium text-gray-900">{check.checkName}</p>
                                            <VerdictBadge verdict={check.verdict} />
                                        </div>
                                        <p className="text-sm text-gray-700 leading-relaxed">{check.detail}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">{check.source1}</span>
                                            <TrendingUp className="h-3 w-3 text-gray-400" />
                                            <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">{check.source2}</span>
                                            {check.confidence > 0 && (
                                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${check.confidence >= 0.8 ? 'bg-green-100 text-green-700' : check.confidence >= 0.6 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                                    {Math.round(check.confidence * 100)}% confidence
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                </div>
            )}
        </div>
    );
}
