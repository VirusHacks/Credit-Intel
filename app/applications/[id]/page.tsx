'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { AgentActivityFeed } from '@/components/agent/agent-activity-feed';
import { AnalysisDashboard } from '@/components/analysis/analysis-dashboard';
import { CamOutputPanel } from '@/components/memo/cam-output-panel';
import { BayesianDecisionPanel } from '@/components/memo/bayesian-decision-panel';
import type { BayesianDecision } from '@/lib/scoring/bayesian-scorer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ArrowLeft,
  Play,
  FileCheck2,
  FileBarChart2,
  RefreshCw,
  Clock,
  Loader2,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Building2,
  Activity,
  BarChart2,
  FileText,
  Zap,
  ClipboardList,
  Layers,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  ShieldAlert,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

// ─── Types from API ────────────────────────────────────────────────────────────
interface AppDetail {
  id: string;
  status: string;
  industry: string | null;
  subIndustry: string | null;
  cin: string | null;
  gstin: string | null;
  pan: string | null;
  promoterDin: string | null;
  requestedAmountInr: string | null;
  cmrRank: number | null;
  pipelineStatus: string;
  qualitativeGateDone: boolean;
  analysisProgress: number;
  annualRevenue: string | null;
  numberOfEmployees: number | null;
  businessStage: string | null;
  yearlyGrowth: string | null;
  createdAt: string;
  updatedAt: string;
  companyName: string | null;
  companyId: string;
  registrationNumber: string | null;
  registrationType: string | null;
  city: string | null;
  state: string | null;
  qualitativeNotesCount: number;
  latestCam: {
    decision: string;
    recommendedAmountInr: string | null;
    recommendedRatePercent: string | null;
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
    reductionRationale: string | null;
    conditions: string[] | null;
    thinkingTrace: string | null;
    bayesianJson: BayesianDecision | null;
    swotJson: { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[] } | null;
    pdfBlobUrl: string | null;
    generatedAt: string;
  } | null;
}

// ─── Pipeline status helpers ──────────────────────────────────────────────────
const PIPELINE_LABELS: Record<string, string> = {
  not_started: 'Not Started',
  ingesting: 'Ingesting Documents',
  analyzing: 'Analyzing',
  awaiting_qualitative: 'Awaiting Field Input',
  reconciling: 'AI Reconciling',
  generating_cam: 'Generating CAM',
  complete: 'Complete',
  failed: 'Failed',
};

function PipelineStatusBadge({ status }: { status: string }) {
  const variants: Record<string, { symbol: string; label: string; weight: string }> = {
    not_started:          { symbol: '○', label: 'Not Started',    weight: 'font-normal' },
    ingesting:            { symbol: '◌', label: 'Ingesting',       weight: 'font-medium' },
    analyzing:            { symbol: '◌', label: 'Analyzing',       weight: 'font-medium' },
    awaiting_qualitative: { symbol: '⚠', label: 'Awaiting Input',  weight: 'font-semibold' },
    reconciling:          { symbol: '◌', label: 'Reconciling',     weight: 'font-medium' },
    generating_cam:       { symbol: '◌', label: 'Generating CAM',  weight: 'font-medium' },
    complete:             { symbol: '✓', label: 'Complete',         weight: 'font-semibold' },
    failed:               { symbol: '✗', label: 'Failed',           weight: 'font-bold' },
  };
  const v = variants[status] ?? variants.not_started;
  const isActive = ['ingesting','analyzing','reconciling','generating_cam'].includes(status);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 ${v.weight}`}>
      <span className={isActive ? 'animate-pulse' : ''}>{v.symbol}</span>
      {v.label}
    </span>
  );
}

function RatingBadge({ rating }: { rating: string | null }) {
  if (!rating) return <span className="text-white/30 text-xs">—</span>;
  const weight = rating === 'Strong' ? 'font-bold text-white' : rating === 'Adequate' ? 'font-semibold text-white/80' : rating === 'Weak' ? 'font-medium text-white/60' : 'font-normal text-white/40';
  return <span className={`rounded px-2 py-0.5 text-xs border border-white/10 bg-white/5 ${weight}`}>{rating}</span>;
}

function ScoreBar({ score }: { score: number | null }) {
  if (score === null) return <div className="h-1.5 w-full rounded-full bg-white/10" />;
  return (
    <div className="h-1.5 w-full rounded-full bg-white/10">
      <div className="h-1.5 rounded-full bg-white/70" style={{ width: `${score}%` }} />
    </div>
  );
}

function DecisionBadge({ decision }: { decision: string }) {
  const symbol = decision === 'APPROVE' ? '✓' : decision === 'CONDITIONAL_APPROVE' ? '→' : '✗';
  const weight = decision === 'APPROVE' ? 'border-white/20 bg-white/10 font-semibold' : decision === 'CONDITIONAL_APPROVE' ? 'border-white/10 bg-white/5 font-medium' : 'border-white/30 bg-white/15 font-bold';
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-3 py-1 text-sm text-white ${weight}`}>
      {symbol} {decision.replace('_', ' ')}
    </span>
  );
}

