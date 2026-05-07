'use client'

import { type ReactNode } from 'react'

import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'

import { DocyrusIcon } from '@/components/docyrus/docyrus-icon'
import {
  AwesomeCard,
  AwesomeCardBody,
  AwesomeCardHeader,
  AwesomeCardIcon,
  AwesomeCardTitle,
} from '@/components/docyrus/awesome-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

import {
  getAccentStyles,
  getComparisonViewModel,
  formatStatValue,
} from './awesome-stats-utils'
import {
  type AwesomeStatItem,
  type AwesomeStatsAwesomeCardProps,
} from './types'
import { AwesomeStatsChart } from './awesome-stats-chart'

function ComparisonIndicator({
  caption,
  direction,
  tone,
}: {
  caption: string
  direction: 'up' | 'down' | 'neutral'
  tone: 'positive' | 'negative' | 'neutral'
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 text-sm',
        tone === 'positive' && 'text-emerald-600 dark:text-emerald-400',
        tone === 'negative' && 'text-red-600 dark:text-red-400',
        tone === 'neutral' && 'text-muted-foreground',
      )}
    >
      {direction === 'up' && <ArrowUpRight className="size-4 shrink-0" />}
      {direction === 'down' && <ArrowDownRight className="size-4 shrink-0" />}
      {direction === 'neutral' && <Minus className="size-4 shrink-0" />}
      <span className="truncate">{caption}</span>
    </div>
  )
}

function StatIcon({
  icon,
  color,
}: {
  icon: AwesomeStatItem['icon']
  color?: string
}) {
  if (!icon) return null

  return (
    <div
      className="flex size-10 shrink-0 items-center justify-center rounded-xl border"
      style={getAccentStyles(color)}
    >
      {typeof icon === 'string' ? (
        <DocyrusIcon icon={icon} className="size-4" />
      ) : (
        icon
      )}
    </div>
  )
}

function ValueBlock({
  item,
  comparisonCaption,
  comparisonDirection,
  comparisonTone,
}: {
  item: AwesomeStatItem
  comparisonCaption: string | null
  comparisonDirection: 'up' | 'down' | 'neutral'
  comparisonTone: 'positive' | 'negative' | 'neutral'
}) {
  return (
    <div className="min-w-0 space-y-3">
      <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
        <div className="text-3xl font-semibold tracking-tight tabular-nums text-foreground">
          {formatStatValue(item.value, item.format)}
        </div>
        {item.unitLabel ? (
          <div className="pb-1 text-sm text-muted-foreground">
            {item.unitLabel}
          </div>
        ) : null}
      </div>

      {comparisonCaption ? (
        <ComparisonIndicator
          caption={comparisonCaption}
          direction={comparisonDirection}
          tone={comparisonTone}
        />
      ) : null}
    </div>
  )
}

function CardHeaderContent({
  item,
  headerControl,
}: {
  item: AwesomeStatItem
  headerControl?: ReactNode
}) {
  return (
    <>
      <div className="min-w-0 space-y-1">
        {item.eyebrow ? (
          <div className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
            {item.eyebrow}
          </div>
        ) : null}
        <CardTitle className="truncate text-base font-semibold">
          {item.title}
        </CardTitle>
        {item.subtitle ? (
          <div className="text-sm text-muted-foreground">{item.subtitle}</div>
        ) : null}
      </div>
      <div className="flex items-start gap-2">
        {headerControl}
        <StatIcon icon={item.icon} color={item.color} />
      </div>
    </>
  )
}

function AwesomeHeaderContent({
  item,
  headerControl,
}: {
  item: AwesomeStatItem
  headerControl?: ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
      <div className="min-w-0 space-y-1">
        {item.eyebrow ? (
          <div className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
            {item.eyebrow}
          </div>
        ) : null}
        <AwesomeCardTitle className="truncate text-base font-semibold text-foreground">
          {item.title}
        </AwesomeCardTitle>
        {item.subtitle ? (
          <div className="text-sm text-muted-foreground">{item.subtitle}</div>
        ) : null}
      </div>

      <div className="flex items-start gap-2">
        {headerControl}
        {item.icon ? (
          <AwesomeCardIcon>
            <StatIcon icon={item.icon} color={item.color} />
          </AwesomeCardIcon>
        ) : null}
      </div>
    </div>
  )
}

function buildChartSection(
  item: AwesomeStatItem,
  chartPosition: 'right' | 'bottom',
): ReactNode {
  if (
    !item.miniChart ||
    (item.miniChart.position ?? 'right') !== chartPosition
  ) {
    return null
  }

  return (
    <AwesomeStatsChart
      miniChart={item.miniChart}
      color={item.color}
      className={cn(
        chartPosition === 'right' && 'h-20 w-24 shrink-0',
        chartPosition === 'bottom' && 'h-24 w-full',
      )}
    />
  )
}

function AwesomeStatsCard({
  item,
  cardVariant,
  awesomeCardProps,
  headerControl,
}: {
  item: AwesomeStatItem
  cardVariant: 'default' | 'awesome'
  awesomeCardProps?: AwesomeStatsAwesomeCardProps
  headerControl?: ReactNode
}) {
  const comparison = item.comparison
    ? getComparisonViewModel(item.value, item.comparison, item.format)
    : null
  const rightChart = buildChartSection(item, 'right')
  const bottomChart = buildChartSection(item, 'bottom')

  if (cardVariant === 'awesome') {
    return (
      <AwesomeCard
        pattern={awesomeCardProps?.pattern}
        patternStyle={awesomeCardProps?.patternStyle}
        collapsible={awesomeCardProps?.collapsible}
        collapsed={awesomeCardProps?.collapsed}
        chevronPosition={awesomeCardProps?.chevronPosition}
        className={cn('h-full', awesomeCardProps?.className)}
      >
        <AwesomeCardHeader>
          <AwesomeHeaderContent item={item} headerControl={headerControl} />
        </AwesomeCardHeader>
        <AwesomeCardBody className="flex h-full flex-col gap-4">
          <div className="flex items-end justify-between gap-4">
            <ValueBlock
              item={item}
              comparisonCaption={comparison?.caption ?? null}
              comparisonDirection={comparison?.direction ?? 'neutral'}
              comparisonTone={comparison?.tone ?? 'neutral'}
            />
            {rightChart}
          </div>

          {bottomChart ? (
            <div className="-mx-5 mt-auto -mt-2">{bottomChart}</div>
          ) : null}
        </AwesomeCardBody>
      </AwesomeCard>
    )
  }

  return (
    <Card className="h-full rounded-2xl border shadow-sm transition-colors hover:border-card-foreground/30">
      <CardHeader className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 border-b border-border/60 pb-4">
        <CardHeaderContent item={item} headerControl={headerControl} />
      </CardHeader>

      <CardContent className="flex h-full flex-col gap-4 pt-4">
        <div className="flex items-end justify-between gap-4">
          <ValueBlock
            item={item}
            comparisonCaption={comparison?.caption ?? null}
            comparisonDirection={comparison?.direction ?? 'neutral'}
            comparisonTone={comparison?.tone ?? 'neutral'}
          />
          {rightChart}
        </div>

        {bottomChart ? (
          <div className="-mx-4 mt-auto -mt-2">{bottomChart}</div>
        ) : null}
      </CardContent>
    </Card>
  )
}

export { AwesomeStatsCard }
