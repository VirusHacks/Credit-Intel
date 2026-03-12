'use client';

import { Button } from '@/components/ui/button';
import { Trash2, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export interface AppListItem {
  id: string;
  companyName: string | null;
  industry: string | null;
  pipelineStatus: string;
  cmrRank: number | null;
  requestedAmountInr: string | null;
  createdAt: string;
}

interface ApplicationsTableProps {
  applications: AppListItem[];
  onDelete?: (id: string) => void;
}

const PIPELINE_LABELS: Record<string, string> = {
  not_started: 'Not Started',
  ingesting: 'Ingesting',
  analyzing: 'Analyzing',
  awaiting_qualitative: 'Needs Field Input',
  reconciling: 'Reconciling',
  generating_cam: 'Generating Report',
  complete: 'Complete',
  failed: 'Failed',
};

const PIPELINE_COLORS: Record<string, string> = {
  not_started: 'bg-gray-100 text-gray-600',
  ingesting: 'bg-blue-100 text-blue-700',
  analyzing: 'bg-blue-100 text-blue-700',
  awaiting_qualitative: 'bg-amber-100 text-amber-800',
  reconciling: 'bg-purple-100 text-purple-700',
  generating_cam: 'bg-indigo-100 text-indigo-700',
  complete: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
};

function StatusDot({ status }: { status: string }) {
  const isActive = ['ingesting', 'analyzing', 'reconciling', 'generating_cam'].includes(status);
  if (status === 'complete') return <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />;
  if (status === 'failed') return <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500" />;
  if (status === 'awaiting_qualitative') return <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />;
  if (isActive) return <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />;
  return <span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-300" />;
}

const AVATAR_COLORS = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-violet-500 to-purple-600',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-sky-600',
];

function getInitials(name: string | null): string {
  if (!name) return '?';
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getAvatarColor(name: string | null): string {
  if (!name) return AVATAR_COLORS[0];
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

export function ApplicationsTable({ applications, onDelete }: ApplicationsTableProps) {
  const router = useRouter();
  if (applications.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-16 text-center space-y-3">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-gray-100 flex items-center justify-center text-2xl">📂</div>
        <p className="text-base font-semibold text-gray-700">No applications found</p>
        <p className="text-sm text-gray-400">Create your first credit application to get started.</p>
        <Link href="/applications/new">
          <Button className="mt-2">Create Application</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50/60">
            <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-gray-400">Company</th>
            <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-gray-400">Industry</th>
            <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-gray-400">Status</th>
            <th className="px-4 py-3.5 text-center text-[11px] font-bold uppercase tracking-widest text-gray-400">CMR</th>
            <th className="px-4 py-3.5 text-right text-[11px] font-bold uppercase tracking-widest text-gray-400">Requested</th>
            <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-gray-400">Date</th>
            <th className="px-4 py-3.5"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {applications.map((app) => (
            <tr
              key={app.id}
              onClick={() => router.push(`/applications/${app.id}`)}
              className="cursor-pointer hover:bg-blue-50/40 transition-colors duration-100 group"
            >
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${getAvatarColor(app.companyName)} flex items-center justify-center shrink-0 shadow-sm`}>
                    <span className="text-xs font-extrabold text-white">{getInitials(app.companyName)}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate max-w-[200px]">{app.companyName ?? '—'}</p>
                    <p className="text-[10px] text-gray-400 font-mono">{app.id.slice(0, 8)}…</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4 text-gray-500 text-sm">{app.industry ?? '—'}</td>
              <td className="px-4 py-4">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${PIPELINE_COLORS[app.pipelineStatus] ?? PIPELINE_COLORS.not_started}`}>
                  <StatusDot status={app.pipelineStatus} />
                  {PIPELINE_LABELS[app.pipelineStatus] ?? app.pipelineStatus}
                </span>
              </td>
              <td className="px-4 py-4 text-center">
                {app.cmrRank !== null ? (
                  <div className="inline-flex flex-col items-center leading-none">
                    <span className={`text-lg font-extrabold ${app.cmrRank <= 4 ? 'text-emerald-600' : app.cmrRank <= 6 ? 'text-amber-600' : 'text-red-600'}`}>{app.cmrRank}</span>
                    <span className="text-[9px] text-gray-300">/10</span>
                  </div>
                ) : <span className="text-gray-300 text-sm">—</span>}
              </td>
              <td className="px-4 py-4 text-right font-semibold text-gray-900 text-sm">
                {app.requestedAmountInr ? `₹${Number(app.requestedAmountInr).toLocaleString('en-IN')}` : '—'}
              </td>
              <td className="px-4 py-4 text-xs text-gray-400">
                {new Date(app.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
              </td>
              <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href={`/applications/${app.id}`}>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-500 hover:bg-blue-50" title="Open">
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-300 hover:text-red-500 hover:bg-red-50"
                    onClick={() => onDelete?.(app.id)} title="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
