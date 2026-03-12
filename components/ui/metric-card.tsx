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
        "rounded-[14px] border bg-card p-5 flex flex-col gap-3",
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold tracking-tight text-foreground">{value}</span>
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-semibold",
              trend.value > 0 && "text-emerald-600",
              trend.value < 0 && "text-red-600",
              trend.value === 0 && "text-muted-foreground",
            )}
          >
            {trend.value > 0 ? <TrendingUp className="h-3 w-3" /> : trend.value < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
            {trend.value > 0 ? "+" : ""}
            {trend.value}%
            {trend.label && <span className="font-normal text-muted-foreground ml-0.5">{trend.label}</span>}
          </span>
        )}
      </div>
      {subtitle && (
        <span className="text-xs text-muted-foreground">{subtitle}</span>
      )}
    </div>
  )
}
