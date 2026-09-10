// @ts-nocheck
/* eslint-disable */
import { arrayMove } from '@dnd-kit/sortable'

import {
  type FlatSchemaNode,
  type SchemaNode,
} from '../json-schema-designer-types'

/** Horizontal indent (px) applied per tree depth level. */
export const INDENT_WIDTH = 20

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Flatten a node tree into a depth-first list.
 *
 * @param respectCollapsed - when `true`, children of collapsed nodes are skipped
 *   (used for rendering). Pass `false` for drag-and-drop reconstruction.
 */
export function flattenTree(
  root: SchemaNode,
  respectCollapsed = false,
): FlatSchemaNode[] {
  const result: FlatSchemaNode[] = []

  const walk = (
    node: SchemaNode,
    parentId: string | null,
    depth: number,
    index: number,
  ) => {
    result.push({
      node,
      id: node.id,
      parentId,
      depth,
      index,
    })

    if (respectCollapsed && node.collapsed) return

    node.children.forEach((child, childIndex) => {
      walk(child, node.id, depth + 1, childIndex)
    })
  }

  walk(root, null, 0, 0)

  return result
}

/**
 * Drop every node that descends from one of `ancestorIds`. Relies on the
 * depth-first ordering produced by {@link flattenTree}.
 */
export function removeDescendants(
  flat: FlatSchemaNode[],
  ancestorIds: string[],
): FlatSchemaNode[] {
  const excluded = new Set<string>()
  const result: FlatSchemaNode[] = []

  for (const item of flat) {
    if (
      item.parentId &&
      (ancestorIds.includes(item.parentId) || excluded.has(item.parentId))
    ) {
      excluded.add(item.id)
      continue
    }

    result.push(item)
  }

  return result
}

/** Reconstruct a node tree from a flat list, nesting by `parentId`. */
export function buildTree(flat: FlatSchemaNode[]): SchemaNode {
  const map = new Map<string, SchemaNode>()

  for (const item of flat) {
    map.set(item.id, { ...item.node, children: [] })
  }

  let root: SchemaNode | null = null

  for (const item of flat) {
    const self = map.get(item.id)

    if (!self) continue

    if (item.parentId === null) {
      root = self
      continue
    }

    map.get(item.parentId)?.children.push(self)
  }

  return (
    root ??
    map.get(flat[0]?.id ?? '') ?? {
      id: 'root',
      key: 'root',
      type: 'object',
      children: [],
    }
  )
}

/** Whether a flattened node may currently receive another child. */
function canHaveChildren(item: FlatSchemaNode): boolean {
  if (item.node.type === 'object') return true

  return item.node.type === 'array' && item.node.children.length === 0
}

interface Projection {
  depth: number
  parentId: string
}

/**
 * Given a drag in progress over a tree, compute the depth and parent the
 * dragged node would land at — the canonical dnd-kit sortable-tree algorithm,
 * constrained so nodes only nest inside containers and never above the root.
 */
export function getProjection(
  items: FlatSchemaNode[],
  rootId: string,
  activeId: string,
  overId: string,
  dragOffsetX: number,
  indentWidth = INDENT_WIDTH,
): Projection {
  const overIndex = items.findIndex((item) => item.id === overId)
  const activeIndex = items.findIndex((item) => item.id === activeId)
  const activeItem = items[activeIndex]

  if (!activeItem || overIndex === -1) return { depth: 1, parentId: rootId }

  const reordered = arrayMove(items, activeIndex, overIndex)
  const previousItem = reordered[overIndex - 1]
  const nextItem = reordered[overIndex + 1]

  const dragDepth = Math.round(dragOffsetX / indentWidth)
  const projectedDepth = activeItem.depth + dragDepth

  const maxDepth = previousItem
    ? canHaveChildren(previousItem)
      ? previousItem.depth + 1
      : previousItem.depth
    : 1
  const minDepth = nextItem ? nextItem.depth : 1
  const depth = clamp(
    projectedDepth,
    Math.max(1, minDepth),
    Math.max(1, maxDepth),
  )

  const resolveParentId = (): string => {
    if (!previousItem) return rootId
    if (depth === previousItem.depth) return previousItem.parentId ?? rootId
    if (depth > previousItem.depth) return previousItem.id

    const ancestor = reordered
      .slice(0, overIndex)
      .reverse()
      .find((item) => item.depth === depth)

    return ancestor?.parentId ?? rootId
  }

  return { depth, parentId: resolveParentId() }
}
