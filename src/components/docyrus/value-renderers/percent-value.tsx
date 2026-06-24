'use client'

// @ts-nocheck
/* eslint-disable */
import { cn } from '@/lib/utils'
import {
  isDefaultNumberFormatContext,
  useNumberFormat,
} from '@/hooks/docyrus/use-number-format'

import { type DocyrusValueProps } from './types'

export function PercentValue({ value, className }: DocyrusValueProps) {
  const ctx = useNumberFormat()

  if (value == null || value === '') {
    return <span className="text-muted-foreground">–</span>
  }

  const num = Number(value)

  if (Number.isNaN(num)) {
    return <span className="text-muted-foreground">–</span>
  }

  const formatted = isDefaultNumberFormatContext(ctx)
    ? `${num.toLocaleString()}%`
    : ctx.formatNumber(num, { variant: 'percent' })

  return <span className={cn('tabular-nums', className)}>{formatted}</span>
}
