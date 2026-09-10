'use client'

// @ts-nocheck
/* eslint-disable */
import { type ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function formatChartValue(
  value: number,
  format: 'short' | 'long' | 'percentage' | undefined,
): string {
  if (format === 'percentage') return `${Math.round(value * 100)}%`
  if (format === 'short') {
    if (Math.abs(value) >= 1_000_000)
      return `${(value / 1_000_000).toFixed(1)}M`
    if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`

    return String(value)
  }

  return value.toLocaleString()
}

export function ChartFrame({
  title,
  showTitle,
  maxWidth,
  children,
}: {
  title?: string
  showTitle?: boolean
  maxWidth?: number
  children: ReactNode
}) {
  const style = maxWidth ? { maxWidth: `${maxWidth}px` } : undefined

  return (
    <div className={cn('flex w-full flex-col gap-2')} style={style}>
      {showTitle !== false && title ? (
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      ) : null}
      <div className="h-64 w-full">{children}</div>
    </div>
  )
}
