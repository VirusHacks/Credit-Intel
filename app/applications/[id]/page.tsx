'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { MainNav } from '@/components/layout/main-nav';
import { AgentActivityFeed } from '@/components/agent/agent-activity-feed';
import { AnalysisDashboard } from '@/components/analysis/analysis-dashboard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ArrowLeft,
  Play,
  FileCheck2,
  FileBarChart2,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Send,
  Brain,
  Shield,
  TrendingUp,
  Landmark,
  Building2,
  BarChart3,
  ClipboardList,
  Sparkles,
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
  const [activeTab, setActiveTab] = useState('pipeline');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedDimension, setExpandedDimension] = useState<string | null>(null);
  const [showThinking, setShowThinking] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

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

  const handleChatSend = async () => {
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;
    setChatInput('');
    const updated = [...chatMessages, { role: 'user' as const, content: msg }];
    setChatMessages(updated);
    setChatLoading(true);
    try {
      const res = await fetch(`/api/applications/${appId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history: updated.slice(-10) }),
      });
      if (!res.ok) throw new Error('Chat failed');
      const data = await res.json() as { reply: string };
      setChatMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setChatMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I could not process your question. Please try again.' }]);
    } finally {
      setChatLoading(false);
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
    { id: 'pipeline', label: 'AI Pipeline' },
    { id: 'analysis', label: 'Analysis Dashboard' },
    { id: 'info', label: 'Application Info' },
    { id: 'cam', label: 'CAM Output' },
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
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
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
            <div className="space-y-6">

              {/* ── Decision Summary Card ──────────────────────────────── */}
              <Card className="overflow-hidden">
                <div className={`px-6 py-4 ${app.latestCam.decision === 'APPROVE' ? 'bg-gradient-to-r from-green-600 to-green-500' :
                    app.latestCam.decision === 'CONDITIONAL_APPROVE' ? 'bg-gradient-to-r from-amber-500 to-yellow-500' :
                      'bg-gradient-to-r from-red-600 to-red-500'
                  } text-white`}>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {app.latestCam.decision === 'APPROVE' ? <CheckCircle2 className="h-8 w-8" /> :
                        app.latestCam.decision === 'CONDITIONAL_APPROVE' ? <AlertTriangle className="h-8 w-8" /> :
                          <XCircle className="h-8 w-8" />}
                      <div>
                        <p className="text-sm font-medium opacity-90">Credit Decision</p>
                        <p className="text-2xl font-bold">{app.latestCam.decision.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <a href={`/api/cam/download/${app.id}`} target="_blank" rel="noreferrer">
                      <Button variant="secondary" className="gap-2 bg-white/20 hover:bg-white/30 text-white border-0">
                        <Download className="h-4 w-4" />
                        Download PDF
                      </Button>
                    </a>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100 bg-white">
                  <div className="p-5 text-center">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Recommended Amount</p>
                    <p className="text-xl font-bold mt-1 text-gray-900">
                      {app.latestCam.recommendedAmountInr && Number(app.latestCam.recommendedAmountInr) > 0
                        ? `₹${Number(app.latestCam.recommendedAmountInr).toLocaleString('en-IN')}`
                        : '—'}
                    </p>
                  </div>
                  <div className="p-5 text-center">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Interest Rate</p>
                    <p className="text-xl font-bold mt-1 text-gray-900">
                      {app.latestCam.recommendedRatePercent && Number(app.latestCam.recommendedRatePercent) > 0
                        ? `${app.latestCam.recommendedRatePercent}%`
                        : '—'}
                    </p>
                  </div>
                  <div className="p-5 text-center">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Original Ask</p>
                    <p className="text-xl font-bold mt-1 text-gray-900">
                      {app.requestedAmountInr ? `₹${Number(app.requestedAmountInr).toLocaleString('en-IN')}` : '—'}
                    </p>
                  </div>
                  <div className="p-5 text-center">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Generated</p>
                    <p className="text-sm font-semibold mt-2 text-gray-700">
                      {new Date(app.latestCam.generatedAt).toLocaleString('en-IN', {
                        dateStyle: 'medium', timeStyle: 'short'
                      })}
                    </p>
                  </div>
                </div>
              </Card>

              {/* ── Reduction Rationale ────────────────────────────────── */}
              {app.latestCam.reductionRationale && (
                <Card className="p-5 border-l-4 border-l-amber-400 bg-amber-50/50">
                  <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-800 text-sm">Reduction Rationale</p>
                      <p className="text-sm text-amber-900 mt-1 leading-relaxed">{app.latestCam.reductionRationale}</p>
                    </div>
                  </div>
                </Card>
              )}

              {/* ── Five C's Assessment ────────────────────────────────── */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Five C&apos;s Credit Assessment
                </h2>
                <div className="space-y-3">
                  {([
                    { key: 'character', icon: <Shield className="h-5 w-5" />, label: 'Character', desc: 'Creditworthiness, reputation & repayment history' },
                    { key: 'capacity', icon: <TrendingUp className="h-5 w-5" />, label: 'Capacity', desc: 'Ability to repay from cash flows & income' },
                    { key: 'capital', icon: <Landmark className="h-5 w-5" />, label: 'Capital', desc: 'Net worth, equity & financial reserves' },
                    { key: 'collateral', icon: <Building2 className="h-5 w-5" />, label: 'Collateral', desc: 'Assets pledged as security' },
                    { key: 'conditions', icon: <ClipboardList className="h-5 w-5" />, label: 'Conditions', desc: 'Industry, macro & loan purpose factors' },
                  ] as const).map(({ key, icon, label, desc }) => {
                    const score = app.latestCam![`${key}Score` as keyof typeof app.latestCam] as number | null;
                    const rating = app.latestCam![`${key}Rating` as keyof typeof app.latestCam] as string | null;
                    const explanation = app.latestCam![`${key}Explanation` as keyof typeof app.latestCam] as string | null;
                    const isExpanded = expandedDimension === key;
                    const scoreColor = (score ?? 0) >= 70 ? 'text-green-600' : (score ?? 0) >= 50 ? 'text-amber-600' : 'text-red-600';
                    const barColor = (score ?? 0) >= 70 ? 'bg-green-500' : (score ?? 0) >= 50 ? 'bg-amber-500' : 'bg-red-500';

                    return (
                      <Card key={key}
                        className={`overflow-hidden transition-all cursor-pointer hover:shadow-md ${isExpanded ? 'ring-2 ring-blue-200' : ''}`}
                        onClick={() => setExpandedDimension(isExpanded ? null : key)}>
                        <div className="p-4 sm:p-5">
                          <div className="flex items-center gap-4">
                            <div className={`flex-shrink-0 rounded-lg p-2.5 ${(score ?? 0) >= 70 ? 'bg-green-100 text-green-600' :
                                (score ?? 0) >= 50 ? 'bg-amber-100 text-amber-600' :
                                  'bg-red-100 text-red-600'
                              }`}>
                              {icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <div>
                                  <p className="font-semibold text-gray-900">{label}</p>
                                  <p className="text-xs text-muted-foreground">{desc}</p>
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0">
                                  <div className="text-right">
                                    <p className={`text-2xl font-bold ${scoreColor}`}>{score ?? '—'}<span className="text-sm font-normal text-muted-foreground">/100</span></p>
                                  </div>
                                  <RatingBadge rating={rating} />
                                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                                </div>
                              </div>
                              <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
                                <div className={`h-2 rounded-full ${barColor} transition-all duration-700`} style={{ width: `${score ?? 0}%` }} />
                              </div>
                            </div>
                          </div>

                          {/* Expanded explanation */}
                          {isExpanded && explanation && (
                            <div className="mt-4 pt-4 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                              <div className="flex gap-2 items-start">
                                <Brain className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-sm font-medium text-blue-800 mb-1">AI Analysis</p>
                                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{explanation}</p>
                                </div>
                              </div>
                            </div>
                          )}
                          {isExpanded && !explanation && (
                            <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-muted-foreground italic">
                              No detailed explanation available for this dimension.
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* ── Loan Conditions ────────────────────────────────────── */}
              {app.latestCam.conditions && (app.latestCam.conditions as string[]).length > 0 && (
                <Card className="p-6">
                  <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-indigo-600" />
                    Loan Conditions &amp; Covenants
                  </h2>
                  <ul className="space-y-2">
                    {(app.latestCam.conditions as string[]).map((cond, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm">
                        <span className="flex-shrink-0 mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500" />
                        <span className="text-gray-700">{cond}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* ── AI Thinking Trace (Collapsible) ───────────────────── */}
              {app.latestCam.thinkingTrace && (
                <Card className="overflow-hidden">
                  <button
                    onClick={() => setShowThinking(!showThinking)}
                    className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-purple-600" />
                      <span className="text-base font-bold text-gray-900">AI Reasoning Trace</span>
                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                        {app.latestCam.thinkingTrace.length.toLocaleString()} chars
                      </span>
                    </div>
                    {showThinking ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                  </button>
                  {showThinking && (
                    <div className="border-t bg-gray-50/70 p-5">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-sans max-h-[500px] overflow-y-auto">
                        {app.latestCam.thinkingTrace}
                      </pre>
                    </div>
                  )}
                </Card>
              )}

              {/* ── AI Chat / Ask About Applicant ─────────────────────── */}
              <Card className="overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center gap-3">
                  <div className="rounded-full bg-white/20 p-2">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold">Ask AI About This Applicant</p>
                    <p className="text-xs opacity-80">Ask questions about the credit analysis, risk factors, or financial health</p>
                  </div>
                </div>

                {/* Quick question chips */}
                <div className="px-6 pt-4 flex flex-wrap gap-2">
                  {[
                    'Why was this application rejected?',
                    'What are the biggest risk factors?',
                    'Summarize the financial health',
                    'What would improve the credit score?',
                    'Is the collateral sufficient?',
                  ].map((q) => (
                    <button key={q}
                      onClick={() => { setChatInput(q); }}
                      className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>

                {/* Chat messages */}
                <div className="px-6 py-4 space-y-4 max-h-[400px] overflow-y-auto">
                  {chatMessages.length === 0 && (
                    <div className="text-center py-8">
                      <Sparkles className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Ask a question about this application&apos;s credit assessment</p>
                    </div>
                  )}
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${msg.role === 'user'
                          ? 'bg-blue-600 text-white rounded-br-md'
                          : 'bg-gray-100 text-gray-800 rounded-bl-md'
                        }`}>
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        <span className="text-sm text-muted-foreground">Thinking…</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat input */}
                <div className="border-t px-4 py-3 flex gap-2 bg-white">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleChatSend(); } }}
                    placeholder="Ask about this applicant's creditworthiness…"
                    className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Button onClick={() => void handleChatSend()} disabled={chatLoading || !chatInput.trim()}
                    className="bg-blue-600 hover:bg-blue-700 rounded-lg px-4">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </Card>

            </div>
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


