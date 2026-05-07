'use client'

import { type RefObject, useCallback, useRef, useState } from 'react'

import { DndContext, MouseSensor, useDraggable, useSensor } from '@dnd-kit/core'
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers'
import { addMilliseconds, differenceInMilliseconds, format } from 'date-fns'

import { cn } from '@/lib/utils'

import { type SchedulerEvent } from './types'

import { pixelToDate } from './lib/timeline-utils'
import { useResourceSchedulerContext } from './resource-scheduler-context'
import { ResourceSchedulerEventBar } from './resource-scheduler-event-bar'

interface DraggableEventProps {
  event: SchedulerEvent
  left: number
  width: number
  top: number
  height: number
}

/*
 * ---------------------------------------------------------------------------
 * Resize handle (left / right edge)
 * ---------------------------------------------------------------------------
 */

function ResizeHandle({
  id,
  side,
  date,
  isDragging,
}: {
  id: string
  side: 'left' | 'right'
  date: Date
  isDragging: boolean
}) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        'absolute top-1/2 z-10 flex h-full w-6 -translate-y-1/2 cursor-col-resize items-center justify-center',
        side === 'left' ? '-left-2.5' : '-right-2.5',
      )}
    >
      <div
        className={cn(
          'h-3/5 w-1 rounded-full bg-current opacity-0 transition-opacity',
          isDragging ? 'opacity-70' : 'group-hover/bar:opacity-50',
        )}
      />
      {isDragging && (
        <div
          className={cn(
            'pointer-events-none absolute top-full mt-1 whitespace-nowrap rounded bg-popover px-1.5 py-0.5 text-[10px] text-popover-foreground shadow-md',
            side === 'left' ? 'left-0' : 'right-0',
          )}
        >
          {format(date, 'MMM d, HH:mm')}
        </div>
      )}
    </div>
  )
}

/*
 * ---------------------------------------------------------------------------
 * Main draggable bar (for move + resource reassignment)
 * ---------------------------------------------------------------------------
 */

function DraggableBar({
  event,
  width,
  height,
  isDragging,
  onClick,
}: {
  event: SchedulerEvent
  width: number
  height: number
  isDragging: boolean
  onClick?: (event: SchedulerEvent) => void
}) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: event.id,
  })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <ResourceSchedulerEventBar
        event={event}
        left={0}
        width={width}
        top={0}
        height={height}
        onClick={isDragging ? undefined : onClick}
      />
    </div>
  )
}

/*
 * ---------------------------------------------------------------------------
 * Coordinate helpers
 * ---------------------------------------------------------------------------
 */

function getResourceIdAtY(
  windowY: number,
  timelineBodyRef: RefObject<HTMLDivElement | null>,
  resources: Array<{ id: string }>,
  rowHeight: number,
): string | undefined {
  const el = timelineBodyRef.current

  if (!el) return undefined
  const rect = el.getBoundingClientRect()
  const headerHeight = 60
  const relY = windowY - rect.top + el.scrollTop - headerHeight
  const rowIndex = Math.floor(relY / rowHeight)

  if (rowIndex < 0 || rowIndex >= resources.length) return undefined

  return resources[rowIndex]?.id
}

/*
 * ---------------------------------------------------------------------------
 * DraggableEvent — orchestrates three DndContexts per event
 * Wraps everything in a single positioned container (Gantt pattern).
 * ---------------------------------------------------------------------------
 */

