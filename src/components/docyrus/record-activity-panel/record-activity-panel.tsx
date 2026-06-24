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
import { cn } from '@/lib/utils'

import { formatDate } from './lib/format'
import { type RecordActivity, type RecordActivityPanelProps } from './types'

// Per-operation icon, icon color, and a soft tinted dot background.
const OPERATION_CONFIG: Record<
  string,
  { icon: LucideIcon; className: string; dotClassName: string }
> = {
  INSERT: {
    icon: PlusCircleIcon,
    className: 'text-emerald-500',
    dotClassName: 'bg-emerald-500/10',
  },
  UPDATE: {
    icon: EditIcon,
    className: 'text-blue-500',
    dotClassName: 'bg-blue-500/10',
  },
  DELETE: {
    icon: Trash2Icon,
    className: 'text-red-500',
    dotClassName: 'bg-red-500/10',
  },
  TRASH: {
    icon: Trash2Icon,
    className: 'text-red-500',
    dotClassName: 'bg-red-500/10',
  },
  STATUS_UPDATE: {
    icon: ArrowRightLeftIcon,
    className: 'text-amber-500',
    dotClassName: 'bg-amber-500/10',
  },
  INSERT_COMMENT: {
    icon: MessageSquareIcon,
    className: 'text-violet-500',
    dotClassName: 'bg-violet-500/10',
  },
  UPDATE_COMMENT: {
    icon: MessageSquareIcon,
    className: 'text-violet-500',
    dotClassName: 'bg-violet-500/10',
  },
  DELETE_COMMENT: {
    icon: MessageSquareIcon,
    className: 'text-red-500',
    dotClassName: 'bg-red-500/10',
  },
  INSERT_FILE: {
    icon: PaperclipIcon,
    className: 'text-orange-500',
    dotClassName: 'bg-orange-500/10',
  },
  UPDATE_FILE: {
    icon: PaperclipIcon,
    className: 'text-orange-500',
    dotClassName: 'bg-orange-500/10',
  },
  DELETE_FILE: {
    icon: PaperclipIcon,
    className: 'text-red-500',
    dotClassName: 'bg-red-500/10',
  },
}

const DEFAULT_CONFIG = {
  icon: ActivityIcon,
  className: 'text-muted-foreground',
  dotClassName: 'bg-muted',
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

/**
 * The raw audit text repeats context that the timeline already shows in the
 * header (actor + date) and carries noise from missing record labels, e.g.
 *   "Leads () is updated by Oliver Carter."
 *   "A new Leads () is created by Oliver Carter."
 * Strip the trailing "by <actor>", any embedded "on … GMT" timestamp, and
 * empty "()" fragments so the description reads once, cleanly:
 *   "Leads is updated" / "A new Leads is created".
 */
function cleanActivityText(activity: RecordActivity): string {
  const raw = (activity.shortDescription || activity.description || '').trim()

  if (!raw) return ''

  return (
    raw
      // Embedded "on <weekday> <month> <day> … GMT…" timestamp (date is in the header).
      .replace(/\s*\bon\s+.*?GMT[^.]*/gi, '')
      // Trailing "by <actor>" (actor is the header title).
      .replace(/\s*\bby\s+[^.]+?(?=\.?\s*$)/i, '')
      // Empty "( )" fragments left by missing record labels.
      .replace(/\(\s*\)/g, '')
      // Tidy whitespace and dangling punctuation.
      .replace(/\s{2,}/g, ' ')
      .replace(/\s+([.,;:])/g, '$1')
      .replace(/[.\s]+$/, '')
      .trim()
  )
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

// Icon + color shown next to each category in the filter list.
const CATEGORY_META: Record<
  ActivityCategory,
  { icon: LucideIcon; className: string }
> = {
  Created: { icon: PlusCircleIcon, className: 'text-emerald-500' },
  Updated: { icon: EditIcon, className: 'text-blue-500' },
  Status: { icon: ArrowRightLeftIcon, className: 'text-amber-500' },
  Comments: { icon: MessageSquareIcon, className: 'text-violet-500' },
  Files: { icon: PaperclipIcon, className: 'text-orange-500' },
  Deleted: { icon: Trash2Icon, className: 'text-red-500' },
  Other: { icon: ActivityIcon, className: 'text-muted-foreground' },
}

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
              <Skeleton className="size-6 shrink-0 rounded-full bg-muted/70" />
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

  const showToolbar = Boolean(filterable)
  const showFilter = showToolbar && presentCategories.length > 1
  const hasActiveFilter = hidden.size > 0
  const eventCount = visibleActivities.length

  return (
    <div className={cn('space-y-3', className)}>
      {showToolbar && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-muted-foreground">
            {eventCount} {eventCount === 1 ? 'event' : 'events'}
          </span>
          {showFilter && (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label="Filter activity"
                  title="Filter activity"
                  className={cn(
                    'inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                    hasActiveFilter && 'text-primary',
                  )}
                >
                  <ListFilter className="size-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-48 p-1">
                {presentCategories.map((category) => {
                  const meta = CATEGORY_META[category]
                  const MetaIcon = meta.icon
                  const isVisible = !hidden.has(category)

                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors hover:bg-muted"
                    >
                      <MetaIcon
                        className={cn('size-3.5 shrink-0', meta.className)}
                      />
                      <span className="flex-1">{category}</span>
                      <Check
                        className={cn(
                          'size-3.5 shrink-0 text-foreground transition-opacity',
                          isVisible ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                    </button>
                  )
                })}
              </PopoverContent>
            </Popover>
          )}
        </div>
      )}
      <div role="list">
        {visibleActivities.map((activity, index) => {
          const config = getOperationConfig(activity.operation)
          const Icon = config.icon
          const actorName = getActorName(activity)
          const description = cleanActivityText(activity)
          const isLast = index === visibleActivities.length - 1

          return (
            <div role="listitem" key={activity.id} className="flex gap-2.5">
              {/* Icon dot + the continuous vertical connector line */}
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full',
                    config.dotClassName,
                  )}
                >
                  <Icon className={cn('size-3.5', config.className)} />
                </span>
                {!isLast && <span className="-mt-0.5 w-px flex-1 bg-border" />}
              </div>
              {/* Actor + date on one line, then the cleaned description */}
              <div className={cn('min-w-0 flex-1', isLast ? 'pb-0' : 'pb-4')}>
                <div className="flex items-baseline gap-2">
                  <span className="min-w-0 truncate text-[13px] font-medium">
                    {actorName}
                  </span>
                  {activity.created_on && (
                    <time
                      dateTime={activity.created_on}
                      className="shrink-0 whitespace-nowrap text-[11px] text-muted-foreground"
                    >
                      {formatDate(activity.created_on, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </time>
                  )}
                </div>
                {description && (
                  <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">
                    {description}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
      {visibleActivities.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No events match the selected filters.
        </p>
      )}
    </div>
  )
}
