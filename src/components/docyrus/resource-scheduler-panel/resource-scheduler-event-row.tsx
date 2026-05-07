'use client'

import { useMemo } from 'react'

import { cn } from '@/lib/utils'

import { type SchedulerEvent } from './types'

import {
  dateRangeToWidth,
  dateToPixel,
  pixelToDate,
  stackEvents,
} from './lib/timeline-utils'
import { useResourceSchedulerContext } from './resource-scheduler-context'
import { ResourceSchedulerDraggableEvent } from './resource-scheduler-draggable-event'
import { ResourceSchedulerEventBar } from './resource-scheduler-event-bar'
import { ResourceSchedulerEventPopover } from './resource-scheduler-event-popover'

const SUB_ROW_HEIGHT = 28
const SUB_ROW_GAP = 2

interface ResourceSchedulerEventRowProps {
  resourceId: string
  events: Array<SchedulerEvent>
  className?: string
}

export function ResourceSchedulerEventRow({
  resourceId,
  events,
  className,
}: ResourceSchedulerEventRowProps) {
  const {
    viewStart,
    activeConfig,
    rowHeight,
    totalTimelineWidth,
    onEventClick,
    onEventMove,
    onEventResize,
    onSlotClick,
    readOnly,
    isDragging,
  } = useResourceSchedulerContext()

  const { stacked, maxSubRows } = useMemo(() => stackEvents(events), [events])

  const computedHeight = Math.max(
    rowHeight,
    maxSubRows * (SUB_ROW_HEIGHT + SUB_ROW_GAP) + SUB_ROW_GAP * 2,
  )

  const hasDnd = !readOnly && (!!onEventMove || !!onEventResize)

  return (
    <div
      className={cn('relative border-b', className)}
      data-resource-id={resourceId}
      style={{
        height: computedHeight,
        width: totalTimelineWidth,
        minHeight: 'var(--scheduler-row-height)',
      }}
      onClick={(e) => {
        if (readOnly || !onSlotClick || isDragging) return
        if ((e.target as HTMLElement).closest('[data-event-bar]')) return
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left

        onSlotClick(resourceId, pixelToDate(x, viewStart, activeConfig))
      }}
    >
      {/* Column grid lines */}
      <div className="pointer-events-none absolute inset-0 flex">
        {Array.from({
          length: Math.ceil(totalTimelineWidth / activeConfig.unitWidth),
        }).map((_, i) => (
          <div
            key={i}
            className="shrink-0 border-r border-border/30"
            style={{ width: activeConfig.unitWidth }}
          />
        ))}
      </div>
      {/* Event bars */}
      {stacked.map(({ event, subRow }) => {
        const left = dateToPixel(event.startDate, viewStart, activeConfig)
        const width = dateRangeToWidth(
          event.startDate,
          event.endDate,
          activeConfig,
        )
        const top = SUB_ROW_GAP + subRow * (SUB_ROW_HEIGHT + SUB_ROW_GAP)

        if (hasDnd) {
          return (
            <ResourceSchedulerDraggableEvent
              key={event.id}
              event={event}
              left={left}
              width={width}
              top={top}
              height={SUB_ROW_HEIGHT}
            />
          )
        }

        return (
          <ResourceSchedulerEventPopover key={event.id} event={event}>
            <div data-event-bar>
              <ResourceSchedulerEventBar
                event={event}
                left={left}
                width={width}
                top={top}
                height={SUB_ROW_HEIGHT}
                onClick={onEventClick}
              />
            </div>
          </ResourceSchedulerEventPopover>
        )
      })}
    </div>
  )
}
