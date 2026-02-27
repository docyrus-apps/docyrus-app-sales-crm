'use client'

import { motion } from 'motion/react'
import { Plus } from 'lucide-react'

import { Button } from '@/components/animate-ui/components/buttons/button'

import { slideFromLeft, slideFromRight, transition } from '../animations'
import { useCalendar } from '../contexts/calendar-context'
import { AddEditEventDialog } from '../dialogs/add-edit-event-dialog'
import { Settings } from '../settings/settings'
import { DateNavigator } from './date-navigator'
import FilterEvents from './filter'
import { TodayButton } from './today-button'
import { UserSelect } from './user-select'
import Views from './view-tabs'

export function CalendarHeader() {
  const { view, events } = useCalendar()

  return (
    <div className="space-y-2 border-b p-3 sm:p-4">
      <div className="flex items-center justify-between gap-3">
        <motion.div
          className="flex items-center gap-3"
          variants={slideFromLeft}
          initial="initial"
          animate="animate"
          transition={transition}
        >
          <TodayButton />
          <DateNavigator view={view} events={events} />
        </motion.div>

        <motion.div
          className="flex items-center gap-2"
          variants={slideFromRight}
          initial="initial"
          animate="animate"
          transition={transition}
        >
          <FilterEvents />
          <Views />
        </motion.div>
      </div>

      <motion.div
        className="flex items-center justify-end gap-2"
        variants={slideFromRight}
        initial="initial"
        animate="animate"
        transition={transition}
      >
        <UserSelect />
        <AddEditEventDialog>
          <Button size="sm">
            <Plus className="size-4" />
            <span className="hidden sm:inline">Add Event</span>
          </Button>
        </AddEditEventDialog>
        <Settings />
      </motion.div>
    </div>
  )
}
