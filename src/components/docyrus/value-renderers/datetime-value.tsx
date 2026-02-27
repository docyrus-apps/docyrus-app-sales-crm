'use client'

import { cn } from '@/lib/utils'

import { type DocyrusValueProps } from './types'

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function DateTimeValue({ value, className }: DocyrusValueProps) {
  if (value == null || value === '') {
    return <span className="text-muted-foreground">—</span>
  }

  const date = new Date(value as string | number)

  if (Number.isNaN(date.getTime())) {
    return <span className="text-muted-foreground">—</span>
  }

  return (
    <span className={cn('truncate text-sm', className)}>
      {dateTimeFormatter.format(date)}
    </span>
  )
}
