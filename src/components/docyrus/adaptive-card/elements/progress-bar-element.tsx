'use client'

// @ts-nocheck
/* eslint-disable */
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'

import {
  type AdaptiveCardProgressBar,
  type AdaptiveCardProgressColor,
} from '../adaptive-card-types'

const COLOR_INDICATOR: Record<AdaptiveCardProgressColor, string> = {
  default: '[&_[data-slot=progress-indicator]]:bg-foreground',
  accent: '[&_[data-slot=progress-indicator]]:bg-primary',
  good: '[&_[data-slot=progress-indicator]]:bg-emerald-600 dark:[&_[data-slot=progress-indicator]]:bg-emerald-500',
  warning: '[&_[data-slot=progress-indicator]]:bg-amber-500',
  attention: '[&_[data-slot=progress-indicator]]:bg-destructive',
}

export function ProgressBarElement({
  element,
}: {
  element: AdaptiveCardProgressBar
}) {
  const max = element.max ?? 100
  const rawValue = element.value
  const isIndeterminate = rawValue == null
  const value = isIndeterminate
    ? undefined
    : Math.min(100, Math.max(0, (rawValue / max) * 100))

  const colorClass = COLOR_INDICATOR[element.color ?? 'accent']

  if (isIndeterminate) {
    return (
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-primary/15">
        <div
          className={cn(
            'absolute inset-y-0 left-0 w-1/3 animate-pulse rounded-full bg-primary',
            element.color === 'good' ? 'bg-emerald-600' : '',
            element.color === 'warning' ? 'bg-amber-500' : '',
            element.color === 'attention' ? 'bg-destructive' : '',
            element.color === 'default' ? 'bg-foreground' : '',
          )}
        />
      </div>
    )
  }

  return <Progress value={value} className={cn(colorClass)} />
}
