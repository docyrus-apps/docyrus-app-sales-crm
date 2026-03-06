import { useId, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import {
  BarChart3,
  Building2,
  Calendar,
  DollarSign,
  Flame,
  PieChartIcon,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react'
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
import { PageContainer } from '@/components/layout/page-container'
import {
  AwesomeCard,
  AwesomeCardBody,
  AwesomeCardHeader,
  AwesomeCardIcon,
  AwesomeCardTitle,
  AwesomeCardTrend,
  AwesomeCardValue,
} from '@/components/docyrus/awesome-card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useDeals } from '@/hooks/use-deals'
import { useLeads } from '@/hooks/use-leads'
import { useCompanies } from '@/hooks/use-companies'
import { useTasks } from '@/hooks/use-tasks'
import { formatCurrency, formatDate } from '@/lib/formatters'

const PIE_COLORS = [
  'hsl(210, 100%, 50%)',
  'hsl(162, 100%, 39%)',
  'hsl(43, 100%, 57%)',
  'hsl(18, 100%, 63%)',
  'hsl(252, 56%, 68%)',
  'hsl(140, 45%, 65%)',
]

const WEEK_BUCKETS = 8
const MONTH_BUCKETS = 8
const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000

function getValidDate(value: unknown): Date | null {
  if (!value) return null

  const date = value instanceof Date ? value : new Date(String(value))
  return Number.isNaN(date.getTime()) ? null : date
}

function getLeadLabel(lead: any, t: (key: string) => string) {
  return (
    lead.title?.trim() ||
    `${t('dashboard.untitledLead')} #${lead.id.slice(0, 6)}`
  )
}

function getSourceLabel(value: unknown, t: (key: string) => string) {
  if (typeof value === 'object' && value && 'name' in value) {
    return String((value as { name?: unknown }).name ?? '')
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    return value
  }

  return t('dashboard.unknownSource')
}

function buildWeeklySparkline(
  records: Array<any> | undefined,
  getDateValue: (record: any) => unknown,
  getAmount?: (record: any) => number,
) {
  const buckets = Array.from({ length: WEEK_BUCKETS }, () => 0)
  const start = Date.now() - (WEEK_BUCKETS - 1) * WEEK_IN_MS

  for (const record of records ?? []) {
    const date = getValidDate(getDateValue(record))
    if (!date) continue

    const bucketIndex = Math.floor((date.getTime() - start) / WEEK_IN_MS)
    if (bucketIndex < 0 || bucketIndex >= WEEK_BUCKETS) continue

    buckets[bucketIndex] += getAmount ? getAmount(record) : 1
  }

  return buckets
}

function buildMonthlyRevenueSparkline(records: Array<any> | undefined) {
  const buckets = Array.from({ length: MONTH_BUCKETS }, () => 0)
  const now = new Date()
  const startMonth = new Date(
    now.getFullYear(),
    now.getMonth() - (MONTH_BUCKETS - 1),
    1,
  )

  for (const record of records ?? []) {
    const date = getValidDate(record.expected_closing_date ?? record.created_on)
    if (!date) continue

    const bucketIndex =
      (date.getFullYear() - startMonth.getFullYear()) * 12 +
      (date.getMonth() - startMonth.getMonth())

    if (bucketIndex < 0 || bucketIndex >= MONTH_BUCKETS) continue

    buckets[bucketIndex] += Number(record.deal_value ?? 0)
  }

  return buckets
}

function MiniSparkline({
  data,
  className,
}: {
  data: Array<number>
  className?: string
}) {
  const gradientId = useId()
  const width = 120
  const height = 48
  const padding = 4
  const hasVariation = Math.max(...data, 0) !== Math.min(...data, 0)
  const min = hasVariation ? Math.min(...data) : 0
  const max = hasVariation ? Math.max(...data) : 1
  const range = max - min || 1

  const points = data.map((value, index) => {
    const x =
      data.length === 1
        ? width / 2
        : padding + (index * (width - padding * 2)) / (data.length - 1)
    const y = hasVariation
      ? padding + ((max - value) / range) * (height - padding * 2)
      : height / 2

    return { x, y }
  })

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')

  const areaPath = [
    `M ${points[0]?.x ?? padding} ${height - padding}`,
    ...points.map((point) => `L ${point.x} ${point.y}`),
    `L ${points.at(-1)?.x ?? width - padding} ${height - padding}`,
    'Z',
  ].join(' ')

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full"
        aria-hidden="true"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" x2="0%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.24" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path
          d={linePath}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.5"
        />
      </svg>
    </div>
  )
}

function PieLeadsBySource({ data }: { data: Array<PieData> }) {
  const { t } = useTranslation()
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const legendItems = data.map((item) => ({
    label: item.label,
    value: item.value,
    color: item.color ?? '',
    maxValue: data.reduce((sum, d) => sum + d.value, 0),
  }))

  return (
    <div className="flex items-center gap-6">
      <PieChart
        data={data}
        size={200}
        innerRadius={55}
        padAngle={0.03}
        cornerRadius={4}
        hoveredIndex={hoveredIndex}
        onHoverChange={setHoveredIndex}
      >
        {data.map((item, index) => (
          <PieSlice key={item.label} index={index} hoverEffect="grow" />
        ))}
        <PieCenter defaultLabel={t('dashboard.total')} />
      </PieChart>
      <Legend
        items={legendItems}
        hoveredIndex={hoveredIndex}
        onHoverChange={setHoveredIndex}
        className="flex-1"
      >
        <LegendItem className="flex items-center gap-2">
          <LegendMarker className="size-2.5 rounded-full" />
          <LegendLabel className="flex-1 text-sm" />
          <LegendValue className="text-sm font-medium tabular-nums" />
        </LegendItem>
      </Legend>
    </div>
  )
}

export function Dashboard() {
  const { t } = useTranslation()
  const { data: deals, isLoading: dealsLoading } = useDeals()
  const { data: leads, isLoading: leadsLoading } = useLeads()
  const { data: companies, isLoading: companiesLoading } = useCompanies()
  const { data: tasks, isLoading: tasksLoading } = useTasks()

  // Calculate stats
  const stats = useMemo(() => {
    const totalDeals = deals?.length || 0
    const totalRevenue =
      deals?.reduce((sum, deal: any) => sum + (deal.deal_value || 0), 0) || 0
    const totalLeads = leads?.length || 0
    const totalCompanies = companies?.length || 0

    // Get current month deals
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const monthlyRevenue =
      deals
        ?.filter((deal: any) => {
          if (!deal.expected_closing_date) return false
          const closeDate = new Date(deal.expected_closing_date)
          return (
            closeDate.getMonth() === currentMonth &&
            closeDate.getFullYear() === currentYear
          )
        })
        .reduce((sum, deal: any) => sum + (deal.deal_value || 0), 0) || 0

    return {
      totalDeals,
      totalRevenue,
      monthlyRevenue,
      totalLeads,
      totalCompanies,
    }
  }, [deals, leads, companies])

  // Pipeline by stage data
  const pipelineData = useMemo(() => {
    if (!deals) return []

    const stageGroups = deals.reduce((acc: any, deal: any) => {
      const stageName =
        deal.stage && typeof deal.stage === 'object'
          ? deal.stage.name
          : deal.stage || 'Unknown'
      if (!acc[stageName]) {
        acc[stageName] = { stage: stageName, count: 0, value: 0 }
      }
      acc[stageName].count++
      acc[stageName].value += deal.deal_value || 0
      return acc
    }, {})

    return Object.values(stageGroups)
  }, [deals])

  // Leads by source data (PieData format: { label, value, color })
  const leadsSourceData = useMemo(() => {
    if (!leads) return []

    const sourceGroups = leads.reduce((acc: any, lead: any) => {
      const sourceName =
        lead.lead_source && typeof lead.lead_source === 'object'
          ? lead.lead_source.name
          : lead.lead_source || 'Unknown'
      if (!acc[sourceName]) {
        acc[sourceName] = { label: sourceName, value: 0 }
      }
      acc[sourceName].value++
      return acc
    }, {})

    return Object.values(sourceGroups).map((item, index) => ({
      ...item,
      color: PIE_COLORS[index % PIE_COLORS.length],
    }))
  }, [leads])

  // Hot deals (top 5)
  const hotDeals = useMemo(() => {
    if (!deals) return []
    return deals
      .filter((deal: any) => deal.hot_prospect)
      .sort((a: any, b: any) => (b.deal_value || 0) - (a.deal_value || 0))
      .slice(0, 5)
  }, [deals])

  // Upcoming tasks (next 7 days)
  const upcomingTasks = useMemo(() => {
    if (!tasks) return []
    const now = new Date()
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    return tasks
      .filter((task: any) => {
        if (!task.end_date) return false
        const endDate = new Date(task.end_date)
        return endDate >= now && endDate <= next7Days
      })
      .sort(
        (a: any, b: any) =>
          new Date(a.end_date).getTime() - new Date(b.end_date).getTime(),
      )
      .slice(0, 5)
  }, [tasks])

  const newLeads = useMemo(() => (leads ?? []).slice(0, 5), [leads])

  const sparklineData = useMemo(
    () => ({
      deals: buildWeeklySparkline(deals, (deal) => deal.created_on),
      leads: buildWeeklySparkline(leads, (lead) => lead.created_on),
      companies: buildWeeklySparkline(
        companies,
        (company) => company.created_on,
      ),
      revenue: buildMonthlyRevenueSparkline(deals),
    }),
    [companies, deals, leads],
  )

  const isLoading =
    dealsLoading || leadsLoading || companiesLoading || tasksLoading

  return (
    <div className="h-full overflow-y-auto">
      <PageContainer className="space-y-8 pb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t('dashboard.title')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('dashboard.subtitle')}
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <AwesomeCard className="animate-fade-in-up">
            <AwesomeCardHeader>
              <AwesomeCardTitle>{t('dashboard.totalDeals')}</AwesomeCardTitle>
              <AwesomeCardIcon>
                <DollarSign className="size-4" />
              </AwesomeCardIcon>
            </AwesomeCardHeader>
            <AwesomeCardBody>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="flex items-end justify-between gap-4">
                  <div className="min-w-0">
                    <AwesomeCardValue>{stats.totalDeals}</AwesomeCardValue>
                    <AwesomeCardTrend>
                      {t('dashboard.activeDealsInPipeline')}
                    </AwesomeCardTrend>
                  </div>
                  <MiniSparkline
                    data={sparklineData.deals}
                    className="h-12 w-24 text-emerald-500"
                  />
                </div>
              )}
            </AwesomeCardBody>
          </AwesomeCard>

          <AwesomeCard className="animate-fade-in-up">
            <AwesomeCardHeader>
              <AwesomeCardTitle>{t('dashboard.leads')}</AwesomeCardTitle>
              <AwesomeCardIcon>
                <Users className="size-4" />
              </AwesomeCardIcon>
            </AwesomeCardHeader>
            <AwesomeCardBody>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="flex items-end justify-between gap-4">
                  <div className="min-w-0">
                    <AwesomeCardValue>{stats.totalLeads}</AwesomeCardValue>
                    <AwesomeCardTrend>
                      {t('dashboard.totalLeads')}
                    </AwesomeCardTrend>
                  </div>
                  <MiniSparkline
                    data={sparklineData.leads}
                    className="h-12 w-24 text-sky-500"
                  />
                </div>
              )}
            </AwesomeCardBody>
          </AwesomeCard>

          <AwesomeCard className="animate-fade-in-up">
            <AwesomeCardHeader>
              <AwesomeCardTitle>{t('dashboard.companies')}</AwesomeCardTitle>
              <AwesomeCardIcon>
                <Building2 className="size-4" />
              </AwesomeCardIcon>
            </AwesomeCardHeader>
            <AwesomeCardBody>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="flex items-end justify-between gap-4">
                  <div className="min-w-0">
                    <AwesomeCardValue>{stats.totalCompanies}</AwesomeCardValue>
                    <AwesomeCardTrend>
                      {t('dashboard.activeCompanies')}
                    </AwesomeCardTrend>
                  </div>
                  <MiniSparkline
                    data={sparklineData.companies}
                    className="h-12 w-24 text-violet-500"
                  />
                </div>
              )}
            </AwesomeCardBody>
          </AwesomeCard>

          <AwesomeCard className="animate-fade-in-up">
            <AwesomeCardHeader>
              <AwesomeCardTitle>{t('dashboard.revenue')}</AwesomeCardTitle>
              <AwesomeCardIcon>
                <TrendingUp className="size-4" />
              </AwesomeCardIcon>
            </AwesomeCardHeader>
            <AwesomeCardBody>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="flex items-end justify-between gap-4">
                  <div className="min-w-0">
                    <AwesomeCardValue>
                      {formatCurrency(stats.monthlyRevenue)}
                    </AwesomeCardValue>
                    <AwesomeCardTrend>
                      {t('dashboard.thisMonth')}
                    </AwesomeCardTrend>
                  </div>
                  <MiniSparkline
                    data={sparklineData.revenue}
                    className="h-12 w-24 text-amber-500"
                  />
                </div>
              )}
            </AwesomeCardBody>
          </AwesomeCard>
        </div>

        {/* Charts */}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <AwesomeCard className="animate-fade-in-up">
            <AwesomeCardHeader>
              <AwesomeCardTitle>
                {t('dashboard.pipelineByStage')}
              </AwesomeCardTitle>
              <AwesomeCardIcon>
                <BarChart3 className="size-4" />
              </AwesomeCardIcon>
            </AwesomeCardHeader>
            <AwesomeCardBody>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : pipelineData.length === 0 ? (
                <p className="text-sm text-muted-foreground py-12 text-center">
                  {t('dashboard.noDealsInPipeline')}
                </p>
              ) : (
                <BarChart
                  data={pipelineData as Array<Record<string, unknown>>}
                  xDataKey="stage"
                  aspectRatio="16 / 9"
                >
                  <Grid horizontal />
                  <Bar
                    dataKey="count"
                    fill="hsl(252, 56%, 68%)"
                    lineCap="round"
                  />
                  <BarXAxis showAllLabels />
                  <ChartTooltip
                    rows={(point) => [
                      {
                        color: 'hsl(252, 56%, 68%)',
                        label: t('dashboard.dealCount'),
                        value: String(point.count ?? 0),
                      },
                    ]}
                  />
                </BarChart>
              )}
            </AwesomeCardBody>
          </AwesomeCard>

          <AwesomeCard className="animate-fade-in-up">
            <AwesomeCardHeader>
              <AwesomeCardTitle>
                {t('dashboard.leadsBySource')}
              </AwesomeCardTitle>
              <AwesomeCardIcon>
                <PieChartIcon className="size-4" />
              </AwesomeCardIcon>
            </AwesomeCardHeader>
            <AwesomeCardBody>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : leadsSourceData.length === 0 ? (
                <p className="text-sm text-muted-foreground py-12 text-center">
                  {t('dashboard.noLeadsDataAvailable')}
                </p>
              ) : (
                <PieLeadsBySource data={leadsSourceData} />
              )}
            </AwesomeCardBody>
          </AwesomeCard>
        </div>

        {/* Widgets */}
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AwesomeCard className="animate-fade-in-up">
            <AwesomeCardHeader>
              <AwesomeCardTitle>{t('dashboard.newLeads')}</AwesomeCardTitle>
              <AwesomeCardIcon>
                <UserPlus className="size-4" />
              </AwesomeCardIcon>
            </AwesomeCardHeader>
            <AwesomeCardBody>
              {leadsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              ) : newLeads.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t('dashboard.noNewLeads')}
                </p>
              ) : (
                <div className="space-y-3">
                  {newLeads.map((lead: any) => (
                    <Link
                      key={lead.id}
                      to="/leads/$leadId"
                      params={{ leadId: lead.id }}
                      className="block rounded-lg border border-border/60 bg-background/60 p-3 transition-colors hover:bg-muted/70"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {getLeadLabel(lead, t)}
                          </p>
                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {typeof lead.company_name === 'object' &&
                            lead.company_name?.name
                              ? lead.company_name.name
                              : getSourceLabel(lead.lead_source, t)}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="max-w-full">
                            <span className="truncate">
                              {getSourceLabel(lead.lead_source, t)}
                            </span>
                          </Badge>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDate(lead.created_on)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </AwesomeCardBody>
          </AwesomeCard>

          <AwesomeCard className="animate-fade-in-up">
            <AwesomeCardHeader>
              <AwesomeCardTitle>{t('dashboard.hotDeals')}</AwesomeCardTitle>
              <AwesomeCardIcon>
                <Flame className="size-4 text-orange-500" />
              </AwesomeCardIcon>
            </AwesomeCardHeader>
            <AwesomeCardBody>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : hotDeals.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t('dashboard.noHotDeals')}
                </p>
              ) : (
                <div className="space-y-3">
                  {hotDeals.map((deal: any) => (
                    <Link
                      key={deal.id}
                      to="/deals/$dealId"
                      params={{ dealId: deal.id }}
                      className="block"
                    >
                      <div className="flex items-center justify-between hover:bg-muted p-2 rounded-md transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {typeof deal.organizations === 'object'
                              ? deal.organizations.name
                              : 'Deal'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {typeof deal.stage === 'object'
                              ? deal.stage.name
                              : deal.stage}
                          </p>
                        </div>
                        <div className="text-sm font-medium">
                          {formatCurrency(deal.deal_value || 0)}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </AwesomeCardBody>
          </AwesomeCard>

          <AwesomeCard className="animate-fade-in-up">
            <AwesomeCardHeader>
              <AwesomeCardTitle>
                {t('dashboard.upcomingTasks')}
              </AwesomeCardTitle>
              <AwesomeCardIcon>
                <Calendar className="size-4" />
              </AwesomeCardIcon>
            </AwesomeCardHeader>
            <AwesomeCardBody>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : upcomingTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t('dashboard.noUpcomingTasks')}
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingTasks.map((task: any) => (
                    <div
                      key={task.id}
                      className="flex items-start justify-between gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {task.subject}
                        </p>
                        {task.status && (
                          <Badge variant="outline" className="mt-1">
                            {typeof task.status === 'object'
                              ? task.status.name
                              : task.status}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(task.end_date)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </AwesomeCardBody>
          </AwesomeCard>
        </div>
      </PageContainer>
    </div>
  )
}
