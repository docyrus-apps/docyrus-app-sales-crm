import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart3, TrendingUp, Target, Timer } from 'lucide-react'
import type { PieData } from '@/components/charts/pie-context'
import { BarChart } from '@/components/charts/bar-chart'
import { Bar } from '@/components/charts/bar'
import { BarXAxis } from '@/components/charts/bar-x-axis'
import { Grid } from '@/components/charts/grid'
import { ChartTooltip } from '@/components/charts/tooltip'
import { PieChart } from '@/components/charts/pie-chart'
import { PieSlice } from '@/components/charts/pie-slice'
import { PieCenter } from '@/components/charts/pie-center'
import {
  Legend,
  LegendItem,
  LegendLabel,
  LegendMarker,
  LegendValue,
} from '@/components/charts/legend'
import { ReportCard } from './report-card'
import { useDeals } from '@/hooks/use-deals'
import type { DateRange } from '@/hooks/use-report-query'
import {
  buildDateFilter,
  getMonthLabels,
  getMonthIndex,
} from '@/hooks/use-report-query'
import { formatCurrency } from '@/lib/formatters'

const COLORS = {
  won: 'hsl(162, 100%, 39%)',
  pipeline: 'hsl(210, 100%, 50%)',
  lost: 'hsl(0, 72%, 51%)',
  weighted: 'hsl(43, 100%, 57%)',
  avgValue: 'hsl(252, 56%, 68%)',
  cycleTime: 'hsl(18, 100%, 63%)',
}

const PIE_COLORS = [
  'hsl(0, 72%, 51%)',
  'hsl(18, 100%, 63%)',
  'hsl(43, 100%, 57%)',
  'hsl(252, 56%, 68%)',
  'hsl(210, 100%, 50%)',
  'hsl(162, 100%, 39%)',
]

interface RevenuePipelineTabProps {
  dateRange: DateRange
}

