'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import {
    Shield, TrendingUp, Landmark, Building2, ClipboardList,
    AlertTriangle, CheckCircle2, XCircle, FileText, Search,
    Brain, ChevronDown, ChevronUp, ExternalLink, Loader2,
    BarChart3, Eye, TrendingDown, Activity, Users,
    BadgeAlert, ShieldCheck, Info,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────
interface Signal {
    agentName: string;
    signalKey: string;
    signalValue: string | null;
    confidence: string | null;
    rawSnippet: string | null;
    isUnverified: boolean | null;
    createdAt: string;
}

interface ResearchFinding {
    searchType: string;
    query: string | null;
    sourceUrl: string | null;
    snippet: string;
    relevanceScore: string | null;
    isFraudSignal: boolean | null;
    scrapedAt: string;
}

interface QualNote {
    category: string;
    fiveCDimension: string;
    noteText: string;
    scoreDelta: number | null;
    createdAt: string;
}

interface DocInfo {
    id: string;
    fileName: string;
    fileType: string | null;
    documentType: string;
    fileSize: number | null;
    uploadedAt: string;
}

interface PipelineStage {
    stage: string;
    status: string;
    startedAt: string | null;
    completedAt: string | null;
    errorMessage: string | null;
}

interface CamData {
    decision: string;
    characterScore: number | null;
    capacityScore: number | null;
    capitalScore: number | null;
    collateralScore: number | null;
    conditionsScore: number | null;
    characterRating: string | null;
    capacityRating: string | null;
    capitalRating: string | null;
    collateralRating: string | null;
    conditionsRating: string | null;
    characterExplanation: string | null;
    capacityExplanation: string | null;
    capitalExplanation: string | null;
    collateralExplanation: string | null;
    conditionsExplanation: string | null;
    recommendedAmountInr: string | null;
    recommendedRatePercent: string | null;
    reductionRationale: string | null;
    conditions: string[] | null;
    thinkingTrace: string | null;
    generatedAt: string;
}

interface AppInfo {
    id: string;
    companyName: string | null;
    cin: string | null;
    gstin: string | null;
    pan: string | null;
    promoterDin: string | null;
    industry: string | null;
    subIndustry: string | null;
    requestedAmountInr: string | null;
    cmrRank: number | null;
    pipelineStatus: string;
    analysisProgress: number | null;
    numberOfEmployees: number | null;
    annualRevenue: string | null;
    businessStage: string | null;
    yearlyGrowth: string | null;
    qualitativeGateDone: boolean;
    createdAt: string;
    city: string | null;
    state: string | null;
    foundedYear: number | null;
    website: string | null;
}

interface AnalysisData {
    application: AppInfo;
    signalsByAgent: Record<string, Signal[]>;
    researchFindings: ResearchFinding[];
    qualitativeNotes: QualNote[];
    documents: DocInfo[];
    pipelineStages: PipelineStage[];
    cam: CamData | null;
}

// ─── Agent metadata ────────────────────────────────────────────────────────
const AGENT_META: Record<string, { label: string; icon: React.ReactNode; color: string; desc: string }> = {
    bank_statement: { label: 'Bank Statement Analysis', icon: <Landmark className="h-5 w-5" />, color: 'blue', desc: 'Cash flows, credits, debits, average balance, bounced cheques' },
    gst_analyzer: { label: 'GST Returns Analysis', icon: <BarChart3 className="h-5 w-5" />, color: 'green', desc: 'Revenue trends, GSTR-3B vs 2A reconciliation, ITC analysis' },
    itr_balancesheet: { label: 'ITR & Balance Sheet', icon: <TrendingUp className="h-5 w-5" />, color: 'purple', desc: 'P&L metrics, net worth, DSCR, debt-equity ratio' },
    cibil_cmr: { label: 'CIBIL / CMR Score', icon: <Shield className="h-5 w-5" />, color: 'orange', desc: 'Credit score, payment history, existing borrowings' },
    scout: { label: 'OSINT Research', icon: <Search className="h-5 w-5" />, color: 'red', desc: 'Court cases, MCA records, news, ratings, fraud signals' },
};

