'use client';

import { Button } from '@/components/ui/button';
import { Eye, Trash2 } from 'lucide-react';
import Link from 'next/link';

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
  awaiting_qualitative: 'Awaiting Field Input',
  reconciling: 'Reconciling',
  generating_cam: 'Generating CAM',
  complete: 'Complete',
  failed: 'Failed',
};

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

export function ApplicationsTable({ applications, onDelete }: ApplicationsTableProps) {
  if (applications.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-12 text-center">
        <p className="text-muted-foreground">No applications found.</p>
        <Link href="/applications/new">
          <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
            Create First Application
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Company</th>
            <th className="px-4 py-3 text-left font-medium">Industry</th>
            <th className="px-4 py-3 text-left font-medium">Pipeline</th>
            <th className="px-4 py-3 text-right font-medium">CMR Rank</th>
            <th className="px-4 py-3 text-right font-medium">Requested</th>
            <th className="px-4 py-3 text-left font-medium">Created</th>
            <th className="px-4 py-3 text-center font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <tr key={app.id} className="border-b hover:bg-muted/50">
              <td className="px-4 py-3 font-medium">{app.companyName ?? '—'}</td>
              <td className="px-4 py-3 text-muted-foreground">{app.industry ?? '—'}</td>
              <td className="px-4 py-3">
                <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${PIPELINE_COLORS[app.pipelineStatus] ?? PIPELINE_COLORS.not_started}`}>
                  {PIPELINE_LABELS[app.pipelineStatus] ?? app.pipelineStatus}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                {app.cmrRank !== null ? (
                  <span className={`font-semibold ${app.cmrRank <= 4 ? 'text-green-700' : app.cmrRank <= 6 ? 'text-amber-700' : 'text-red-700'}`}>
                    {app.cmrRank}/10
                  </span>
                ) : '—'}
              </td>
              <td className="px-4 py-3 text-right">
                {app.requestedAmountInr
                  ? `₹${Number(app.requestedAmountInr).toLocaleString('en-IN')}`
                  : '—'}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {new Date(app.createdAt).toLocaleDateString('en-IN')}
              </td>
              <td className="px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Link href={`/applications/${app.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="View">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" className="h-8 w-8"
                    onClick={() => onDelete?.(app.id)} title="Delete">
                    <Trash2 className="h-4 w-4 text-red-600" />
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
