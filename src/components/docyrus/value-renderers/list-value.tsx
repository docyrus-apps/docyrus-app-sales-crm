'use client'

import { List } from 'lucide-react'

import { cn } from '@/lib/utils'

import { type DocyrusValueProps } from './types'

export function ListValue({ value, className }: DocyrusValueProps) {
  if (value == null || (Array.isArray(value) && value.length === 0)) {
    return <span className="text-muted-foreground">—</span>
  }

  const count = Array.isArray(value)
    ? value.length
    : typeof value === 'number'
      ? value
      : 0

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-sm text-muted-foreground',
        className,
      )}
    >
      <List className="size-3.5 shrink-0" />
      <span>
        {count} {count === 1 ? 'record' : 'records'}
      </span>
    </span>
  )
}
