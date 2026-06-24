'use client'

// @ts-nocheck
/* eslint-disable */
import { GripVertical } from 'lucide-react'

import { type ActiveDrag } from './designer-dnd'

interface DragChipProps {
  drag: ActiveDrag
}

/** Floating chip rendered inside the `<DragOverlay>` while a drag is active. */
export function DragChip({ drag }: DragChipProps) {
  if (drag.source === 'toolbox') {
    const Icon = drag.item.icon

    return (
      <div className="flex items-center gap-1.5 rounded-md border border-primary/50 bg-primary/10 px-2 py-1 text-xs font-medium shadow-md backdrop-blur-sm">
        <Icon className="size-3.5 text-primary" />
        <span>{drag.item.label}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 rounded-md border border-primary/50 bg-card px-2 py-1 text-xs font-medium shadow-md">
      <GripVertical className="size-3.5 text-muted-foreground" />
      <span>{drag.node.type}</span>
    </div>
  )
}
