'use client'

// @ts-nocheck
/* eslint-disable */
import { useDraggable } from '@dnd-kit/core'
import { GripVertical } from 'lucide-react'

import { cn } from '@/lib/utils'

import { type ToolboxItemDef } from '../json-schema-designer-types'

interface ToolboxItemProps {
  item: ToolboxItemDef
  onAdd: (item: ToolboxItemDef) => void
  disabled?: boolean
}

/** A draggable / clickable schema-type tile in the toolbox pane. */
export function ToolboxItem({ item, onAdd, disabled }: ToolboxItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `toolbox-${item.id}`,
    data: { source: 'toolbox', toolboxId: item.id },
    disabled,
  })

  const Icon = item.icon

  return (
    <button
      ref={setNodeRef}
      type="button"
      disabled={disabled}
      className={cn(
        'group flex w-full cursor-grab items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5 text-left',
        'transition-colors hover:border-primary/40 hover:bg-accent active:cursor-grabbing',
        'disabled:cursor-not-allowed disabled:opacity-50',
        isDragging && 'opacity-40',
      )}
      onClick={() => !disabled && onAdd(item)}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="size-3.5 shrink-0 text-muted-foreground/40 group-hover:text-muted-foreground" />
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-xs font-medium text-foreground">
          {item.label}
        </span>
        <span className="truncate text-[10px] text-muted-foreground">
          {item.description}
        </span>
      </span>
    </button>
  )
}
