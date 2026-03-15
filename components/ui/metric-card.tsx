import * as React from "react"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: { value: number; label?: string }
  subtitle?: string
}

export function MetricCard({ label, value, icon, trend, subtitle, className, ...props }: MetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 shadow-2xl flex flex-col gap-3",
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-white/40">
          {label}
        </span>
        {icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/60">
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold tracking-tight text-white">{value}</span>
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-semibold",
              trend.value > 0 && "text-white/80",
              trend.value < 0 && "text-white/40",
              trend.value === 0 && "text-white/40",
            )}
          >
            {trend.value > 0 ? <TrendingUp className="h-3 w-3" /> : trend.value < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
            {trend.value > 0 ? "+" : ""}
            {trend.value}%
            {trend.label && <span className="font-normal text-white/40 ml-0.5">{trend.label}</span>}
          </span>
        )}
      </div>
      {subtitle && (
        <span className="text-xs text-white/40">{subtitle}</span>
      )}
    </div>
  )
}
