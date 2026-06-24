'use client'

// @ts-nocheck
/* eslint-disable */
import { cn } from '@/lib/utils'
import {
  CircularProgress,
  CircularProgressIndicator,
  CircularProgressRange,
  CircularProgressTrack,
} from '@/components/ui/circular-progress'

import {
  type AdaptiveCardProgressColor,
  type AdaptiveCardProgressRing,
  type AdaptiveCardProgressRingSize,
} from '../adaptive-card-types'

const SIZE_PX: Record<AdaptiveCardProgressRingSize, number> = {
  tiny: 16,
  extraSmall: 20,
  small: 28,
  medium: 36,
  large: 48,
  extraLarge: 64,
  huge: 96,
}

const THICKNESS_PX: Record<AdaptiveCardProgressRingSize, number> = {
  tiny: 2,
  extraSmall: 2,
  small: 3,
  medium: 3,
  large: 4,
  extraLarge: 5,
  huge: 6,
}

const RANGE_COLOR: Record<AdaptiveCardProgressColor, string> = {
  default: '[&_[data-slot=circular-progress-range]]:stroke-foreground',
  accent: '[&_[data-slot=circular-progress-range]]:stroke-primary',
  good: '[&_[data-slot=circular-progress-range]]:stroke-emerald-600 dark:[&_[data-slot=circular-progress-range]]:stroke-emerald-500',
  warning: '[&_[data-slot=circular-progress-range]]:stroke-amber-500',
  attention: '[&_[data-slot=circular-progress-range]]:stroke-destructive',
}

export function ProgressRingElement({
  element,
}: {
  element: AdaptiveCardProgressRing
}) {
  const size = SIZE_PX[element.size ?? 'medium']
  const thickness = THICKNESS_PX[element.size ?? 'medium']
  const colorClass = RANGE_COLOR[element.color ?? 'accent']
  const isIndeterminate = element.value == null
  const max = element.max ?? 100
  const normalizedValue =
    element.value == null ? null : Math.min(max, Math.max(0, element.value))

  return (
    <div className={cn('inline-flex items-center gap-2', colorClass)}>
      <CircularProgress
        value={normalizedValue}
        max={max}
        size={size}
        thickness={thickness}
        label={element.label}
        className={cn(isIndeterminate ? 'animate-spin' : '')}
      >
        <CircularProgressIndicator>
          <CircularProgressTrack />
          <CircularProgressRange />
        </CircularProgressIndicator>
      </CircularProgress>
      {element.label ? (
        <span className="text-sm text-muted-foreground">{element.label}</span>
      ) : null}
    </div>
  )
}
