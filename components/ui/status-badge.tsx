import * as React from "react"
import { cn } from "@/lib/utils"
import type { PipelineStatus, ApplicationStatus, StageStatus } from "@/lib/types"

type StatusType = PipelineStatus | ApplicationStatus | StageStatus

// Monochromatic status config — no colors, only opacity/weight contrast
const statusConfig: Record<string, { label: string; symbol: string; weight: string; opacity: string }> = {
  // Pipeline statuses
  not_started:          { label: "Not Started",    symbol: "○", weight: "font-normal",   opacity: "text-white/40" },
  ingesting:            { label: "Ingesting",       symbol: "◌", weight: "font-medium",   opacity: "text-white/60" },
  analyzing:            { label: "Analyzing",       symbol: "◌", weight: "font-medium",   opacity: "text-white/60" },
  awaiting_qualitative: { label: "Awaiting Input",  symbol: "⚠", weight: "font-semibold", opacity: "text-white/80" },
  reconciling:          { label: "Reconciling",     symbol: "◌", weight: "font-medium",   opacity: "text-white/60" },
  generating_cam:       { label: "Generating CAM",  symbol: "◌", weight: "font-medium",   opacity: "text-white/60" },
  complete:             { label: "Complete",         symbol: "✓", weight: "font-semibold", opacity: "text-white"     },
  failed:               { label: "Failed",           symbol: "✗", weight: "font-bold",     opacity: "text-white"     },
  // Application statuses
  draft:                { label: "Draft",            symbol: "○", weight: "font-normal",   opacity: "text-white/40" },
  submitted:            { label: "Submitted",        symbol: "→", weight: "font-medium",   opacity: "text-white/60" },
  under_review:         { label: "Under Review",     symbol: "⚠", weight: "font-semibold", opacity: "text-white/80" },
  approved:             { label: "Approved",          symbol: "✓", weight: "font-semibold", opacity: "text-white"     },
  rejected:             { label: "Rejected",          symbol: "✗", weight: "font-bold",     opacity: "text-white"     },
  // Stage statuses
  pending:              { label: "Pending",           symbol: "○", weight: "font-normal",   opacity: "text-white/40" },
  processing:           { label: "Processing",        symbol: "◌", weight: "font-medium",   opacity: "text-white/60" },
  done:                 { label: "Done",               symbol: "✓", weight: "font-semibold", opacity: "text-white"     },
}

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: StatusType
  label?: string
}

export function StatusBadge({ status, label, className, ...props }: StatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status, symbol: "○", weight: "font-normal", opacity: "text-white/40" }
  const isActive = ["ingesting","analyzing","reconciling","generating_cam","processing"].includes(status)

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs",
        config.weight,
        config.opacity,
        className,
      )}
      {...props}
    >
      <span className={cn("text-[10px]", isActive && "animate-pulse")}>
        {config.symbol}
      </span>
      {label ?? config.label}
    </span>
  )
}
