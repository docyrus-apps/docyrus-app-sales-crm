'use client'

// @ts-nocheck
/* eslint-disable */
import { useMemo } from 'react'

import { useAdaptiveCard } from '@/hooks/docyrus/use-adaptive-card'

import { type AdaptiveCardProps } from './adaptive-card-types'

import { AdaptiveCardView } from './adaptive-card-view'
import { parseAdaptiveCard } from './lib/parse-card'
import { expandTemplate } from './lib/templating'

export function AdaptiveCard({
  payload,
  data,
  onAction,
  hostConfig,
  customElements,
  onChoiceQuery,
  className,
}: AdaptiveCardProps) {
  const expandedPayload = useMemo(() => {
    if (data === undefined) return payload

    return expandTemplate(payload, data)
  }, [payload, data])

  const parsed = useMemo(
    () => parseAdaptiveCard(expandedPayload),
    [expandedPayload],
  )

  const adaptive = useAdaptiveCard(parsed ?? expandedPayload, {
    onAction,
    hostConfig,
    customElements,
    onChoiceQuery,
  })

  if (!parsed) {
    const fallback =
      payload &&
      typeof payload === 'object' &&
      'fallbackText' in payload &&
      typeof (payload as { fallbackText?: string }).fallbackText === 'string'
        ? (payload as { fallbackText: string }).fallbackText
        : 'Invalid Adaptive Card payload.'

    return (
      <div
        role="alert"
        className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
      >
        {fallback}
      </div>
    )
  }

  return (
    <AdaptiveCardView cardProps={adaptive.cardProps} className={className} />
  )
}

export type { AdaptiveCardProps }
