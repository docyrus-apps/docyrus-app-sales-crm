import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  icon?: LucideIcon
  center?: ReactNode
  actions?: ReactNode
  className?: string
}

/**
 * Standard page header with title and action buttons
 * Styled with sidebar background color and compact layout matching the design
 */
export function PageHeader({
  title,
  icon: Icon,
  center,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'sticky top-0 z-10 h-12 border-b flex items-center justify-between px-4 bg-sidebar shrink-0',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-5 w-5 text-primary" />}
        <h1 className="text-sm font-bold">{title}</h1>
        {center}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
