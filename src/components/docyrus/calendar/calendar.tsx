'use client'

import { type ComponentProps } from 'react'

import { forwardRef } from 'react'

import { cva } from 'class-variance-authority'

import { cn } from '@/lib/utils'

import { type IEvent, type IUser } from './interfaces'
import { type TCalendarView } from './types'

import { CalendarBody } from './calendar-body'
import { CalendarProvider } from './contexts/calendar-context'
import { DndProvider } from './contexts/dnd-context'
import { CalendarHeader } from './header/calendar-header'
import { CalendarSkeleton } from './skeletons/calendar-skeleton'

const calendarVariants = cva('w-full border rounded-xl bg-card', {
  variants: {
    variant: {
      default: '',
      bordered: 'border-2',
      compact: 'text-xs',
    },
    size: {
      sm: 'max-w-3xl mx-auto',
      default: 'max-w-6xl mx-auto',
      lg: '',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
})

interface CalendarProps extends Omit<ComponentProps<'div'>, 'children'> {
  events?: Array<IEvent>
  users?: Array<IUser>
  isLoading?: boolean
  defaultView?: TCalendarView
  variant?: 'default' | 'bordered' | 'compact'
  size?: 'sm' | 'default' | 'lg'
  readOnly?: boolean
  showUserFilter?: boolean
}

const Calendar = forwardRef<HTMLDivElement, CalendarProps>(
  (
    {
      events = [],
      users = [],
      isLoading = false,
      defaultView = 'month',
      variant,
      size,
      readOnly = false,
      showUserFilter = true,
      className,
      ...props
    },
    ref,
  ) => {
    if (isLoading) {
      return <CalendarSkeleton />
    }

    return (
      <CalendarProvider
        events={events}
        users={users}
        defaultView={defaultView}
        readOnly={readOnly}
        showUserFilter={showUserFilter}
      >
        <DndProvider>
          <div
            ref={ref}
            className={cn(calendarVariants({ variant, size }), className)}
            {...props}
          >
            <CalendarHeader />
            <CalendarBody />
          </div>
        </DndProvider>
      </CalendarProvider>
    )
  },
)

Calendar.displayName = 'Calendar'

export { Calendar, calendarVariants }
export type { CalendarProps }
