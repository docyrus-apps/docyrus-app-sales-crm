'use client'

// @ts-nocheck
/* eslint-disable */
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import {
  type AdaptiveCardBadge,
  type AdaptiveCardBadgeSize,
  type AdaptiveCardBadgeStyle,
} from '../adaptive-card-types'

import { renderLucideIcon } from './icon-element'

const SIZE_CLASS: Record<AdaptiveCardBadgeSize, string> = {
  extraSmall: 'px-1.5 py-0 text-[10px] [&>svg]:size-2.5',
  small: 'px-2 py-0 text-[11px] [&>svg]:size-3',
  medium: 'px-2 py-0.5 text-xs [&>svg]:size-3',
  large: 'px-2.5 py-1 text-sm [&>svg]:size-4',
  extraLarge: 'px-3 py-1.5 text-base [&>svg]:size-5',
}

const FILLED_STYLE: Record<AdaptiveCardBadgeStyle, string> = {
  default: 'bg-foreground text-background border-transparent',
  subtle: 'bg-muted text-muted-foreground border-transparent',
  informative: 'bg-foreground/80 text-background border-transparent',
  accent: 'bg-primary text-primary-foreground border-transparent',
  good: 'bg-emerald-600 text-white border-transparent',
  attention: 'bg-destructive text-white border-transparent',
  warning: 'bg-amber-500 text-white border-transparent',
}

const TINT_STYLE: Record<AdaptiveCardBadgeStyle, string> = {
  default: 'bg-muted text-foreground border border-border',
  subtle: 'bg-muted/50 text-muted-foreground border border-transparent',
  informative: 'bg-muted text-foreground border border-border',
  accent: 'bg-primary/10 text-primary border border-primary/20',
  good: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20',
  attention: 'bg-destructive/10 text-destructive border border-destructive/20',
  warning:
    'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20',
}

const SHAPE_CLASS = {
  rounded: 'rounded-md',
  square: 'rounded-none',
  circular: 'rounded-full',
} as const

export function BadgeElement({ element }: { element: AdaptiveCardBadge }) {
  const appearance = element.appearance ?? 'filled'
  const style = element.style ?? 'default'
  const size = element.size ?? 'medium'
  const shape = element.shape ?? 'rounded'

  const styleMap = appearance === 'tint' ? TINT_STYLE : FILLED_STYLE

  const badge = (
    <Badge
      className={cn(
        styleMap[style],
        SIZE_CLASS[size],
        SHAPE_CLASS[shape],
        'whitespace-nowrap',
      )}
    >
      {element.icon ? renderLucideIcon(element.icon) : null}
      {element.text ? <span>{element.text}</span> : null}
    </Badge>
  )

  if (element.tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent>{element.tooltip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return badge
}
