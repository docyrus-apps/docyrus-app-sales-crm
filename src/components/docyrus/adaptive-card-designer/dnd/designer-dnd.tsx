'use client'

// @ts-nocheck
/* eslint-disable */
import { createContext, use, useMemo, useState, type ReactNode } from 'react'

import { createPortal } from 'react-dom'

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'

import { useDesignerContext } from '../adaptive-card-designer-context'
import {
  type DesignerNode,
  type ToolboxItem,
} from '../adaptive-card-designer-types'
import { TOOLBOX_ITEMS, buildToolbox } from '../lib/element-catalog'
import { findNode } from '../lib/node-traversal'
import { canAccept } from './drop-rules'
import { DragChip } from './drag-chip'

/* ─── Drag identifier helpers ───────────────────────────────────── */

export const TOOLBOX_DRAG_PREFIX = 'toolbox:'
export const NODE_DRAG_PREFIX = 'node:'

/**
 * Stable id for a slot drop zone. Format: `slot::<parentId>::<slot>::<index>`
 * Double-colon avoids collisions with type names like `Action.Submit`.
 */
export function slotDropId(
  parentId: string,
  slot: string,
  index: number,
): string {
  return `slot::${parentId}::${slot}::${index}`
}

export function parseSlotDropId(
  id: string,
): { parentId: string; slot: string; index: number } | null {
  if (!id.startsWith('slot::')) return null

  const parts = id.slice('slot::'.length).split('::')

  if (parts.length !== 3) return null

  const parentId = parts[0]
  const slot = parts[1]
  const indexStr = parts[2]

  if (!parentId || !slot || indexStr === undefined) return null

  const index = Number(indexStr)

  if (!Number.isFinite(index)) return null

  return { parentId, slot, index }
}

/* ─── Active drag descriptor ────────────────────────────────────── */

export type ActiveDrag =
  | { source: 'toolbox'; item: ToolboxItem }
  | { source: 'node'; node: DesignerNode }

interface DesignerDndValue {
  activeDrag: ActiveDrag | null
  /** Slot drop id currently under the pointer (or `null`). */
  overSlotId: string | null
  /** Whether the active drag may legally land on the over-slot. */
  overSlotValid: boolean
}

const DesignerDndContext = createContext<DesignerDndValue | null>(null)

export function useDesignerDnd(): DesignerDndValue {
  const ctx = use(DesignerDndContext)

  if (!ctx)
    throw new Error('useDesignerDnd must be used within <DesignerDndProvider>')

  return ctx
}

/* ─── Collision detection ───────────────────────────────────────── */

/*
 * Use pointer-within so a drop only registers when the cursor is actually
 * inside the drop zone (the zones are thin lines, so closest-center would
 * latch onto whichever line is nearest even when the cursor is far away).
 * Filter out the active draggable so the source row can't be its own target.
 */
const designerCollisionDetection: CollisionDetection = (args) => {
  const droppableContainers = args.droppableContainers.filter(
    (container) => container.id !== args.active.id,
  )

  return pointerWithin({ ...args, droppableContainers })
}

/* ─── Provider ──────────────────────────────────────────────────── */

interface DesignerDndProviderProps {
  children: ReactNode
  extraToolboxItems?: ToolboxItem[]
}

