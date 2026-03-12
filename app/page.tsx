'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { MainNav } from '@/components/layout/main-nav';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import Link from 'next/link';
import {
  Plus,
  Loader2,
  FolderOpen,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Sparkles,
  BarChart2,
  FileText,
} from 'lucide-react';
import type { AppListItem } from '@/components/tables/applications-table';

export default function DashboardHome() {
  const [applications, setApplications] = useState<AppListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/applications?limit=100')
      .then((r) => r.json())
      .then((d: { data: AppListItem[] }) => setApplications(d.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const total = applications.length;
  const complete = applications.filter((a) => a.pipelineStatus === 'complete').length;
  const inProgress = applications.filter((a) =>
    ['ingesting', 'analyzing', 'reconciling', 'generating_cam'].includes(a.pipelineStatus),
  ).length;
  const awaitingField = applications.filter((a) => a.pipelineStatus === 'awaiting_qualitative').length;
  const failed = applications.filter((a) => a.pipelineStatus === 'failed').length;

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <main className="mx-auto max-w-[1320px] space-y-8 px-6 py-8">
        {/* Hero Section */}
        <div className="rounded-2xl bg-gradient-to-br from-primary/5 via-primary/[0.02] to-transparent border p-8">
          <PageHeader
            title="Dashboard"
            description="Monitor your credit application pipeline and key metrics at a glance."
            actions={
              <Link href="/applications/new">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Application
                </Button>
              </Link>
            }
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Metrics Row */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                label="Total Applications"
                value={total}
                icon={<FolderOpen className="h-4 w-4" />}
              />
              <MetricCard
                label="Complete"
                value={complete}
                icon={<CheckCircle2 className="h-4 w-4" />}
                subtitle={total > 0 ? `${Math.round((complete / total) * 100)}% completion rate` : undefined}
              />
              <MetricCard
                label="In Progress"
                value={inProgress}
                icon={<Clock className="h-4 w-4" />}
              />
              <MetricCard
                label="Needs Attention"
                value={awaitingField + failed}
                icon={<AlertTriangle className="h-4 w-4" />}
                subtitle={failed > 0 ? `${failed} failed` : undefined}
              />
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: 'New Application', desc: 'Start a credit assessment', icon: Plus, href: '/applications/new' },
                { label: 'AI Analysis', desc: 'View agent insights', icon: Sparkles, href: '/analysis' },
                { label: 'Analytics', desc: 'Portfolio overview', icon: BarChart2, href: '/analytics' },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group flex items-center gap-4 rounded-[14px] border bg-card p-4 transition-colors hover:border-primary/20 hover:bg-primary/[0.02]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <action.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{action.label}</p>
                    <p className="text-xs text-muted-foreground">{action.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>

            {/* Recent Applications */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Recent Applications</h2>
                <Link href="/applications" className="text-sm font-medium text-primary hover:underline">
                  View all <ArrowRight className="inline h-3 w-3" />
                </Link>
              </div>

              {applications.length === 0 ? (
                <EmptyState
                  icon={<FileText className="h-5 w-5" />}
                  title="No applications yet"
                  description="Get started by creating your first credit application."
                  action={
                    <Link href="/applications/new">
                      <Button>Create Application</Button>
                    </Link>
                  }
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {applications.slice(0, 6).map((app) => (
                    <Link
                      key={app.id}
                      href={`/applications/${app.id}`}
                      className="group rounded-[14px] border bg-card p-5 transition-all hover:border-primary/20 hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                            {app.companyName ?? '—'}
                          </h3>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {app.industry ?? 'Unknown industry'}
                          </p>
                        </div>
                        <StatusBadge status={app.pipelineStatus} />
                      </div>

                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">CMR Rank</span>
                          <span
                            className={`font-semibold tabular-nums ${
                              app.cmrRank !== null
                                ? app.cmrRank <= 4
                                  ? 'text-emerald-600'
                                  : app.cmrRank <= 6
                                    ? 'text-amber-600'
                                    : 'text-red-600'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {app.cmrRank !== null ? `${app.cmrRank}/10` : '—'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Requested</span>
                          <span className="font-semibold tabular-nums">
                            {app.requestedAmountInr
                              ? `₹${Number(app.requestedAmountInr).toLocaleString('en-IN')}`
                              : '—'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}


