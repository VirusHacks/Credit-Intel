import * as React from "react"
import { cn } from "@/lib/utils"

interface ConfidenceBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  confidence: number // 0-100 or 0-1
}

export function ConfidenceBadge({ confidence, className, ...props }: ConfidenceBadgeProps) {
  // Normalize to 0-100
  const pct = confidence <= 1 ? Math.round(confidence * 100) : Math.round(confidence)

  const color =
    pct >= 85
      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
      : pct >= 70
        ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
        : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
        color,
        className,
      )}
      {...props}
    >
      {pct}%
    </span>
  )
}
