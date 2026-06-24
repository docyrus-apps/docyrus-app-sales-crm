import { useMemo } from 'react'

import { type DateRange } from '@/hooks/use-report-query'

import { useTranslation } from 'react-i18next'
import { BarChart3, Funnel, TrendingUp } from 'lucide-react'

import { ReportCard } from './report-card'

import { BarChart } from '@/components/charts/bar-chart'
import { Bar } from '@/components/charts/bar'
import { BarXAxis } from '@/components/charts/bar-x-axis'
import { Grid } from '@/components/charts/grid'
import { ChartTooltip } from '@/components/charts/tooltip'
import { useLeads } from '@/hooks/use-leads'
import {
  buildDateFilter,
  getMonthIndex,
  getMonthLabels
} from '@/hooks/use-report-query'

const COLORS = {
  total: 'hsl(210, 100%, 50%)',
  converted: 'hsl(162, 100%, 39%)',
  funnel: 'hsl(252, 56%, 68%)',
  type1: 'hsl(210, 100%, 50%)',
  type2: 'hsl(162, 100%, 39%)',
  type3: 'hsl(43, 100%, 57%)',
  type4: 'hsl(18, 100%, 63%)'
}

const TYPE_COLORS = [
  'hsl(210, 100%, 50%)',
  'hsl(162, 100%, 39%)',
  'hsl(43, 100%, 57%)',
  'hsl(18, 100%, 63%)',
  'hsl(252, 56%, 68%)',
  'hsl(140, 45%, 65%)'
]

interface LeadAnalyticsTabProps {
  dateRange: DateRange;
}

