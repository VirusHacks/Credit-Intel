'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { MainNav } from '@/components/layout/main-nav';
import { AgentActivityFeed } from '@/components/agent/agent-activity-feed';
import { AnalysisDashboard } from '@/components/analysis/analysis-dashboard';
import { CamOutputPanel } from '@/components/memo/cam-output-panel';
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


  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <MainNav />
        <main className="flex items-center justify-center p-20">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
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
            <XCircle className="h-12 w-12 text-red-500 mx-auto" />
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
    { id: 'analysis', label: 'Analysis Dashboard' },
    { id: 'info', label: 'Application Info' },
    { id: 'cam', label: 'CAM Output' },
    { id: 'pipeline', label: 'AI Pipeline' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNav />
      <main className="mx-auto max-w-7xl space-y-6 p-6 sm:p-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <Link href="/applications" className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline mb-2">
              <ArrowLeft className="h-3.5 w-3.5" />
              Applications
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{app.companyName ?? 'Unnamed Company'}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <PipelineStatusBadge status={app.pipelineStatus} />
              {app.cin && <span className="text-xs text-muted-foreground">CIN: {app.cin}</span>}
              {app.gstin && <span className="text-xs text-muted-foreground">GSTIN: {app.gstin}</span>}
              <span className="text-xs text-muted-foreground">ID: {app.id}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void handleRunPipeline()} disabled={actionLoading !== null}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
              {actionLoading === 'pipeline' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {['analyzing', 'reconciling', 'generating_cam'].includes(app.pipelineStatus) ? 'Pipeline Running…' : 'Run AI Pipeline'}
            </Button>
            {showQualifyButton && (
              <Link href={`/applications/${app.id}/qualify`}>
                <Button variant="outline" className="gap-2 border-amber-500 text-amber-700 hover:bg-amber-50">
                  <FileCheck2 className="h-4 w-4" />
                  Field Qualify
                </Button>
              </Link>
            )}
            {showCAMButton && (
              <Button onClick={() => void handleGenerateCAM()} disabled={actionLoading !== null}
                className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                {actionLoading === 'cam' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileBarChart2 className="h-4 w-4" />}
                Generate CAM
              </Button>
            )}
            {app.pipelineStatus === 'complete' && app.latestCam?.pdfBlobUrl && (
              <a href={`/api/cam/download/${app.id}`} target="_blank" rel="noreferrer">
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Download CAM PDF
                </Button>
              </a>
            )}
            <Button variant="ghost" size="icon" onClick={() => void fetchApp()} title="Refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Summary strip */}
        <Card className="grid gap-4 p-5 sm:grid-cols-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase">Requested</p>
            <p className="mt-1 text-xl font-bold">
              {app.requestedAmountInr ? `₹${Number(app.requestedAmountInr).toLocaleString('en-IN')}` : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase">Industry</p>
            <p className="mt-1 font-semibold text-sm">{app.industry ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase">CMR Rank</p>
            <p className="mt-1 text-xl font-bold">
              {app.cmrRank !== null ? (
                <span className={app.cmrRank <= 4 ? 'text-green-600' : app.cmrRank <= 6 ? 'text-amber-600' : 'text-red-600'}>
                  {app.cmrRank}/10
                </span>
              ) : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase">Progress</p>
            <div className="mt-2 space-y-1">
              <div className="h-2 w-full rounded bg-gray-200">
                <div className="h-2 rounded bg-blue-600 transition-all duration-500"
                  style={{ width: `${app.analysisProgress ?? 0}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">{app.analysisProgress ?? 0}% complete</p>
            </div>
          </div>
        </Card>

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
        <div className="border-b bg-white -mx-6 sm:-mx-8 px-6 sm:px-8">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-muted-foreground hover:text-gray-800'
                  }`}>
                {tab.label}
                {tab.id === 'cam' && app.latestCam && (
                  <span className="ml-1.5 rounded-full bg-green-100 px-1.5 py-0.5 text-xs font-semibold text-green-700">
                    {app.latestCam.decision.replace('_', ' ')}
                  </span>
                )}
              </button>
            ))}
          </div>
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

      </main>
    </div>
  );
}


