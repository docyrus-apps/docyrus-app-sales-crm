'use client'

// @ts-nocheck
/* eslint-disable */
import { type ToolboxItemDef } from '../json-schema-designer-types'
import { useDesignerContext } from '../json-schema-designer-context'
import { findNode } from '../lib/schema-node'
import { NODE_ICONS, getNodeIconKey } from './node-icon'

/** Floating chip rendered in the DragOverlay while dragging a toolbox type. */
export function ToolboxDragChip({ item }: { item: ToolboxItemDef }) {
  const Icon = item.icon

  return (
    <div className="flex items-center gap-1.5 rounded-md border border-primary bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary shadow-lg">
      <Icon className="size-4" />
      {item.label}
    </div>
  )
}

/** Floating chip rendered in the DragOverlay while dragging a tree node. */
export function TreeNodeDragChip({ nodeId }: { nodeId: string }) {
  const { state } = useDesignerContext()
  const node = findNode(state.root, nodeId)

  if (!node) return null

  const Icon = NODE_ICONS[getNodeIconKey(node)]

  return (
    <div className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium shadow-lg">
      <Icon className="size-4 text-muted-foreground" />
      <span className="text-foreground">{node.key}</span>
      <span className="text-muted-foreground">{node.type}</span>
    </div>
  )
}