export function DesignerDndProvider({
  children,
  extraToolboxItems,
}: DesignerDndProviderProps) {
  const { state, dispatch } = useDesignerContext()

  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null)
  const [overSlotId, setOverSlotId] = useState<string | null>(null)

  const catalog = useMemo(
    () => buildToolbox(extraToolboxItems),
    [extraToolboxItems],
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  )

  function resolveToolboxItem(id: string): ToolboxItem | undefined {
    return (
      catalog.find((item) => item.id === id) ??
      TOOLBOX_ITEMS.find((item) => item.id === id)
    )
  }

  function handleDragStart(event: DragStartEvent) {
    if (state.readOnly) return

    const activeId = String(event.active.id)

    setOverSlotId(null)

    if (activeId.startsWith(TOOLBOX_DRAG_PREFIX)) {
      const itemId = activeId.slice(TOOLBOX_DRAG_PREFIX.length)
      const item = resolveToolboxItem(itemId)

      setActiveDrag(item ? { source: 'toolbox', item } : null)

      return
    }

    if (activeId.startsWith(NODE_DRAG_PREFIX)) {
      const nodeId = activeId.slice(NODE_DRAG_PREFIX.length)
      const node = findNode(state.root, nodeId)

      setActiveDrag(node ? { source: 'node', node } : null)

      return
    }

    setActiveDrag(null)
  }

  function handleDragOver(event: DragOverEvent) {
    setOverSlotId(event.over ? String(event.over.id) : null)
  }

  function reset() {
    setActiveDrag(null)
    setOverSlotId(null)
  }

  function handleDragEnd(event: DragEndEvent) {
    /*
     * Read everything from the event — never from React state. On a fast drag
     * the `activeDrag` / `overSlotId` updates may not have re-rendered yet,
     * which would leave a stale closure and silently drop the gesture.
     */
    const overId = event.over ? String(event.over.id) : null
    const activeId = String(event.active.id)

    reset()

    if (state.readOnly) return
    if (!overId) return

    const target = parseSlotDropId(overId)

    if (!target) return

    const parent = findNode(state.root, target.parentId)

    if (!parent) return

    if (activeId.startsWith(TOOLBOX_DRAG_PREFIX)) {
      const itemId = activeId.slice(TOOLBOX_DRAG_PREFIX.length)
      const item = resolveToolboxItem(itemId)

      if (!item) return
      if (!canAccept(parent.type, target.slot, item.type)) return

      dispatch({
        type: 'INSERT_NODE',
        parentId: target.parentId,
        slot: target.slot,
        index: target.index,
        node: item.factory(),
      })

      return
    }

    if (activeId.startsWith(NODE_DRAG_PREFIX)) {
      const nodeId = activeId.slice(NODE_DRAG_PREFIX.length)
      const node = findNode(state.root, nodeId)

      if (!node) return
      if (!canAccept(parent.type, target.slot, node.type)) return

      dispatch({
        type: 'MOVE_NODE',
        id: nodeId,
        targetParentId: target.parentId,
        targetSlot: target.slot,
        targetIndex: target.index,
      })
    }
  }

  const overSlotValid = useMemo(() => {
    if (!activeDrag || !overSlotId) return false

    const target = parseSlotDropId(overSlotId)

    if (!target) return false

    const parent = findNode(state.root, target.parentId)

    if (!parent) return false

    const childType =
      activeDrag.source === 'toolbox'
        ? activeDrag.item.type
        : activeDrag.node.type

    return canAccept(parent.type, target.slot, childType)
  }, [activeDrag, overSlotId, state.root])

  const value = useMemo<DesignerDndValue>(
    () => ({
      activeDrag,
      overSlotId,
      overSlotValid,
    }),
    [activeDrag, overSlotId, overSlotValid],
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={designerCollisionDetection}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={reset}
    >
      <DesignerDndContext value={value}>{children}</DesignerDndContext>
      {/*
       * Portal the DragOverlay to document.body so its `position: fixed` is
       * relative to the viewport. When the designer mounts inside a Radix
       * Dialog (`translate-x/y-[-50%]` for centering), an inline DragOverlay
       * inherits the dialog's transform as its containing block — the chip
       * floats away from the cursor and users drop where they *see* it,
       * which never matches a real drop zone.
       */}
      {typeof document === 'undefined'
        ? null
        : createPortal(
            <DragOverlay dropAnimation={null}>
              {activeDrag ? <DragChip drag={activeDrag} /> : null}
            </DragOverlay>,
            document.body,
          )}
    </DndContext>
  )
}
