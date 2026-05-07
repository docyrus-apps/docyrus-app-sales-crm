'use client'

import { format } from 'date-fns'

import { ScrollArea } from '@/components/ui/scroll-area'

import { tUi } from '@/lib/ui-i18n'

import { useTimeSlotSchedulerContext } from './time-slot-scheduler-context'
import { TimeSlotSchedulerMonthCalendar } from './time-slot-scheduler-month-calendar'
import { TimeSlotSchedulerSlotButton } from './time-slot-scheduler-slot-button'

function TimeSlotSchedulerMonthView() {
  const { selectedDay, selectedDaySlots, locale } =
    useTimeSlotSchedulerContext()

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:flex-row">
      <TimeSlotSchedulerMonthCalendar />

      <div className="flex flex-1 flex-col">
        {selectedDay ? (
          <>
            <h3 className="mb-3 text-sm font-semibold">
              {format(selectedDay, 'EEEE, MMMM d')}
            </h3>
            <ScrollArea className="flex-1">
              <div className="space-y-1.5">
                {selectedDaySlots && selectedDaySlots.slots.length > 0 ? (
                  selectedDaySlots.slots.map((slot) => (
                    <TimeSlotSchedulerSlotButton key={slot.id} slot={slot} />
                  ))
                ) : (
                  <p className="py-8 text-center text-xs text-muted-foreground">
                    {tUi(locale, 'tssNoSlotsAvailable')}
                  </p>
                )}
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-muted-foreground">
              {tUi(locale, 'tssSelectSlot')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export { TimeSlotSchedulerMonthView }
