'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { MainNav } from '@/components/layout/main-nav';
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
  const variants: Record<string, { icon: React.ReactNode; cls: string }> = {
    not_started: { icon: <Clock className="h-3 w-3" />, cls: 'bg-gray-100 text-gray-700' },
    ingesting: { icon: <Loader2 className="h-3 w-3 animate-spin" />, cls: 'bg-blue-100 text-blue-700' },
    analyzing: { icon: <Loader2 className="h-3 w-3 animate-spin" />, cls: 'bg-blue-100 text-blue-700' },
    awaiting_qualitative: { icon: <AlertTriangle className="h-3 w-3" />, cls: 'bg-amber-100 text-amber-800' },
    reconciling: { icon: <Loader2 className="h-3 w-3 animate-spin" />, cls: 'bg-purple-100 text-purple-700' },
    generating_cam: { icon: <Loader2 className="h-3 w-3 animate-spin" />, cls: 'bg-indigo-100 text-indigo-700' },
    complete: { icon: <CheckCircle2 className="h-3 w-3" />, cls: 'bg-green-100 text-green-700' },
    failed: { icon: <XCircle className="h-3 w-3" />, cls: 'bg-red-100 text-red-700' },
  };
  const variant = variants[status] ?? variants.not_started;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${variant.cls}`}>
      {variant.icon}
      {PIPELINE_LABELS[status] ?? status}
    </span>
  );
}

function RatingBadge({ rating }: { rating: string | null }) {
  if (!rating) return <span className="text-gray-400 text-xs">—</span>;
  const cls =
    rating === 'Strong' ? 'bg-green-100 text-green-800' :
      rating === 'Adequate' ? 'bg-blue-100 text-blue-800' :
        rating === 'Weak' ? 'bg-amber-100 text-amber-800' :
          'bg-red-100 text-red-800';
  return <span className={`rounded px-2 py-0.5 text-xs font-semibold ${cls}`}>{rating}</span>;
}

function ScoreBar({ score }: { score: number | null }) {
  if (score === null) return <div className="h-1.5 w-full rounded bg-gray-200" />;
  const color = score >= 70 ? 'bg-green-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="h-1.5 w-full rounded bg-gray-200">
      <div className={`h-1.5 rounded ${color}`} style={{ width: `${score}%` }} />
    </div>
  );
}

function DecisionBadge({ decision }: { decision: string }) {
  const cls =
    decision === 'APPROVE' ? 'bg-green-600' :
      decision === 'CONDITIONAL_APPROVE' ? 'bg-amber-500' :
        'bg-red-600';
  return (
    <span className={`inline-block rounded px-3 py-1 text-sm font-bold text-white ${cls}`}>
      {decision.replace('_', ' ')}
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
      <div className="min-h-screen bg-background">
        <MainNav />
        <main className="flex items-center justify-center p-20">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading application…</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="min-h-screen bg-background">
        <MainNav />
        <main className="flex items-center justify-center p-20">
          <div className="text-center space-y-4">
            <XCircle className="h-12 w-12 text-destructive mx-auto" />
            <h1 className="text-2xl font-bold">{error ?? 'Application not found'}</h1>
            <Link href="/applications">
              <Button>Back to Applications</Button>
            </Link>
          </div>
        </main>
      </div>
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
    <div className="min-h-screen bg-background">
      <MainNav />
      <main className="mx-auto max-w-[1320px] space-y-6 px-6 py-8">

        {/* ── Page Header ── */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {/* Top: company identity + actions */}
          <div className="px-6 py-5 flex items-start gap-4 flex-wrap">
            <Link
              href="/applications"
              className="shrink-0 mt-1 flex items-center justify-center h-8 w-8 rounded-lg border border-gray-200 text-gray-400 hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${getAvatarGradient(app.companyName)} flex items-center justify-center shrink-0 shadow-md`}>
              <span className="text-xl font-extrabold text-white">{getInitials(app.companyName)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">{app.companyName ?? 'Unnamed Company'}</h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <PipelineStatusBadge status={app.pipelineStatus} />
                {app.cin && (
                  <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">CIN: {app.cin}</span>
                )}
                {app.gstin && (
                  <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">GSTIN: {app.gstin}</span>
                )}
                {app.industry && (
                  <span className="rounded-md bg-blue-50 border border-blue-100 px-2 py-0.5 text-xs font-medium text-blue-600">{app.industry}</span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 items-center shrink-0">
              <Button onClick={() => void handleRunPipeline()} disabled={actionLoading !== null} className="gap-2">
                {actionLoading === 'pipeline' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {['analyzing', 'reconciling', 'generating_cam'].includes(app.pipelineStatus) ? 'Pipeline Running…' : 'Run AI Pipeline'}
              </Button>
              {showQualifyButton && (
                <Link href={`/applications/${app.id}/qualify`}>
                  <Button variant="outline" className="gap-2 border-amber-400 text-amber-700 hover:bg-amber-50">
                    <FileCheck2 className="h-4 w-4" />
                    Add Field Notes
                  </Button>
                </Link>
              )}
              {showCAMButton && (
                <Button onClick={() => void handleGenerateCAM()} disabled={actionLoading !== null}
                  className="gap-2 bg-violet-600 hover:bg-violet-700 text-white">
                  {actionLoading === 'cam' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileBarChart2 className="h-4 w-4" />}
                  Generate Report
                </Button>
              )}
              {app.pipelineStatus === 'complete' && app.latestCam?.pdfBlobUrl && (
                <a href={`/api/cam/download/${app.id}`} target="_blank" rel="noreferrer">
                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Download PDF
                  </Button>
                </a>
              )}
              <Button variant="ghost" size="icon" onClick={() => void fetchApp()} title="Refresh" className="text-gray-400 hover:text-gray-600">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {/* Workflow Stepper */}
          <div className="border-t border-gray-100 bg-gray-50/60 px-6 py-4">
            <WorkflowStepper status={app.pipelineStatus} />
          </div>
        </div>

        {/* Summary strip */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Loan Requested</p>
              <div className="rounded-lg bg-emerald-50 p-1.5"><TrendingUp className="h-3.5 w-3.5 text-emerald-600" /></div>
            </div>
            <p className="text-2xl font-extrabold text-gray-900">
              {app.requestedAmountInr ? `₹${Number(app.requestedAmountInr).toLocaleString('en-IN')}` : '—'}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Industry</p>
              <div className="rounded-lg bg-blue-50 p-1.5"><Building2 className="h-3.5 w-3.5 text-blue-600" /></div>
            </div>
            <p className="text-sm font-bold text-gray-900 leading-snug">{app.industry ?? '—'}</p>
            {app.subIndustry && <p className="text-xs text-gray-400 mt-0.5">{app.subIndustry}</p>}
          </div>
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">CMR Rank</p>
              <div className="rounded-lg bg-purple-50 p-1.5"><BarChart2 className="h-3.5 w-3.5 text-purple-600" /></div>
            </div>
            {app.cmrRank !== null ? (
              <div className="flex items-baseline gap-1.5">
                <span className={`text-2xl font-extrabold ${app.cmrRank <= 4 ? 'text-emerald-600' : app.cmrRank <= 6 ? 'text-amber-600' : 'text-red-600'}`}>{app.cmrRank}</span>
                <span className="text-xs text-gray-400">/10</span>
                <span className={`text-[11px] font-semibold ml-0.5 ${app.cmrRank <= 4 ? 'text-emerald-600' : app.cmrRank <= 6 ? 'text-amber-600' : 'text-red-600'}`}>
                  · {app.cmrRank <= 4 ? 'Low Risk' : app.cmrRank <= 6 ? 'Medium Risk' : 'High Risk'}
                </span>
              </div>
            ) : <p className="text-2xl font-extrabold text-gray-200">—</p>}
          </div>
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Pipeline Progress</p>
              <div className="rounded-lg bg-indigo-50 p-1.5"><Activity className="h-3.5 w-3.5 text-indigo-600" /></div>
            </div>
            <p className="text-2xl font-extrabold text-gray-900 mb-2">{app.analysisProgress ?? 0}%</p>
            <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
              <div className="h-2 rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-700"
                style={{ width: `${app.analysisProgress ?? 0}%` }} />
            </div>
          </div>
        </div>

        {/* Field qualify banner */}
        {showQualifyButton && (
          <div className="flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-amber-800 text-sm">Field qualification required</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Automated analysis complete. A credit officer must submit field observations, or skip to proceed directly to CAM generation.
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => void handleSkipQualify()}
                disabled={actionLoading !== null}
                className="gap-1.5 border-amber-400 text-amber-700 hover:bg-amber-100">
                {actionLoading === 'skip' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                Skip &amp; Continue
              </Button>
              <Link href={`/applications/${app.id}/qualify`}>
                <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5">
                  <FileCheck2 className="h-3.5 w-3.5" />
                  Start Field Input
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-gray-100/40 p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all whitespace-nowrap ${isActive
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white/60'
                  }`}
              >
                <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
                {tab.label}
                {tab.id === 'cam' && app.latestCam && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${app.latestCam.decision === 'APPROVE'
                    ? 'bg-emerald-100 text-emerald-700'
                    : app.latestCam.decision === 'CONDITIONAL_APPROVE'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'
                    }`}>
                    {app.latestCam.decision === 'APPROVE' ? 'Approved' : app.latestCam.decision === 'CONDITIONAL_APPROVE' ? 'Conditional' : 'Rejected'}
                  </span>
                )}
                {tab.id === 'swot' && swot && (
                  <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold bg-violet-100 text-violet-700">Ready</span>
                )}
                {tab.id === 'pipeline' && ['ingesting', 'analyzing', 'reconciling', 'generating_cam'].includes(app.pipelineStatus) && (
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab: AI Pipeline */}
        {activeTab === 'pipeline' && <AgentActivityFeed appId={appId} pipelineStatus={app.pipelineStatus} />}

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
                {/* 2×2 SWOT Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Strengths */}
                  <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-emerald-200 bg-emerald-100/60">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 shadow-sm">
                        <TrendingUp className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-emerald-900 text-sm uppercase tracking-wide">Strengths</p>
                        <p className="text-xs text-emerald-600">Internal advantages</p>
                      </div>
                      <span className="ml-auto text-xs font-bold text-emerald-700 bg-emerald-100 rounded-full px-2.5 py-1 border border-emerald-200">
                        {swot.strengths.length}
                      </span>
                    </div>
                    <ul className="p-5 space-y-3">
                      {swot.strengths.map((item, i) => (
                        <li key={i} className="flex gap-3">
                          <ChevronRight className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                          <span className="text-sm text-gray-700 leading-relaxed">{item}</span>
                        </li>
                      ))}
                      {swot.strengths.length === 0 && (
                        <li className="text-sm text-gray-400 italic">No strengths identified.</li>
                      )}
                    </ul>
                  </div>

                  {/* Weaknesses */}
                  <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-rose-50 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-red-200 bg-red-100/60">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500 shadow-sm">
                        <TrendingDown className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-red-900 text-sm uppercase tracking-wide">Weaknesses</p>
                        <p className="text-xs text-red-600">Internal vulnerabilities</p>
                      </div>
                      <span className="ml-auto text-xs font-bold text-red-700 bg-red-100 rounded-full px-2.5 py-1 border border-red-200">
                        {swot.weaknesses.length}
                      </span>
                    </div>
                    <ul className="p-5 space-y-3">
                      {swot.weaknesses.map((item, i) => (
                        <li key={i} className="flex gap-3">
                          <ChevronRight className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                          <span className="text-sm text-gray-700 leading-relaxed">{item}</span>
                        </li>
                      ))}
                      {swot.weaknesses.length === 0 && (
                        <li className="text-sm text-gray-400 italic">No weaknesses identified.</li>
                      )}
                    </ul>
                  </div>

                  {/* Opportunities */}
                  <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-sky-50 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-blue-200 bg-blue-100/60">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500 shadow-sm">
                        <Lightbulb className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-blue-900 text-sm uppercase tracking-wide">Opportunities</p>
                        <p className="text-xs text-blue-600">External growth factors</p>
                      </div>
                      <span className="ml-auto text-xs font-bold text-blue-700 bg-blue-100 rounded-full px-2.5 py-1 border border-blue-200">
                        {swot.opportunities.length}
                      </span>
                    </div>
                    <ul className="p-5 space-y-3">
                      {swot.opportunities.map((item, i) => (
                        <li key={i} className="flex gap-3">
                          <ChevronRight className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                          <span className="text-sm text-gray-700 leading-relaxed">{item}</span>
                        </li>
                      ))}
                      {swot.opportunities.length === 0 && (
                        <li className="text-sm text-gray-400 italic">No opportunities identified.</li>
                      )}
                    </ul>
                  </div>

                  {/* Threats */}
                  <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-amber-200 bg-amber-100/60">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 shadow-sm">
                        <ShieldAlert className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-amber-900 text-sm uppercase tracking-wide">Threats</p>
                        <p className="text-xs text-amber-600">External risks & headwinds</p>
                      </div>
                      <span className="ml-auto text-xs font-bold text-amber-700 bg-amber-100 rounded-full px-2.5 py-1 border border-amber-200">
                        {swot.threats.length}
                      </span>
                    </div>
                    <ul className="p-5 space-y-3">
                      {swot.threats.map((item, i) => (
                        <li key={i} className="flex gap-3">
                          <ChevronRight className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                          <span className="text-sm text-gray-700 leading-relaxed">{item}</span>
                        </li>
                      ))}
                      {swot.threats.length === 0 && (
                        <li className="text-sm text-gray-400 italic">No threats identified.</li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Summary scorecard */}
                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5">
                  <div className="flex flex-wrap gap-6 items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Analysis Summary</p>
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold text-emerald-600">{swot.strengths.length} strengths</span>
                        {' · '}
                        <span className="font-semibold text-red-600">{swot.weaknesses.length} weaknesses</span>
                        {' · '}
                        <span className="font-semibold text-blue-600">{swot.opportunities.length} opportunities</span>
                        {' · '}
                        <span className="font-semibold text-amber-600">{swot.threats.length} threats</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                      <span>AI-generated from document analysis · {swot.generatedAt ? new Date(swot.generatedAt as string).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently'}</span>
                    </div>
                  </div>
                  {/* Visual evidence bar */}
                  <div className="mt-4 flex rounded-full overflow-hidden h-2.5">
                    <div className="bg-emerald-400 transition-all" style={{ width: `${(swot.strengths.length / 20) * 100}%` }} />
                    <div className="bg-red-400 transition-all" style={{ width: `${(swot.weaknesses.length / 20) * 100}%` }} />
                    <div className="bg-blue-400 transition-all" style={{ width: `${(swot.opportunities.length / 20) * 100}%` }} />
                    <div className="bg-amber-400 transition-all" style={{ width: `${(swot.threats.length / 20) * 100}%` }} />
                    <div className="bg-gray-100 flex-1" />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-gray-400">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />Strengths</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Weaknesses</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />Opportunities</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Threats</span>
                  </div>
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
  );
}


