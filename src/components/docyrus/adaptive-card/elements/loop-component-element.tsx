'use client'

// @ts-nocheck
/* eslint-disable */
import { ExternalLink } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { type AdaptiveCardLoopComponent } from '../adaptive-card-types'

/*
 * Microsoft Loop components are live collaborative widgets hosted by the
 * Loop platform. Rendering them inline would require an authenticated iframe
 * + cross-origin handshake we don't have here — we surface a placeholder
 * card with the component URL so the payload round-trips losslessly and the
 * user can open the live experience in a new tab.
 */
export function LoopComponentElement({
  element,
}: {
  element: AdaptiveCardLoopComponent
}) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-dashed border-border bg-muted/30 p-3">
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <ExternalLink className="size-4" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-sm font-semibold text-foreground">
          Microsoft Loop component
        </span>
        <span className="break-all text-xs text-muted-foreground">
          {element.componentUrl}
        </span>
        <Button
          asChild
          type="button"
          size="sm"
          variant="outline"
          className="mt-1 w-fit"
        >
          <a
            href={element.componentUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open in Loop
          </a>
        </Button>
      </div>
    </div>
  )
}
