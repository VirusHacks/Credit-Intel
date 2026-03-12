import * as React from "react"
import { cn } from "@/lib/utils"
import type { PipelineStatus, ApplicationStatus, StageStatus } from "@/lib/types"

type StatusType = PipelineStatus | ApplicationStatus | StageStatus

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  // Pipeline statuses
  not_started: { label: "Not Started", color: "bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400", dot: "bg-slate-400" },
  ingesting: { label: "Ingesting", color: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", dot: "bg-blue-500 animate-pulse" },
  analyzing: { label: "Analyzing", color: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", dot: "bg-blue-500 animate-pulse" },
  awaiting_qualitative: { label: "Awaiting Input", color: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", dot: "bg-amber-500" },
  reconciling: { label: "Reconciling", color: "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400", dot: "bg-violet-500 animate-pulse" },
  generating_cam: { label: "Generating CAM", color: "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400", dot: "bg-violet-500 animate-pulse" },
  complete: { label: "Complete", color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", dot: "bg-emerald-500" },
  failed: { label: "Failed", color: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400", dot: "bg-red-500" },
  // Application statuses
  draft: { label: "Draft", color: "bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400", dot: "bg-slate-400" },
  submitted: { label: "Submitted", color: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", dot: "bg-blue-500" },
  under_review: { label: "Under Review", color: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", dot: "bg-amber-500" },
  approved: { label: "Approved", color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", dot: "bg-emerald-500" },
  rejected: { label: "Rejected", color: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400", dot: "bg-red-500" },
  // Stage statuses
  pending: { label: "Pending", color: "bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400", dot: "bg-slate-400" },
  processing: { label: "Processing", color: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", dot: "bg-blue-500 animate-pulse" },
  done: { label: "Done", color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", dot: "bg-emerald-500" },
}

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: StatusType
  label?: string
}

export function StatusBadge({ status, label, className, ...props }: StatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status, color: "bg-slate-50 text-slate-600", dot: "bg-slate-400" }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        config.color,
        className,
      )}
      {...props}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
      {label ?? config.label}
    </span>
  )
}
