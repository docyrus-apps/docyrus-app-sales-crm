'use client'

import { type ReactNode } from 'react'

import { format } from 'date-fns'
import { Clock, MapPin } from 'lucide-react'

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

import { type SchedulerEvent } from './types'

interface ResourceSchedulerEventPopoverProps {
  event: SchedulerEvent
  children: ReactNode
}

export function ResourceSchedulerEventPopover({
  event,
  children,
}: ResourceSchedulerEventPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-72 p-3" side="top" align="start">
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            {event.icon && (
              <span className="mt-0.5 shrink-0">{event.icon}</span>
            )}
            <h4 className="text-sm font-semibold leading-tight">
              {event.title}
            </h4>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3" />
            <span>
              {format(event.startDate, 'MMM d, HH:mm')} —{' '}
              {format(event.endDate, 'MMM d, HH:mm')}
            </span>
          </div>
          {event.location && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="size-3" />
              <span>{event.location}</span>
            </div>
          )}
          {event.description && (
            <p className="text-xs text-muted-foreground">{event.description}</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
