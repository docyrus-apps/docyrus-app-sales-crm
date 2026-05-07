'use client'

import { type ReactNode, useState } from 'react'

import { ChevronDown } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface SideFilterSectionProps {
  id: string
  title: ReactNode
  icon?: ReactNode
  activeCount?: number
  defaultCollapsed?: boolean
  onClear?: () => void
  clearLabel?: string
  children: ReactNode
}

export function SideFilterSection({
  id,
  title,
  icon,
  activeCount = 0,
  defaultCollapsed = false,
  onClear,
  clearLabel = 'Clear',
  children,
}: SideFilterSectionProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const hasActive = activeCount > 0

  return (
    <section
      data-side-filter-section={id}
      className="flex flex-col gap-2 border-b border-border/60 py-3 last:border-b-0"
    >
      <header className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-expanded={!collapsed}
          className="group flex flex-1 items-center gap-2 text-left text-sm font-medium"
        >
          {icon && (
            <span className="shrink-0 text-muted-foreground">{icon}</span>
          )}
          <span className="flex-1 truncate">{title}</span>
          {hasActive && (
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-primary">
              {activeCount}
            </span>
          )}
          <ChevronDown
            className={cn(
              'size-4 shrink-0 text-muted-foreground transition-transform',
              collapsed && '-rotate-90',
            )}
          />
        </button>
        {hasActive && onClear && !collapsed && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground"
          >
            {clearLabel}
          </Button>
        )}
      </header>
      {!collapsed && <div className="pt-1">{children}</div>}
    </section>
  )
}