export function ResourceSchedulerDraggableEvent({
  event,
  left,
  width,
  top,
  height,
}: DraggableEventProps) {
  const {
    viewStart,
    activeConfig,
    onEventClick,
    onEventMove,
    onEventResize,
    readOnly,
    resources,
    rowHeight,
    timelineBodyRef,
    setIsDragging,
  } = useResourceSchedulerContext()

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 6 },
  })

  const [isMoveDragging, setIsMoveDragging] = useState(false)
  const [isLeftResizing, setIsLeftResizing] = useState(false)
  const [isRightResizing, setIsRightResizing] = useState(false)

  const prevStartRef = useRef(event.startDate)
  const prevEndRef = useRef(event.endDate)
  const currentStartRef = useRef(event.startDate)
  const currentEndRef = useRef(event.endDate)
  const targetResourceRef = useRef(event.resourceId)

  const [dragLeft, setDragLeft] = useState(left)
  const [dragWidth, setDragWidth] = useState(width)
  const [dragTop, setDragTop] = useState(top)

  const isAnyDrag = isMoveDragging || isLeftResizing || isRightResizing
  const displayLeft = isAnyDrag ? dragLeft : left
  const displayWidth = isAnyDrag ? dragWidth : width
  const displayTop = isAnyDrag ? dragTop : top

  const handleMoveDragStart = useCallback(() => {
    prevStartRef.current = event.startDate
    prevEndRef.current = event.endDate
    currentStartRef.current = event.startDate
    currentEndRef.current = event.endDate
    targetResourceRef.current = event.resourceId
    setDragLeft(left)
    setDragWidth(width)
    setDragTop(top)
    setIsMoveDragging(true)
    setIsDragging(true)
  }, [event, left, width, top, setIsDragging])

  const handleMoveDragMove = useCallback(
    ({
      activatorEvent,
      delta,
    }: {
      activatorEvent: Event
      delta: { x: number; y: number }
    }) => {
      const durationMs = differenceInMilliseconds(
        prevEndRef.current,
        prevStartRef.current,
      )
      const pxDelta = delta.x
      const newLeft = left + pxDelta
      const newStart = pixelToDate(newLeft, viewStart, activeConfig)
      const newEnd = addMilliseconds(newStart, durationMs)

      currentStartRef.current = newStart
      currentEndRef.current = newEnd
      setDragLeft(newLeft)

      const mouseEvent = activatorEvent as MouseEvent
      const windowY = mouseEvent.clientY + delta.y
      const resourceId = getResourceIdAtY(
        windowY,
        timelineBodyRef,
        resources,
        rowHeight,
      )

      if (resourceId) {
        targetResourceRef.current = resourceId
        const resourceIndex = resources.findIndex((r) => r.id === resourceId)
        const originalIndex = resources.findIndex(
          (r) => r.id === event.resourceId,
        )

        if (resourceIndex !== originalIndex) {
          setDragTop(top) // keep sub-row offset for visual
        }
      }
    },
    [
      left,
      viewStart,
      activeConfig,
      timelineBodyRef,
      resources,
      rowHeight,
      event.resourceId,
      top,
    ],
  )

  const handleMoveDragEnd = useCallback(() => {
    setIsMoveDragging(false)
    setIsDragging(false)
    const newResourceId =
      targetResourceRef.current !== event.resourceId
        ? targetResourceRef.current
        : undefined

    onEventMove?.(
      event,
      currentStartRef.current,
      currentEndRef.current,
      newResourceId,
    )
  }, [event, onEventMove, setIsDragging])

  const handleLeftResizeStart = useCallback(() => {
    currentStartRef.current = event.startDate
    currentEndRef.current = event.endDate
    setDragLeft(left)
    setDragWidth(width)
    setIsLeftResizing(true)
    setIsDragging(true)
  }, [event, left, width, setIsDragging])

  const handleLeftResizeMove = useCallback(
    ({ delta }: { delta: { x: number } }) => {
      const newLeft = left + delta.x
      const newStart = pixelToDate(newLeft, viewStart, activeConfig)

      currentStartRef.current = newStart
      setDragLeft(newLeft)
      setDragWidth(width - delta.x)
    },
    [left, width, viewStart, activeConfig],
  )

  const handleLeftResizeEnd = useCallback(() => {
    setIsLeftResizing(false)
    setIsDragging(false)
    onEventResize?.(event, currentStartRef.current, currentEndRef.current)
  }, [event, onEventResize, setIsDragging])

  const handleRightResizeStart = useCallback(() => {
    currentStartRef.current = event.startDate
    currentEndRef.current = event.endDate
    setDragLeft(left)
    setDragWidth(width)
    setIsRightResizing(true)
    setIsDragging(true)
  }, [event, left, width, setIsDragging])

  const handleRightResizeMove = useCallback(
    ({ delta }: { delta: { x: number } }) => {
      const newWidth = width + delta.x
      const newEndPx = left + newWidth
      const newEnd = pixelToDate(newEndPx, viewStart, activeConfig)

      currentEndRef.current = newEnd
      setDragWidth(Math.max(newWidth, 4))
    },
    [left, width, viewStart, activeConfig],
  )

  const handleRightResizeEnd = useCallback(() => {
    setIsRightResizing(false)
    setIsDragging(false)
    onEventResize?.(event, currentStartRef.current, currentEndRef.current)
  }, [event, onEventResize, setIsDragging])

  if (readOnly || (!onEventMove && !onEventResize)) {
    return (
      <ResourceSchedulerEventBar
        event={event}
        left={left}
        width={width}
        top={top}
        height={height}
        onClick={onEventClick}
      />
    )
  }

  return (
    <div
      className={cn('group/bar absolute', isAnyDrag && 'z-50')}
      data-event-bar
      style={{
        left: Math.round(displayLeft),
        top: displayTop,
        width: Math.max(Math.round(displayWidth), 4),
        height,
      }}
    >
      {/* Left resize handle */}
      {onEventResize && (
        <DndContext
          sensors={[mouseSensor]}
          modifiers={[restrictToHorizontalAxis]}
          onDragStart={handleLeftResizeStart}
          onDragMove={handleLeftResizeMove}
          onDragEnd={handleLeftResizeEnd}
        >
          <ResizeHandle
            id={`resize-left-${event.id}`}
            side="left"
            date={currentStartRef.current}
            isDragging={isLeftResizing}
          />
        </DndContext>
      )}

      {/* Main bar (move + resource reassignment) */}
      {onEventMove ? (
        <DndContext
          sensors={[mouseSensor]}
          onDragStart={handleMoveDragStart}
          onDragMove={handleMoveDragMove}
          onDragEnd={handleMoveDragEnd}
        >
          <DraggableBar
            event={event}
            width={displayWidth}
            height={height}
            isDragging={isMoveDragging}
            onClick={onEventClick}
          />
        </DndContext>
      ) : (
        <ResourceSchedulerEventBar
          event={event}
          left={0}
          width={displayWidth}
          top={0}
          height={height}
          onClick={onEventClick}
        />
      )}

      {/* Right resize handle */}
      {onEventResize && (
        <DndContext
          sensors={[mouseSensor]}
          modifiers={[restrictToHorizontalAxis]}
          onDragStart={handleRightResizeStart}
          onDragMove={handleRightResizeMove}
          onDragEnd={handleRightResizeEnd}
        >
          <ResizeHandle
            id={`resize-right-${event.id}`}
            side="right"
            date={currentEndRef.current}
            isDragging={isRightResizing}
          />
        </DndContext>
      )}
    </div>
  )
}
