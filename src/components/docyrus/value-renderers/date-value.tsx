'use client'

// @ts-nocheck
/* eslint-disable */
import { cn } from '@/lib/utils'
import {
  isDefaultDateFormatContext,
  useDateFormat,
} from '@/hooks/docyrus/use-date-format'

import { type DocyrusValueProps } from './types'

const fallbackDateFormatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
})

export function DateValue({ value, className }: DocyrusValueProps) {
  const ctx = useDateFormat()

  if (value == null || value === '') {
    return <span className="text-muted-foreground">–</span>
  }

  const date = new Date(value as string | number)

  if (Number.isNaN(date.getTime())) {
    return <span className="text-muted-foreground">–</span>
  }

  const formatted = isDefaultDateFormatContext(ctx)
    ? fallbackDateFormatter.format(date)
    : ctx.formatDate(date)

  return (
    <span className={cn('block truncate text-sm', className)}>{formatted}</span>
  )
}
