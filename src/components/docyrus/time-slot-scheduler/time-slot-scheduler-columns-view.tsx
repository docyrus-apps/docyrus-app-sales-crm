'use client'

import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'

import { tUi } from '@/lib/ui-i18n'

import { useTimeSlotSchedulerContext } from './time-slot-scheduler-context'
import { TimeSlotSchedulerSlotButton } from './time-slot-scheduler-slot-button'

function TimeSlotSchedulerColumnsView() {
  const { days, locale } = useTimeSlotSchedulerContext()

  return (
    <div
      className="grid flex-1 divide-x"
      style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
    >
      {days.map((day) => (
        <div key={day.date.toISOString()} className="flex flex-col">
          <div
            className={cn(
              'flex flex-col items-center border-b px-2 py-3',
              day.isToday && 'bg-primary/5',
            )}
          >
            <span className="text-xs font-medium text-muted-foreground">
              {day.dayLabel}
            </span>
            <span
              className={cn(
                'mt-0.5 flex size-8 items-center justify-center rounded-full text-sm font-semibold',
                day.isToday && 'bg-primary text-primary-foreground',
              )}
            >
              {day.dateLabel}
            </span>
          </div>

          <ScrollArea className="flex-1">
            <div className="space-y-1.5 p-2">
              {day.slots.length > 0 ? (
                day.slots.map((slot) => (
                  <TimeSlotSchedulerSlotButton key={slot.id} slot={slot} />
                ))
              ) : (
                <p className="py-8 text-center text-xs text-muted-foreground">
                  {tUi(locale, 'tssNoSlotsAvailable')}
                </p>
              )}
            </div>
          </ScrollArea>
        </div>
      ))}
    </div>
  )
}

export { TimeSlotSchedulerColumnsView }
