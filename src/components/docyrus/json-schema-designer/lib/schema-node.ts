// @ts-nocheck
/* eslint-disable */
import {
  type JsonSchemaType,
  type SchemaNode,
  type ToolboxItemDef,
} from '../json-schema-designer-types'

/** Generate a short, collision-resistant internal node id. */
export function createNodeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `node-${Math.random().toString(36).slice(2, 11)}`
}

/** Types that can contain children. */
export function isContainerType(type: JsonSchemaType): boolean {
  return type === 'object' || type === 'array'
}

/** Whether a node may receive another child (arrays accept exactly one item). */
export function canAcceptChild(node: SchemaNode): boolean {
  if (node.type === 'object') return true
  if (node.type === 'array') return node.children.length === 0

  return false
}

/** Human-readable label for a schema type. */
export function typeLabel(type: JsonSchemaType): string {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

/**
 * Build a fresh node from a toolbox template. Keys are assigned by the caller
 * (the reducer) so they stay unique within the destination object.
 */
export function createNode(
  template: ToolboxItemDef['template'],
  key: string,
): SchemaNode {
  return {
    id: createNodeId(),
    key,
    type: template.type,
    title: template.title,
    description: template.description,
    format: template.format,
    enumValues: template.enumValues ? [...template.enumValues] : undefined,
    children: [],
  }
}

/**
 * Ensure `desired` does not collide with any name in `taken`, appending a
 * numeric suffix when needed (`field` → `field_2` → `field_3`).
 */
export function uniqueKey(desired: string, taken: Iterable<string>): string {
  const used = new Set(taken)
  const base = desired.trim() || 'field'

  if (!used.has(base)) return base

  let n = 2

  while (used.has(`${base}_${n}`)) n += 1

  return `${base}_${n}`
}

/** Depth-first search for a node by id. */
export function findNode(root: SchemaNode, id: string): SchemaNode | null {
  if (root.id === id) return root

  for (const child of root.children) {
    const found = findNode(child, id)

    if (found) return found
  }

  return null
}

/** Find the parent of `id`, or `null` when `id` is the root / not found. */
export function findParent(root: SchemaNode, id: string): SchemaNode | null {
  for (const child of root.children) {
    if (child.id === id) return root

    const found = findParent(child, id)

    if (found) return found
  }

  return null
}

/** Whether `ancestorId` is `nodeId` or one of its ancestors. */
export function isAncestor(
  root: SchemaNode,
  ancestorId: string,
  nodeId: string,
): boolean {
  const ancestor = findNode(root, ancestorId)

  if (!ancestor) return false

  return findNode(ancestor, nodeId) !== null
}

/** Immutably map over every node in the tree. */
export function mapTree(
  node: SchemaNode,
  fn: (node: SchemaNode) => SchemaNode,
): SchemaNode {
  const mapped = fn(node)

  return {
    ...mapped,
    children: mapped.children.map((child) => mapTree(child, fn)),
  }
}

/** Total node count excluding the root. */
export function countNodes(root: SchemaNode): number {
  return root.children.reduce((sum, child) => sum + 1 + countNodes(child), 0)
}

/** An empty object root — the starting point for a brand-new schema. */
export function createEmptyRoot(): SchemaNode {
  return {
    id: createNodeId(),
    key: 'root',
    type: 'object',
    children: [],
  }
}
