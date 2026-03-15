'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import {
    Shield, TrendingUp, Landmark, Building2, ClipboardList,
    AlertTriangle, CheckCircle2, XCircle, FileText, Search,
    Brain, ChevronDown, ChevronUp, ExternalLink, Loader2,
    BarChart3, Eye, TrendingDown, Activity, Users,
    BadgeAlert, ShieldCheck, Info, Zap, Clock
} from 'lucide-react';
import { DiscrepancyEngine, computeDiscrepancies } from './discrepancy-engine';
import { Explainability } from '@/components/agent/explainability';

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
const AGENT_META: Record<string, { label: string; icon: React.ReactNode; desc: string }> = {
    bank_statement: { label: 'Bank Statement Analysis', icon: <Landmark className="h-5 w-5" />, desc: 'Cash flows, credits, debits, average balance, bounced cheques' },
    gst_analyzer: { label: 'GST Returns Analysis', icon: <BarChart3 className="h-5 w-5" />, desc: 'Revenue trends, GSTR-3B vs 2A reconciliation, ITC analysis' },
    itr_balancesheet: { label: 'ITR & Balance Sheet', icon: <TrendingUp className="h-5 w-5" />, desc: 'P&L metrics, net worth, DSCR, debt-equity ratio' },
    cibil_cmr: { label: 'CIBIL / CMR Score', icon: <Shield className="h-5 w-5" />, desc: 'Credit score, payment history, existing borrowings' },
    scout: { label: 'OSINT Research', icon: <Search className="h-5 w-5" />, desc: 'Court cases, MCA records, news, ratings, fraud signals' },
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
    // Monochromatic: weight and opacity based on value
    const weight = pct >= 80 ? 'font-bold' : pct >= 60 ? 'font-semibold' : 'font-medium';
    const opacity = pct >= 80 ? 'bg-white/20 text-white' : pct >= 60 ? 'bg-white/10 text-white/80' : 'bg-white/5 text-white/60';
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] ${weight} ${opacity} border border-white/10 uppercase`}>
            {pct}%
        </span>
    );
}

function RatingBadge({ rating }: { rating: string | null }) {
    if (!rating) return null;
    const cls =
        rating === 'Strong' ? 'bg-white/20 text-white font-bold' :
            rating === 'Adequate' ? 'bg-white/10 text-white/90 font-semibold text-xs' :
                rating === 'Weak' ? 'bg-white/5 text-white/70 font-medium text-[11px]' :
                    'bg-white/5 text-white/50 border border-white/10 text-[10px]';
    return <span className={`rounded-full px-2.5 py-0.5 ${cls} uppercase tracking-tight`}>{rating}</span>;
}

// ─── Main Component ────────────────────────────────────────────────────────
export function AnalysisDashboard({ appId }: { appId: string }) {
    const [data, setData] = useState<AnalysisData | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
    const [expandedSection, setExpandedSection] = useState<string | null>('overview');
    const [promoterHistory, setPromoterHistory] = useState<{ available: boolean; din: string | null; memories: Array<{ id: string; memory: string; created_at?: string }> } | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const [analysisRes, promoterRes] = await Promise.all([
                    fetch(`/api/applications/${appId}/analysis`),
                    fetch(`/api/applications/${appId}/promoter-history`),
                ]);
                if (analysisRes.ok) {
                    setData(await analysisRes.json() as AnalysisData);
                }
                if (promoterRes.ok) {
                    setPromoterHistory(await promoterRes.json());
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
                <Loader2 className="h-8 w-8 animate-spin text-white/20" />
            </div>
        );
    }

    if (!data) {
        return (
            <Card className="p-12 text-center">
                <XCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
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

    // avgConfidence is naturally 0..1 from the agents
    const overallScore = cam
        ? Math.round(((cam.characterScore ?? 0) + (cam.capacityScore ?? 0) + (cam.capitalScore ?? 0) + (cam.collateralScore ?? 0) + (cam.conditionsScore ?? 0)) / 5)
        : null;

    const sections = [
        { id: 'overview', label: 'Overview', icon: <Eye className="h-4 w-4" /> },
        { id: 'discrepancy', label: 'Discrepancy Engine', icon: <Zap className="h-4 w-4" /> },
        { id: 'financials', label: 'Financial Signals', icon: <TrendingUp className="h-4 w-4" /> },
        { id: 'research', label: 'Research & OSINT', icon: <Search className="h-4 w-4" /> },
        { id: 'promoter', label: 'Promoter DNA', icon: <Brain className="h-4 w-4" /> },
        { id: 'fieldnotes', label: 'Field Notes', icon: <Users className="h-4 w-4" /> },
        { id: 'documents', label: 'Documents', icon: <FileText className="h-4 w-4" /> },
        { id: 'explainability', label: 'AI Explainability', icon: <Brain className="h-4 w-4" /> },
        { id: 'pipeline', label: 'Pipeline Audit', icon: <Activity className="h-4 w-4" /> },
    ];

    return (
        <div className="space-y-6">

            {/* Section navigation */}
            <div className="flex flex-wrap gap-2">
                {sections.map(s => (
                    <button key={s.id}
                        onClick={() => setExpandedSection(expandedSection === s.id ? null : s.id)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all backdrop-blur-md ${expandedSection === s.id
                            ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                            : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white hover:border-white/20'
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
                        <Card className="p-4 text-center bg-white/5 backdrop-blur-xl border-white/10">
                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Overall Score</p>
                            <p className={`text-4xl font-bold mt-2 tabular-nums ${
                                (overallScore ?? 0) >= 70 ? 'text-white' : (overallScore ?? 0) >= 50 ? 'text-white/80' : 'text-white/60 font-black'
                            }`}>
                                {overallScore ?? '—'}
                                <span className="text-xs font-normal text-white/30 ml-0.5">/100</span>
                            </p>
                        </Card>
                        <Card className="p-4 text-center bg-white/5 backdrop-blur-xl border-white/10">
                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Data Points</p>
                            <p className="text-4xl font-bold mt-2 text-white tabular-nums">{totalSignals}</p>
                            <p className="text-[10px] text-white/30 mt-1 uppercase">Across {Object.keys(signalsByAgent).length} agents</p>
                        </Card>
                        <Card className="p-4 text-center bg-white/5 backdrop-blur-xl border-white/10">
                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Avg Confidence</p>
                            <p className={`text-4xl font-bold mt-2 tabular-nums ${avgConfidence >= 0.8 ? 'text-white' : avgConfidence >= 0.6 ? 'text-white/80' : 'text-white/60'}`}>
                                {Math.round(avgConfidence * 100)}%
                            </p>
                        </Card>
                        <Card className="p-4 text-center bg-white/5 backdrop-blur-xl border-white/10">
                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Fraud Alerts</p>
                            <div className="flex flex-col items-center">
                                <p className={`text-4xl font-bold mt-2 tabular-nums ${fraudFindings.length > 0 ? 'text-white ring-1 ring-white/20 px-2 rounded' : 'text-white/20'}`}>
                                    {fraudFindings.length}
                                </p>
                                <p className="text-[10px] text-white/30 mt-1 uppercase">{generalFindings.length} research findings</p>
                            </div>
                        </Card>
                    </div>

                    {/* 5Cs visual summary */}
                    {cam && (
                        <Card className="p-6 bg-white/5 backdrop-blur-xl border-white/10">
                            <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <BarChart3 className="h-4 w-4 text-white/60" />
                                Credit Quality Index
                            </h3>
                            <div className="space-y-5">
                                {([
                                    { key: 'character', icon: <Shield className="h-4 w-4" />, label: 'Character' },
                                    { key: 'capacity', icon: <TrendingUp className="h-4 w-4" />, label: 'Capacity' },
                                    { key: 'capital', icon: <Landmark className="h-4 w-4" />, label: 'Capital' },
                                    { key: 'collateral', icon: <Building2 className="h-4 w-4" />, label: 'Collateral' },
                                    { key: 'conditions', icon: <ClipboardList className="h-4 w-4" />, label: 'Conditions' },
                                ] as const).map(({ key, icon, label }) => {
                                    const score = cam[`${key}Score` as keyof CamData] as number | null;
                                    const rating = cam[`${key}Rating` as keyof CamData] as string | null;
                                    const barOpacity = (score ?? 0) >= 70 ? 'bg-white' : (score ?? 0) >= 50 ? 'bg-white/60' : 'bg-white/30';
                                    return (
                                        <div key={key} className="flex items-center gap-6">
                                            <div className="flex items-center gap-3 w-32 flex-shrink-0">
                                                <div className="text-white/40">{icon}</div>
                                                <span className="text-[11px] font-bold text-white/80 uppercase tracking-tight">{label}</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="h-1 w-full rounded-full bg-white/5 overflow-hidden">
                                                    <div className={`h-full rounded-full ${barOpacity} transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,255,255,0.1)]`}
                                                        style={{ width: `${score ?? 0}%` }} />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 w-32 justify-end flex-shrink-0">
                                                <span className="text-sm font-bold text-white tabular-nums">{score ?? '—'}</span>
                                                <RatingBadge rating={rating} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    )}

                    {/* Transparency notice */}
                    <Card className="p-4 border border-white/10 bg-white/5 backdrop-blur-xl">
                        <div className="flex gap-4">
                            <Info className="h-5 w-5 text-white/40 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold text-white text-xs uppercase tracking-wider">Monochromatic Transparency Engine</p>
                                <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
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
          SECTION: Discrepancy Engine (Cross-Document Fraud Detection)
         ══════════════════════════════════════════════════════════════ */}
            {expandedSection === 'discrepancy' && (
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Cross-document verification engine — automatically triangulates data across GST returns, bank statements,
                        ITR filings, and CIBIL reports to detect revenue inflation, circular trading, and hidden defaults.
                    </p>
                    <DiscrepancyEngine checks={computeDiscrepancies(signalsByAgent)} />
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

                        return (
                            <Card key={agentKey} className={`overflow-hidden transition-all bg-white/5 backdrop-blur-xl border-white/10 ${isExpanded ? 'border-white/30 bg-white/10' : 'hover:bg-white/10'}`}>
                                <button
                                    onClick={() => setExpandedAgent(isExpanded ? null : agentKey)}
                                    className="w-full flex items-center gap-4 p-5 text-left transition-colors"
                                >
                                    <div className="rounded-lg p-2.5 bg-white/10 text-white/80 border border-white/10">
                                        {meta.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-bold text-white uppercase tracking-tight">{meta.label}</p>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] uppercase font-bold text-white/30 tracking-widest">{sigs.length} signals</span>
                                                {sigs.length > 0 && <ConfidenceBadge confidence={String(avgConf)} />}
                                                {isExpanded ? <ChevronUp className="h-4 w-4 text-white/40" /> : <ChevronDown className="h-4 w-4 text-white/40" />}
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-white/40 mt-1">{meta.desc}</p>
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div className="border-t border-white/10 bg-black/20 divide-y divide-white/5">
                                        {sigs.length === 0 ? (
                                            <div className="p-5 text-center text-xs text-white/30 uppercase tracking-widest">
                                                No signals extracted
                                            </div>
                                        ) : (
                                            sigs.map((sig, i) => (
                                                <div key={i} className="px-5 py-3">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-medium text-white/90">{formatSignalKey(sig.signalKey)}</p>
                                                                {sig.isUnverified && (
                                                                    <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-white/40 uppercase border border-white/10">Unverified</span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-white/60 mt-1 font-mono">
                                                                {formatSignalValue(sig.signalValue)}
                                                            </p>
                                                            {sig.rawSnippet && (
                                                                <p className="text-[10px] text-white/30 mt-1.5 italic line-clamp-2 leading-relaxed">
                                                                    Source: &ldquo;{sig.rawSnippet}&rdquo;
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
                        <Card className="overflow-hidden border-white/20 bg-white/5 backdrop-blur-xl ring-1 ring-white/10">
                            <div className="px-5 py-4 bg-white/10 border-b border-white/10 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <BadgeAlert className="h-5 w-5 text-white" />
                                    <div>
                                        <p className="font-bold text-white text-xs uppercase tracking-widest">Priority Risk Signals ({fraudFindings.length})</p>
                                        <p className="text-[10px] text-white/40 uppercase font-medium mt-0.5">Alerts flagged during automated OSINT research</p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-black text-white px-2 py-1 bg-white/20 rounded border border-white/20">⚠ HIGH RISK</span>
                            </div>
                            <div className="divide-y divide-white/5">
                                {fraudFindings.map((f, i) => (
                                    <div key={i} className="px-5 py-4 bg-white/[0.02] hover:bg-white/[0.05] transition-colors">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="rounded border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-black text-white uppercase tracking-wider">
                                                        {RESEARCH_TYPE_LABELS[f.searchType] ?? f.searchType}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-white/80 leading-relaxed font-medium">{f.snippet}</p>
                                            </div>
                                            {f.sourceUrl && (
                                                <a href={f.sourceUrl} target="_blank" rel="noreferrer"
                                                    className="flex-shrink-0 text-white/30 hover:text-white transition-colors">
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
                        <Card className="p-5 border border-white/10 bg-white/5 backdrop-blur-xl">
                            <div className="flex gap-4">
                                <ShieldCheck className="h-5 w-5 text-white/40 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold text-white text-xs uppercase tracking-widest">Verification Status: Clean</p>
                                    <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
                                        OSINT research across court records, MCA filings, and news sources found no fraud indicators.
                                    </p>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* General research */}
                    {generalFindings.length > 0 && (
                        <Card className="overflow-hidden bg-white/5 backdrop-blur-xl border-white/10">
                            <div className="px-5 py-4 bg-white/10 border-b border-white/10 flex items-center gap-3">
                                <Search className="h-4 w-4 text-white/40" />
                                <div>
                                    <p className="font-bold text-white text-xs uppercase tracking-widest">Research Findings ({generalFindings.length})</p>
                                    <p className="text-[10px] text-white/40 uppercase font-medium mt-0.5">External datasets gathered about the entity</p>
                                </div>
                            </div>
                            <div className="divide-y divide-white/5">
                                {generalFindings.map((f, i) => (
                                    <div key={i} className="px-5 py-4 hover:bg-white/[0.02] transition-colors">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-bold text-white/50 mb-2 inline-block uppercase tracking-wider">
                                                    {RESEARCH_TYPE_LABELS[f.searchType] ?? f.searchType}
                                                </span>
                                                <p className="text-sm text-white/70 leading-relaxed font-medium mt-1">{f.snippet}</p>
                                            </div>
                                            {f.sourceUrl && (
                                                <a href={f.sourceUrl} target="_blank" rel="noreferrer"
                                                    className="flex-shrink-0 text-white/30 hover:text-white transition-colors">
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
                        <div className="space-y-4">
                            {notes.map((note, i) => (
                                <Card key={i} className="p-5 bg-white/5 backdrop-blur-xl border-white/10 hover:border-white/20 transition-all">
                                    <div className="flex items-start gap-4">
                                        <div className={`rounded-lg p-2 flex-shrink-0 border border-white/10 ${(note.scoreDelta ?? 0) > 0 ? 'bg-white/20' :
                                            (note.scoreDelta ?? 0) < 0 ? 'bg-white/5' : 'bg-white/10'
                                            }`}>
                                            {(note.scoreDelta ?? 0) > 0 ? <TrendingUp className="h-4 w-4 text-white" /> :
                                                (note.scoreDelta ?? 0) < 0 ? <TrendingDown className="h-4 w-4 text-white/40" /> :
                                                    <Users className="h-4 w-4 text-white/60" />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-black text-white uppercase tracking-widest border border-white/10">
                                                    {note.category.replace(/_/g, ' ')}
                                                </span>
                                                <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] font-bold text-white/40 uppercase border border-white/5">
                                                    {note.fiveCDimension}
                                                </span>
                                                {note.scoreDelta !== null && note.scoreDelta !== 0 && (
                                                    <span className={`text-xs font-black tabular-nums ${note.scoreDelta > 0 ? 'text-white' : 'text-white/40'}`}>
                                                        {note.scoreDelta > 0 ? '▲' : '▼'}{Math.abs(note.scoreDelta)} PTS
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-white/80 leading-relaxed font-medium">{note.noteText}</p>
                                            <div className="flex items-center gap-2 mt-3">
                                                <Clock className="h-3 w-3 text-white/20" />
                                                <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                                                    SUBMITTED: {new Date(note.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                                </p>
                                            </div>
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
                                    <div key={doc.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors">
                                        <div className="rounded-lg bg-white/10 p-2.5 flex-shrink-0 border border-white/10">
                                            <FileText className="h-5 w-5 text-white/60" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-white/90 truncate uppercase tracking-tight">{doc.fileName}</p>
                                            <p className="text-[10px] text-white/30 font-bold uppercase mt-1 tracking-widest">
                                                {doc.documentType.replace(/_/g, ' ')}
                                                {doc.fileSize ? ` · ${(doc.fileSize / 1024).toFixed(0)} KB` : ''}
                                            </p>
                                        </div>
                                        <span className="rounded-full bg-white/10 border border-white/20 px-3 py-1 text-[10px] font-black text-white uppercase tracking-widest shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                                            PROCESSED ✓
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
          SECTION: Promoter DNA (mem0)
         ══════════════════════════════════════════════════════════════ */}
            {expandedSection === 'promoter' && (
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Cross-application promoter memory powered by <span className="font-semibold">mem0</span>. Tracks promoter history across all loan applications by DIN.
                    </p>

                    {!promoterHistory?.available ? (
                        <Card className="p-8 text-center">
                            <Brain className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                            <p className="text-sm font-medium text-gray-600">mem0 Not Configured</p>
                            <p className="text-xs text-muted-foreground mt-1">Set <code className="bg-gray-100 px-1 rounded">MEM0_API_KEY</code> in .env.local to enable Promoter DNA tracking.</p>
                        </Card>
                    ) : !promoterHistory.din ? (
                        <Card className="p-8 text-center">
                            <Info className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                            <p className="text-sm font-medium text-gray-600">No Promoter DIN on File</p>
                            <p className="text-xs text-muted-foreground mt-1">Add a Director Identification Number (DIN) to the application to enable promoter history lookup.</p>
                        </Card>
                    ) : promoterHistory.memories.length === 0 ? (
                        <Card className="p-8 text-center">
                            <ShieldCheck className="h-10 w-10 text-green-400 mx-auto mb-3" />
                            <p className="text-sm font-medium text-gray-600">First Application for DIN {promoterHistory.din}</p>
                            <p className="text-xs text-muted-foreground mt-1">No prior loan applications found for this promoter. History will be recorded after CAM generation.</p>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            <Card className="px-5 py-4 bg-white/10 border border-white/20 backdrop-blur-xl">
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 bg-white text-black rounded-lg">
                                        <Brain className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-white uppercase tracking-widest">Promoter DNA: {promoterHistory.din}</p>
                                        <p className="text-[10px] text-white/50 uppercase font-bold mt-0.5">{promoterHistory.memories.length} historical records discovered across prior exposure</p>
                                    </div>
                                </div>
                            </Card>

                            {promoterHistory.memories.map((mem, idx) => (
                                <Card key={mem.id || idx} className="p-5 bg-white/5 backdrop-blur-xl border-white/10 hover:border-white/20 transition-all">
                                    <div className="flex items-start gap-4">
                                        <div className="mt-0.5 flex-shrink-0">
                                            <div className="h-10 w-10 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-white/40">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <pre className="text-sm text-white/80 whitespace-pre-wrap font-sans leading-relaxed font-medium">{mem.memory}</pre>
                                            {mem.created_at && (
                                                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
                                                    <Clock className="h-3 w-3 text-white/20" />
                                                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                                                        RECORDED: {new Date(mem.created_at).toLocaleString('en-IN')}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
          SECTION: AI Explainability
         ══════════════════════════════════════════════════════════════ */}
            {expandedSection === 'explainability' && (
                <Explainability
                    cam={cam}
                    agentCount={Object.keys(signalsByAgent).length}
                    signalCount={totalSignals}
                    avgConfidence={Math.round(avgConfidence * 100)}
                />
            )}

            {/* ══════════════════════════════════════════════════════════════
          SECTION: Pipeline Audit Trail
         ══════════════════════════════════════════════════════════════ */}
            {expandedSection === 'pipeline' && (
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Complete audit trail of every step in the AI analysis pipeline.
                    </p>

                    <Card className="overflow-hidden bg-white/5 backdrop-blur-xl border-white/10">
                        <div className="px-5 py-4 bg-white/10 border-b border-white/10">
                            <p className="font-bold text-white text-xs uppercase tracking-widest">Pipeline Execution Audit</p>
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
                                        <div key={i} className="relative mb-6 last:mb-0">
                                            {/* Timeline dot */}
                                            <div className={`absolute -left-[1.2rem] top-1.5 h-4 w-4 rounded-full border-4 border-[#0A0A0A] ${isDone ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]' : isFailed ? 'bg-white/40 border-white/20' : isProcessing ? 'bg-white animate-pulse' : 'bg-white/10'
                                                }`} />
                                            <div className="ml-6">
                                                <div className="flex items-center gap-3">
                                                    <p className="text-xs font-black text-white uppercase tracking-widest">{stage.stage.replace(/_/g, ' ')}</p>
                                                    <span className={`rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-tighter border ${isDone ? 'bg-white/20 border-white/20 text-white' :
                                                        isFailed ? 'bg-white/5 border-white/10 text-white/40' :
                                                            isProcessing ? 'bg-white text-black' :
                                                                'bg-white/5 border-white/5 text-white/20'
                                                        }`}>
                                                        {stage.status}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 mt-1.5">
                                                    {stage.startedAt && (
                                                        <p className="text-[10px] text-white/30 font-bold uppercase tracking-tight">
                                                            T: {new Date(stage.startedAt).toLocaleTimeString('en-IN')}
                                                        </p>
                                                    )}
                                                    {stage.completedAt && stage.startedAt && (
                                                        <p className="text-[10px] text-white/30 font-bold uppercase tracking-tight">
                                                            Δ: {((new Date(stage.completedAt).getTime() - new Date(stage.startedAt).getTime()) / 1000).toFixed(1)}S
                                                        </p>
                                                    )}
                                                </div>
                                                {stage.errorMessage && (
                                                    <p className="text-[10px] text-white/40 font-bold uppercase mt-1 border-l border-white/20 pl-2 leading-relaxed">{stage.errorMessage}</p>
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