export function LeadAnalyticsTab({ dateRange }: LeadAnalyticsTabProps) {
  const { t } = useTranslation()
  const filters = buildDateFilter(dateRange)
  const { data: leads, isLoading } = useLeads({
    filters,
    columns: [
'id',
'lead_status',
'lead_source',
'lead_type',
'created_on'
],
    limit: 10000
  })

  const monthLabels = useMemo(() => getMonthLabels(dateRange), [dateRange])

  // 2.1 Lead Conversion Funnel
  const funnelData = useMemo(() => {
    if (!leads) return []
    const statusOrder = [
'New',
'Contacted',
'Qualified',
'Converted',
'Lost'
]
    const statusCounts: Record<string, number> = {}

    for (const lead of leads as Array<any>) {
      const statusName =
        typeof lead.lead_status === 'object'
          ? lead.lead_status?.name
          : lead.lead_status || 'Unknown'

      statusCounts[statusName] = (statusCounts[statusName] || 0) + 1
    }

    // Sort by predefined order, put unknowns at end
    const sorted = Object.entries(statusCounts).sort(([a], [b]) => {
      const idxA = statusOrder.findIndex(
        s => s.toLowerCase() === a.toLowerCase()
      )
      const idxB = statusOrder.findIndex(
        s => s.toLowerCase() === b.toLowerCase()
      )

      return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB)
    })

    return sorted.map(([status, count]) => ({ status, count }))
  }, [leads])

  // 2.2 Lead Source Effectiveness
  const sourceEffectivenessData = useMemo(() => {
    if (!leads) return []
    const sourceMap: Record<string, { total: number; converted: number }> = {}

    for (const lead of leads as Array<any>) {
      const sourceName =
        typeof lead.lead_source === 'object'
          ? lead.lead_source?.name
          : lead.lead_source || 'Unknown'

      if (!sourceMap[sourceName]) {
        sourceMap[sourceName] = { total: 0, converted: 0 }
      }
      sourceMap[sourceName].total++

      const statusName =
        typeof lead.lead_status === 'object'
          ? lead.lead_status?.name
          : lead.lead_status || ''

      if (statusName.toLowerCase().includes('converted')) {
        sourceMap[sourceName].converted++
      }
    }

    return Object.entries(sourceMap).map(([source, data]) => ({
      source,
      total: data.total,
      converted: data.converted
    }))
  }, [leads])

  // 2.3 Lead Acquisition Trend
  const acquisitionTrendData = useMemo(() => {
    if (!leads)
      return {
        data: [] as Array<Record<string, unknown>>,
        typeKeys: [] as Array<string>
      }
    const typeSet = new Set<string>()
    const buckets: Array<Record<string, unknown>> = monthLabels.map(
      label => ({
        month: label
      })
    )

    for (const lead of leads as Array<any>) {
      const dateStr = lead.created_on

      if (!dateStr) continue
      const idx = getMonthIndex(dateStr, dateRange.from)

      if (idx < 0 || idx >= buckets.length) continue

      const typeName =
        typeof lead.lead_type === 'object'
          ? lead.lead_type?.name
          : lead.lead_type || 'Other'

      typeSet.add(typeName)

      const bucket = buckets[idx]

      bucket[typeName] = (Number(bucket[typeName] ?? 0) || 0) + 1
    }

    const typeKeys = Array.from(typeSet)

    // Ensure all buckets have all keys
    for (const bucket of buckets) {
      for (const key of typeKeys) {
        if (!(key in bucket)) bucket[key] = 0
      }
    }

    return { data: buckets, typeKeys }
  }, [leads, monthLabels, dateRange])

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* 2.1 Lead Conversion Funnel */}
      <ReportCard
        title={t('reports.leadConversionFunnel')}
        icon={<Funnel className="size-4" />}
        isLoading={isLoading}
        isEmpty={funnelData.length === 0}>
        <BarChart
          data={funnelData}
          xDataKey="status"
          orientation="horizontal"
          aspectRatio="16 / 9">
          <Grid horizontal />
          <Bar dataKey="count" fill={COLORS.funnel} lineCap="round" />
          <BarXAxis showAllLabels />
          <ChartTooltip
            rows={point => [
              {
                color: COLORS.funnel,
                label: String(point.status ?? ''),
                value: String(point.count ?? 0)
              }
            ]} />
        </BarChart>
      </ReportCard>

      {/* 2.2 Lead Source Effectiveness */}
      <ReportCard
        title={t('reports.leadSourceEffectiveness')}
        icon={<BarChart3 className="size-4" />}
        isLoading={isLoading}
        isEmpty={sourceEffectivenessData.length === 0}>
        <BarChart
          data={sourceEffectivenessData}
          xDataKey="source"
          aspectRatio="16 / 9">
          <Grid horizontal />
          <Bar dataKey="total" fill={COLORS.total} lineCap="round" />
          <Bar dataKey="converted" fill={COLORS.converted} lineCap="round" />
          <BarXAxis showAllLabels />
          <ChartTooltip
            rows={(point) => {
              const total = Number(point.total ?? 0)
              const converted = Number(point.converted ?? 0)
              const rate =
                total > 0 ? ((converted / total) * 100).toFixed(1) : '0'

              return [
                {
                  color: COLORS.total,
                  label: t('reports.totalLeads'),
                  value: String(total)
                },
                {
                  color: COLORS.converted,
                  label: t('reports.converted'),
                  value: `${converted} (${rate}%)`
                }
              ]
            }} />
        </BarChart>
      </ReportCard>

      {/* 2.3 Lead Acquisition Trend */}
      <ReportCard
        title={t('reports.leadAcquisitionTrend')}
        icon={<TrendingUp className="size-4" />}
        isLoading={isLoading}
        isEmpty={acquisitionTrendData.data.length === 0}>
        <BarChart
          data={acquisitionTrendData.data}
          xDataKey="month"
          stacked
          aspectRatio="16 / 9">
          <Grid horizontal />
          {acquisitionTrendData.typeKeys.map((key, i) => (
            <Bar
              key={key}
              dataKey={key}
              fill={TYPE_COLORS[i % TYPE_COLORS.length]}
              lineCap="round" />
          ))}
          <BarXAxis showAllLabels />
          <ChartTooltip
            rows={point => acquisitionTrendData.typeKeys.map((key, i) => ({
                color: TYPE_COLORS[i % TYPE_COLORS.length],
                label: key,
                value: String(point[key] ?? 0)
              }))} />
        </BarChart>
      </ReportCard>
    </div>
  )
}
