import { CalendarClock, Plus } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export interface RecordEvent {
  id?: string
  subject?: string
  description?: string
  start_date?: string
  end_date?: string
  created_on?: string
  calendar?: { name?: string } | string | null
  record_owner?:
    | { firstname?: string; lastname?: string; email?: string }
    | string
    | null
}

export interface RecordActivityTimelineProps {
  events: Array<RecordEvent>
  isLoading?: boolean
  /** Cap the number of rows (e.g. 2 for the Overview "recent" list) */
  limit?: number
  emptyLabel?: string
  /** Optional "add activity" handler — renders an action in the empty state */
  onAdd?: () => void
  addLabel?: string
  className?: string
}

function ownerName(owner: RecordEvent['record_owner']): string | undefined {
  if (!owner) return undefined
  if (typeof owner === 'string') return owner

  const full = [owner.firstname, owner.lastname].filter(Boolean).join(' ')

  return full || owner.email || undefined
}

function formatWhen(value?: string): string {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function RecordActivityTimeline({
  events,
  isLoading,
  limit,
  emptyLabel = 'No activity yet',
  onAdd,
  addLabel = 'Log activity',
  className,
}: RecordActivityTimelineProps) {
  if (isLoading) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: limit ?? 4 }).map((_, index) => (
          <div
            key={index}
            className="h-12 animate-pulse rounded-lg bg-muted/40"
          />
        ))}
      </div>
    )
  }

  if (!events.length) {
    return (
      <div
        className={cn(
          'flex min-h-32 flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-8 text-center',
          className,
        )}
      >
        <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <CalendarClock className="size-4.5" />
        </div>
        <p className="text-[13px] text-muted-foreground">{emptyLabel}</p>
        {onAdd && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={onAdd}
          >
            <Plus className="size-3.5" />
            {addLabel}
          </Button>
        )}
      </div>
    )
  }

  const rows = limit != null ? events.slice(0, limit) : events

  return (
    <ul className={cn('space-y-1', className)}>
      {rows.map((event) => {
        const owner = ownerName(event.record_owner)
        const when = formatWhen(event.start_date ?? event.created_on)

        return (
          <li
            key={event.id}
            className="flex items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50"
          >
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
              <CalendarClock className="size-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium">
                {event.subject || 'Untitled activity'}
              </p>
              {event.description && (
                <p className="truncate text-xs text-muted-foreground">
                  {event.description}
                </p>
              )}
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
                {when && <span>{when}</span>}
                {when && owner && <span aria-hidden>·</span>}
                {owner && <span className="truncate">{owner}</span>}
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
