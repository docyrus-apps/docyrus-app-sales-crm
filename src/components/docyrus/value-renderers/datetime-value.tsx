'use client'

// @ts-nocheck
/* eslint-disable */
import { cn } from '@/lib/utils'
import {
  isDefaultDateFormatContext,
  useDateFormat,
} from '@/hooks/docyrus/use-date-format'

import { type DocyrusValueProps } from './types'

const fallbackDateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

export function DateTimeValue({ value, className }: DocyrusValueProps) {
  const ctx = useDateFormat()

  if (value == null || value === '') {
    return <span className="text-muted-foreground">–</span>
  }

  const date = new Date(value as string | number)

  if (Number.isNaN(date.getTime())) {
    return <span className="text-muted-foreground">–</span>
  }

  const formatted = isDefaultDateFormatContext(ctx)
    ? fallbackDateTimeFormatter.format(date)
    : ctx.formatDateTime(date)

  return (
    <span className={cn('block truncate text-sm', className)}>{formatted}</span>
  )
}
