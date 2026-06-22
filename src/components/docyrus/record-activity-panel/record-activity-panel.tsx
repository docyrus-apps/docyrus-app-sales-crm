'use client'

import { useMemo, useState } from 'react'

import { Check, ListFilter, type LucideIcon } from 'lucide-react'

import {
  ActivityIcon,
  ArrowRightLeftIcon,
  EditIcon,
  MessageSquareIcon,
  PaperclipIcon,
  PlusCircleIcon,
  Trash2Icon,
} from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDescription,
  TimelineDot,
  TimelineHeader,
  TimelineItem,
  TimelineTime,
  TimelineTitle,
} from '@/components/ui/timeline'
import { cn } from '@/lib/utils'

import { formatDate } from './lib/format'
import { type RecordActivity, type RecordActivityPanelProps } from './types'

const OPERATION_CONFIG: Record<
  string,
  { icon: LucideIcon; className: string }
> = {
  INSERT: { icon: PlusCircleIcon, className: 'text-green-500' },
  UPDATE: { icon: EditIcon, className: 'text-blue-500' },
  DELETE: { icon: Trash2Icon, className: 'text-red-500' },
  TRASH: { icon: Trash2Icon, className: 'text-red-500' },
  STATUS_UPDATE: { icon: ArrowRightLeftIcon, className: 'text-yellow-500' },
  INSERT_COMMENT: { icon: MessageSquareIcon, className: 'text-purple-500' },
  UPDATE_COMMENT: { icon: MessageSquareIcon, className: 'text-purple-500' },
  DELETE_COMMENT: { icon: MessageSquareIcon, className: 'text-red-500' },
  INSERT_FILE: { icon: PaperclipIcon, className: 'text-orange-500' },
  UPDATE_FILE: { icon: PaperclipIcon, className: 'text-orange-500' },
  DELETE_FILE: { icon: PaperclipIcon, className: 'text-red-500' },
}

const DEFAULT_CONFIG = {
  icon: ActivityIcon,
  className: 'text-muted-foreground',
}

function getOperationConfig(operation: string) {
  return OPERATION_CONFIG[operation] ?? DEFAULT_CONFIG
}

function getActorName(activity: RecordActivity): string {
  const user = activity.created_by_user

  if (!user) return 'System'
  const name = [user.firstname, user.lastname].filter(Boolean).join(' ')

  return name || user.name || 'System'
}

// Raw audit operations reduced to readable categories for the filter.
const CATEGORY_ORDER = [
  'Created',
  'Updated',
  'Status',
  'Comments',
  'Files',
  'Deleted',
  'Other',
] as const

type ActivityCategory = (typeof CATEGORY_ORDER)[number]

function categoryOf(operation: string): ActivityCategory {
  switch (operation) {
    case 'INSERT':
      return 'Created'

    case 'UPDATE':
      return 'Updated'

    case 'STATUS_UPDATE':
      return 'Status'

    case 'DELETE':

    case 'TRASH':
      return 'Deleted'

    default:
      if (operation.endsWith('_COMMENT')) return 'Comments'
      if (operation.endsWith('_FILE')) return 'Files'

      return 'Other'
  }
}

export function RecordActivityPanel({
  activities,
  isLoading,
  className,
  filterable,
}: RecordActivityPanelProps) {
  const [hidden, setHidden] = useState<Set<string>>(() => new Set())

  const presentCategories = useMemo(() => {
    const set = new Set<ActivityCategory>()

    for (const activity of activities ?? []) {
      set.add(categoryOf(activity.operation))
    }

    return CATEGORY_ORDER.filter((category) => set.has(category))
  }, [activities])

  const visibleActivities = useMemo(
    () =>
      (activities ?? []).filter(
        (activity) => !hidden.has(categoryOf(activity.operation)),
      ),
    [activities, hidden],
  )

  const toggleCategory = (category: ActivityCategory) =>
    setHidden((prev) => {
      const next = new Set(prev)

      if (next.has(category)) next.delete(category)
      else next.add(category)

      return next
    })

  if (isLoading) {
    return (
      <div
        className={cn(
          'space-y-4 flex flex-col items-center justify-center',
          className,
        )}
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-block size-4 animate-spin rounded-full border-2 border-border border-t-foreground/70" />
          Loading activity…
        </div>
        <div className="w-full max-w-2xl space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="flex gap-3">
              <Skeleton className="size-8 shrink-0 rounded-full bg-muted/70" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-32 bg-muted/70" />
                <Skeleton className="h-4 w-full bg-muted/70" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!activities || activities.length === 0) {
    return (
      <div
        className={`flex flex-col items-center gap-2 py-8 text-center ${className ?? ''}`}
      >
        <ActivityIcon className="size-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">No activity yet</p>
        <p className="text-xs text-muted-foreground">
          Activity will appear here when changes are made to this record.
        </p>
      </div>
    )
  }

  const showFilter = Boolean(filterable) && presentCategories.length > 1
  const hasActiveFilter = hidden.size > 0

  return (
    <div className={cn('space-y-2', className)}>
      {showFilter && (
        <div className="flex items-center justify-end">
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                  hasActiveFilter && 'text-primary',
                )}
              >
                <ListFilter className="size-3.5" />
                Filter
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-44 p-1">
              {presentCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors hover:bg-muted"
                >
                  <Check
                    className={cn(
                      'size-3.5 shrink-0',
                      hidden.has(category) ? 'opacity-0' : 'opacity-100',
                    )}
                  />
                  {category}
                </button>
              ))}
            </PopoverContent>
          </Popover>
        </div>
      )}
      <Timeline className="[--timeline-dot-size:2rem]">
        {visibleActivities.map((activity) => {
          const config = getOperationConfig(activity.operation)
          const Icon = config.icon
          const actorName = getActorName(activity)

          return (
            <TimelineItem key={activity.id}>
              <TimelineDot>
                <Icon className={`size-3.5 ${config.className}`} />
              </TimelineDot>
              <TimelineConnector />
              <TimelineContent>
                <TimelineHeader>
                  {activity.created_on && (
                    <TimelineTime dateTime={activity.created_on}>
                      {formatDate(activity.created_on, {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </TimelineTime>
                  )}
                  <TimelineTitle className="text-sm">{actorName}</TimelineTitle>
                </TimelineHeader>
                <TimelineDescription>
                  {activity.shortDescription || activity.description}
                </TimelineDescription>
              </TimelineContent>
            </TimelineItem>
          )
        })}
      </Timeline>
      {visibleActivities.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No activity matches the selected filters.
        </p>
      )}
    </div>
  )
}