function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="mt-1 font-semibold text-sm">{value ?? <span className="text-gray-400">—</span>}</p>
    </div>
  );
}

// ─── Workflow stepper ──────────────────────────────────────────────────────────
const WORKFLOW_STEPS = [
  { id: 1, label: 'Documents', desc: 'Upload & classify', icon: FileText },
  { id: 2, label: 'AI Analysis', desc: 'Agent processing', icon: Zap },
  { id: 3, label: 'Field Notes', desc: 'Officer observations', icon: ClipboardList },
  { id: 4, label: 'Credit Report', desc: 'CAM generation', icon: FileBarChart2 },
  { id: 5, label: 'Complete', desc: 'Decision ready', icon: CheckCircle2 },
];

function getActiveStep(pipelineStatus: string): number {
  if (pipelineStatus === 'complete') return 5;
  if (['reconciling', 'generating_cam'].includes(pipelineStatus)) return 4;
  if (pipelineStatus === 'awaiting_qualitative') return 3;
  if (pipelineStatus === 'analyzing') return 2;
  return 1;
}

function getInitials(name: string | null): string {
  if (!name) return '?';
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const AVATAR_GRADIENTS = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-violet-500 to-purple-600',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-600',
];

function getAvatarGradient(name: string | null): string {
  if (!name) return AVATAR_GRADIENTS[0];
  return AVATAR_GRADIENTS[name.charCodeAt(0) % AVATAR_GRADIENTS.length];
}

