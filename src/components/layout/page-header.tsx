import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: ReactNode
  section?: string
  sectionUrl?: string
  icon?: ReactNode
  titleSuffix?: ReactNode
  actions?: ReactNode
  className?: string
}

export function PageHeader({
  title,
  icon,
  titleSuffix,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
            {icon}
          </span>
        )}
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {titleSuffix && <div className="shrink-0">{titleSuffix}</div>}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {actions}
        </div>
      )}
    </div>
  )
}
