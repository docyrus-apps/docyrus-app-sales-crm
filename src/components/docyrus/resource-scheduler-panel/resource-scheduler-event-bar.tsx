'use client'

import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

import { type SchedulerEvent } from './types'

const eventBarVariants = cva(
  'absolute flex cursor-pointer items-center gap-1 truncate rounded-md px-2 text-xs font-medium transition-shadow hover:shadow-md',
  {
    variants: {
      variant: {
        solid: 'text-white',
        outlined: 'border bg-background',
        subtle: '',
      },
    },
    defaultVariants: {
      variant: 'solid',
    },
  },
)

interface ResourceSchedulerEventBarProps extends VariantProps<
  typeof eventBarVariants
> {
  event: SchedulerEvent
  left: number
  width: number
  top: number
  height: number
  onClick?: (event: SchedulerEvent) => void
}

const DEFAULT_COLORS: Record<string, string> = {
  solid: 'hsl(var(--primary))',
  outlined: 'hsl(var(--primary))',
  subtle: 'hsl(var(--primary) / 0.15)',
}

export function ResourceSchedulerEventBar({
  event,
  left,
  width,
  top,
  height,
  variant = 'solid',
  onClick,
}: ResourceSchedulerEventBarProps) {
  const resolvedVariant = event.variant ?? variant ?? 'solid'
  const color =
    event.color ?? DEFAULT_COLORS[resolvedVariant] ?? DEFAULT_COLORS.solid ?? ''

  const style: Record<string, string | number> = {
    left: Math.round(left),
    width: Math.max(Math.round(width), 4),
    top,
    height,
  }

  if (resolvedVariant === 'solid') {
    style.backgroundColor = color
  } else if (resolvedVariant === 'outlined') {
    style.borderColor = color
    style.color = color
  } else {
    style.backgroundColor = event.color
      ? `${color}20`
      : 'hsl(var(--primary) / 0.1)'
    style.color = color
  }

  return (
    <div
      className={cn(eventBarVariants({ variant: resolvedVariant }))}
      style={style}
      onClick={() => onClick?.(event)}
    >
      {event.icon && <span className="shrink-0">{event.icon}</span>}
      <span className="truncate">{event.title}</span>
    </div>
  )
}

export { eventBarVariants }