function WorkflowStepper({ status }: { status: string }) {
  const activeStep = getActiveStep(status);
  const isFailed = status === 'failed';
  return (
    <div className="flex items-start w-full overflow-x-auto pb-1">
      {WORKFLOW_STEPS.map((step, idx) => {
        const isDone = activeStep > step.id;
        const isActive = activeStep === step.id && !isFailed;
        const Icon = step.icon;
        return (
          <div key={step.id} className="flex items-center flex-1 min-w-0">
            <div className={`flex flex-col items-center gap-1.5 flex-1 min-w-0 transition-opacity ${isDone || isActive ? 'opacity-100' : 'opacity-35'}`}>
              <div className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${isDone ? 'bg-emerald-500 text-white' :
                isActive ? 'bg-primary text-white shadow-lg ring-4 ring-primary/20' :
                  isFailed && activeStep === step.id ? 'bg-red-500 text-white' :
                    'bg-gray-100 text-gray-400'
                }`}>
                {isDone ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-3.5 w-3.5" />}
              </div>
              <p className={`text-[11px] font-semibold whitespace-nowrap ${isActive ? 'text-primary' : isDone ? 'text-emerald-600' : 'text-gray-400'
                }`}>{step.label}</p>
              <p className="text-[9px] text-gray-400 hidden sm:block text-center leading-none">{step.desc}</p>
            </div>
            {idx < WORKFLOW_STEPS.length - 1 && (
              <div className={`h-px flex-1 mx-1 max-w-[40px] transition-colors ${isDone ? 'bg-emerald-300' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── SWOT helpers ────────────────────────────────────────────────────────────
const SOURCE_MAP: Record<string, { label: string; cls: string }> = {
  bank_statement: { label: 'Bank Statement', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  bank: { label: 'Bank Statement', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  gst_analyzer: { label: 'GST Returns', cls: 'bg-teal-50 text-teal-700 border-teal-200' },
  gst: { label: 'GST Returns', cls: 'bg-teal-50 text-teal-700 border-teal-200' },
  itr_balancesheet: { label: 'ITR / Balance Sheet', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  itr: { label: 'ITR / Balance Sheet', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  balancesheet: { label: 'Balance Sheet', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  cibil_agent: { label: 'CIBIL', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  cibil_cmr: { label: 'CIBIL', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  cibil: { label: 'CIBIL', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  scout: { label: 'Research', cls: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  reconciler: { label: 'Cross-Validation', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  factory_operations: { label: 'Factory Visit', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  management_quality: { label: 'Management', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  customer_relationships: { label: 'Customer Intel', cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  industry_context: { label: 'Industry', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  collateral_inspection: { label: 'Collateral', cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  mca_din: { label: 'MCA / DIN', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  ecourts: { label: 'Court Records', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  rbi_circular: { label: 'RBI Circular', cls: 'bg-red-50 text-red-700 border-red-200' },
  rbi: { label: 'RBI Circular', cls: 'bg-red-50 text-red-700 border-red-200' },
  news_fraud: { label: 'Fraud Signal', cls: 'bg-red-100 text-red-800 border-red-300' },
};

function resolveSource(raw: string): { label: string; cls: string } {
  const key = raw.toLowerCase().replace(/[\s\-]/g, '_').replace(/[^a-z0-9_]/g, '');
  if (SOURCE_MAP[key]) return SOURCE_MAP[key];
  for (const [k, v] of Object.entries(SOURCE_MAP)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  // Humanise unknown source
  return { label: raw.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).slice(0, 20), cls: 'bg-gray-100 text-gray-600 border-gray-200' };
}

interface ParsedSwotItem { headline: string; detail: string; sources: Array<{ label: string; cls: string }> }

function parseSwotItem(text: string): ParsedSwotItem {
  const rawSources: string[] = [];
  const cleaned = text.replace(/\[([^\]]+)\]/g, (_, tag: string) => { rawSources.push(tag.trim()); return ''; }).replace(/\s{2,}/g, ' ').trim();
  // Deduplicate sources by label
  const seen = new Set<string>();
  const sources = rawSources.map(resolveSource).filter((s) => { if (seen.has(s.label)) return false; seen.add(s.label); return true; });
  // Split at first sentence boundary for headline/detail
  const breakIdx = cleaned.search(/\.\s+[A-Z]/);
  const headline = breakIdx > 20 ? cleaned.slice(0, breakIdx + 1).trim() : cleaned;
  const detail = breakIdx > 20 ? cleaned.slice(breakIdx + 2).trim() : '';
  return { headline, detail, sources };
}

function SwotItemRow({ text, index, numCls }: { text: string; index: number; numCls: string }) {
  const { headline, detail, sources } = parseSwotItem(text);
  return (
    <li className="group rounded-xl border border-transparent hover:border-gray-200 hover:bg-white/80 transition-all duration-150 p-3 -mx-1">
      <div className="flex gap-3">
        <span className={`shrink-0 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold mt-0.5 ${numCls}`}>
          {index + 1}
        </span>
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-sm font-semibold text-gray-900 leading-snug">{headline}</p>
          {detail && <p className="text-xs text-gray-500 leading-relaxed">{detail}</p>}
          {sources.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1.5">
              {sources.map((s, si) => (
                <span key={si} className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold tracking-tight ${s.cls}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current opacity-50 shrink-0" />
                  {s.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function ApplicationDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const appId = params.id as string;
  const devMode = searchParams.get('dev') === 'true';

  const [app, setApp] = useState<AppDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('analysis');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // SWOT state
  const [swot, setSwot] = useState<{
    strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[];
    generatedAt?: string; isGenerated?: boolean;
  } | null>(null);
  const [swotLoading, setSwotLoading] = useState(false);

  const fetchApp = useCallback(async () => {
    try {
      const res = await fetch(`/api/applications/${appId}`);
      if (!res.ok) throw new Error(res.status === 404 ? 'Application not found' : 'Failed to load');
      const data = await res.json() as AppDetail;
      setApp(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load application');
    } finally {
      setLoading(false);
    }
  }, [appId]);

  useEffect(() => { void fetchApp(); }, [fetchApp]);

  // Seed SWOT from latestCam when app loads
  useEffect(() => {
    if (app?.latestCam?.swotJson) {
      setSwot(app.latestCam.swotJson as typeof swot);
    }
  }, [app?.latestCam?.swotJson]);

  // Gentle auto-refresh every 10s while pipeline is in an active state
  useEffect(() => {
    if (!app) return;
    const active = ['ingesting', 'analyzing', 'awaiting_qualitative', 'reconciling', 'generating_cam'];
    if (!active.includes(app.pipelineStatus)) return;
    const timer = setInterval(() => void fetchApp(), 10_000);
    return () => clearInterval(timer);
  }, [app, fetchApp]);

  const handleRunPipeline = async () => {
    setActionLoading('pipeline');
    try {
      const res = await fetch('/api/pipeline/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId, companyName: app?.companyName ?? '', promoterName: '' }),
      });
      if (!res.ok) throw new Error('Failed to start pipeline');
      await fetchApp();
      setActiveTab('pipeline');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Pipeline start failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleGenerateCAM = async () => {
    setActionLoading('cam');
    try {
      const res = await fetch('/api/cam/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'CAM generation failed');
      }
      await fetchApp();
      setActiveTab('cam');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'CAM generation failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleGenerateDecision = async () => {
    setActionLoading('decision');
    try {
      const res = await fetch('/api/cam/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? 'Decision analysis generation failed');
      }
      await fetchApp();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAcceptDecision = async () => {
    try {
      await fetch(`/api/applications/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: app?.latestCam?.decision === 'APPROVE' || app?.latestCam?.decision === 'CONDITIONAL_APPROVE' ? 'approved' : 'rejected' }),
      });
      await fetchApp();
    } catch {
      // non-critical — silently ignore if endpoint doesn't exist yet
    }
  };

  const handleOverrideDecision = async (verdict: 'approve' | 'reject', reason: string) => {
    try {
      await fetch(`/api/applications/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: verdict === 'approve' ? 'approved' : 'rejected', overrideReason: reason }),
      });
      await fetchApp();
    } catch {
      // non-critical
    }
  };

  const handleSkipQualify = async () => {
    setActionLoading('skip');
    try {
      const res = await fetch(`/api/applications/${appId}/skip-qualify`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to skip qualification');
      await fetchApp();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleGenerateSWOT = async () => {
    setSwotLoading(true);
    try {
      const res = await fetch('/api/cam/swot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? 'SWOT generation failed');
      }
      const data = await res.json() as { swot: typeof swot };
      setSwot(data.swot);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'SWOT generation failed');
    } finally {
      setSwotLoading(false);
    }
  };


  if (loading) {
    return (
      <DashboardLayout>
        <main className="flex items-center justify-center p-20">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading application…</p>
          </div>
        </main>
      </DashboardLayout>
    );
  }

  if (error || !app) {
    return (
      <DashboardLayout>
        <main className="flex items-center justify-center p-20">
          <div className="text-center space-y-4">
            <XCircle className="h-12 w-12 text-destructive mx-auto" />
            <h1 className="text-2xl font-bold">{error ?? 'Application not found'}</h1>
            <Link href="/applications">
              <Button>Back to Applications</Button>
            </Link>
          </div>
        </main>
      </DashboardLayout>
    );
  }

  const showRunButton = ['not_started', 'failed', 'ingesting'].includes(app.pipelineStatus);
  const showQualifyButton = app.pipelineStatus === 'awaiting_qualitative' && !app.qualitativeGateDone;
  const showCAMButton = app.qualitativeGateDone && !['complete', 'reconciling', 'generating_cam'].includes(app.pipelineStatus);

  const tabs = [
    { id: 'analysis', label: 'Overview', icon: BarChart2 },
    { id: 'info', label: 'Company Info', icon: Building2 },
    { id: 'cam', label: 'Credit Report', icon: FileBarChart2 },
    { id: 'swot', label: 'SWOT Analysis', icon: Sparkles },
    { id: 'decision', label: 'Decision Engine', icon: Layers },
    { id: 'pipeline', label: 'Pipeline Logs', icon: Activity },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col">
        <h1 className="sticky top-0 z-[10] flex items-center justify-between border-b border-white/10 bg-black/40 px-6 py-4 text-2xl font-medium backdrop-blur-2xl">
          <div className="flex items-center gap-3">
            <Link href="/applications" className="text-sm text-white/40 hover:text-white/80 transition-colors">
              ← Applications
            </Link>
            <span className="text-white/20">/</span>
            <span className="text-white text-lg font-semibold">{app.companyName ?? 'Unnamed Company'}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void handleRunPipeline()} disabled={actionLoading !== null}
              className="gap-2 bg-white text-black hover:bg-white/90 text-sm">
              {actionLoading === 'pipeline' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {['analyzing', 'reconciling', 'generating_cam'].includes(app.pipelineStatus) ? 'Pipeline Running…' : 'Run AI Pipeline'}
            </Button>
            {showQualifyButton && (
              <Link href={`/applications/${app.id}/qualify`}>
                <Button variant="outline" className="gap-2 border-white/20 text-white/60 hover:bg-white/5 hover:text-white text-sm">
                  <FileCheck2 className="h-4 w-4" />
                  Field Qualify
                </Button>
              </Link>
            )}
            {showCAMButton && (
              <Button onClick={() => void handleGenerateCAM()} disabled={actionLoading !== null}
                className="gap-2 bg-white text-black hover:bg-white/90 text-sm">
                {actionLoading === 'cam' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileBarChart2 className="h-4 w-4" />}
                Generate CAM
              </Button>
            )}
            {app.pipelineStatus === 'complete' && app.latestCam?.pdfBlobUrl && (
              <a href={`/api/cam/download/${app.id}`} target="_blank" rel="noreferrer">
                <Button variant="outline" className="gap-2 border-white/20 text-white/60 hover:bg-white/5 hover:text-white text-sm">
                  <Download className="h-4 w-4" />
                  Download CAM PDF
                </Button>
              </a>
            )}
            <Button variant="ghost" size="icon" onClick={() => void fetchApp()} title="Refresh" className="text-white/40 hover:text-white hover:bg-white/5">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </h1>

        <main className="flex flex-col gap-6 p-6">
          {/* Summary strip */}
          <div className="grid gap-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 shadow-2xl sm:grid-cols-4">
            <div>
              <p className="text-xs font-medium text-white/40 uppercase tracking-wider">Requested</p>
              <p className="mt-1 text-xl font-bold text-white">
                {app.requestedAmountInr ? `₹${Number(app.requestedAmountInr).toLocaleString('en-IN')}` : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-white/40 uppercase tracking-wider">Industry</p>
              <p className="mt-1 font-semibold text-sm text-white">{app.industry ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-white/40 uppercase tracking-wider">CMR Rank</p>
              <p className="mt-1 text-xl font-bold text-white">
                {app.cmrRank !== null ? `${app.cmrRank}/10` : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-white/40 uppercase tracking-wider">Progress</p>
              <div className="mt-2 space-y-1">
                <div className="h-2 w-full rounded-full bg-white/10">
                  <div className="h-2 rounded-full bg-white/70 transition-all duration-500"
                    style={{ width: `${app.analysisProgress ?? 0}%` }} />
                </div>
                <p className="text-xs text-white/40">{app.analysisProgress ?? 0}% complete</p>
              </div>
            </div>
          </div>

        {/* Field qualify banner */}
        {showQualifyButton && (
          <div className="flex items-start gap-3 rounded-xl border border-white/30 bg-white/10 backdrop-blur-md p-4 shadow-xl">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-white/80" />
            <div className="flex-1">
              <p className="font-semibold text-sm text-white">⚠ Field qualification required</p>
              <p className="text-xs text-white/60 mt-0.5">
                Automated analysis complete. A credit officer must submit field observations, or skip to proceed directly to CAM generation.
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => void handleSkipQualify()}
                disabled={actionLoading !== null}
                className="gap-1.5 text-xs text-white/60 hover:bg-white/10 hover:text-white">
                {actionLoading === 'skip' ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                Skip &amp; Continue
              </Button>
              <Link href={`/applications/${app.id}/qualify`}>
                <Button size="sm" className="bg-white text-black hover:bg-white/90 gap-1.5 text-xs">
                  <FileCheck2 className="h-3 w-3" />
                  Start Field Input
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto rounded-xl bg-black/40 border border-white/10 backdrop-blur-md p-1 shadow-xl">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/80'
              }`}>
              {tab.label}
              {tab.id === 'cam' && app.latestCam && (
                <span className="ml-1.5 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-xs font-semibold text-white/60">
                  {app.latestCam.decision.replace('_', ' ')}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab: AI Pipeline */}
        {activeTab === 'pipeline' && (
          <AgentActivityFeed
            appId={appId}
            pipelineStatus={app.pipelineStatus}
            decisionSummary={app.latestCam?.bayesianJson ? {
              overallScore: app.latestCam.bayesianJson.overallScore,
              decisionBand: app.latestCam.bayesianJson.decisionBand,
              conflictCount: app.latestCam.bayesianJson.dimensions.filter((d) => d.conflictFlag).length,
            } : undefined}
          />
        )}

        {/* Tab: Analysis Dashboard */}
        {activeTab === 'analysis' && <AnalysisDashboard appId={appId} />}

        {/* Tab: Application Info */}
        {activeTab === 'info' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-6 space-y-4">
              <h2 className="text-base font-bold">Company Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <KV label="Company Name" value={app.companyName} />
                <KV label="Registration No." value={app.registrationNumber} />
                <KV label="CIN" value={app.cin} />
                <KV label="GSTIN" value={app.gstin} />
                <KV label="PAN" value={app.pan} />
                <KV label="Promoter DIN" value={app.promoterDin} />
                <KV label="City" value={app.city} />
                <KV label="State" value={app.state} />
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <h2 className="text-base font-bold">Business & Financial</h2>
              <div className="grid grid-cols-2 gap-4">
                <KV label="Industry" value={app.industry} />
                <KV label="Sub-Industry" value={app.subIndustry} />
                <KV label="Business Stage" value={app.businessStage} />
                <KV label="Employees" value={app.numberOfEmployees?.toLocaleString()} />
                <KV label="Annual Revenue" value={app.annualRevenue ? `₹${Number(app.annualRevenue).toLocaleString('en-IN')}` : null} />
                <KV label="Yearly Growth" value={app.yearlyGrowth ? `${app.yearlyGrowth}%` : null} />
                <KV label="Requested" value={app.requestedAmountInr ? `₹${Number(app.requestedAmountInr).toLocaleString('en-IN')}` : null} />
                <KV label="CMR Rank" value={app.cmrRank !== null ? `${app.cmrRank}/10` : null} />
              </div>
            </Card>

            <Card className="p-6 space-y-3 lg:col-span-2">
              <h2 className="text-base font-bold">Pipeline Metadata</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <KV label="Pipeline Status" value={<PipelineStatusBadge status={app.pipelineStatus} />} />
                <KV label="Qualitative Gate" value={app.qualitativeGateDone ? '✅ Done' : '⏳ Pending'} />
                <KV label="Field Notes" value={`${app.qualitativeNotesCount} submitted`} />
                <KV label="Created" value={new Date(app.createdAt).toLocaleDateString('en-IN')} />
              </div>
            </Card>
          </div>
        )}

        {/* Tab: CAM Output */}
        {activeTab === 'cam' && (
          app.latestCam ? (
            <CamOutputPanel
              cam={app.latestCam}
              appId={app.id}
              requestedAmountInr={app.requestedAmountInr}
            />
          ) : (
            <Card className="p-12 text-center space-y-4">
              <FileBarChart2 className="h-12 w-12 text-gray-300 mx-auto" />
              <h3 className="text-lg font-semibold text-gray-700">No CAM generated yet</h3>
              <p className="text-sm text-muted-foreground">
                Complete the AI pipeline and field qualification to enable CAM generation.
              </p>
            </Card>
          )
        )}

        {/* Tab: SWOT Analysis */}
        {activeTab === 'swot' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900">SWOT Analysis</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  AI-generated strategic assessment based on financial documents, field notes, and research findings.
                </p>
              </div>
              <Button
                onClick={() => void handleGenerateSWOT()}
                disabled={swotLoading}
                className={`gap-2 ${swot ? 'bg-violet-600 hover:bg-violet-700' : 'bg-violet-600 hover:bg-violet-700'} text-white`}
              >
                {swotLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Generating SWOT…</>
                ) : (
                  <><Sparkles className="h-4 w-4" /> {swot ? 'Regenerate SWOT' : 'Generate SWOT Analysis'}</>
                )}
              </Button>
            </div>

            {swot ? (
              <>
                {/* ── Credit Posture Banner ── */}
                {(() => {
                  const internalScore = swot.strengths.length - swot.weaknesses.length;
                  const externalScore = swot.opportunities.length - swot.threats.length;
                  const internalLabel = internalScore > 1 ? 'Favorable' : internalScore < -1 ? 'Concerning' : 'Mixed';
                  const externalLabel = externalScore > 1 ? 'Supportive' : externalScore < -1 ? 'Challenging' : 'Neutral';
                  const internalCls = internalScore > 1 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : internalScore < -1 ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-200 text-amber-800';
                  const externalCls = externalScore > 1 ? 'bg-blue-50 border-blue-200 text-blue-800' : externalScore < -1 ? 'bg-orange-50 border-orange-200 text-orange-800' : 'bg-gray-50 border-gray-200 text-gray-700';
                  const decision = app.latestCam?.decision;
                  const decisionCls = decision === 'APPROVE' ? 'bg-emerald-600' : decision === 'CONDITIONAL_APPROVE' ? 'bg-amber-500' : decision === 'REJECT' ? 'bg-red-600' : 'bg-gray-400';
                  const decisionLabel = decision === 'APPROVE' ? 'Approved' : decision === 'CONDITIONAL_APPROVE' ? 'Conditional' : decision === 'REJECT' ? 'Rejected' : 'Pending';
                  return (
                    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-widest mr-1">
                          <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                          Credit Posture
                        </div>
                        <span className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${internalCls}`}>
                          Internal: <span className="font-bold">{internalLabel}</span>
                          <span className="ml-1 opacity-60">({swot.strengths.length}S / {swot.weaknesses.length}W)</span>
                        </span>
                        <span className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${externalCls}`}>
                          External: <span className="font-bold">{externalLabel}</span>
                          <span className="ml-1 opacity-60">({swot.opportunities.length}O / {swot.threats.length}T)</span>
                        </span>
                        {decision && (
                          <span className={`ml-auto rounded-full px-3 py-1 text-xs font-bold text-white ${decisionCls}`}>
                            {decisionLabel}
                          </span>
                        )}
                      </div>
                      {/* Evidence balance bar */}
                      <div className="mt-3 flex rounded-full overflow-hidden h-2">
                        {swot.strengths.length > 0 && <div className="bg-emerald-400" style={{ flex: swot.strengths.length }} />}
                        {swot.weaknesses.length > 0 && <div className="bg-red-400" style={{ flex: swot.weaknesses.length }} />}
                        {swot.opportunities.length > 0 && <div className="bg-blue-400" style={{ flex: swot.opportunities.length }} />}
                        {swot.threats.length > 0 && <div className="bg-amber-400" style={{ flex: swot.threats.length }} />}
                      </div>
                      <div className="mt-1.5 flex gap-3 text-[10px] text-gray-400">
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />Strengths</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />Weaknesses</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />Opportunities</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />Threats</span>
                        <span className="ml-auto">
                          {swot.generatedAt ? `Generated ${new Date(swot.generatedAt as string).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : 'Recently generated'}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* ── 2×2 SWOT Grid ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {/* Strengths */}
                  <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/60 to-green-50/40 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-emerald-100 bg-emerald-100/50">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 shadow-sm shrink-0">
                        <TrendingUp className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-emerald-900 text-sm uppercase tracking-wide">Strengths</p>
                        <p className="text-xs text-emerald-600">Internal advantages — what works in their favour</p>
                      </div>
                      <span className="shrink-0 text-xs font-bold text-emerald-700 bg-emerald-100 rounded-full px-2.5 py-1 border border-emerald-200">
                        {swot.strengths.length}
                      </span>
                    </div>
                    <ul className="px-4 py-3 space-y-0.5">
                      {swot.strengths.map((item, i) => (
                        <SwotItemRow key={i} text={item} index={i} numCls="bg-emerald-100 text-emerald-700" />
                      ))}
                      {swot.strengths.length === 0 && (
                        <li className="py-6 text-sm text-gray-400 italic text-center">No strengths identified.</li>
                      )}
                    </ul>
                  </div>

                  {/* Weaknesses */}
                  <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50/60 to-rose-50/40 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-red-100 bg-red-100/50">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500 shadow-sm shrink-0">
                        <TrendingDown className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-red-900 text-sm uppercase tracking-wide">Weaknesses</p>
                        <p className="text-xs text-red-600">Internal vulnerabilities — areas of concern</p>
                      </div>
                      <span className="shrink-0 text-xs font-bold text-red-700 bg-red-100 rounded-full px-2.5 py-1 border border-red-200">
                        {swot.weaknesses.length}
                      </span>
                    </div>
                    <ul className="px-4 py-3 space-y-0.5">
                      {swot.weaknesses.map((item, i) => (
                        <SwotItemRow key={i} text={item} index={i} numCls="bg-red-100 text-red-700" />
                      ))}
                      {swot.weaknesses.length === 0 && (
                        <li className="py-6 text-sm text-gray-400 italic text-center">No weaknesses identified.</li>
                      )}
                    </ul>
                  </div>

                  {/* Opportunities */}
                  <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/60 to-sky-50/40 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-blue-100 bg-blue-100/50">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500 shadow-sm shrink-0">
                        <Lightbulb className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-blue-900 text-sm uppercase tracking-wide">Opportunities</p>
                        <p className="text-xs text-blue-600">External growth factors — market tailwinds</p>
                      </div>
                      <span className="shrink-0 text-xs font-bold text-blue-700 bg-blue-100 rounded-full px-2.5 py-1 border border-blue-200">
                        {swot.opportunities.length}
                      </span>
                    </div>
                    <ul className="px-4 py-3 space-y-0.5">
                      {swot.opportunities.map((item, i) => (
                        <SwotItemRow key={i} text={item} index={i} numCls="bg-blue-100 text-blue-700" />
                      ))}
                      {swot.opportunities.length === 0 && (
                        <li className="py-6 text-sm text-gray-400 italic text-center">No opportunities identified.</li>
                      )}
                    </ul>
                  </div>

                  {/* Threats */}
                  <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/60 to-orange-50/40 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-amber-100 bg-amber-100/50">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 shadow-sm shrink-0">
                        <ShieldAlert className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-amber-900 text-sm uppercase tracking-wide">Threats</p>
                        <p className="text-xs text-amber-600">External risks & headwinds — macro pressures</p>
                      </div>
                      <span className="shrink-0 text-xs font-bold text-amber-700 bg-amber-100 rounded-full px-2.5 py-1 border border-amber-200">
                        {swot.threats.length}
                      </span>
                    </div>
                    <ul className="px-4 py-3 space-y-0.5">
                      {swot.threats.map((item, i) => (
                        <SwotItemRow key={i} text={item} index={i} numCls="bg-amber-100 text-amber-700" />
                      ))}
                      {swot.threats.length === 0 && (
                        <li className="py-6 text-sm text-gray-400 italic text-center">No threats identified.</li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* ── Evidence legend ── */}
                <div className="rounded-xl border border-gray-100 bg-gray-50/60 px-5 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Evidence Sources Used</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: 'Bank Statement', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
                      { label: 'GST Returns', cls: 'bg-teal-50 text-teal-700 border-teal-200' },
                      { label: 'ITR / Balance Sheet', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
                      { label: 'CIBIL', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
                      { label: 'Research', cls: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
                      { label: 'Factory Visit', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
                      { label: 'Industry', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
                      { label: 'Court Records', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
                      { label: 'RBI Circular', cls: 'bg-red-50 text-red-700 border-red-200' },
                    ].map((s) => (
                      <span key={s.label} className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-semibold ${s.cls}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-50" />{s.label}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 text-[10px] text-gray-400">Each finding above is tagged with the data source the AI used to derive it — hover any item to review the evidence chain.</p>
                </div>
              </>
            ) : (
              <Card className="p-16 text-center space-y-5">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-violet-50 mx-auto">
                  <Sparkles className="h-8 w-8 text-violet-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-800">No SWOT analysis yet</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Click the button above to generate an AI-powered SWOT analysis drawing from financial documents, field observations, and research findings.
                  </p>
                </div>
                <Button
                  onClick={() => void handleGenerateSWOT()}
                  disabled={swotLoading}
                  className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
                >
                  {swotLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
                  ) : (
                    <><Sparkles className="h-4 w-4" /> Generate SWOT Analysis</>
                  )}
                </Button>
                {swotLoading && (
                  <p className="text-xs text-violet-600 animate-pulse">
                    Analysing financial signals, qualitative notes, and research findings…
                  </p>
                )}
              </Card>
            )}
          </div>
        )}

        {/* Tab: Decision Logic */}
        {activeTab === 'decision' && (
          app.latestCam?.bayesianJson ? (
            <div className="rounded-xl border bg-white shadow-sm p-6">
              <BayesianDecisionPanel
                data={app.latestCam.bayesianJson}
                onAccept={handleAcceptDecision}
                onOverride={handleOverrideDecision}
                onRequestDocs={() => setActiveTab('overview')}
              />
            </div>
          ) : (
            <Card className="p-16 text-center space-y-5">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mx-auto">
                <FileBarChart2 className="h-8 w-8 text-blue-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-800">No decision analysis yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Run the Bayesian evidence engine to get posterior credit scores, rate decomposition,
                  and adversarial bull/bear analysis.
                </p>
              </div>
              {app.pipelineStatus === 'complete' ? (
                <Button
                  onClick={handleGenerateDecision}
                  disabled={actionLoading === 'decision'}
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                >
                  {actionLoading === 'decision' ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
                  ) : (
                    <><Play className="h-4 w-4" /> Generate Decision Analysis</>
                  )}
                </Button>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 inline-block">
                    Complete the AI Pipeline first to enable decision analysis
                  </p>
                  <div>
                    <Button
                      onClick={handleRunPipeline}
                      disabled={!!actionLoading || ['analyzing', 'reconciling', 'generating_cam', 'ingesting'].includes(app.pipelineStatus)}
                      variant="outline"
                      className="gap-2"
                    >
                      {actionLoading === 'pipeline' ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Starting Pipeline…</>
                      ) : (
                        <><Play className="h-4 w-4" /> Run AI Pipeline First</>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )
        )}

        </main>
      </div>
    </DashboardLayout>
  );
}


