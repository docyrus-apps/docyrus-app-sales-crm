'use client'

// @ts-nocheck
/* eslint-disable */
import { type ComponentProps, type ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface DataGridSidePanelProps extends ComponentProps<'aside'> {
  /**
   * Optional header rendered above the panel body. Use for a section title,
   * a "+ New" button, or any composite header element. Pass `null` to skip.
   */
  header?: ReactNode
  /**
   * Optional footer rendered below the panel body. Pinned to the bottom by
   * the panel's flex column. Pass `null` to skip.
   */
  footer?: ReactNode
  /**
   * Panel width in Tailwind class form. Default `w-56`.
   */
  width?: string
}

/**
 * Sidebar container for `useDocyrusDataGrid` / `useDataGrid` pages. Today it
 * hosts the vertical-tabs `DataGridViewSelect`; future iterations may add
 * filter lists, group controls, etc. through additional props or children.
 *
 * The component is purely presentational — layout is the consumer's
 * responsibility (typically a `flex` row with the panel followed by the
 * grid).
 */
export function DataGridSidePanel({
  header,
  footer,
  width = 'w-56',
  className,
  children,
  ...props
}: DataGridSidePanelProps) {
  return (
    <aside
      data-slot="data-grid-side-panel"
      className={cn(
        'flex shrink-0 flex-col gap-2 border-e bg-muted/30',
        width,
        className,
      )}
      {...props}
    >
      {header && (
        <div className="shrink-0 border-b px-3 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {header}
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto p-2">{children}</div>
      {footer && <div className="shrink-0 border-t px-3 py-2">{footer}</div>}
    </aside>
  )
}
