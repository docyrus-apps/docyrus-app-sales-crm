'use client'

// @ts-nocheck
/* eslint-disable */
import { Calendar } from 'lucide-react'

import { cn } from '@/lib/utils'
import {
  isDefaultDateFormatContext,
  useDateFormat,
} from '@/hooks/docyrus/use-date-format'

import { type DocyrusValueProps } from './types'

import { formatDateRange, parseDateRange } from './utils'

const fallbackDateFormatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
})

const fallbackFormatDate = (value: unknown) => {
  if (value instanceof Date) return fallbackDateFormatter.format(value)
  if (value == null) return ''

  return String(value)
}

export function DateRangeValue({ value, className }: DocyrusValueProps) {
  const ctx = useDateFormat()

  if (value == null || value === '') {
    return <span className="text-muted-foreground">–</span>
  }

  const range = parseDateRange(String(value))

  if (!range) {
    return <span className="text-muted-foreground">–</span>
  }

  const formatDate = isDefaultDateFormatContext(ctx)
    ? fallbackFormatDate
    : ctx.formatDate

  return (
    <span
      className={cn(
        'inline-flex min-w-0 max-w-full items-center gap-1 text-sm',
        className,
      )}
    >
      <Calendar className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="truncate">
        {formatDateRange(range.start, range.end, formatDate)}
      </span>
    </span>
  )
}
