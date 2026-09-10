// @ts-nocheck
/* eslint-disable */
import { type DesignerNode } from '../adaptive-card-designer-types'
import { slotsFor } from './node-tree'

export interface NodeLocation {
  parent: DesignerNode
  slot: string
  index: number
}

/** Depth-first search for a node by `__designerId`. */
export function findNode(root: DesignerNode, id: string): DesignerNode | null {
  if (root.__designerId === id) return root

  for (const slot of Object.values(root.slots)) {
    for (const child of slot) {
      const found = findNode(child, id)

      if (found) return found
    }
  }

  return null
}

/** Locate the parent + slot + index of a node, or `null` for the root / not-found. */
export function findLocation(
  root: DesignerNode,
  id: string,
): NodeLocation | null {
  for (const [slot, children] of Object.entries(root.slots)) {
    for (let i = 0; i < children.length; i += 1) {
      const child = children[i]

      if (!child) continue

      if (child.__designerId === id) {
        return { parent: root, slot, index: i }
      }

      const nested = findLocation(child, id)

      if (nested) return nested
    }
  }

  return null
}

/** Whether `ancestorId` equals `nodeId` or is one of its ancestors. */
export function isAncestor(
  root: DesignerNode,
  ancestorId: string,
  nodeId: string,
): boolean {
  const ancestor = findNode(root, ancestorId)

  if (!ancestor) return false

  return findNode(ancestor, nodeId) !== null
}

/* ─── Immutable mutations ──────────────────────────────────────── */

export function updateNode(
  root: DesignerNode,
  id: string,
  updater: (node: DesignerNode) => DesignerNode,
): DesignerNode {
  if (root.__designerId === id) return updater(root)

  let changed = false
  const slots: Record<string, DesignerNode[]> = {}

  for (const [slot, children] of Object.entries(root.slots)) {
    const next: DesignerNode[] = []
    let slotChanged = false

    for (const child of children) {
      const updated = updateNode(child, id, updater)

      if (updated !== child) slotChanged = true
      next.push(updated)
    }

    slots[slot] = slotChanged ? next : children

    if (slotChanged) changed = true
  }

  return changed ? { ...root, slots } : root
}

export function insertNode(
  root: DesignerNode,
  parentId: string,
  slot: string,
  index: number,
  node: DesignerNode,
): DesignerNode {
  return updateNode(root, parentId, (parent) => {
    if (!slotsFor(parent.type).includes(slot)) return parent

    const existing = parent.slots[slot] ?? []
    const at = Math.max(0, Math.min(index, existing.length))
    const nextChildren = [...existing.slice(0, at), node, ...existing.slice(at)]

    return {
      ...parent,
      slots: { ...parent.slots, [slot]: nextChildren },
    }
  })
}

export function removeNode(root: DesignerNode, id: string): DesignerNode {
  if (root.__designerId === id) return root // never remove the root

  let changed = false
  const slots: Record<string, DesignerNode[]> = {}

  for (const [slot, children] of Object.entries(root.slots)) {
    const next: DesignerNode[] = []
    let slotChanged = false

    for (const child of children) {
      if (child.__designerId === id) {
        slotChanged = true
        continue
      }

      const stripped = removeNode(child, id)

      if (stripped !== child) slotChanged = true

      next.push(stripped)
    }

    slots[slot] = slotChanged ? next : children

    if (slotChanged) changed = true
  }

  return changed ? { ...root, slots } : root
}

export function moveNode(
  root: DesignerNode,
  id: string,
  targetParentId: string,
  targetSlot: string,
  targetIndex: number,
): DesignerNode {
  if (id === targetParentId || isAncestor(root, id, targetParentId)) return root

  const node = findNode(root, id)

  if (!node) return root

  const source = findLocation(root, id)

  if (!source) return root

  let next = removeNode(root, id)

  let adjustedIndex = targetIndex

  if (
    source.parent.__designerId === targetParentId &&
    source.slot === targetSlot &&
    source.index < targetIndex
  ) {
    adjustedIndex = Math.max(0, targetIndex - 1)
  }

  next = insertNode(next, targetParentId, targetSlot, adjustedIndex, node)

  return next
}

/* ─── Aggregate helpers ────────────────────────────────────────── */

/** Recursive node count, excluding the root. */
export function countNodes(root: DesignerNode): number {
  let total = 0

  for (const children of Object.values(root.slots)) {
    for (const child of children) {
      total += 1 + countNodes(child)
    }
  }

  return total
}

/** Collect every `__designerId` in document order. */
export function collectIds(root: DesignerNode): string[] {
  const ids: string[] = [root.__designerId]

  for (const children of Object.values(root.slots)) {
    for (const child of children) ids.push(...collectIds(child))
  }

  return ids
}