const RESEARCH_TYPE_LABELS: Record<string, string> = {
    ecourts: 'Court Cases',
    mca_din: 'MCA / Director Records',
    rbi_circular: 'RBI Circulars',
    credit_ratings: 'Credit Ratings',
    news_fraud: 'News & Fraud',
    shareholding: 'Shareholding',
    apify_enrichment: 'Data Enrichment',
};

// ─── Signal formatting ─────────────────────────────────────────────────────
function formatSignalKey(key: string): string {
    return key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
        .replace(/Gst/g, 'GST')
        .replace(/Itr/g, 'ITR')
        .replace(/Cmr/g, 'CMR')
        .replace(/Dscr/g, 'DSCR')
        .replace(/Inr/g, '(₹)');
}

function formatSignalValue(value: string | null): string {
    if (!value) return '—';
    try {
        const parsed = JSON.parse(value);
        if (typeof parsed === 'object' && parsed !== null) {
            return JSON.stringify(parsed, null, 2);
        }
        return String(parsed);
    } catch {
        return value;
    }
}

function ConfidenceBadge({ confidence }: { confidence: string | null }) {
    const val = confidence ? parseFloat(confidence) : 0;
    const pct = Math.round(val * 100);
    const cls = pct >= 80 ? 'bg-green-100 text-green-700' : pct >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
            {pct}%
        </span>
    );
}

function RatingBadge({ rating }: { rating: string | null }) {
    if (!rating) return null;
    const cls =
        rating === 'Strong' ? 'bg-green-100 text-green-800' :
            rating === 'Adequate' ? 'bg-blue-100 text-blue-800' :
                rating === 'Weak' ? 'bg-amber-100 text-amber-800' :
                    'bg-red-100 text-red-800';
    return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{rating}</span>;
}

