'use client'

// @ts-nocheck
/* eslint-disable */
import { Star } from 'lucide-react'

import { cn } from '@/lib/utils'

import { type AdaptiveCardRating } from '../adaptive-card-types'

const SIZE_CLASS = {
  medium: 'size-4',
  large: 'size-6',
} as const

const FILL_COLOR = {
  marigold: 'text-amber-500 fill-amber-500',
  neutral: 'text-foreground fill-foreground',
} as const

const EMPTY_COLOR = 'text-muted-foreground/40'

function StarRow({
  value,
  max,
  sizeClass,
  color,
}: {
  value: number
  max: number
  sizeClass: string
  color: string
}) {
  const stars: Array<{ fill: number; key: number }> = []

  for (let i = 0; i < max; i++) {
    const remaining = value - i
    const fill = Math.max(0, Math.min(1, remaining))

    stars.push({ fill, key: i })
  }

  return (
    <div className="flex items-center gap-0.5">
      {stars.map(({ fill, key }) => (
        <span key={key} className="relative inline-flex">
          <Star
            className={cn(sizeClass, EMPTY_COLOR, 'stroke-current')}
            strokeWidth={1.5}
          />
          {fill > 0 ? (
            <span
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{ width: `${fill * 100}%` }}
            >
              <Star className={cn(sizeClass, color)} strokeWidth={1.5} />
            </span>
          ) : null}
        </span>
      ))}
    </div>
  )
}

export function RatingElement({ element }: { element: AdaptiveCardRating }) {
  const max = element.max ?? 5
  const sizeClass = SIZE_CLASS[element.size ?? 'medium']
  const colorClass = FILL_COLOR[element.color ?? 'marigold']

  if (element.style === 'compact') {
    return (
      <div className="inline-flex items-center gap-1.5 text-sm">
        <Star className={cn('size-4', colorClass)} strokeWidth={1.5} />
        <span className="font-medium text-foreground">
          {element.value.toFixed(1)}
        </span>
        {typeof element.count === 'number' ? (
          <span className="text-muted-foreground">({element.count})</span>
        ) : null}
      </div>
    )
  }

  return (
    <div className="inline-flex items-center gap-2">
      <StarRow
        value={element.value}
        max={max}
        sizeClass={sizeClass}
        color={colorClass}
      />
      {typeof element.count === 'number' ? (
        <span className="text-sm text-muted-foreground">({element.count})</span>
      ) : null}
    </div>
  )
}

export function RatingStars({
  value,
  max,
  size,
  color,
}: {
  value: number
  max: number
  size: 'medium' | 'large'
  color: 'marigold' | 'neutral'
}) {
  return (
    <StarRow
      value={value}
      max={max}
      sizeClass={SIZE_CLASS[size]}
      color={FILL_COLOR[color]}
    />
  )
}
