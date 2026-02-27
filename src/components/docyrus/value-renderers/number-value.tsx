'use client'

import { cn } from '@/lib/utils'

import { type DocyrusValueProps } from './types'

export function NumberValue({ value, className }: DocyrusValueProps) {
  if (value == null || value === '') {
    return <span className="text-muted-foreground">—</span>
  }

  const num = Number(value)

  if (Number.isNaN(num)) {
    return <span className="text-muted-foreground">—</span>
  }

  return (
    <span className={cn('tabular-nums', className)}>
      {num.toLocaleString()}
    </span>
  )
}
