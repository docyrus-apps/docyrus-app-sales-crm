'use client'

// @ts-nocheck
/* eslint-disable */
import { cn } from '@/lib/utils'

import { type DocyrusValueProps } from './types'

import { getCurrencySymbol } from './utils'

export function CurrencyCodeValue({ value, className }: DocyrusValueProps) {
  if (value == null || value === '') {
    return <span className="text-muted-foreground">–</span>
  }

  const code = String(value)
  const symbol = getCurrencySymbol(code)

  return (
    <span className={cn('block truncate text-sm', className)}>
      {code}
      {symbol !== code && ` (${symbol})`}
    </span>
  )
}
