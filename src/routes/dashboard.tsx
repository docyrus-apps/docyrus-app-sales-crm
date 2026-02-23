import { useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Building2,
  Calendar,
  DollarSign,
  Flame,
  TrendingUp,
  Users,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import {
  AwesomeCard,
  AwesomeCardBody,
  AwesomeCardHeader,
  AwesomeCardIcon,
  AwesomeCardTitle,
  AwesomeCardTrend,
  AwesomeCardValue,
} from '@/components/docyrus/awesome-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useDeals } from '@/hooks/use-deals'
import { useLeads } from '@/hooks/use-leads'
import { useCompanies } from '@/hooks/use-companies'
import { useTasks } from '@/hooks/use-tasks'
import { formatCurrency, formatDate } from '@/lib/formatters'

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884D8',
  '#82CA9D',
]

export function Dashboard() {
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

  // Leads by source data
  const leadsSourceData = useMemo(() => {
    if (!leads) return []

    const sourceGroups = leads.reduce((acc: any, lead: any) => {
      const sourceName =
        lead.lead_source && typeof lead.lead_source === 'object'
          ? lead.lead_source.name
          : lead.lead_source || 'Unknown'
      if (!acc[sourceName]) {
        acc[sourceName] = { name: sourceName, value: 0 }
      }
      acc[sourceName].value++
      return acc
    }, {})

    return Object.values(sourceGroups)
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

  const isLoading =
    dealsLoading || leadsLoading || companiesLoading || tasksLoading

  return (
    <>
      <PageHeader title="Dashboard" />
      <PageContainer>
        {/* Stat Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <AwesomeCard className="animate-fade-in-up">
            <AwesomeCardHeader>
              <AwesomeCardTitle>Total Deals</AwesomeCardTitle>
              <AwesomeCardIcon>
                <DollarSign className="size-4" />
              </AwesomeCardIcon>
            </AwesomeCardHeader>
            <AwesomeCardBody>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <AwesomeCardValue>{stats.totalDeals}</AwesomeCardValue>
                  <AwesomeCardTrend>Active deals in pipeline</AwesomeCardTrend>
                </>
              )}
            </AwesomeCardBody>
          </AwesomeCard>

          <AwesomeCard className="animate-fade-in-up">
            <AwesomeCardHeader>
              <AwesomeCardTitle>Leads</AwesomeCardTitle>
              <AwesomeCardIcon>
                <Users className="size-4" />
              </AwesomeCardIcon>
            </AwesomeCardHeader>
            <AwesomeCardBody>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <AwesomeCardValue>{stats.totalLeads}</AwesomeCardValue>
                  <AwesomeCardTrend>Total leads</AwesomeCardTrend>
                </>
              )}
            </AwesomeCardBody>
          </AwesomeCard>

          <AwesomeCard className="animate-fade-in-up">
            <AwesomeCardHeader>
              <AwesomeCardTitle>Companies</AwesomeCardTitle>
              <AwesomeCardIcon>
                <Building2 className="size-4" />
              </AwesomeCardIcon>
            </AwesomeCardHeader>
            <AwesomeCardBody>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <AwesomeCardValue>{stats.totalCompanies}</AwesomeCardValue>
                  <AwesomeCardTrend>Active companies</AwesomeCardTrend>
                </>
              )}
            </AwesomeCardBody>
          </AwesomeCard>

          <AwesomeCard className="animate-fade-in-up">
            <AwesomeCardHeader>
              <AwesomeCardTitle>Revenue</AwesomeCardTitle>
              <AwesomeCardIcon>
                <TrendingUp className="size-4" />
              </AwesomeCardIcon>
            </AwesomeCardHeader>
            <AwesomeCardBody>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <AwesomeCardValue>
                    {formatCurrency(stats.monthlyRevenue)}
                  </AwesomeCardValue>
                  <AwesomeCardTrend>This month</AwesomeCardTrend>
                </>
              )}
            </AwesomeCardBody>
          </AwesomeCard>
        </div>

        {/* Charts */}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <AwesomeCard className="animate-fade-in-up">
            <AwesomeCardHeader>
              <AwesomeCardTitle>Pipeline by Stage</AwesomeCardTitle>
            </AwesomeCardHeader>
            <AwesomeCardBody>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : pipelineData.length === 0 ? (
                <p className="text-sm text-muted-foreground py-12 text-center">
                  No deals in pipeline
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={pipelineData}>
                    <XAxis
                      dataKey="stage"
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#8884d8" name="Deal Count" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </AwesomeCardBody>
          </AwesomeCard>

          <AwesomeCard className="animate-fade-in-up">
            <AwesomeCardHeader>
              <AwesomeCardTitle>Leads by Source</AwesomeCardTitle>
            </AwesomeCardHeader>
            <AwesomeCardBody>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : leadsSourceData.length === 0 ? (
                <p className="text-sm text-muted-foreground py-12 text-center">
                  No leads data available
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={leadsSourceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {leadsSourceData.map((_entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </AwesomeCardBody>
          </AwesomeCard>
        </div>

        {/* Widgets */}
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AwesomeCard className="animate-fade-in-up">
            <AwesomeCardHeader>
              <AwesomeCardTitle>Quick Actions</AwesomeCardTitle>
            </AwesomeCardHeader>
            <AwesomeCardBody className="space-y-2">
              <Link to="/deals">
                <Button variant="outline" className="w-full justify-start">
                  <DollarSign className="mr-2 h-4 w-4" />
                  View Deals Pipeline
                </Button>
              </Link>
              <Link to="/leads">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  Manage Leads
                </Button>
              </Link>
              <Link to="/companies">
                <Button variant="outline" className="w-full justify-start">
                  <Building2 className="mr-2 h-4 w-4" />
                  Browse Companies
                </Button>
              </Link>
            </AwesomeCardBody>
          </AwesomeCard>

          <AwesomeCard className="animate-fade-in-up">
            <AwesomeCardHeader>
              <AwesomeCardTitle>Hot Deals</AwesomeCardTitle>
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
                <p className="text-sm text-muted-foreground">No hot deals</p>
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
              <AwesomeCardTitle>Upcoming Tasks</AwesomeCardTitle>
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
                  No upcoming tasks
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
    </>
  )
}
