'use client'

import { cn } from '@/lib/utils'
import { useDateFormat } from '@/lib/use-date-format'

import { type DocyrusValueProps } from './types'

export function DateTimeValue({ value, className }: DocyrusValueProps) {
  const { formatDateTime } = useDateFormat()

  if (value == null || value === '') {
    return <span className="text-muted-foreground">—</span>
  }

  const date = new Date(value as string | number)

  if (Number.isNaN(date.getTime())) {
    return <span className="text-muted-foreground">—</span>
  }

  return (
    <span className={cn('truncate text-sm', className)}>
      {formatDateTime(date)}
    </span>
  )
}
