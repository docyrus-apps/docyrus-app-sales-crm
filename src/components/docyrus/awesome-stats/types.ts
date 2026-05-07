'use client'

import { type ComponentProps, type ReactNode } from 'react'

import { type PatternStyle } from '@/lib/pattern-styles'

export type AwesomeStatComparisonPeriod =
  | 'yesterday'
  | 'last-week'
  | 'last-month'
  | 'last-quarter'
  | 'last-year'

export interface AwesomeStatValueFormat {
  locale?: string
  style?: 'number' | 'currency' | 'percent'
  currency?: string
  currencyDisplay?: 'symbol' | 'code' | 'name' | 'narrowSymbol'
  notation?: 'standard' | 'scientific' | 'engineering' | 'compact'
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  signDisplay?: Intl.NumberFormatOptions['signDisplay']
  percentScale?: 'whole' | 'fraction'
}

export interface AwesomeStatComparison {
  previousValue: number
  period: AwesomeStatComparisonPeriod
  positiveDirection?: 'up' | 'down'
}

export interface AwesomeStatMiniChart {
  type: 'sparkline' | 'bar' | 'area'
  data: number[] | Array<Record<string, unknown>>
  dataKey?: string
  position?: 'right' | 'bottom'
}

export interface AwesomeStatsCardMenuItem {
  id: string
  label: ReactNode
  icon?: ReactNode
  shortcut?: ReactNode
  disabled?: boolean
  variant?: 'default' | 'destructive'
  onSelect?: (item: AwesomeStatItem) => void
}

export interface AwesomeStatItem {
  id: string
  eyebrow?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  icon?: ReactNode | string
  color?: string
  value: number
  format?: AwesomeStatValueFormat
  unitLabel?: ReactNode
  comparison?: AwesomeStatComparison
  miniChart?: AwesomeStatMiniChart
  menuItems?: AwesomeStatsCardMenuItem[]
}

export type AwesomeStatsLayout =
  | {
      type: 'flex'
      cardWidth: number | string
      behavior: 'wrap' | 'scroll'
      gap?: number | string
    }
  | {
      type: 'grid'
      columns: number
      maxCardWidth?: number | string
      gap?: number | string
    }
  | {
      type: 'tabs'
      defaultTabId?: string
    }

export interface AwesomeStatsAwesomeCardProps {
  pattern?: boolean
  patternStyle?: PatternStyle
  collapsible?: boolean
  collapsed?: boolean
  chevronPosition?: 'left' | 'right'
  className?: string
}

export interface AwesomeStatsProps extends Omit<
  ComponentProps<'div'>,
  'children'
> {
  items: AwesomeStatItem[]
  layout: AwesomeStatsLayout
  cardVariant?: 'default' | 'awesome'
  awesomeCardProps?: AwesomeStatsAwesomeCardProps
  sortable?: boolean
  onItemsOrderChange?: (items: AwesomeStatItem[]) => void
  getCardMenuItems?: (item: AwesomeStatItem) => AwesomeStatsCardMenuItem[]
}
