"use client";

import { Button } from "@/components/ui/button";
import { Trash2, ArrowUpRight, Eye } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  not_started: "Not Started",
  ingesting: "Ingesting",
  analyzing: "Analyzing",
  awaiting_qualitative: "Needs Field Input",
  reconciling: "Reconciling",
  generating_cam: "Generating Report",
  complete: "Complete",
  failed: "Failed",
};

const PIPELINE_SYMBOLS: Record<string, string> = {
  not_started: "○",
  ingesting: "◌",
  analyzing: "◌",
  awaiting_qualitative: "⚠",
  reconciling: "◌",
  generating_cam: "◌",
  complete: "✓",
  failed: "✗",
};

const PIPELINE_STYLES: Record<string, string> = {
  not_started: "bg-slate-800/60 border-slate-600/50 text-slate-400 font-normal",
  ingesting: "bg-blue-950/60 border-blue-500/50 text-blue-300 font-medium",
  analyzing: "bg-violet-950/60 border-violet-500/50 text-violet-300 font-medium",
  awaiting_qualitative:
    "bg-amber-950/60 border-amber-500/60 text-amber-300 font-semibold",
  reconciling: "bg-cyan-950/60 border-cyan-500/50 text-cyan-300 font-medium",
  generating_cam: "bg-purple-950/60 border-purple-500/50 text-purple-300 font-medium",
  complete: "bg-emerald-950/60 border-emerald-500/60 text-emerald-300 font-semibold",
  failed: "bg-red-950/60 border-red-500/60 text-red-400 font-bold",
};

export function ApplicationsTable({
  applications,
  onDelete,
}: ApplicationsTableProps) {
  const router = useRouter();
  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-12 text-center shadow-2xl">
        <p className="text-white/40 text-sm">No applications found.</p>
        <Link href="/applications/new">
          <Button className="mt-4 bg-white text-black hover:bg-white/90">
            Create First Application
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
      <table className="w-full text-sm">
        <thead className="border-b border-white/10 bg-black/40">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/30">
              Company
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/30">
              Industry
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/30">
              Pipeline
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white/30">
              CMR Rank
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white/30">
              Requested
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/30">
              Created
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-white/30">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {applications.map((app) => (
            <tr
              key={app.id}
              className="group border-b border-white/10 hover:bg-white/5"
            >
              <td className="px-4 py-3 font-medium text-white">
                {app.companyName ?? "—"}
              </td>
              <td className="px-4 py-3 text-white/40">{app.industry ?? "—"}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-xs ${PIPELINE_STYLES[app.pipelineStatus] ??
                    PIPELINE_STYLES.not_started
                    }`}
                >
                  <span>{PIPELINE_SYMBOLS[app.pipelineStatus] ?? "○"}</span>
                  {PIPELINE_LABELS[app.pipelineStatus] ?? app.pipelineStatus}
                </span>
              </td>
              <td className="px-4 py-4 text-center">
                {app.cmrRank !== null ? (
                  <span className="font-semibold tabular-nums text-white">
                    {app.cmrRank}/10
                  </span>
                ) : (
                  <span className="text-white/30">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-right text-white/60 tabular-nums">
                {app.requestedAmountInr
                  ? `₹${Number(app.requestedAmountInr).toLocaleString("en-IN")}`
                  : "—"}
              </td>
              <td className="px-4 py-3 text-white/40">
                {new Date(app.createdAt).toLocaleDateString("en-IN")}
              </td>
              <td
                className="px-4 py-4 text-center"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  <Link href={`/applications/${app.id}`}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-white/40 hover:bg-white/10 hover:text-white"
                      title="View"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white/30 hover:bg-white/5 hover:text-white/60"
                    onClick={() => onDelete?.(app.id)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
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
