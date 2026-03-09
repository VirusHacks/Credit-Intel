'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MainNav } from '@/components/layout/main-nav';
import Link from 'next/link';
import { Plus, Loader2, TrendingUp, CheckCircle2, Clock, XCircle, AlertTriangle } from 'lucide-react';
import type { AppListItem } from '@/components/tables/applications-table';

const PIPELINE_COLORS: Record<string, string> = {
  not_started: 'bg-gray-100 text-gray-700',
  ingesting: 'bg-blue-100 text-blue-700',
  analyzing: 'bg-blue-100 text-blue-700',
  awaiting_qualitative: 'bg-amber-100 text-amber-800',
  reconciling: 'bg-purple-100 text-purple-700',
  generating_cam: 'bg-indigo-100 text-indigo-700',
  complete: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

const PIPELINE_LABELS: Record<string, string> = {
  not_started: 'Not Started',
  ingesting: 'Ingesting',
  analyzing: 'Analyzing',
  awaiting_qualitative: 'Awaiting Field Input',
  reconciling: 'Reconciling',
  generating_cam: 'Generating CAM',
  complete: 'Complete',
  failed: 'Failed',
};

export default function DashboardHome() {
  const [applications, setApplications] = useState<AppListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/applications?limit=100')
      .then((r) => r.json())
      .then((d: { data: AppListItem[] }) => setApplications(d.data))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const total = applications.length;
  const complete = applications.filter((a) => a.pipelineStatus === 'complete').length;
  const inProgress = applications.filter((a) =>
    ['ingesting', 'analyzing', 'reconciling', 'generating_cam'].includes(a.pipelineStatus)
  ).length;
  const awaitingField = applications.filter((a) => a.pipelineStatus === 'awaiting_qualitative').length;
  const failed = applications.filter((a) => a.pipelineStatus === 'failed').length;

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <main className="space-y-8 p-6 sm:p-10">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="mt-2 text-muted-foreground">
              Welcome back! Here&apos;s an overview of your credit applications.
            </p>
          </div>
          <Link href="/applications/new">
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4" />
              New Application
            </Button>
          </Link>
        </div>

        {/* Overview Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {[
                { title: 'Total', value: total, icon: TrendingUp, color: 'bg-blue-50 text-blue-600' },
                { title: 'Complete', value: complete, icon: CheckCircle2, color: 'bg-green-50 text-green-600' },
                { title: 'In Progress', value: inProgress, icon: Clock, color: 'bg-yellow-50 text-yellow-600' },
                { title: 'Awaiting Field', value: awaitingField, icon: AlertTriangle, color: 'bg-amber-50 text-amber-600' },
                { title: 'Failed', value: failed, icon: XCircle, color: 'bg-red-50 text-red-600' },
              ].map(({ title, value, icon: Icon, color }) => (
                <Card key={title} className={`p-6 ${color.split(' ')[0]}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{title}</p>
                      <p className={`mt-2 text-3xl font-bold ${color.split(' ')[1]}`}>{value}</p>
                    </div>
                    <Icon className={`h-8 w-8 ${color.split(' ')[1]} opacity-70`} />
                  </div>
                </Card>
              ))}
            </div>

            {/* Recent Applications */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Recent Applications</h2>
                <Link href="/applications" className="text-sm text-blue-600 hover:underline">View all →</Link>
              </div>
              {applications.length === 0 ? (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground">No applications yet.</p>
                  <Link href="/applications/new">
                    <Button className="mt-4 bg-blue-600 hover:bg-blue-700">Create First Application</Button>
                  </Link>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {applications.slice(0, 6).map((app) => (
                    <Card key={app.id} className="p-6 shadow-sm transition-all hover:shadow-md">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{app.companyName ?? '—'}</h3>
                          <p className="text-sm text-muted-foreground">{app.industry ?? 'Unknown industry'}</p>
                        </div>
                        <span className={`ml-2 flex-shrink-0 rounded-full px-2 py-1 text-xs font-medium ${PIPELINE_COLORS[app.pipelineStatus] ?? 'bg-gray-100 text-gray-700'}`}>
                          {PIPELINE_LABELS[app.pipelineStatus] ?? app.pipelineStatus}
                        </span>
                      </div>
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">CMR Rank</span>
                          <span className={`font-semibold ${app.cmrRank !== null ? (app.cmrRank <= 4 ? 'text-green-700' : app.cmrRank <= 6 ? 'text-amber-700' : 'text-red-700') : 'text-gray-500'}`}>
                            {app.cmrRank !== null ? `${app.cmrRank}/10` : '—'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Requested</span>
                          <span className="font-semibold">
                            {app.requestedAmountInr ? `₹${Number(app.requestedAmountInr).toLocaleString('en-IN')}` : '—'}
                          </span>
                        </div>
                      </div>
                      <Link href={`/applications/${app.id}`}>
                        <Button variant="outline" className="mt-4 w-full" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </Card>
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


