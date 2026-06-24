// @ts-nocheck
/* eslint-disable */
import {
  type AdaptiveCardColor,
  type AdaptiveCardContainerStyle,
} from '../adaptive-card-types'

export const TEXT_COLOR: Record<
  AdaptiveCardColor,
  { default: string; subtle: string }
> = {
  default: { default: 'text-foreground', subtle: 'text-muted-foreground' },
  dark: { default: 'text-foreground', subtle: 'text-muted-foreground' },
  light: {
    default: 'text-muted-foreground',
    subtle: 'text-muted-foreground/70',
  },
  accent: { default: 'text-primary', subtle: 'text-primary/70' },
  good: {
    default: 'text-emerald-600 dark:text-emerald-400',
    subtle: 'text-emerald-500/70 dark:text-emerald-400/70',
  },
  warning: {
    default: 'text-amber-600 dark:text-amber-400',
    subtle: 'text-amber-500/70 dark:text-amber-400/70',
  },
  attention: { default: 'text-destructive', subtle: 'text-destructive/70' },
}

export function getTextColorClass(
  color: AdaptiveCardColor | undefined,
  isSubtle?: boolean,
): string {
  const pair = TEXT_COLOR[color ?? 'default']

  return isSubtle ? pair.subtle : pair.default
}

export const CONTAINER_STYLE: Record<AdaptiveCardContainerStyle, string> = {
  default: '',
  emphasis: 'bg-muted/50',
  good: 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300',
  attention: 'bg-destructive/10 border border-destructive/20 text-destructive',
  warning:
    'bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300',
  accent: 'bg-primary/10 border border-primary/20',
}

export function getContainerStyleClass(
  style: AdaptiveCardContainerStyle | undefined,
): string {
  return CONTAINER_STYLE[style ?? 'default']
}

export const HIGHLIGHT_CLASS =
  'bg-yellow-200 dark:bg-yellow-500/30 px-0.5 rounded'
