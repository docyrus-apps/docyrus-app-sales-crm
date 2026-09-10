'use client'

// @ts-nocheck
/* eslint-disable */
import { cn } from '@/lib/utils'
import {
  isDefaultNumberFormatContext,
  useNumberFormat,
} from '@/hooks/docyrus/use-number-format'

import { type DocyrusValueProps } from './types'

import { formatMoney, getCompanionValue } from './utils'

export function MoneyValue({
  field,
  value,
  record,
  className,
}: DocyrusValueProps) {
  const ctx = useNumberFormat()

  if (value == null || value === '') {
    return <span className="text-muted-foreground">–</span>
  }

  const num = Number(value)

  if (Number.isNaN(num)) {
    return <span className="text-muted-foreground">–</span>
  }

  const currency = getCompanionValue(record, field.slug, 'currency')
  const currencyCode = typeof currency === 'string' ? currency : undefined
  const formatted = isDefaultNumberFormatContext(ctx)
    ? formatMoney(num, currencyCode)
    : ctx.formatNumber(num, { variant: 'currency', currency: currencyCode })

  return <span className={cn('tabular-nums', className)}>{formatted}</span>
}
