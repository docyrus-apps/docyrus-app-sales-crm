'use client'

// @ts-nocheck
/* eslint-disable */
import { Boxes } from 'lucide-react'

import { type AdaptiveCardComponent } from '../adaptive-card-types'

/*
 * Generic `Component` placeholder (AC 1.6). The host is expected to register
 * a real renderer through the `customElements` extension map; this fallback
 * surfaces the component identity and properties so the payload round-trips
 * losslessly even when the host has no matching implementation.
 */
export function ComponentElement({
  element,
}: {
  element: AdaptiveCardComponent
}) {
  const name = element.name ?? element.componentName ?? '(unnamed)'
  const hasProps =
    element.properties && Object.keys(element.properties).length > 0

  return (
    <div className="flex flex-col gap-2 rounded-md border border-dashed border-border bg-muted/30 p-3 text-sm">
      <div className="flex items-center gap-2">
        <Boxes className="size-4 text-muted-foreground" aria-hidden="true" />
        <span className="font-semibold text-foreground">Component</span>
        <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          {name}
        </span>
      </div>
      {element.componentUrl ? (
        <a
          href={element.componentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all text-xs text-primary underline-offset-2 hover:underline"
        >
          {element.componentUrl}
        </a>
      ) : null}
      {hasProps ? (
        <pre className="overflow-x-auto rounded bg-background p-2 font-mono text-[11px] leading-relaxed">
          {JSON.stringify(element.properties, null, 2)}
        </pre>
      ) : null}
    </div>
  )
}
