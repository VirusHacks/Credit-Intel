'use client';

import { useEffect, useState } from 'react';
import { MainNav } from '@/components/layout/main-nav';
import { ApplicationsTable, AppListItem } from '@/components/tables/applications-table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, Loader2 } from 'lucide-react';

const PIPELINE_FILTERS = [
  { value: null, label: 'All' },
  { value: 'not_started', label: 'Not Started' },
  { value: 'analyzing', label: 'Analyzing' },
  { value: 'awaiting_qualitative', label: 'Awaiting Field Input' },
  { value: 'complete', label: 'Complete' },
  { value: 'failed', label: 'Failed' },
];

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<AppListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const fetchApplications = async (filter: string | null) => {
    setLoading(true);
    try {
      const url = filter ? `/api/applications?status=${filter}&limit=100` : '/api/applications?limit=100';
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json() as { data: AppListItem[] };
        setApplications(json.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchApplications(statusFilter); }, [statusFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this application?')) return;
    // Optimistic remove
    setApplications((prev) => prev.filter((a) => a.id !== id));
  };

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
          {PIPELINE_FILTERS.map((f) => (
            <button key={f.label}
              onClick={() => setStatusFilter(f.value)}
              className={`px-4 py-2 font-medium transition-colors ${statusFilter === f.value
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-muted-foreground hover:text-foreground'
                }`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : (
          <ApplicationsTable applications={applications} onDelete={handleDelete} />
        )}
      </main>
    </div>
  );
}

