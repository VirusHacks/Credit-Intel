import * as React from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps extends React.HTMLAttributes<HTMLElement> {
  title: string
  description?: string
  actions?: React.ReactNode
}

export function PageHeader({ title, description, actions, className, ...props }: PageHeaderProps) {
  return (
    <h1
      className={cn(
        "sticky top-0 z-[10] flex items-center justify-between border-b border-white/10 bg-black/40 px-6 py-5 backdrop-blur-2xl",
        className,
      )}
      {...props}
    >
      <div className="space-y-0.5">
        <span className="block text-4xl font-medium leading-tight text-white">{title}</span>
        {description && (
          <span className="block text-sm text-white/40 font-normal">{description}</span>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </h1>
  )
}
