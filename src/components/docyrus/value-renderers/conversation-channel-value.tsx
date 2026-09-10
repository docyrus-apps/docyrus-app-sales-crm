'use client'

// @ts-nocheck
/* eslint-disable */
import { MessageSquare } from 'lucide-react'

import { cn } from '@/lib/utils'

import { type DocyrusValueProps } from './types'

interface ChannelData {
  id?: string
  name?: string
  title?: string
}

function isChannelData(val: unknown): val is ChannelData {
  return typeof val === 'object' && val !== null
}

export function ConversationChannelValue({
  value,
  className,
}: DocyrusValueProps) {
  if (value == null || value === '') {
    return <span className="text-muted-foreground">–</span>
  }

  let display: string

  if (typeof value === 'string') {
    display = value
  } else if (isChannelData(value)) {
    display = value.name ?? value.title ?? value.id ?? 'Channel'
  } else {
    display = String(value)
  }

  return (
    <span
      className={cn(
        'inline-flex min-w-0 max-w-full items-center gap-1 text-sm',
        className,
      )}
    >
      <MessageSquare className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="truncate">{display}</span>
    </span>
  )
}
