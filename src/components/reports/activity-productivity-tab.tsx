import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, Building2, Globe } from 'lucide-react'
import { BarChart } from '@/components/charts/bar-chart'
import { Bar } from '@/components/charts/bar'
import { BarXAxis } from '@/components/charts/bar-x-axis'
import { Grid } from '@/components/charts/grid'
import { ChartTooltip } from '@/components/charts/tooltip'
import { ReportCard } from './report-card'
import { useDeals } from '@/hooks/use-deals'
import { useTasks } from '@/hooks/use-tasks'
import type { DateRange } from '@/hooks/use-report-query'
import {
  buildDateFilter,
  getMonthLabels,
  getMonthIndex,
} from '@/hooks/use-report-query'
import { formatCurrency } from '@/lib/formatters'

const COLORS = {
  completed: 'hsl(162, 100%, 39%)',
  overdue: 'hsl(0, 72%, 51%)',
  open: 'hsl(210, 100%, 50%)',
  dealCount: 'hsl(252, 56%, 68%)',
  dealValue: 'hsl(43, 100%, 57%)',
  country: 'hsl(18, 100%, 63%)',
}

interface ActivityProductivityTabProps {
  dateRange: DateRange
}

export function ActivityProductivityTab({
  dateRange,
}: ActivityProductivityTabProps) {
  const { t } = useTranslation()
  const filters = buildDateFilter(dateRange)

  const { data: tasks, isLoading: tasksLoading } = useTasks({
    filters,
    columns: ['id', 'status', 'end_date', 'created_on'],
    limit: 10000,
  })

  const { data: deals, isLoading: dealsLoading } = useDeals({
    filters,
    columns: [
      'id',
      'deal_value',
      'organizations(id,name)',
      'country(id,name)',
      'created_on',
    ],
    limit: 10000,
  })

  const isLoading = tasksLoading || dealsLoading
  const monthLabels = useMemo(() => getMonthLabels(dateRange), [dateRange])

  // 4.1 Task Completion Rate
  const taskCompletionData = useMemo(() => {
    if (!tasks) return []
    const now = new Date()
    const buckets = monthLabels.map((label) => ({
      month: label,
      completed: 0,
      overdue: 0,
      open: 0,
    }))

    for (const task of tasks as Array<any>) {
      const dateStr = task.created_on
      if (!dateStr) continue
      const idx = getMonthIndex(dateStr, dateRange.from)
      if (idx < 0 || idx >= buckets.length) continue

      const statusName =
        typeof task.status === 'object'
          ? task.status?.name?.toLowerCase()
          : (task.status || '').toLowerCase()

      if (
        statusName.includes('completed') ||
        statusName.includes('done') ||
        statusName.includes('closed')
      ) {
        buckets[idx]!.completed++
      } else if (task.end_date && new Date(task.end_date) < now) {
        buckets[idx]!.overdue++
      } else {
        buckets[idx]!.open++
      }
    }
    return buckets
  }, [tasks, monthLabels, dateRange])

  // 4.2 Company Engagement
  const companyEngagementData = useMemo(() => {
    if (!deals) return []
    const companyMap: Record<
      string,
      { company: string; dealCount: number; totalValue: number }
    > = {}

    for (const deal of deals as Array<any>) {
      const companyName =
        typeof deal.organizations === 'object'
          ? deal.organizations?.name
          : deal.organizations || 'Unknown'
      if (!companyMap[companyName]) {
        companyMap[companyName] = {
          company: companyName,
          dealCount: 0,
          totalValue: 0,
        }
      }
      companyMap[companyName]!.dealCount++
      companyMap[companyName]!.totalValue += Number(deal.deal_value ?? 0)
    }

    return Object.values(companyMap)
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 15)
  }, [deals])

  // 4.3 Geographic Analysis
  const geoData = useMemo(() => {
    if (!deals) return []
    const countryMap: Record<string, { country: string; value: number }> = {}

    for (const deal of deals as Array<any>) {
      const countryName =
        typeof deal.country === 'object'
          ? deal.country?.name
          : deal.country || 'Unknown'
      if (!countryMap[countryName]) {
        countryMap[countryName] = { country: countryName, value: 0 }
      }
      countryMap[countryName]!.value += Number(deal.deal_value ?? 0)
    }

    return Object.values(countryMap).sort((a, b) => b.value - a.value)
  }, [deals])

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* 4.1 Task Completion Rate */}
      <ReportCard
        title={t('reports.taskCompletionRate')}
        icon={<CheckCircle2 className="size-4" />}
        isLoading={isLoading}
        isEmpty={taskCompletionData.length === 0}
      >
        <BarChart
          data={taskCompletionData as Array<Record<string, unknown>>}
          xDataKey="month"
          stacked
          aspectRatio="16 / 9"
        >
          <Grid horizontal />
          <Bar dataKey="completed" fill={COLORS.completed} lineCap="round" />
          <Bar dataKey="overdue" fill={COLORS.overdue} lineCap="round" />
          <Bar dataKey="open" fill={COLORS.open} lineCap="round" />
          <BarXAxis showAllLabels />
          <ChartTooltip
            rows={(point) => [
              {
                color: COLORS.completed,
                label: t('reports.completed'),
                value: String(point.completed ?? 0),
              },
              {
                color: COLORS.overdue,
                label: t('reports.overdue'),
                value: String(point.overdue ?? 0),
              },
              {
                color: COLORS.open,
                label: t('reports.open'),
                value: String(point.open ?? 0),
              },
            ]}
          />
        </BarChart>
      </ReportCard>

      {/* 4.2 Company Engagement */}
      <ReportCard
        title={t('reports.companyEngagement')}
        icon={<Building2 className="size-4" />}
        isLoading={isLoading}
        isEmpty={companyEngagementData.length === 0}
      >
        <BarChart
          data={companyEngagementData as Array<Record<string, unknown>>}
          xDataKey="company"
          orientation="horizontal"
          aspectRatio="16 / 9"
        >
          <Grid horizontal />
          <Bar dataKey="totalValue" fill={COLORS.dealValue} lineCap="round" />
          <BarXAxis showAllLabels />
          <ChartTooltip
            rows={(point) => [
              {
                color: COLORS.dealValue,
                label: t('reports.totalValue'),
                value: formatCurrency(Number(point.totalValue ?? 0)),
              },
              {
                color: COLORS.dealCount,
                label: t('reports.dealCount'),
                value: String(point.dealCount ?? 0),
              },
            ]}
          />
        </BarChart>
      </ReportCard>

      {/* 4.3 Geographic Analysis */}
      <ReportCard
        title={t('reports.geographicAnalysis')}
        icon={<Globe className="size-4" />}
        isLoading={isLoading}
        isEmpty={geoData.length === 0}
      >
        <BarChart
          data={geoData as Array<Record<string, unknown>>}
          xDataKey="country"
          orientation="horizontal"
          aspectRatio="16 / 9"
        >
          <Grid horizontal />
          <Bar dataKey="value" fill={COLORS.country} lineCap="round" />
          <BarXAxis showAllLabels />
          <ChartTooltip
            rows={(point) => [
              {
                color: COLORS.country,
                label: String(point.country ?? ''),
                value: formatCurrency(Number(point.value ?? 0)),
              },
            ]}
          />
        </BarChart>
      </ReportCard>
    </div>
  )
}
