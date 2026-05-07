'use client'

import { useMemo } from 'react'

import { isSameDay, parseISO } from 'date-fns'
import { motion } from 'motion/react'

import { fadeIn, transition } from './animations'
import { useCalendar } from './contexts/calendar-context'
import { type IEvent } from './interfaces'
import { AgendaEvents } from './views/agenda-view/agenda-events'
import { CalendarMonthView } from './views/month-view/calendar-month-view'
import { CalendarDayView } from './views/week-and-day-view/calendar-day-view'
import { CalendarWeekView } from './views/week-and-day-view/calendar-week-view'
import { CalendarYearView } from './views/year-view/calendar-year-view'

export function CalendarBody() {
  const { view, events } = useCalendar()

  const { singleDayEvents, multiDayEvents } = useMemo(() => {
    const singles: IEvent[] = []
    const multis: IEvent[] = []

    for (const event of events) {
      const startDate = parseISO(event.startDate)
      const endDate = parseISO(event.endDate)

      if (isSameDay(startDate, endDate)) {
        singles.push(event)
      } else {
        multis.push(event)
      }
    }

    return { singleDayEvents: singles, multiDayEvents: multis }
  }, [events])

  return (
    <div className="w-full h-full overflow-scroll relative">
      <motion.div
        key={view}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={fadeIn}
        transition={transition}
      >
        {view === 'month' && (
          <CalendarMonthView
            singleDayEvents={singleDayEvents}
            multiDayEvents={multiDayEvents}
          />
        )}
        {view === 'week' && (
          <CalendarWeekView
            singleDayEvents={singleDayEvents}
            multiDayEvents={multiDayEvents}
          />
        )}
        {view === 'day' && (
          <CalendarDayView
            singleDayEvents={singleDayEvents}
            multiDayEvents={multiDayEvents}
          />
        )}
        {view === 'year' && (
          <CalendarYearView
            singleDayEvents={singleDayEvents}
            multiDayEvents={multiDayEvents}
          />
        )}
        {view === 'agenda' && (
          <motion.div
            key="agenda"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={fadeIn}
            transition={transition}
          >
            <AgendaEvents />
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
