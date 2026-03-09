'use client';

import { useEffect, useState } from 'react';
import { AgentActivityFeed } from '@/components/agent/agent-activity-feed';
import { Card } from '@/components/ui/card';
import { MainNav } from '@/components/layout/main-nav';
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
        // Auto-select the most recently active application
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
    <div className="min-h-screen bg-gray-50">
      <MainNav />
      <main className="mx-auto max-w-6xl space-y-6 p-6 sm:p-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="w-8 h-8 text-blue-600" />
            AI Analysis Monitor
          </h1>
          <p className="text-gray-600 mt-1">
            Watch the agent pipeline run in real time for any application.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : apps.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No applications yet. Create one and run the pipeline to monitor it here.</p>
          </Card>
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
                    className="w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pr-8 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
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
                    <span className="text-muted-foreground">Industry: <strong>{selected.industry ?? '—'}</strong></span>
                    <span className="text-muted-foreground">Progress: <strong>{selected.pipelineStatus.replace(/_/g, ' ')}</strong></span>
                  </div>
                )}
              </div>
            </Card>

            {/* Activity feed */}
            {selectedId && <AgentActivityFeed appId={selectedId} />}
          </>
        )}
      </main>
    </div>
  );
}
