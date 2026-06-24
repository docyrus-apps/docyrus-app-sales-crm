'use client'

// @ts-nocheck
/* eslint-disable */
import { type ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface PanelShellProps {
  title: ReactNode
  rightSlot?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}

/**
 * Reusable titled-panel wrapper used by every panel in the designer
 * (toolbox, structure, properties, payload editor, data editor).
 */
export function PanelShell({
  title,
  rightSlot,
  children,
  className,
  bodyClassName,
}: PanelShellProps) {
  return (
    <div className={cn('flex h-full min-h-0 flex-col bg-card', className)}>
      <div className="flex h-8 shrink-0 items-center justify-between gap-2 border-b border-border px-2.5">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </div>
        {rightSlot ? (
          <div className="flex items-center gap-1">{rightSlot}</div>
        ) : null}
      </div>
      <div className={cn('min-h-0 flex-1 overflow-auto', bodyClassName)}>
        {children}
      </div>
    </div>
  )
}