// ─── Main Component ────────────────────────────────────────────────────────
export function AnalysisDashboard({ appId }: { appId: string }) {
    const [data, setData] = useState<AnalysisData | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
    const [expandedSection, setExpandedSection] = useState<string | null>('overview');

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch(`/api/applications/${appId}/analysis`);
                if (res.ok) {
                    setData(await res.json() as AnalysisData);
                }
            } finally {
                setLoading(false);
            }
        }
        void load();
    }, [appId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!data) {
        return (
            <Card className="p-12 text-center">
                <XCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-muted-foreground">No analysis data available yet. Run the AI pipeline first.</p>
            </Card>
        );
    }

    const { application: app, signalsByAgent, researchFindings: findings, qualitativeNotes: notes, documents: docs, pipelineStages: stages, cam } = data;
    const fraudFindings = findings.filter(f => f.isFraudSignal);
    const generalFindings = findings.filter(f => !f.isFraudSignal);
    const totalSignals = Object.values(signalsByAgent).reduce((a, b) => a + b.length, 0);
    const avgConfidence = totalSignals > 0
        ? Object.values(signalsByAgent).flat().reduce((s, sig) => s + (sig.confidence ? parseFloat(sig.confidence) : 0), 0) / totalSignals
        : 0;

    // Key financial metrics extraction
    function findSignal(key: string): string | null {
        for (const sigs of Object.values(signalsByAgent)) {
            const found = sigs.find(s => s.signalKey === key);
            if (found) return found.signalValue;
        }
        return null;
    }

    const overallScore = cam
        ? Math.round(((cam.characterScore ?? 0) + (cam.capacityScore ?? 0) + (cam.capitalScore ?? 0) + (cam.collateralScore ?? 0) + (cam.conditionsScore ?? 0)) / 5)
        : null;

    const sections = [
        { id: 'overview', label: 'Overview', icon: <Eye className="h-4 w-4" /> },
        { id: 'financials', label: 'Financial Signals', icon: <TrendingUp className="h-4 w-4" /> },
        { id: 'research', label: 'Research & OSINT', icon: <Search className="h-4 w-4" /> },
        { id: 'fieldnotes', label: 'Field Notes', icon: <Users className="h-4 w-4" /> },
        { id: 'documents', label: 'Documents', icon: <FileText className="h-4 w-4" /> },
        { id: 'pipeline', label: 'Pipeline Audit', icon: <Activity className="h-4 w-4" /> },
    ];

    return (
        <div className="space-y-6">

            {/* Section navigation */}
            <div className="flex flex-wrap gap-2">
                {sections.map(s => (
                    <button key={s.id}
                        onClick={() => setExpandedSection(expandedSection === s.id ? null : s.id)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all ${expandedSection === s.id
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                            }`}>
                        {s.icon}
                        {s.label}
                    </button>
                ))}
            </div>

            {/* ══════════════════════════════════════════════════════════════
          SECTION: Overview
         ══════════════════════════════════════════════════════════════ */}
            {expandedSection === 'overview' && (
                <div className="space-y-6">

                    {/* Top-level stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <Card className="p-4 text-center">
                            <p className="text-xs font-medium text-muted-foreground uppercase">Overall Score</p>
                            <p className={`text-3xl font-bold mt-1 ${(overallScore ?? 0) >= 70 ? 'text-green-600' : (overallScore ?? 0) >= 50 ? 'text-amber-600' : 'text-red-600'
                                }`}>
                                {overallScore ?? '—'}
                                <span className="text-sm font-normal text-muted-foreground">/100</span>
                            </p>
                        </Card>
                        <Card className="p-4 text-center">
                            <p className="text-xs font-medium text-muted-foreground uppercase">Data Points</p>
                            <p className="text-3xl font-bold mt-1 text-blue-600">{totalSignals}</p>
                            <p className="text-xs text-muted-foreground">Across {Object.keys(signalsByAgent).length} agents</p>
                        </Card>
                        <Card className="p-4 text-center">
                            <p className="text-xs font-medium text-muted-foreground uppercase">Avg Confidence</p>
                            <p className={`text-3xl font-bold mt-1 ${avgConfidence >= 0.8 ? 'text-green-600' : avgConfidence >= 0.6 ? 'text-amber-600' : 'text-red-600'
                                }`}>
                                {Math.round(avgConfidence * 100)}%
                            </p>
                        </Card>
                        <Card className="p-4 text-center">
                            <p className="text-xs font-medium text-muted-foreground uppercase">Fraud Alerts</p>
                            <p className={`text-3xl font-bold mt-1 ${fraudFindings.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {fraudFindings.length}
                            </p>
                            <p className="text-xs text-muted-foreground">{generalFindings.length} research items</p>
                        </Card>
                    </div>

                    {/* 5Cs visual summary */}
                    {cam && (
                        <Card className="p-6">
                            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-blue-600" />
                                Credit Quality at a Glance
                            </h3>
                            <div className="space-y-4">
                                {([
                                    { key: 'character', icon: <Shield className="h-4 w-4" />, label: 'Character' },
                                    { key: 'capacity', icon: <TrendingUp className="h-4 w-4" />, label: 'Capacity' },
                                    { key: 'capital', icon: <Landmark className="h-4 w-4" />, label: 'Capital' },
                                    { key: 'collateral', icon: <Building2 className="h-4 w-4" />, label: 'Collateral' },
                                    { key: 'conditions', icon: <ClipboardList className="h-4 w-4" />, label: 'Conditions' },
                                ] as const).map(({ key, icon, label }) => {
                                    const score = cam[`${key}Score` as keyof CamData] as number | null;
                                    const rating = cam[`${key}Rating` as keyof CamData] as string | null;
                                    const barColor = (score ?? 0) >= 70 ? 'bg-green-500' : (score ?? 0) >= 50 ? 'bg-amber-500' : 'bg-red-500';
                                    return (
                                        <div key={key} className="flex items-center gap-4">
                                            <div className="flex items-center gap-2 w-28 flex-shrink-0">
                                                {icon}
                                                <span className="text-sm font-medium text-gray-700">{label}</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="h-3 w-full rounded-full bg-gray-100">
                                                    <div className={`h-3 rounded-full ${barColor} transition-all duration-700`}
                                                        style={{ width: `${score ?? 0}%` }} />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 w-24 justify-end flex-shrink-0">
                                                <span className="text-sm font-bold text-gray-900">{score ?? '—'}</span>
                                                <RatingBadge rating={rating} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    )}

                    {/* Transparency notice */}
                    <Card className="p-4 border-l-4 border-l-blue-500 bg-blue-50/50">
                        <div className="flex gap-3">
                            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-blue-800 text-sm">Full Transparency</p>
                                <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
                                    Every data point shown below was extracted by our AI agents from the documents you uploaded.
                                    Each signal includes a confidence score showing how certain the AI is about its extraction.
                                    Explore each section to see exactly what was found and how it influenced the decision.
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
          SECTION: Financial Signals by Agent
         ══════════════════════════════════════════════════════════════ */}
            {expandedSection === 'financials' && (
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Each AI agent analyzed specific documents and extracted structured financial data points.
                        Click on any agent to see all extracted signals.
                    </p>

                    {Object.keys(AGENT_META).filter(a => a !== 'scout').map(agentKey => {
                        const meta = AGENT_META[agentKey];
                        const sigs = signalsByAgent[agentKey] ?? [];
                        const isExpanded = expandedAgent === agentKey;
                        const avgConf = sigs.length > 0
                            ? sigs.reduce((s, sig) => s + (sig.confidence ? parseFloat(sig.confidence) : 0), 0) / sigs.length
                            : 0;
                        const colorMap: Record<string, string> = {
                            blue: 'bg-blue-100 text-blue-600 border-blue-200',
                            green: 'bg-green-100 text-green-600 border-green-200',
                            purple: 'bg-purple-100 text-purple-600 border-purple-200',
                            orange: 'bg-orange-100 text-orange-600 border-orange-200',
                            red: 'bg-red-100 text-red-600 border-red-200',
                        };

                        return (
                            <Card key={agentKey} className={`overflow-hidden transition-all ${isExpanded ? 'ring-2 ring-blue-200' : ''}`}>
                                <button
                                    onClick={() => setExpandedAgent(isExpanded ? null : agentKey)}
                                    className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 transition-colors"
                                >
                                    <div className={`rounded-lg p-2.5 ${colorMap[meta.color] ?? colorMap.blue}`}>
                                        {meta.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="font-semibold text-gray-900">{meta.label}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">{sigs.length} signals</span>
                                                {sigs.length > 0 && <ConfidenceBadge confidence={String(avgConf)} />}
                                                {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">{meta.desc}</p>
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div className="border-t bg-gray-50/50 divide-y divide-gray-100">
                                        {sigs.length === 0 ? (
                                            <div className="p-5 text-center text-sm text-muted-foreground">
                                                No signals extracted. This agent may not have run yet.
                                            </div>
                                        ) : (
                                            sigs.map((sig, i) => (
                                                <div key={i} className="px-5 py-3">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-medium text-gray-900">{formatSignalKey(sig.signalKey)}</p>
                                                                {sig.isUnverified && (
                                                                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 uppercase">Unverified</span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-gray-700 mt-0.5 font-mono">
                                                                {formatSignalValue(sig.signalValue)}
                                                            </p>
                                                            {sig.rawSnippet && (
                                                                <p className="text-xs text-muted-foreground mt-1 italic line-clamp-2">
                                                                    Source: &quot;{sig.rawSnippet}&quot;
                                                                </p>
                                                            )}
                                                        </div>
                                                        <ConfidenceBadge confidence={sig.confidence} />
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
          SECTION: Research & OSINT
         ══════════════════════════════════════════════════════════════ */}
            {expandedSection === 'research' && (
                <div className="space-y-6">

                    {/* Fraud alerts */}
                    {fraudFindings.length > 0 && (
                        <Card className="overflow-hidden border-red-200">
                            <div className="px-5 py-4 bg-red-50 border-b border-red-100 flex items-center gap-3">
                                <BadgeAlert className="h-5 w-5 text-red-600" />
                                <div>
                                    <p className="font-bold text-red-800">Fraud / Litigation Signals ({fraudFindings.length})</p>
                                    <p className="text-xs text-red-600">These findings flagged potential concerns during OSINT research</p>
                                </div>
                            </div>
                            <div className="divide-y divide-red-50">
                                {fraudFindings.map((f, i) => (
                                    <div key={i} className="px-5 py-3 bg-red-50/30">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
                                                        {RESEARCH_TYPE_LABELS[f.searchType] ?? f.searchType}
                                                    </span>
                                                    <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                                                </div>
                                                <p className="text-sm text-gray-800 leading-relaxed">{f.snippet}</p>
                                            </div>
                                            {f.sourceUrl && (
                                                <a href={f.sourceUrl} target="_blank" rel="noreferrer"
                                                    className="flex-shrink-0 text-blue-600 hover:text-blue-800">
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {fraudFindings.length === 0 && (
                        <Card className="p-5 border-l-4 border-l-green-500 bg-green-50/50">
                            <div className="flex gap-3">
                                <ShieldCheck className="h-5 w-5 text-green-600 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-green-800 text-sm">No Fraud Signals Detected</p>
                                    <p className="text-xs text-green-700 mt-0.5">
                                        OSINT research across court records, MCA filings, and news sources found no fraud indicators.
                                    </p>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* General research */}
                    {generalFindings.length > 0 && (
                        <Card className="overflow-hidden">
                            <div className="px-5 py-4 bg-gray-50 border-b flex items-center gap-3">
                                <Search className="h-5 w-5 text-gray-600" />
                                <div>
                                    <p className="font-bold text-gray-800">Research Findings ({generalFindings.length})</p>
                                    <p className="text-xs text-muted-foreground">External data gathered about the company and directors</p>
                                </div>
                            </div>
                            <div className="divide-y">
                                {generalFindings.map((f, i) => (
                                    <div key={i} className="px-5 py-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1">
                                                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 mb-1 inline-block">
                                                    {RESEARCH_TYPE_LABELS[f.searchType] ?? f.searchType}
                                                </span>
                                                <p className="text-sm text-gray-700 leading-relaxed mt-1">{f.snippet}</p>
                                            </div>
                                            {f.sourceUrl && (
                                                <a href={f.sourceUrl} target="_blank" rel="noreferrer"
                                                    className="flex-shrink-0 text-blue-600 hover:text-blue-800">
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {findings.length === 0 && (
                        <Card className="p-8 text-center">
                            <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">No research findings yet. The Scout agent hasn&apos;t run or found results.</p>
                        </Card>
                    )}
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
          SECTION: Field Notes
         ══════════════════════════════════════════════════════════════ */}
            {expandedSection === 'fieldnotes' && (
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Field observations submitted by credit officers during site visits and interviews.
                    </p>

                    {notes.length > 0 ? (
                        <div className="space-y-3">
                            {notes.map((note, i) => (
                                <Card key={i} className="p-4">
                                    <div className="flex items-start gap-3">
                                        <div className={`rounded-full p-2 flex-shrink-0 ${(note.scoreDelta ?? 0) > 0 ? 'bg-green-100' :
                                                (note.scoreDelta ?? 0) < 0 ? 'bg-red-100' : 'bg-gray-100'
                                            }`}>
                                            {(note.scoreDelta ?? 0) > 0 ? <TrendingUp className="h-4 w-4 text-green-600" /> :
                                                (note.scoreDelta ?? 0) < 0 ? <TrendingDown className="h-4 w-4 text-red-600" /> :
                                                    <Users className="h-4 w-4 text-gray-500" />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 capitalize">
                                                    {note.category.replace(/_/g, ' ')}
                                                </span>
                                                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 capitalize">
                                                    {note.fiveCDimension}
                                                </span>
                                                {note.scoreDelta !== null && note.scoreDelta !== 0 && (
                                                    <span className={`text-xs font-bold ${note.scoreDelta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {note.scoreDelta > 0 ? '+' : ''}{note.scoreDelta} pts
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-700 leading-relaxed">{note.noteText}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {new Date(note.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="p-8 text-center">
                            <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">No field notes submitted yet.</p>
                        </Card>
                    )}
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
          SECTION: Documents
         ══════════════════════════════════════════════════════════════ */}
            {expandedSection === 'documents' && (
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Documents uploaded for this application and processed by the AI pipeline.
                    </p>

                    {docs.length > 0 ? (
                        <Card className="overflow-hidden">
                            <div className="divide-y">
                                {docs.map(doc => (
                                    <div key={doc.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50">
                                        <div className="rounded-lg bg-blue-100 p-2 flex-shrink-0">
                                            <FileText className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{doc.fileName}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {doc.documentType.replace(/_/g, ' ')}
                                                {doc.fileSize ? ` · ${(doc.fileSize / 1024).toFixed(0)} KB` : ''}
                                            </p>
                                        </div>
                                        <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                                            Processed
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    ) : (
                        <Card className="p-8 text-center">
                            <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
                        </Card>
                    )}
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
          SECTION: Pipeline Audit Trail
         ══════════════════════════════════════════════════════════════ */}
            {expandedSection === 'pipeline' && (
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Complete audit trail of every step in the AI analysis pipeline.
                    </p>

                    <Card className="overflow-hidden">
                        <div className="px-5 py-4 bg-gray-50 border-b">
                            <p className="font-bold text-gray-800">Pipeline Execution Timeline</p>
                        </div>

                        {stages.length > 0 ? (
                            <div className="relative pl-8 py-4 pr-5">
                                {/* Timeline line */}
                                <div className="absolute left-[1.15rem] top-6 bottom-6 w-0.5 bg-gray-200" />

                                {stages.map((stage, i) => {
                                    const isDone = stage.status === 'done';
                                    const isFailed = stage.status === 'failed';
                                    const isProcessing = stage.status === 'processing';
                                    return (
                                        <div key={i} className="relative mb-4 last:mb-0">
                                            {/* Timeline dot */}
                                            <div className={`absolute -left-[1.05rem] top-1 h-3.5 w-3.5 rounded-full border-2 border-white ${isDone ? 'bg-green-500' : isFailed ? 'bg-red-500' : isProcessing ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'
                                                }`} />
                                            <div className="ml-4">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-medium text-gray-900 capitalize">{stage.stage.replace(/_/g, ' ')}</p>
                                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${isDone ? 'bg-green-100 text-green-700' :
                                                            isFailed ? 'bg-red-100 text-red-700' :
                                                                isProcessing ? 'bg-blue-100 text-blue-700' :
                                                                    'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {stage.status}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 mt-0.5">
                                                    {stage.startedAt && (
                                                        <p className="text-xs text-muted-foreground">
                                                            Started: {new Date(stage.startedAt).toLocaleTimeString('en-IN')}
                                                        </p>
                                                    )}
                                                    {stage.completedAt && stage.startedAt && (
                                                        <p className="text-xs text-muted-foreground">
                                                            Duration: {((new Date(stage.completedAt).getTime() - new Date(stage.startedAt).getTime()) / 1000).toFixed(1)}s
                                                        </p>
                                                    )}
                                                </div>
                                                {stage.errorMessage && (
                                                    <p className="text-xs text-red-600 mt-0.5">{stage.errorMessage}</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-sm text-muted-foreground">
                                Pipeline hasn&apos;t started yet.
                            </div>
                        )}
                    </Card>
                </div>
            )}

        </div>
    );
}
