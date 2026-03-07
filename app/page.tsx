'use client';

import { Button } from '@/components/ui/button';
import { MainNav } from '@/components/layout/main-nav';
import { OverviewCards } from '@/components/dashboard/overview-cards';
import { MetricsChart } from '@/components/dashboard/metrics-chart';
import { mockApplications } from '@/lib/mock-data';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default function DashboardHome() {
  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <main className="space-y-8 p-6 sm:p-10">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="mt-2 text-muted-foreground">
              Welcome back! Here's an overview of your credit applications.
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
        <OverviewCards applications={mockApplications} />

        {/* Charts */}
        <MetricsChart applications={mockApplications} />

        {/* Recent Applications */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Recent Applications</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mockApplications.slice(0, 3).map((app) => (
              <div
                key={app.id}
                className="rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{app.company.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {app.businessDetails.industry}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      app.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : app.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : app.status === 'under_review'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {app.status
                      .split('_')
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ')}
                  </span>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Credit Score</span>
                    <span className="font-semibold">
                      {app.creditAssessment.creditScore}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Requested</span>
                    <span className="font-semibold">
                      ${(app.requestedAmount / 1000000).toFixed(1)}M
                    </span>
                  </div>
                </div>
                <Link href={`/applications/${app.id}`}>
                  <Button
                    variant="outline"
                    className="mt-4 w-full"
                    size="sm"
                  >
                    View Details
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
