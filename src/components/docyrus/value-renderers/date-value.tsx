'use client'

import { cn } from '@/lib/utils'
import { useDateFormat } from '@/lib/use-date-format'

import { type DocyrusValueProps } from './types'

export function DateValue({ value, className }: DocyrusValueProps) {
  const { formatDate } = useDateFormat()

  if (value == null || value === '') {
    return <span className="text-muted-foreground">—</span>
  }

  const date = new Date(value as string | number)

  if (Number.isNaN(date.getTime())) {
    return <span className="text-muted-foreground">—</span>
  }

  return (
    <span className={cn('truncate text-sm', className)}>
      {formatDate(date)}
    </span>
  )
}