export function RevenuePipelineTab({ dateRange }: RevenuePipelineTabProps) {
  const { t } = useTranslation()
  const filters = buildDateFilter(dateRange)
  const { data: deals, isLoading } = useDeals({
    filters,
    columns: [
      'id',
      'deal_value',
      'stage',
      'close_probability',
      'expected_closing_date',
      'closed_date',
      'reason_for_lost',
      'created_on',
    ],
    limit: 10000,
  })

  const monthLabels = useMemo(() => getMonthLabels(dateRange), [dateRange])

  // 1.1 Revenue Trend
  const revenueTrendData = useMemo(() => {
    if (!deals) return []
    const buckets = monthLabels.map((label) => ({
      month: label,
      won: 0,
      pipeline: 0,
    }))

    for (const deal of deals as Array<any>) {
      const stageName =
        typeof deal.stage === 'object' ? deal.stage?.name : deal.stage
      const isWon =
        stageName?.toLowerCase().includes('won') ||
        stageName?.toLowerCase().includes('closed won')
      const dateStr = deal.expected_closing_date || deal.created_on
      if (!dateStr) continue
      const idx = getMonthIndex(dateStr, dateRange.from)
      if (idx < 0 || idx >= buckets.length) continue

      if (isWon) {
        buckets[idx]!.won += Number(deal.deal_value ?? 0)
      } else {
        buckets[idx]!.pipeline += Number(deal.deal_value ?? 0)
      }
    }
    return buckets
  }, [deals, monthLabels, dateRange])

  // 1.2 Pipeline Value by Stage
  const pipelineValueData = useMemo(() => {
    if (!deals) return []
    const stageMap: Record<
      string,
      { stage: string; total: number; weighted: number }
    > = {}

    for (const deal of deals as Array<any>) {
      const stageName =
        typeof deal.stage === 'object'
          ? deal.stage?.name
          : deal.stage || 'Unknown'
      if (!stageMap[stageName]) {
        stageMap[stageName] = { stage: stageName, total: 0, weighted: 0 }
      }
      const value = Number(deal.deal_value ?? 0)
      const prob = Number(deal.close_probability ?? 0) / 100
      stageMap[stageName]!.total += value
      stageMap[stageName]!.weighted += value * prob
    }
    return Object.values(stageMap)
  }, [deals])

  // 1.3 Win/Loss Analysis
  const winLossData = useMemo(() => {
    if (!deals) return { monthly: [], reasons: [] as Array<PieData> }
    const buckets = monthLabels.map((label) => ({
      month: label,
      won: 0,
      lost: 0,
    }))
    const reasonCounts: Record<string, number> = {}

    for (const deal of deals as Array<any>) {
      const stageName =
        typeof deal.stage === 'object' ? deal.stage?.name : deal.stage
      const isWon =
        stageName?.toLowerCase().includes('won') ||
        stageName?.toLowerCase().includes('closed won')
      const isLost =
        stageName?.toLowerCase().includes('lost') ||
        stageName?.toLowerCase().includes('closed lost')
      const dateStr = deal.closed_date || deal.created_on
      if (!dateStr) continue
      const idx = getMonthIndex(dateStr, dateRange.from)
      if (idx < 0 || idx >= buckets.length) continue

      if (isWon) buckets[idx]!.won++
      if (isLost) {
        buckets[idx]!.lost++
        const reason =
          typeof deal.reason_for_lost === 'object'
            ? deal.reason_for_lost?.name
            : deal.reason_for_lost || t('reports.unknownReason')
        reasonCounts[reason] = (reasonCounts[reason] || 0) + 1
      }
    }

    const reasons: Array<PieData> = Object.entries(reasonCounts).map(
      ([label, value], i) => ({
        label,
        value,
        color: PIE_COLORS[i % PIE_COLORS.length],
      }),
    )

    return { monthly: buckets, reasons }
  }, [deals, monthLabels, dateRange, t])

  // 1.4 Avg Deal Size & Cycle Time
  const dealMetricsData = useMemo(() => {
    if (!deals) return []
    const buckets = monthLabels.map((label) => ({
      month: label,
      totalValue: 0,
      count: 0,
      totalDays: 0,
      closedCount: 0,
    }))

    for (const deal of deals as Array<any>) {
      const dateStr = deal.created_on
      if (!dateStr) continue
      const idx = getMonthIndex(dateStr, dateRange.from)
      if (idx < 0 || idx >= buckets.length) continue

      buckets[idx]!.totalValue += Number(deal.deal_value ?? 0)
      buckets[idx]!.count++

      if (deal.closed_date && deal.created_on) {
        const days = Math.round(
          (new Date(deal.closed_date).getTime() -
            new Date(deal.created_on).getTime()) /
            (1000 * 60 * 60 * 24),
        )
        if (days >= 0) {
          buckets[idx]!.totalDays += days
          buckets[idx]!.closedCount++
        }
      }
    }

    return buckets.map((b) => ({
      month: b.month,
      avgValue: b.count > 0 ? Math.round(b.totalValue / b.count) : 0,
      avgCycleTime:
        b.closedCount > 0 ? Math.round(b.totalDays / b.closedCount) : 0,
    }))
  }, [deals, monthLabels, dateRange])

  const [hoveredReasonIdx, setHoveredReasonIdx] = useState<number | null>(null)

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* 1.1 Revenue Trend */}
      <ReportCard
        title={t('reports.revenueTrend')}
        icon={<TrendingUp className="size-4" />}
        isLoading={isLoading}
        isEmpty={revenueTrendData.length === 0}
      >
        <BarChart
          data={revenueTrendData as Array<Record<string, unknown>>}
          xDataKey="month"
          stacked
          aspectRatio="16 / 9"
        >
          <Grid horizontal />
          <Bar dataKey="won" fill={COLORS.won} lineCap="round" />
          <Bar dataKey="pipeline" fill={COLORS.pipeline} lineCap="round" />
          <BarXAxis showAllLabels />
          <ChartTooltip
            rows={(point) => [
              {
                color: COLORS.won,
                label: t('reports.won'),
                value: formatCurrency(Number(point.won ?? 0)),
              },
              {
                color: COLORS.pipeline,
                label: t('reports.pipeline'),
                value: formatCurrency(Number(point.pipeline ?? 0)),
              },
            ]}
          />
        </BarChart>
      </ReportCard>

      {/* 1.2 Pipeline Value by Stage */}
      <ReportCard
        title={t('reports.pipelineValueByStage')}
        icon={<BarChart3 className="size-4" />}
        isLoading={isLoading}
        isEmpty={pipelineValueData.length === 0}
      >
        <BarChart
          data={pipelineValueData as Array<Record<string, unknown>>}
          xDataKey="stage"
          orientation="horizontal"
          aspectRatio="16 / 9"
        >
          <Grid horizontal />
          <Bar dataKey="total" fill={COLORS.pipeline} lineCap="round" />
          <Bar dataKey="weighted" fill={COLORS.weighted} lineCap="round" />
          <BarXAxis showAllLabels />
          <ChartTooltip
            rows={(point) => [
              {
                color: COLORS.pipeline,
                label: t('reports.totalValue'),
                value: formatCurrency(Number(point.total ?? 0)),
              },
              {
                color: COLORS.weighted,
                label: t('reports.weightedValue'),
                value: formatCurrency(Number(point.weighted ?? 0)),
              },
            ]}
          />
        </BarChart>
      </ReportCard>

      {/* 1.3 Win/Loss Analysis */}
      <ReportCard
        title={t('reports.winLossAnalysis')}
        icon={<Target className="size-4" />}
        isLoading={isLoading}
        isEmpty={
          winLossData.monthly.every((m) => m.won === 0 && m.lost === 0) &&
          winLossData.reasons.length === 0
        }
      >
        <div className="space-y-4">
          <BarChart
            data={winLossData.monthly as Array<Record<string, unknown>>}
            xDataKey="month"
            aspectRatio="21 / 9"
          >
            <Grid horizontal />
            <Bar dataKey="won" fill={COLORS.won} lineCap="round" />
            <Bar dataKey="lost" fill={COLORS.lost} lineCap="round" />
            <BarXAxis showAllLabels />
            <ChartTooltip
              rows={(point) => [
                {
                  color: COLORS.won,
                  label: t('reports.won'),
                  value: String(point.won ?? 0),
                },
                {
                  color: COLORS.lost,
                  label: t('reports.lost'),
                  value: String(point.lost ?? 0),
                },
              ]}
            />
          </BarChart>
          {winLossData.reasons.length > 0 && (
            <div className="flex items-center gap-6 pt-2">
              <PieChart
                data={winLossData.reasons}
                size={140}
                innerRadius={40}
                padAngle={0.03}
                cornerRadius={4}
                hoveredIndex={hoveredReasonIdx}
                onHoverChange={setHoveredReasonIdx}
              >
                {winLossData.reasons.map((_, index) => (
                  <PieSlice key={index} index={index} hoverEffect="grow" />
                ))}
                <PieCenter defaultLabel={t('reports.lossReasons')} />
              </PieChart>
              <Legend
                items={winLossData.reasons.map((r) => ({
                  label: r.label,
                  value: r.value,
                  color: r.color ?? '',
                  maxValue: winLossData.reasons.reduce(
                    (s, d) => s + d.value,
                    0,
                  ),
                }))}
                hoveredIndex={hoveredReasonIdx}
                onHoverChange={setHoveredReasonIdx}
                className="flex-1"
              >
                <LegendItem className="flex items-center gap-2">
                  <LegendMarker className="size-2.5 rounded-full" />
                  <LegendLabel className="flex-1 text-sm" />
                  <LegendValue className="text-sm font-medium tabular-nums" />
                </LegendItem>
              </Legend>
            </div>
          )}
        </div>
      </ReportCard>

      {/* 1.4 Avg Deal Size & Cycle Time */}
      <ReportCard
        title={t('reports.avgDealSizeAndCycleTime')}
        icon={<Timer className="size-4" />}
        isLoading={isLoading}
        isEmpty={dealMetricsData.length === 0}
      >
        <BarChart
          data={dealMetricsData as Array<Record<string, unknown>>}
          xDataKey="month"
          aspectRatio="16 / 9"
        >
          <Grid horizontal />
          <Bar dataKey="avgValue" fill={COLORS.avgValue} lineCap="round" />
          <Bar dataKey="avgCycleTime" fill={COLORS.cycleTime} lineCap="round" />
          <BarXAxis showAllLabels />
          <ChartTooltip
            rows={(point) => [
              {
                color: COLORS.avgValue,
                label: t('reports.avgDealSize'),
                value: formatCurrency(Number(point.avgValue ?? 0)),
              },
              {
                color: COLORS.cycleTime,
                label: t('reports.avgCycleTimeDays'),
                value: `${point.avgCycleTime ?? 0} ${t('reports.days')}`,
              },
            ]}
          />
        </BarChart>
      </ReportCard>
    </div>
  )
}
