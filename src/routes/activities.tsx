import { useMemo, useState } from 'react'
import {
  Zap,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  Filter,
  Loader2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  useMyAuditActivities,
  type AuditActivity,
} from '@/hooks/use-audit-activities'
import { formatDate } from '@/lib/formatters'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

type DateRange = '7d' | '30d' | '90d' | 'all'

function getDateRangeStart(range: DateRange): string | undefined {
  if (range === 'all') return undefined
  const now = new Date()
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
  now.setDate(now.getDate() - days)
  return now.toISOString()
}

function getOperationIcon(operation: string) {
  const op = operation?.toLowerCase()
  if (op?.includes('insert') || op?.includes('create')) {
    return <Plus className="h-3.5 w-3.5" />
  }
  if (op?.includes('delete') || op?.includes('remove')) {
    return <Trash2 className="h-3.5 w-3.5" />
  }
  return <Pencil className="h-3.5 w-3.5" />
}

function getOperationColor(operation: string) {
  const op = operation?.toLowerCase()
  if (op?.includes('insert') || op?.includes('create')) {
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
  }
  if (op?.includes('delete') || op?.includes('remove')) {
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  }
  return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
}

function getOperationLabel(operation: string, t: (key: string) => string) {
  const op = operation?.toLowerCase()
  if (op?.includes('insert') || op?.includes('create')) {
    return t('activities.operations.create')
  }
  if (op?.includes('delete') || op?.includes('remove')) {
    return t('activities.operations.delete')
  }
  return t('activities.operations.update')
}

function getUserDisplayName(user: AuditActivity['created_by_user']): string {
  if (!user) return 'System'
  return (
    [user.firstname, user.lastname].filter(Boolean).join(' ') ||
    user.name ||
    user.email ||
    'Unknown'
  )
}

function getUserInitials(user: AuditActivity['created_by_user']): string {
  if (!user) return 'S'
  const first = user.firstname?.[0] || ''
  const last = user.lastname?.[0] || ''
  if (first || last) return (first + last).toUpperCase()
  return (user.name?.[0] || user.email?.[0] || '?').toUpperCase()
}

function groupActivitiesByDate(
  activities: Array<AuditActivity>,
): Array<{ label: string; items: Array<AuditActivity> }> {
  const groups = new Map<string, Array<AuditActivity>>()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  for (const activity of activities) {
    const date = activity.created_on ? new Date(activity.created_on) : null
    let label: string
    if (!date) {
      label = 'Unknown'
    } else {
      const d = new Date(date)
      d.setHours(0, 0, 0, 0)
      if (d.getTime() === today.getTime()) {
        label = 'Today'
      } else if (d.getTime() === yesterday.getTime()) {
        label = 'Yesterday'
      } else {
        label =
          formatDate(date, { format: 'long' }).split(',')[0] || formatDate(date)
      }
    }
    const existing = groups.get(label) ?? []
    existing.push(activity)
    groups.set(label, existing)
  }

  return Array.from(groups.entries()).map(([label, items]) => ({
    label,
    items,
  }))
}

const PAGE_SIZE = 50

export function Activities() {
  const { t } = useTranslation()
  const [dateRange, setDateRange] = useState<DateRange>('30d')
  const [offset, setOffset] = useState(0)

  const createdAfter = useMemo(() => getDateRangeStart(dateRange), [dateRange])

  const { data: activities = [], isLoading } = useMyAuditActivities({
    limit: PAGE_SIZE,
    offset,
    createdAfter,
  })

  const groupedActivities = useMemo(
    () => groupActivitiesByDate(activities),
    [activities],
  )

  const hasMore = activities.length === PAGE_SIZE

  return (
    <>
      <PageHeader
        title={t('activities.title')}
        icon={<Zap className="h-4 w-4 text-orange-500" />}
        actions={
          <div className="flex items-center gap-2">
            <Select
              value={dateRange}
              onValueChange={(value) => {
                setDateRange(value as DateRange)
                setOffset(0)
              }}
            >
              <SelectTrigger className="w-[160px]">
                <Filter className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">
                  {t('activities.filters.last7Days')}
                </SelectItem>
                <SelectItem value="30d">
                  {t('activities.filters.last30Days')}
                </SelectItem>
                <SelectItem value="90d">
                  {t('activities.filters.last90Days')}
                </SelectItem>
                <SelectItem value="all">
                  {t('activities.filters.allTime')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />
      <PageContainer>
        {isLoading ? (
          <Card>
            <CardContent className="space-y-6 p-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-start gap-4">
                  <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : activities.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Zap className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">{t('activities.empty')}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('activities.emptyDescription')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {groupedActivities.map((group) => (
              <div key={group.label}>
                <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                  {group.label}
                </h3>
                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {group.items.map((activity) => (
                        <ActivityItem key={activity.id} activity={activity} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}

            {(hasMore || offset > 0) && (
              <div className="flex items-center justify-center gap-2 pt-2">
                {offset > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                  >
                    Previous
                  </Button>
                )}
                {hasMore && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOffset(offset + PAGE_SIZE)}
                  >
                    {t('activities.loadMore')}
                    <ChevronDown className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </PageContainer>
    </>
  )
}

function ActivityItem({ activity }: { activity: AuditActivity }) {
  const { t } = useTranslation()
  const userName = getUserDisplayName(activity.created_by_user)
  const initials = getUserInitials(activity.created_by_user)
  const operationColor = getOperationColor(activity.operation)
  const operationIcon = getOperationIcon(activity.operation)
  const operationLabel = getOperationLabel(activity.operation, t)

  return (
    <div className="flex items-start gap-4 px-4 py-3.5">
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
          'bg-muted text-muted-foreground',
        )}
        title={userName}
      >
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{userName}</span>
          <Badge
            variant="secondary"
            className={cn('gap-1 text-xs font-normal', operationColor)}
          >
            {operationIcon}
            {operationLabel}
          </Badge>
          {activity.data_source_name && (
            <Badge variant="outline" className="text-xs font-normal">
              {activity.data_source_name}
            </Badge>
          )}
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {activity.shortDescription || activity.description}
        </p>
        {activity.title && (
          <p className="mt-0.5 text-xs text-muted-foreground/70">
            {activity.title}
          </p>
        )}
      </div>
      <span className="shrink-0 text-xs text-muted-foreground">
        {activity.created_on
          ? formatDate(activity.created_on, { format: 'relative' })
          : ''}
      </span>
    </div>
  )
}
