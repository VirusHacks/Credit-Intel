'use client';

import { useEffect, useState } from 'react';
import { MainNav } from '@/components/layout/main-nav';
import { ApplicationsTable, AppListItem } from '@/components/tables/applications-table';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Plus, Loader2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const PIPELINE_FILTERS = [
  { value: null, label: 'All' },
  { value: 'not_started', label: 'Not Started' },
  { value: 'analyzing', label: 'Analyzing' },
  { value: 'awaiting_qualitative', label: 'Awaiting Input' },
  { value: 'complete', label: 'Complete' },
  { value: 'failed', label: 'Failed' },
];

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<AppListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [search, setSearch] = useState('');

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
    setApplications((prev) => prev.filter((a) => a.id !== id));
  };

  const filtered = search
    ? applications.filter((a) =>
        (a.companyName ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (a.industry ?? '').toLowerCase().includes(search.toLowerCase()),
      )
    : applications;

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <main className="mx-auto max-w-[1320px] space-y-6 px-6 py-8">
        <PageHeader
          title="Applications"
          description="Manage and review all credit applications."
          actions={
            <Link href="/applications/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Application
              </Button>
            </Link>
          }
        />

        {/* Filters Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1">
            {PIPELINE_FILTERS.map((f) => (
              <button
                key={f.label}
                onClick={() => setStatusFilter(f.value)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                  statusFilter === f.value
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by company or industry..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <ApplicationsTable applications={filtered} onDelete={handleDelete} />
        )}
      </main>
    </div>
  );
}

