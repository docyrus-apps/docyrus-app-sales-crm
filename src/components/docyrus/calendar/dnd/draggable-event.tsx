'use client'

import { type DragEvent, type MouseEvent, type ReactNode } from 'react'

import { useCallback, useRef } from 'react'

import { motion } from 'motion/react'

import { type IEvent } from '../interfaces'

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
  const ref = useRef<HTMLDivElement>(null)

  const isCurrentlyDragged = isDragging && draggedEvent?.id === event.id

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
  }

  const handleDragStart = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.dataTransfer.setData('text/plain', event.id.toString())
      startDrag(event)
    },
    [event, startDrag],
  )

  const handleDragEnd = useCallback(() => {
    endDrag()
  }, [endDrag])

  return (
    <motion.div
      ref={ref}
      className={`${className || ''} ${isCurrentlyDragged ? 'opacity-50 cursor-grabbing' : 'cursor-grab'}`}
      draggable
      onClick={(e: MouseEvent<HTMLDivElement>) => handleClick(e)}
      // @ts-expect-error -- native HTML drag events conflict with motion's gesture types
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {children}
    </motion.div>
  )
}
