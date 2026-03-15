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
    { id: 'analysis', label: 'Analysis Dashboard' },
    { id: 'info', label: 'Application Info' },
    { id: 'cam', label: 'CAM Output' },
    { id: 'decision', label: 'Decision Logic' },
    { id: 'pipeline', label: 'AI Pipeline' },
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

        {/* Tab: Decision Logic */}
        {activeTab === 'decision' && (
          app.latestCam?.bayesianJson ? (
            <div className="rounded-xl border bg-white shadow-sm p-6">
              <BayesianDecisionPanel data={app.latestCam.bayesianJson} />
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


