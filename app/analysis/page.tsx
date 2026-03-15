'use client';

import { useEffect, useState } from 'react';
import { AgentActivityFeed } from '@/components/agent/agent-activity-feed';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
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
    <DashboardLayout>
      <div className="flex flex-col">
        <h1 className="sticky top-0 z-[10] flex items-center justify-between border-b border-white/10 bg-black/40 px-6 py-5 text-4xl font-medium backdrop-blur-2xl">
          AI Analysis Monitor
        </h1>

        <div className="relative flex flex-col gap-6 p-6">
          <p className="text-sm text-white/40">Watch the agent pipeline run in real time for any application.</p>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex items-center gap-2 text-sm text-white/60">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </div>
            </div>
          ) : apps.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl py-20 shadow-2xl">
              <Brain className="h-8 w-8 text-white/20" />
              <div className="text-center">
                <p className="text-sm font-medium text-white/60">No applications yet</p>
                <p className="mt-1 text-xs text-white/30">Create one and run the pipeline to monitor it here.</p>
              </div>
            </div>
          ) : (
            <>
              {/* App selector */}
              <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 shadow-2xl">
                <div className="flex flex-wrap items-center gap-4">
                  <label className="text-sm font-medium text-white/40 whitespace-nowrap">Monitor application:</label>
                  <div className="relative flex-1 min-w-52">
                    <select
                      value={selectedId}
                      onChange={(e) => setSelectedId(e.target.value)}
                      className="w-full appearance-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 pr-8 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                    >
                      {apps.map((a) => (
                        <option key={a.id} value={a.id} className="bg-[#111111]">
                          {a.companyName ?? 'Unnamed'} — {a.pipelineStatus.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-white/40" />
                  </div>
                  {selected && (
                    <div className="flex gap-4 text-sm">
                      <span className="text-white/40">Industry: <strong className="text-white font-medium">{selected.industry ?? '—'}</strong></span>
                      <span className="text-white/40">Status: <strong className="text-white font-medium">{selected.pipelineStatus.replace(/_/g, ' ')}</strong></span>
                    </div>
                  )}
                </div>
              </div>

              {selectedId && <AgentActivityFeed appId={selectedId} />}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
