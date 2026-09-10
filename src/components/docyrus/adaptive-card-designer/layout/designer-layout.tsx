'use client'

// @ts-nocheck
/* eslint-disable */
import { type ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface DesignerLayoutProps {
  toolbar: ReactNode
  toolbox: ReactNode
  toolboxOpen: boolean
  canvas: ReactNode
  structure: ReactNode
  properties: ReactNode
  payloadEditor: ReactNode
  dataEditor: ReactNode
  aiAssistantSlot?: ReactNode
  height?: string
  className?: string
}

/**
 * Top-level grid for the designer:
 *
 * ```
 * ┌────────────────────────────────────────────────┐
 * │                  TOOLBAR                       │
 * ├────────┬────────────────────────┬──────────────┤
 * │TOOLBOX │        CANVAS          │  STRUCTURE   │
 * │        │                        │  ────────    │
 * │        │                        │  PROPERTIES  │
 * ├────────┴────────────────────────┴──────────────┤
 * │  PAYLOAD EDITOR     │      DATA EDITOR         │
 * └────────────────────────────────────────────────┘
 * ```
 *
 * The toolbox is an absolute-positioned overlay over the canvas area —
 * the same pattern as the JSONata editor's AI assistant. When collapsed it
 * slides off-screen and a small floating button at the top-left of the
 * canvas remains as the re-open affordance.
 */
export function DesignerLayout({
  toolbar,
  toolbox,
  toolboxOpen,
  canvas,
  structure,
  properties,
  payloadEditor,
  dataEditor,
  aiAssistantSlot,
  height = '70vh',
  className,
}: DesignerLayoutProps) {
  return (
    <div
      className={cn(
        'flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-background',
        className,
      )}
      style={{ height }}
    >
      <div className="flex h-11 shrink-0 items-center border-b border-border bg-card">
        {toolbar}
      </div>

      <div className="relative flex min-h-0 flex-1">
        <div className="relative min-w-0 flex-1">
          {canvas}

          {/*
           * Overlay toolbox — slides in/out via translate. `inert` (not
           * `aria-hidden`) hides the panel from AT and the tab order while
           * also pulling focus out of any descendant when closed. Using
           * aria-hidden alone with a focused descendant trips the Chrome
           * a11y warning. The open/close toggle now lives in the toolbar.
           */}
          <div
            inert={!toolboxOpen}
            className={cn(
              'absolute inset-y-0 left-0 z-10 w-56 border-r border-border bg-card shadow-lg',
              'transition-transform duration-200 ease-out',
              !toolboxOpen && '-translate-x-full',
            )}
          >
            {toolbox}
          </div>
        </div>
        <div className="flex w-80 shrink-0 flex-col border-l border-border">
          <div className="h-1/2 min-h-0 border-b border-border">
            {structure}
          </div>
          <div className="h-1/2 min-h-0">{properties}</div>
        </div>
        {aiAssistantSlot}
      </div>

      <div className="flex h-64 shrink-0 border-t border-border">
        <div className="min-w-0 flex-1 border-r border-border">
          {payloadEditor}
        </div>
        <div className="min-w-0 flex-1">{dataEditor}</div>
      </div>
    </div>
  )
}
