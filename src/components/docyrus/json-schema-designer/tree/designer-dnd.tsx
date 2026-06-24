'use client'

// @ts-nocheck
/* eslint-disable */
import { createContext, use, useMemo, useState, type ReactNode } from 'react'

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'

import {
  type FlatSchemaNode,
  type ToolboxItemDef,
} from '../json-schema-designer-types'
import { useDesignerContext } from '../json-schema-designer-context'
import {
  canAcceptChild,
  findNode,
  findParent,
  isAncestor,
  isContainerType,
} from '../lib/schema-node'
import { getToolboxItem } from '../lib/toolbox-items'
import {
  INDENT_WIDTH,
  buildTree,
  flattenTree,
  getProjection,
  removeDescendants,
} from '../lib/tree-utils'
import { ToolboxDragChip, TreeNodeDragChip } from './drag-chips'

/*
 * Resolve the drop target.
 *
 * The active sortable row is itself a droppable that tracks the cursor, so it
 * must be excluded — otherwise every collision resolves to the dragged row and
 * reorders silently no-op. Prefer the row the pointer is actually inside
 * (precise targeting); fall back to closest-center for keyboard dragging.
 */
const treeCollisionDetection: CollisionDetection = (args) => {
  const droppableContainers = args.droppableContainers.filter(
    (container) => container.id !== args.active.id,
  )
  const scoped = { ...args, droppableContainers }
  const pointerHits = pointerWithin(scoped)

  return pointerHits.length > 0 ? pointerHits : closestCenter(scoped)
}

type ActiveDrag =
  | { source: 'tree'; nodeId: string }
  | { source: 'toolbox'; item: ToolboxItemDef }

interface DesignerDndValue {
  /** Collapse-aware flat list (active node's descendants removed mid-drag). */
  rendered: FlatSchemaNode[]
  activeDrag: ActiveDrag | null
  /** Projected depth + parent for the active tree node, while dragging. */
  projection: { depth: number; parentId: string } | null
  /** Container highlighted as the destination of an in-progress toolbox drag. */
  dropTargetId: string | null
  indentWidth: number
}

const DesignerDndContext = createContext<DesignerDndValue | null>(null)

export function useDesignerDnd(): DesignerDndValue {
  const ctx = use(DesignerDndContext)

  if (!ctx)
    throw new Error('useDesignerDnd must be used within <DesignerDndProvider>')

  return ctx
}

/**
 * Owns the single {@link DndContext} shared by the toolbox and the tree.
 * Handles toolbox→tree inserts and in-tree reorder/reparent via the canonical
 * dnd-kit flattened-tree projection algorithm.
 */
export function DesignerDndProvider({ children }: { children: ReactNode }) {
  const { state, dispatch, readOnly } = useDesignerContext()
  const { root } = state

  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [offsetX, setOffsetX] = useState(0)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const rendered = useMemo<FlatSchemaNode[]>(() => {
    const flat = flattenTree(root, true)

    return activeDrag?.source === 'tree'
      ? removeDescendants(flat, [activeDrag.nodeId])
      : flat
  }, [root, activeDrag])

  const projection = useMemo(() => {
    if (activeDrag?.source !== 'tree' || !overId) return null

    return getProjection(rendered, root.id, activeDrag.nodeId, overId, offsetX)
  }, [activeDrag, overId, offsetX, rendered, root.id])

  const dropTargetId = useMemo<string | null>(() => {
    if (activeDrag?.source !== 'toolbox' || !overId) return null

    const overNode = findNode(root, overId)

    if (!overNode) return null
    if (canAcceptChild(overNode)) return overNode.id

    const parent = findParent(root, overId)

    return parent && parent.type === 'object' ? parent.id : null
  }, [activeDrag, overId, root])

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current

    setOverId(null)
    setOffsetX(0)

    if (data?.source === 'toolbox') {
      const item = getToolboxItem(String(data.toolboxId))

      setActiveDrag(item ? { source: 'toolbox', item } : null)

      return
    }

    setActiveDrag({ source: 'tree', nodeId: String(event.active.id) })
  }

  const handleDragMove = (event: DragMoveEvent) => {
    setOffsetX(event.delta.x)
  }

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over ? String(event.over.id) : null)
  }

  const resetDrag = () => {
    setActiveDrag(null)
    setOverId(null)
    setOffsetX(0)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    resetDrag()

    if (readOnly || !event.over) return

    /*
     * Read everything from the event — never from `activeDrag` / `projection`
     * React state. On a fast drag those updates may not have re-rendered yet,
     * which would leave a stale closure and silently drop the gesture.
     */
    const activeData = event.active.data.current
    const overNodeId = String(event.over.id)

    if (activeData?.source === 'toolbox') {
      const item = getToolboxItem(String(activeData.toolboxId))

      if (!item) return

      const overNode = findNode(root, overNodeId)

      if (!overNode) return

      if (canAcceptChild(overNode)) {
        dispatch({
          type: 'ADD_NODE',
          payload: { parentId: overNode.id, template: item.template },
        })

        return
      }

      const parent = findParent(root, overNodeId)

      if (parent && parent.type === 'object') {
        const index = parent.children.findIndex(
          (child) => child.id === overNodeId,
        )

        dispatch({
          type: 'ADD_NODE',
          payload: {
            parentId: parent.id,
            template: item.template,
            index: index + 1,
          },
        })
      }

      return
    }

    if (activeData?.source !== 'tree') return

    const activeNodeId = String(event.active.id)
    const renderedNow = removeDescendants(flattenTree(root, true), [
      activeNodeId,
    ])
    const { depth, parentId } = getProjection(
      renderedNow,
      root.id,
      activeNodeId,
      overNodeId,
      event.delta.x,
    )

    if (
      activeNodeId === overNodeId &&
      depth === renderedNow.find((i) => i.id === activeNodeId)?.depth
    ) {
      return
    }

    const parentNode = findNode(root, parentId)

    if (!parentNode || !isContainerType(parentNode.type)) return
    if (isAncestor(root, activeNodeId, parentId)) return
    if (
      parentNode.type === 'array' &&
      parentNode.children.some((child) => child.id !== activeNodeId)
    ) {
      return
    }

    const full = flattenTree(root).map((item) => ({ ...item }))
    const activeIndex = full.findIndex((item) => item.id === activeNodeId)
    const overIndex = full.findIndex((item) => item.id === overNodeId)

    if (activeIndex === -1 || overIndex === -1) return

    const moved = full[activeIndex]

    if (!moved) return

    full[activeIndex] = { ...moved, parentId, depth }

    const newRoot = buildTree(arrayMove(full, activeIndex, overIndex))

    dispatch({ type: 'REPLACE_ROOT', payload: { root: newRoot } })
  }

  const contextValue = useMemo<DesignerDndValue>(
    () => ({
      rendered,
      activeDrag,
      projection,
      dropTargetId,
      indentWidth: INDENT_WIDTH,
    }),
    [rendered, activeDrag, projection, dropTargetId],
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={treeCollisionDetection}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={resetDrag}
    >
      <DesignerDndContext value={contextValue}>{children}</DesignerDndContext>
      <DragOverlay dropAnimation={null}>
        {activeDrag?.source === 'toolbox' && (
          <ToolboxDragChip item={activeDrag.item} />
        )}
        {activeDrag?.source === 'tree' && (
          <TreeNodeDragChip nodeId={activeDrag.nodeId} />
        )}
      </DragOverlay>
    </DndContext>
  )
}
