'use client'

import { type DragEvent, type MouseEvent, type ReactNode } from 'react'

import { useCallback, useRef } from 'react'

import { motion } from 'motion/react'

import { type IEvent } from '../interfaces'

import { useCalendar } from '../contexts/calendar-context'
import { useDragDrop } from '../contexts/dnd-context'

interface DraggableEventProps {
  event: IEvent
  children: ReactNode
  className?: string
}

export function DraggableEvent({
  event,
  children,
  className,
}: DraggableEventProps) {
  const { startDrag, endDrag, isDragging, draggedEvent } = useDragDrop()
  const { readOnly } = useCalendar()
  const ref = useRef<HTMLDivElement>(null)

  const isCurrentlyDragged = isDragging && draggedEvent?.id === event.id

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
  }

  const handleDragStart = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      if (readOnly) {
        e.preventDefault()

        return
      }

      e.dataTransfer.setData('text/plain', event.id.toString())
      startDrag(event)
    },
    [event, readOnly, startDrag],
  )

  const handleDragEnd = useCallback(() => {
    endDrag()
  }, [endDrag])

  return (
    <motion.div
      ref={ref}
      className={`${className || ''} ${readOnly ? '' : isCurrentlyDragged ? 'opacity-50 cursor-grabbing' : 'cursor-grab'}`}
      draggable={!readOnly}
      onClick={(e: MouseEvent<HTMLDivElement>) => handleClick(e)}
      // @ts-expect-error -- native HTML drag events conflict with motion's gesture types
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {children}
    </motion.div>
  )
}
