import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import {
  Bell,
  CheckSquare,
  DollarSign,
  InboxIcon,
  UserRoundSearch,
} from 'lucide-react'
import type { ActivityItem } from '@/hooks/use-recent-activity'
import {
  AwesomeCard,
  AwesomeCardBody,
  AwesomeCardHeader,
  AwesomeCardIcon,
  AwesomeCardTitle,
} from '@/components/docyrus/awesome-card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { useRecentActivity } from '@/hooks/use-recent-activity'

type TabValue = 'today' | 'yesterday' | 'this_week'

const TYPE_COLORS: Record<string, string> = {
  deal: 'bg-emerald-500',
  lead: 'bg-blue-500',
  task: 'bg-amber-500',
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  deal: DollarSign,
  lead: UserRoundSearch,
  task: CheckSquare,
}

function timeAgo(
  dateStr: string,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return t('dashboard.timeAgo.justNow')
  if (mins < 60) return t('dashboard.timeAgo.minutesAgo', { count: mins })
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return t('dashboard.timeAgo.hoursAgo', { count: hrs })
  const days = Math.floor(hrs / 24)
  return t('dashboard.timeAgo.daysAgo', { count: days })
}

function getDateRange(tab: TabValue): { start: Date; end: Date } {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(todayStart)
  todayEnd.setDate(todayEnd.getDate() + 1)

  if (tab === 'today') {
    return { start: todayStart, end: todayEnd }
  }
  if (tab === 'yesterday') {
    const yesterdayStart = new Date(todayStart)
    yesterdayStart.setDate(yesterdayStart.getDate() - 1)
    return { start: yesterdayStart, end: todayStart }
  }
  // this_week
  const weekStart = new Date(todayStart)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  return { start: weekStart, end: todayEnd }
}

function getDetailLink(item: ActivityItem): string {
  switch (item.type) {
    case 'deal':
      return `/deals/${item.id}`
    case 'lead':
      return `/leads/${item.id}`
    case 'task':
      return `/tasks`
    default:
      return '/'
  }
}

export function LatestUpdatesPanel() {
  const { t } = useTranslation()
  const { data: items, isLoading } = useRecentActivity({ limit: 20 })
  const [tab, setTab] = useState<TabValue>('today')

  const filtered = useMemo(() => {
    if (!items) return []
    const { start, end } = getDateRange(tab)

    return items.filter((item) => {
      if (!item.modifiedOn) return false
      const d = new Date(item.modifiedOn)
      return d >= start && d < end
    })
  }, [items, tab])

  return (
    <AwesomeCard className="h-fit">
      <AwesomeCardHeader>
        <div className="flex items-center gap-2">
          <AwesomeCardIcon>
            <Bell className="size-5" />
          </AwesomeCardIcon>
          <AwesomeCardTitle>{t('dashboard.latestUpdates')}</AwesomeCardTitle>
        </div>
      </AwesomeCardHeader>
      <AwesomeCardBody className="px-3 py-3">
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as TabValue)}
          className="mb-3"
        >
          <TabsList className="h-8 w-full">
            <TabsTrigger value="today" className="flex-1 text-xs">
              {t('dashboard.today')}
            </TabsTrigger>
            <TabsTrigger value="yesterday" className="flex-1 text-xs">
              {t('dashboard.yesterday')}
            </TabsTrigger>
            <TabsTrigger value="this_week" className="flex-1 text-xs">
              {t('dashboard.thisWeek')}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-0.5">
          {isLoading && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {t('dashboard.loadingActivity')}
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
              <InboxIcon className="size-5 text-muted-foreground/70" />
              {t('dashboard.noUpdates')}
            </div>
          )}

          {filtered.map((item) => {
            const Icon = TYPE_ICONS[item.type] ?? Bell
            const dotColor = TYPE_COLORS[item.type] ?? 'bg-gray-400'

            return (
              <Link
                key={`${item.type}-${item.id}`}
                to={getDetailLink(item)}
                className="group flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted/50"
              >
                <div
                  className={cn(
                    'mt-1.5 flex size-5 shrink-0 items-center justify-center rounded-full',
                    dotColor,
                  )}
                >
                  <Icon className="size-3 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.modifiedBy ?? t(`dashboard.${item.type}`)}
                    {item.subtitle && (
                      <span className="text-muted-foreground/70">
                        {' '}
                        &middot; {item.subtitle}
                      </span>
                    )}
                  </p>
                </div>
                {item.modifiedOn && (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {timeAgo(item.modifiedOn, t)}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </AwesomeCardBody>
    </AwesomeCard>
  )
}
