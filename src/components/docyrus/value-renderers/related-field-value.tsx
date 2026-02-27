'use client'

import { cn } from '@/lib/utils'

import { type DocyrusValueProps } from './types'

export function RelatedFieldValue({ value, className }: DocyrusValueProps) {
  if (value == null || value === '') {
    return <span className="text-muted-foreground">—</span>
  }

  return (
    <span className={cn('truncate text-sm', className)}>{String(value)}</span>
  )
}
