'use client'

// @ts-nocheck
/* eslint-disable */
import { Layers } from 'lucide-react'

import { cn } from '@/lib/utils'

import { type DocyrusValueProps } from './types'

interface CardLike {
  type?: string
  body?: unknown[]
  actions?: unknown[]
}

export function AdaptiveCardValue({ value, className }: DocyrusValueProps) {
  if (value == null || value === '') {
    return <span className="text-muted-foreground">–</span>
  }

  let card: CardLike | null = null

  if (typeof value === 'object' && !Array.isArray(value)) {
    card = value as CardLike
  } else if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown

      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        card = parsed as CardLike
      }
    } catch {
      /* fall through to invalid-card display */
    }
  }

  if (!card || card.type !== 'AdaptiveCard') {
    return <span className="text-muted-foreground">Invalid card</span>
  }

  const bodyLen = Array.isArray(card.body) ? card.body.length : 0
  const actionsLen = Array.isArray(card.actions) ? card.actions.length : 0

  const parts: string[] = []

  if (bodyLen > 0) parts.push(`${bodyLen} element${bodyLen === 1 ? '' : 's'}`)
  if (actionsLen > 0)
    parts.push(`${actionsLen} action${actionsLen === 1 ? '' : 's'}`)

  const summary = parts.length === 0 ? 'Empty' : parts.join(' · ')

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs text-muted-foreground',
        className,
      )}
    >
      <Layers className="size-3.5" />
      {summary}
    </span>
  )
}
