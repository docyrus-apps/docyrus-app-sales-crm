// @ts-nocheck
/* eslint-disable */
/*
 * ─────────────────────────────────────────────────────────────────────────────
 * Path discovery helpers for the block helper popover.
 *
 * Both walkers are intentionally object-rooted: they descend through plain
 * objects but never *into* arrays. That matches how `{{#each}}` and
 * `{{#with}}` are typically authored — users select an array or object
 * accessible from the template's root context, then write the body of the
 * block. Surfacing paths inside specific array items (e.g. `items.0.tags`)
 * would clutter the picker with paths the user can't reach without first
 * being inside another loop.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const MAX_DEPTH = 6

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export interface DataArrayPath {
  /** Dot-joined path string used by Handlebars (e.g. `customer.contacts`). */
  path: string
  /** Indent depth for the tree UI. */
  depth: number
  /** Number of items in the array. */
  itemCount: number
  /** Inferred field keys from the first object row — empty for primitives. */
  itemKeys: string[]
  /** True when array items are objects (vs primitives / mixed). */
  isObjectArray: boolean
}

export interface DataObjectPath {
  /** Dot-joined path string used by Handlebars (e.g. `customer.address`). */
  path: string
  /** Indent depth for the tree UI. */
  depth: number
  /** Number of top-level keys on the object. */
  keyCount: number
  /** Top-level keys on the object (used by tooltip / preview). */
  keys: string[]
}

/** Walk plain-object branches and collect every array reachable from root. */
export function findDataArrayPaths(value: unknown): DataArrayPath[] {
  const out: DataArrayPath[] = []

  function walk(node: unknown, parts: string[], depth: number) {
    if (depth > MAX_DEPTH) return
    if (!isPlainObject(node)) return

    for (const [k, v] of Object.entries(node)) {
      const nextParts = [...parts, k]

      if (Array.isArray(v)) {
        const first = v[0]
        const isObjectArray = isPlainObject(first)

        out.push({
          path: nextParts.join('.'),
          depth: nextParts.length,
          itemCount: v.length,
          itemKeys: isObjectArray ? Object.keys(first) : [],
          isObjectArray,
        })
        continue
      }

      if (isPlainObject(v)) {
        walk(v, nextParts, depth + 1)
      }
    }
  }

  walk(value, [], 0)

  return out
}

/** Walk plain-object branches and collect every nested object reachable from root. */
export function findDataObjectPaths(value: unknown): DataObjectPath[] {
  const out: DataObjectPath[] = []

  function walk(node: unknown, parts: string[], depth: number) {
    if (depth > MAX_DEPTH) return
    if (!isPlainObject(node)) return

    for (const [k, v] of Object.entries(node)) {
      const nextParts = [...parts, k]

      if (isPlainObject(v)) {
        const keys = Object.keys(v)

        out.push({
          path: nextParts.join('.'),
          depth: nextParts.length,
          keyCount: keys.length,
          keys,
        })
        walk(v, nextParts, depth + 1)
      }
    }
  }

  walk(value, [], 0)

  return out
}
