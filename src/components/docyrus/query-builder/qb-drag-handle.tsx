'use client'

// @ts-nocheck
/* eslint-disable */
import { type Ref, memo } from 'react'

import { type DragHandleProps } from 'react-querybuilder'

import { GripVertical } from 'lucide-react'

import { cn } from '@/lib/utils'

const QBDragHandle = memo(
  ({
    className,
    title,
    disabled,
    testID,
    ref,
  }: DragHandleProps & { ref?: Ref<HTMLSpanElement> }) => {
    return (
      <span
        ref={ref}
        role="button"
        tabIndex={disabled ? -1 : 0}
        title={title}
        aria-roledescription="Drag handle"
        aria-label={title || 'Reorder'}
        className={cn(
          'qb-drag-handle flex cursor-grab items-center text-muted-foreground transition-colors hover:text-foreground active:cursor-grabbing',
          disabled && 'cursor-not-allowed opacity-50',
          className,
        )}
        data-testid={testID}
      >
        <GripVertical className="size-4" />
      </span>
    )
  },
)

export { QBDragHandle }
