'use client'

import { cn } from '@/lib/utils'

import { type DocyrusValueProps } from './types'

export function ColorValue({ value, className }: DocyrusValueProps) {
  if (value == null || value === '') {
    return <span className="text-muted-foreground">—</span>
  }

  const color = String(value)

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span
        className="size-4 shrink-0 rounded-full border"
        style={{ backgroundColor: color }}
      />
      <span className="truncate text-sm">{color}</span>
    </span>
  )
}
