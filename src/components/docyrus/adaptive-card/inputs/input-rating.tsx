'use client'

// @ts-nocheck
/* eslint-disable */
import { useId, useState } from 'react'

import { Star } from 'lucide-react'

import { cn } from '@/lib/utils'

import { type AdaptiveCardInputRating } from '../adaptive-card-types'

import { useAdaptiveCardInput } from '../adaptive-card-context'
import { InputShell } from './input-shell'
import { useInputRegister } from './use-input-register'

const SIZE_CLASS = {
  medium: 'size-5',
  large: 'size-7',
} as const

const FILL_COLOR = {
  marigold: 'text-amber-500 fill-amber-500',
  neutral: 'text-foreground fill-foreground',
} as const

function asNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value !== '') {
    const n = Number(value)

    return Number.isFinite(n) ? n : 0
  }

  return 0
}

export function InputRatingElement({
  element,
}: {
  element: AdaptiveCardInputRating
}) {
  const inputId = useId()
  const max = element.max ?? 5
  const sizeClass = SIZE_CLASS[element.size ?? 'medium']
  const colorClass = FILL_COLOR[element.color ?? 'marigold']

  const initial = element.value != null ? String(element.value) : ''

  useInputRegister(element.id, initial)
  const { value, setValue, validation, showError } = useAdaptiveCardInput(
    element.id,
  )
  const invalid = showError && validation?.isValid === false
  const [hover, setHover] = useState<number | null>(null)

  const current = asNumber(value ?? initial)
  const display = hover ?? current

  return (
    <InputShell input={element} inputId={inputId}>
      <div
        id={inputId}
        role="radiogroup"
        aria-required={element.isRequired ? true : undefined}
        aria-invalid={invalid || undefined}
        className={cn(
          'inline-flex items-center gap-0.5',
          invalid ? 'ring-2 ring-destructive/40 rounded-md p-1' : '',
        )}
        onMouseLeave={() => setHover(null)}
      >
        {Array.from({ length: max }, (_, i) => {
          const starValue = i + 1
          const filled = display >= starValue

          return (
            <button
              key={starValue}
              type="button"
              role="radio"
              aria-checked={current === starValue}
              aria-label={`${starValue} of ${max}`}
              onClick={() => setValue(String(starValue))}
              onMouseEnter={() => setHover(starValue)}
              className="inline-flex cursor-pointer items-center rounded-sm p-0.5 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Star
                className={cn(
                  sizeClass,
                  filled ? colorClass : 'text-muted-foreground/40',
                )}
                strokeWidth={1.5}
              />
            </button>
          )
        })}
      </div>
    </InputShell>
  )
}
