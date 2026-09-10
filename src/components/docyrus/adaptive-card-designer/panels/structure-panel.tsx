'use client'

// @ts-nocheck
/* eslint-disable */
import { useMemo, type ComponentType } from 'react'

import { useDraggable, useDroppable } from '@dnd-kit/core'
import {
  ChevronDownIcon,
  ChevronRight as ChevronRightIcon,
  ChevronsDownUp,
  ChevronsUpDown,
  FileText,
  ListTree,
  Trash2,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

import { useDesignerContext } from '../adaptive-card-designer-context'
import { type DesignerNode } from '../adaptive-card-designer-types'
import {
  NODE_DRAG_PREFIX,
  slotDropId,
  useDesignerDnd,
} from '../dnd/designer-dnd'
import { canAccept } from '../dnd/drop-rules'
import { TOOLBOX_ITEMS } from '../lib/element-catalog'
import { slotsFor } from '../lib/node-tree'
import { PanelShell } from '../layout/panel-shell'

const ICON_BY_TYPE: Record<
  string,
  ComponentType<{ className?: string }>
> = (() => {
  const map: Record<string, ComponentType<{ className?: string }>> = {}

  for (const item of TOOLBOX_ITEMS) map[item.type] = item.icon
  map.__root = FileText

  return map
})()

function labelFor(node: DesignerNode): string {
  if (node.type === '__root') return 'AdaptiveCard'

  if (node.type === 'TextBlock' && typeof node.props.text === 'string') {
    const trimmed = node.props.text.trim()

    return trimmed.length > 28
      ? `${trimmed.slice(0, 28)}…`
      : trimmed || 'TextBlock'
  }

  if (node.type === 'StringInline' && typeof node.props.text === 'string') {
    const trimmed = node.props.text.trim()

    return trimmed.length > 28
      ? `${trimmed.slice(0, 28)}…`
      : trimmed || 'inline'
  }

  if (node.type === 'Fact' && typeof node.props.title === 'string') {
    return `Fact: ${node.props.title}`
  }

  if (node.type === 'Choice' && typeof node.props.title === 'string') {
    return `Choice: ${node.props.title}`
  }

  if (typeof node.props.id === 'string' && node.props.id) {
    return `${node.type} (#${node.props.id})`
  }

  if (typeof node.props.title === 'string' && node.props.title) {
    return `${node.type}: ${node.props.title}`
  }

  return node.type
}

function totalChildren(node: DesignerNode): number {
  let total = 0

  for (const slot of Object.values(node.slots)) total += slot.length

  return total
}

interface SlotDropZoneProps {
  parentId: string
  parentType: string
  slot: string
  index: number
  depth: number
  /** Empty append zone gets a larger hit area so users can target empty slots. */
  variant?: 'between' | 'append'
}

function SlotDropZone({
  parentId,
  parentType,
  slot,
  index,
  depth,
  variant = 'between',
}: SlotDropZoneProps) {
  const id = slotDropId(parentId, slot, index)
  const { activeDrag } = useDesignerDnd()
  const childType =
    activeDrag?.source === 'toolbox'
      ? activeDrag.item.type
      : activeDrag?.source === 'node'
        ? activeDrag.node.type
        : null
  const accepts = childType ? canAccept(parentType, slot, childType) : false
  const { setNodeRef, isOver } = useDroppable({ id, disabled: !activeDrag })

  return (
    <div
      ref={setNodeRef}
      style={{ paddingLeft: 4 + depth * 12 }}
      className={cn(
        'relative',
        variant === 'append' ? 'h-3' : 'h-1.5',
        activeDrag && accepts && 'h-3',
      )}
    >
      <div
        className={cn(
          'mx-1 h-px transition-colors',
          activeDrag && accepts && 'h-0.5 rounded bg-primary/40',
          activeDrag &&
            accepts &&
            isOver &&
            'h-0.5 rounded bg-primary shadow-[0_0_0_2px_var(--primary)/25]',
        )}
      />
    </div>
  )
}

interface NodeRowProps {
  node: DesignerNode
  depth: number
}

function NodeRow({ node, depth }: NodeRowProps) {
  const { state, dispatch } = useDesignerContext()
  const { activeDrag } = useDesignerDnd()
  const { readOnly } = state
  const slots = slotsFor(node.type)
  const childCount = totalChildren(node)
  const hasChildren = childCount > 0
  const isExpanded = state.expanded[node.__designerId] ?? true
  const isSelected = state.selection === node.__designerId
  const Icon = ICON_BY_TYPE[node.type] ?? FileText

  const isRoot = node.type === '__root'
  const dragDisabled = isRoot || readOnly
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${NODE_DRAG_PREFIX}${node.__designerId}`,
    data: { source: 'node', nodeId: node.__designerId },
    disabled: dragDisabled,
  })

  return (
    <div className="flex flex-col">
      <div
        ref={setNodeRef}
        {...attributes}
        {...(dragDisabled ? {} : listeners)}
        onClick={() => dispatch({ type: 'SELECT', id: node.__designerId })}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            dispatch({ type: 'SELECT', id: node.__designerId })
          }
        }}
        className={cn(
          'group flex h-6 items-center gap-1 rounded px-1 text-xs',
          !dragDisabled && 'cursor-grab active:cursor-grabbing',
          'hover:bg-accent hover:text-accent-foreground',
          isSelected && 'bg-primary/15 text-foreground',
          isDragging && 'opacity-40',
        )}
        style={{ paddingLeft: 4 + depth * 12 }}
      >
        {hasChildren ? (
          <button
            type="button"
            tabIndex={-1}
            onClick={(event) => {
              event.stopPropagation()
              dispatch({ type: 'TOGGLE_EXPANDED', id: node.__designerId })
            }}
            onPointerDown={(event) => event.stopPropagation()}
            className="flex size-4 items-center justify-center rounded text-muted-foreground hover:text-foreground"
          >
            {isExpanded ? (
              <ChevronDownIcon className="size-3" />
            ) : (
              <ChevronRightIcon className="size-3" />
            )}
          </button>
        ) : (
          <span className="inline-block size-4" />
        )}
        <Icon className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate">{labelFor(node)}</span>
        {hasChildren ? (
          <span className="text-[10px] text-muted-foreground">
            {childCount}
          </span>
        ) : null}
        {!isRoot && !readOnly && isSelected && !activeDrag ? (
          <button
            type="button"
            tabIndex={-1}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation()
              dispatch({ type: 'REMOVE_NODE', id: node.__designerId })
            }}
            className="ml-1 flex size-4 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
            aria-label="Remove"
          >
            <Trash2 className="size-3" />
          </button>
        ) : null}
      </div>

      {isExpanded ? (
        <div className="flex flex-col">
          {slots.map((slot) => {
            const children = node.slots[slot] ?? []
            const showSlotLabel =
              slots.length > 1 && (children.length > 0 || Boolean(activeDrag))

            return (
              <div key={slot} className="flex flex-col">
                {showSlotLabel ? (
                  <div
                    className="px-1 text-[9px] uppercase tracking-wider text-muted-foreground/60"
                    style={{ paddingLeft: 16 + depth * 12 }}
                  >
                    {slot}
                  </div>
                ) : null}
                {children.length === 0 ? (
                  <SlotDropZone
                    parentId={node.__designerId}
                    parentType={node.type}
                    slot={slot}
                    index={0}
                    depth={depth + 1}
                    variant="append"
                  />
                ) : null}
                {children.map((child, index) => (
                  <div key={child.__designerId} className="flex flex-col">
                    <SlotDropZone
                      parentId={node.__designerId}
                      parentType={node.type}
                      slot={slot}
                      index={index}
                      depth={depth + 1}
                    />
                    <NodeRow node={child} depth={depth + 1} />
                  </div>
                ))}
                {children.length > 0 ? (
                  <SlotDropZone
                    parentId={node.__designerId}
                    parentType={node.type}
                    slot={slot}
                    index={children.length}
                    depth={depth + 1}
                    variant="append"
                  />
                ) : null}
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

export function StructurePanel() {
  const { state, dispatch } = useDesignerContext()
  const totalNodes = useMemo(() => {
    let total = 0

    const walk = (node: DesignerNode) => {
      total += 1
      for (const children of Object.values(node.slots)) {
        for (const child of children) walk(child)
      }
    }

    walk(state.root)

    return total
  }, [state.root])

  return (
    <PanelShell
      title={
        <>
          <ListTree className="size-3 shrink-0" />
          Card Structure
        </>
      }
      rightSlot={
        <>
          <span className="text-[10px] text-muted-foreground">
            {totalNodes} nodes
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            title="Expand all"
            onClick={() =>
              dispatch({ type: 'SET_ALL_EXPANDED', expanded: true })
            }
          >
            <ChevronsUpDown className="size-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            title="Collapse all"
            onClick={() =>
              dispatch({ type: 'SET_ALL_EXPANDED', expanded: false })
            }
          >
            <ChevronsDownUp className="size-3" />
          </Button>
        </>
      }
    >
      <div className="px-1.5 py-1">
        <NodeRow node={state.root} depth={0} />
      </div>
    </PanelShell>
  )
}
