'use client';

import { useEffect, useState } from 'react';
import { AgentActivityFeed } from '@/components/agent/agent-activity-feed';
import { Card } from '@/components/ui/card';
import { MainNav } from '@/components/layout/main-nav';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Brain, Loader2, ChevronDown } from 'lucide-react';
import type { AppListItem } from '@/components/tables/applications-table';

export default function AnalysisPage() {
  const [apps, setApps] = useState<AppListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>('');

  useEffect(() => {
    fetch('/api/applications?limit=100')
      .then((r) => r.json())
      .then((d: { data: AppListItem[] }) => {
        setApps(d.data);
        const active = d.data.find((a) =>
          ['ingesting', 'analyzing', 'reconciling', 'generating_cam', 'awaiting_qualitative', 'complete'].includes(a.pipelineStatus)
        );
        if (active) setSelectedId(active.id);
        else if (d.data.length > 0) setSelectedId(d.data[0].id);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const selected = apps.find((a) => a.id === selectedId);

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <main className="mx-auto max-w-[1320px] space-y-6 px-6 py-8">
        <PageHeader
          title="AI Analysis Monitor"
          description="Watch the agent pipeline run in real time for any application."
        />

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : apps.length === 0 ? (
          <EmptyState
            icon={<Brain className="h-5 w-5" />}
            title="No applications yet"
            description="Create one and run the pipeline to monitor it here."
          />
        ) : (
          <>
            {/* App selector */}
            <Card className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">Monitor application:</label>
                <div className="relative flex-1 min-w-52">
                  <select
                    value={selectedId}
                    onChange={(e) => setSelectedId(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-input bg-background px-3 py-2 pr-8 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {apps.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.companyName ?? 'Unnamed'} — {a.pipelineStatus.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
                {selected && (
                  <div className="flex gap-4 text-sm">
                    <span className="text-muted-foreground">Industry: <strong className="text-foreground">{selected.industry ?? '—'}</strong></span>
                    <span className="text-muted-foreground">Status: <strong className="text-foreground">{selected.pipelineStatus.replace(/_/g, ' ')}</strong></span>
                  </div>
                )}
              </div>
            </Card>

            {selectedId && <AgentActivityFeed appId={selectedId} />}
          </>
        )}
      </main>
    </div>
  );
}
