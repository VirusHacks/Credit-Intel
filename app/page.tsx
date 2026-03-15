"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
import {
  Plus,
  Loader2,
  FileText,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  Inbox,
  RefreshCw,
} from "lucide-react";

/* ────────────────────────────────────────────
   Types matching /api/analytics response
──────────────────────────────────────────── */
interface AnalyticsData {
  portfolio: {
    totalApplications: number;
    completedAnalyses: number;
    approvalRate: number;
    totalRequested: string;
    totalRecommended: string;
  };
  decisions: {
    approved: number;
    conditionalApproved: number;
    rejected: number;
    total: number;
  };
  avgScores: {
    avgCharacter: number | null;
    avgCapacity: number | null;
    avgCapital: number | null;
    avgCollateral: number | null;
    avgConditions: number | null;
    avgOverall: number | null;
  };
  pipelineStatus: Array<{ pipelineStatus: string; count: number }>;
  industryBreakdown: Array<{
    industry: string | null;
    count: number;
    avgAmount: string | null;
  }>;
  fraudStats: { totalFindings: number; fraudSignals: number };
  signalStats: {
    totalSignals: number;
    avgConfidence: number;
    unverifiedCount: number;
  };
  recentApplications: Array<{
    id: string;
    companyName: string | null;
    industry: string | null;
    requestedAmountInr: string | null;
    pipelineStatus: string;
    createdAt: string;
  }>;
}

/* ────────────────────────────────────────────
   Helpers
──────────────────────────────────────────── */
function formatInr(val: string | number | null | undefined): string {
  const n = typeof val === "string" ? parseFloat(val) : val ?? 0;
  if (!n || isNaN(n)) return "—";
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

const PIPELINE_LABELS: Record<string, string> = {
  not_started: "Not Started",
  ingesting: "Ingesting",
  analyzing: "Analyzing",
  awaiting_qualitative: "Awaiting Input",
  reconciling: "Reconciling",
  generating_cam: "Generating CAM",
  complete: "Complete",
  failed: "Failed",
};

const PIPELINE_SYMBOLS: Record<string, string> = {
  not_started: "○",
  ingesting: "◌",
  analyzing: "◌",
  awaiting_qualitative: "⚠",
  reconciling: "◌",
  generating_cam: "◌",
  complete: "✓",
  failed: "✗",
};

const PIPELINE_ORDER = [
  "not_started",
  "ingesting",
  "analyzing",
  "awaiting_qualitative",
  "reconciling",
  "generating_cam",
  "complete",
  "failed",
];

/* ────────────────────────────────────────────
   Sub-components
──────────────────────────────────────────── */
function KpiCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 shadow-2xl">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/30">
          {label}
        </p>
        <span className="text-white/20">{icon}</span>
      </div>
      <p className="text-3xl font-bold tabular-nums text-white">{value}</p>
      {sub && <p className="text-xs text-white/40">{sub}</p>}
    </div>
  );
}

function ScoreBar({ label, score }: { label: string; score: number | null }) {
  const pct = score ?? 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 text-xs text-white/40">{label}</span>
      <div className="relative flex-1 h-1.5 rounded-full bg-white/10">
        <div
          className="absolute left-0 top-0 h-1.5 rounded-full bg-white/70 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 text-right text-xs font-semibold tabular-nums text-white">
        {score !== null ? score : "—"}
      </span>
    </div>
  );
}

