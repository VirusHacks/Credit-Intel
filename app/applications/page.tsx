'use client';

import { useState } from 'react';
import { MainNav } from '@/components/layout/main-nav';
import { ApplicationsTable } from '@/components/tables/applications-table';
import { Button } from '@/components/ui/button';
import { mockApplications } from '@/lib/mock-data';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default function ApplicationsPage() {
  const [applications, setApplications] = useState(mockApplications);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const filteredApplications = statusFilter
    ? applications.filter((app) => app.status === statusFilter)
    : applications;

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this application?')) {
      setApplications(applications.filter((app) => app.id !== id));
    }
  };

  const getStatusCounts = () => {
    return {
      all: applications.length,
      approved: applications.filter((app) => app.status === 'approved').length,
      underReview: applications.filter(
        (app) => app.status === 'under_review'
      ).length,
      rejected: applications.filter((app) => app.status === 'rejected').length,
    };
  };

  const counts = getStatusCounts();

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <main className="space-y-8 p-6 sm:p-10">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
            <p className="mt-2 text-muted-foreground">
              Manage and review all credit applications.
            </p>
          </div>
          <Link href="/applications/new">
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4" />
              New Application
            </Button>
          </Link>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2 border-b">
          <button
            onClick={() => setStatusFilter(null)}
            className={`px-4 py-2 font-medium transition-colors ${
              statusFilter === null
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All ({counts.all})
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-4 py-2 font-medium transition-colors ${
              statusFilter === 'approved'
                ? 'border-b-2 border-green-600 text-green-600'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Approved ({counts.approved})
          </button>
          <button
            onClick={() => setStatusFilter('under_review')}
            className={`px-4 py-2 font-medium transition-colors ${
              statusFilter === 'under_review'
                ? 'border-b-2 border-yellow-600 text-yellow-600'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Under Review ({counts.underReview})
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-4 py-2 font-medium transition-colors ${
              statusFilter === 'rejected'
                ? 'border-b-2 border-red-600 text-red-600'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Rejected ({counts.rejected})
          </button>
        </div>

        {/* Table */}
        <ApplicationsTable
          applications={filteredApplications}
          onDelete={handleDelete}
        />
      </main>
    </div>
  );
}