/* ────────────────────────────────────────────
   Main Page
──────────────────────────────────────────── */
export default function DashboardHome() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    fetch("/api/analytics")
      .then((r) => r.json() as Promise<AnalyticsData>)
      .then(setData)
      .catch(() => {})
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    load();
  }, []);

  // Build ordered pipeline status map
  const statusMap: Record<string, number> = {};
  (data?.pipelineStatus ?? []).forEach(({ pipelineStatus, count }) => {
    statusMap[pipelineStatus] = count;
  });

  const total = data?.portfolio.totalApplications ?? 0;

  return (
    <DashboardLayout>
      <div className="flex flex-col">
        {/* ── Sticky Glassmorphism Header ── */}
        <h1 className="sticky top-0 z-[10] flex items-center justify-between border-b border-white/10 bg-black/40 px-6 py-5 text-4xl font-medium backdrop-blur-2xl">
          Dashboard
          <div className="flex items-center gap-2">
            <button
              onClick={() => load(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 backdrop-blur-md px-3 py-1.5 text-xs text-white/40 transition-colors hover:bg-white/10 hover:text-white/80 disabled:opacity-40"
            >
              <RefreshCw
                className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
            <Link href="/applications/new">
              <Button className="flex items-center gap-2 bg-white text-black hover:bg-white/90 text-sm font-medium">
                <Plus className="h-4 w-4" />
                New Application
              </Button>
            </Link>
          </div>
        </h1>

        {/* ── Main Content ── */}
        <div className="flex flex-col gap-8 p-6">
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <div className="flex items-center gap-2 text-sm text-white/40">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading dashboard…
              </div>
            </div>
          ) : !data || total === 0 ? (
            <EmptyState
              icon={<FileText className="h-6 w-6" />}
              title="No applications yet"
              description="Get started by creating your first credit application. The dashboard will populate as you add and process applications."
              action={
                <Link href="/applications/new">
                  <Button className="bg-white text-black hover:bg-white/90">
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Application
                  </Button>
                </Link>
              }
            />
          ) : (
            <>
              {/* ══ Section 1: Portfolio KPIs ══ */}
              <section className="flex flex-col gap-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/30">
                  Portfolio Overview
                </p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <KpiCard
                    label="Total Applications"
                    value={total}
                    icon={<Inbox className="h-4 w-4" />}
                    sub={`${data.portfolio.completedAnalyses} completed`}
                  />
                  <KpiCard
                    label="Approval Rate"
                    value={`${data.portfolio.approvalRate}%`}
                    icon={<TrendingUp className="h-4 w-4" />}
                    sub={
                      data.decisions.total > 0
                        ? `${data.decisions.approved} approved · ${data.decisions.conditionalApproved} conditional`
                        : "No decisions yet"
                    }
                  />
                  <KpiCard
                    label="Total Requested"
                    value={formatInr(data.portfolio.totalRequested)}
                    icon={<FileText className="h-4 w-4" />}
                    sub={
                      data.portfolio.totalRecommended !== "0"
                        ? `${formatInr(
                            data.portfolio.totalRecommended
                          )} recommended`
                        : undefined
                    }
                  />
                  <KpiCard
                    label="Avg AI Confidence"
                    value={
                      data.signalStats.avgConfidence > 0
                        ? `${data.signalStats.avgConfidence}%`
                        : "—"
                    }
                    icon={<CheckCircle2 className="h-4 w-4" />}
                    sub={`${data.signalStats.totalSignals} agent signals`}
                  />
                </div>
              </section>

              {/* ══ Section 2: Pipeline Health ══
              <section className="flex flex-col gap-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/30">Pipeline Health</p>
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-8">
                  {PIPELINE_ORDER.map((status) => {
                    const count = statusMap[status] ?? 0;
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                    const isActive = ['ingesting', 'analyzing', 'reconciling', 'generating_cam'].includes(status);
                    const isAlert = status === 'awaiting_qualitative';
                    const isFailed = status === 'failed';
                    const borderCls = isFailed
                      ? 'border-white/30 bg-white/5'
                      : isAlert
                        ? 'border-white/20 bg-white/5'
                        : count > 0
                          ? 'border-white/10 bg-white/5'
                          : 'border-[#222222] bg-[#111111]';
                    return (
                      <div
                        key={status}
                        className={`flex flex-col gap-2 rounded-lg border px-3 py-3 ${borderCls}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs ${isActive ? 'animate-pulse' : ''} ${count === 0 ? 'text-white/20' : 'text-white/60'}`}>
                            {PIPELINE_SYMBOLS[status]}
                          </span>
                          <span className={`text-lg font-bold tabular-nums ${count === 0 ? 'text-white/20' : 'text-white'}`}>
                            {count}
                          </span>
                        </div>
                        <p className={`text-[10px] font-medium leading-tight ${count === 0 ? 'text-white/20' : 'text-white/50'}`}>
                          {PIPELINE_LABELS[status]}
                        </p>
                        <div className="h-0.5 w-full rounded-full bg-white/10">
                          <div
                            className="h-0.5 rounded-full bg-white/50 transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section> */}

              {/* ══ Section 3: Decision Funnel + 5Cs Scores (side by side) ══ */}
              <section className="grid gap-4 lg:grid-cols-2">
                {/* Decision Breakdown */}
                <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 shadow-2xl">
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/30">
                    Decision Breakdown
                  </p>
                  {data.decisions.total === 0 ? (
                    <p className="text-sm text-white/20 py-4 text-center">
                      No decisions recorded yet
                    </p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {[
                        {
                          symbol: "✓",
                          label: "Approved",
                          count: data.decisions.approved,
                          weight: "font-semibold",
                        },
                        {
                          symbol: "→",
                          label: "Conditional",
                          count: data.decisions.conditionalApproved,
                          weight: "font-medium",
                        },
                        {
                          symbol: "✗",
                          label: "Rejected",
                          count: data.decisions.rejected,
                          weight: "font-bold",
                        },
                      ].map(({ symbol, label, count, weight }) => {
                        const pct =
                          data.decisions.total > 0
                            ? Math.round((count / data.decisions.total) * 100)
                            : 0;
                        return (
                          <div key={label} className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between text-sm">
                              <span className={`text-white/70 ${weight}`}>
                                {symbol} {label}
                              </span>
                              <span className="tabular-nums text-white font-semibold">
                                {count}{" "}
                                <span className="text-white/30 font-normal text-xs">
                                  ({pct}%)
                                </span>
                              </span>
                            </div>
                            <div className="h-1 w-full rounded-full bg-white/10">
                              <div
                                className="h-1 rounded-full bg-white/60 transition-all duration-700"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                      <div className="mt-2 border-t border-white/10 pt-3 flex justify-between text-xs text-white/40">
                        <span>Total decisions</span>
                        <span className="font-semibold text-white/70 tabular-nums">
                          {data.decisions.total}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 5Cs Average Scores */}
                <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 shadow-2xl">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-widest text-white/30">
                      Avg 5Cs Scores
                    </p>
                    {data.avgScores.avgOverall !== null && (
                      <span className="text-2xl font-bold tabular-nums text-white">
                        {data.avgScores.avgOverall}
                        <span className="text-sm font-normal text-white/30">
                          /100
                        </span>
                      </span>
                    )}
                  </div>
                  {data.avgScores.avgOverall === null ? (
                    <p className="text-sm text-white/20 py-4 text-center">
                      No CAM analyses completed yet
                    </p>
                  ) : (
                    <div className="flex flex-col gap-3 pt-1">
                      <ScoreBar
                        label="Character"
                        score={data.avgScores.avgCharacter}
                      />
                      <ScoreBar
                        label="Capacity"
                        score={data.avgScores.avgCapacity}
                      />
                      <ScoreBar
                        label="Capital"
                        score={data.avgScores.avgCapital}
                      />
                      <ScoreBar
                        label="Collateral"
                        score={data.avgScores.avgCollateral}
                      />
                      <ScoreBar
                        label="Conditions"
                        score={data.avgScores.avgConditions}
                      />
                    </div>
                  )}
                </div>
              </section>

              {/* ══ Section 4: Recent Applications ══ */}
              <section className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/30">
                    Recent Applications
                  </p>
                  <Link
                    href="/applications"
                    className="flex items-center gap-1 text-xs text-white/40 transition-colors hover:text-white/80"
                  >
                    View all <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                {data.recentApplications.length === 0 ? (
                  <EmptyState
                    icon={<FileText className="h-5 w-5" />}
                    title="No applications yet"
                    description="Create your first credit application to get started."
                    action={
                      <Link href="/applications/new">
                        <Button className="bg-white text-black hover:bg-white/90">
                          Create Application
                        </Button>
                      </Link>
                    }
                  />
                ) : (
                  <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
                    <table className="w-full text-sm">
                      <thead className="border-b border-white/10 bg-black/40">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/30">
                            Company
                          </th>
                          <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/30 sm:table-cell">
                            Industry
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/30">
                            Status
                          </th>
                          <th className="hidden px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white/30 md:table-cell">
                            Requested
                          </th>
                          <th className="hidden px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white/30 lg:table-cell">
                            Date
                          </th>
                          <th className="px-4 py-3" />
                        </tr>
                      </thead>
                      <tbody>
                        {data.recentApplications.map((app) => (
                          <tr
                            key={app.id}
                            className="group border-b border-white/10 last:border-0 hover:bg-white/5"
                          >
                            <td className="px-4 py-3">
                              <span className="font-medium text-white">
                                {app.companyName ?? "—"}
                              </span>
                            </td>
                            <td className="hidden px-4 py-3 text-white/40 sm:table-cell">
                              {app.industry ?? "—"}
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-1.5 text-xs text-white/60">
                                <span>
                                  {PIPELINE_SYMBOLS[app.pipelineStatus] ?? "○"}
                                </span>
                                {PIPELINE_LABELS[app.pipelineStatus] ??
                                  app.pipelineStatus}
                              </span>
                            </td>
                            <td className="hidden px-4 py-3 text-right tabular-nums text-white/60 md:table-cell">
                              {formatInr(app.requestedAmountInr)}
                            </td>
                            <td className="hidden px-4 py-3 text-right text-white/30 lg:table-cell">
                              {new Date(app.createdAt).toLocaleDateString(
                                "en-IN",
                                { day: "numeric", month: "short" }
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Link
                                href={`/applications/${app.id}`}
                                className="text-xs text-white/30 transition-colors group-hover:text-white/70"
                              >
                                View →
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* ══ Section 5: Alerts strip (if any need attention) ══ */}
              {(data.fraudStats.fraudSignals > 0 ||
                statusMap["failed"] > 0 ||
                statusMap["awaiting_qualitative"] > 0) && (
                <section className="flex flex-col gap-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/30">
                    Attention Required
                  </p>
                  <div className="flex flex-col gap-2">
                    {statusMap["awaiting_qualitative"] > 0 && (
                      <Link
                        href="/applications?status=awaiting_qualitative"
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl px-4 py-3 transition-colors hover:bg-white/10"
                      >
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="h-4 w-4 text-white/60 shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {statusMap["awaiting_qualitative"]}{" "}
                              {statusMap["awaiting_qualitative"] === 1
                                ? "application"
                                : "applications"}{" "}
                              awaiting field qualification
                            </p>
                            <p className="text-xs text-white/40">
                              A credit officer needs to submit field
                              observations
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-white/30" />
                      </Link>
                    )}
                    {statusMap["failed"] > 0 && (
                      <Link
                        href="/applications?status=failed"
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl px-4 py-3 transition-colors hover:bg-white/10"
                      >
                        <div className="flex items-center gap-3">
                          <XCircle className="h-4 w-4 text-white/60 shrink-0" />
                          <div>
                            <p className="text-sm font-bold text-white">
                              {statusMap["failed"]} pipeline{" "}
                              {statusMap["failed"] === 1
                                ? "failure"
                                : "failures"}{" "}
                              detected
                            </p>
                            <p className="text-xs text-white/40">
                              Re-run the AI pipeline to attempt recovery
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-white/30" />
                      </Link>
                    )}
                    {data.fraudStats.fraudSignals > 0 && (
                      <Link
                        href="/audit"
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl px-4 py-3 transition-colors hover:bg-white/10"
                      >
                        <div className="flex items-center gap-3">
                          <Clock className="h-4 w-4 text-white/60 shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {data.fraudStats.fraudSignals} fraud{" "}
                              {data.fraudStats.fraudSignals === 1
                                ? "signal"
                                : "signals"}{" "}
                              flagged
                            </p>
                            <p className="text-xs text-white/40">
                              Review in the Audit log
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-white/30" />
                      </Link>
                    )}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
