// @ts-nocheck
/* eslint-disable */
/*
 * Shared autocomplete-variable descriptors for the Handlebars + JSONata
 * editors. A "context path" is a dotted path the user can insert into a
 * template / expression (e.g. `customer.email`). Paths may carry an optional
 * type label and description so the editors can surface them in the
 * autocomplete dropdown — the type inline (`detail`), the description in the
 * side panel (`info`).
 */

/** A single autocomplete variable surfaced in the expression / template editors. */
export interface ContextPath {
  /** Dotted path inserted into the editor (e.g. `customer.email`). */
  path: string
  /** Optional type label shown inline (the completion `detail`, e.g. `string`). */
  type?: string
  /** Optional description shown in the side panel (the completion `info`). */
  description?: string
  /** Optional human-readable label shown alongside the path in pickers. */
  label?: string
}

/** Either a bare dotted-path string or a rich {@link ContextPath} descriptor. */
export type ContextPathInput = string | ContextPath

/**
 * Normalizes mixed string / object context paths into {@link ContextPath}
 * records, de-duplicated by `path`. Earlier entries win, so list richer
 * explicit descriptors (e.g. derived from a schema) **before** bare
 * auto-extracted strings — missing `type` / `description` / `label` fields are
 * back-filled from later duplicates of the same path.
 */
export function normalizeContextPaths(
  paths: readonly ContextPathInput[] | undefined,
): ContextPath[] {
  if (!paths || paths.length === 0) return []

  const byPath = new Map<string, ContextPath>()

  for (const entry of paths) {
    const cp = typeof entry === 'string' ? { path: entry } : entry

    if (!cp || !cp.path) continue

    const existing = byPath.get(cp.path)

    if (!existing) {
      byPath.set(cp.path, { ...cp })

      continue
    }

    byPath.set(cp.path, {
      path: cp.path,
      type: existing.type ?? cp.type,
      description: existing.description ?? cp.description,
      label: existing.label ?? cp.label,
    })
  }

  return Array.from(byPath.values())
}

/*
 * ────────────────────────────────────────────────────────────
 * JSON Schema → context paths
 * ────────────────────────────────────────────────────────────
 */

/** A minimal, structural JSON Schema node — enough to derive context paths. */
export interface JsonSchemaNode {
  type?: string | string[]
  title?: string
  description?: string
  properties?: Record<string, JsonSchemaNode>
  items?: JsonSchemaNode | JsonSchemaNode[]
  required?: string[]
  enum?: unknown[]
  format?: string
  allOf?: JsonSchemaNode[]
  anyOf?: JsonSchemaNode[]
  oneOf?: JsonSchemaNode[]
  [key: string]: unknown
}

/** Options for {@link jsonSchemaToContextPaths}. */
export interface JsonSchemaToContextPathsOptions {
  /**
   * How to represent array-element access in emitted paths.
   * - `'index'` (default) — `items[0].name` (JSONata-style)
   * - `'dot-index'` — `items.[0].name` (matches the Handlebars extractor)
   * - `'none'` — descend into item properties without an index marker (`items.name`)
   */
  arrayNotation?: 'index' | 'dot-index' | 'none'
  /** Emit intermediate object / array container paths, not just leaves. Default `true`. */
  includeContainers?: boolean
  /** Maximum nesting depth to walk. Default `8`. */
  maxDepth?: number
}

/** Merges a node's own `properties` with any contributed by `allOf` / `anyOf` / `oneOf`. */
function mergedProperties(
  node: JsonSchemaNode,
): Record<string, JsonSchemaNode> {
  const props: Record<string, JsonSchemaNode> = { ...(node.properties ?? {}) }

  for (const key of ['allOf', 'anyOf', 'oneOf'] as const) {
    const subs = node[key]

    if (!Array.isArray(subs)) continue

    for (const sub of subs) {
      if (sub && typeof sub === 'object' && sub.properties)
        Object.assign(props, sub.properties)
    }
  }

  return props
}

/** Whether a node has nested structure worth descending into. */
function isContainerNode(node: JsonSchemaNode | undefined): boolean {
  if (!node) return false
  if (node.type === 'array' || node.items != null) return true

  return Object.keys(mergedProperties(node)).length > 0
}

/** Human-readable type label for the completion `detail`. */
function typeLabel(node: JsonSchemaNode | undefined): string | undefined {
  if (!node) return undefined

  if (Array.isArray(node.type)) return node.type.join(' | ')

  if (node.type === 'array') {
    const items = Array.isArray(node.items) ? node.items[0] : node.items
    const itemType = typeLabel(items)

    return itemType ? `${itemType}[]` : 'array'
  }

  if (typeof node.type === 'string') return node.type
  if (Array.isArray(node.enum)) return 'enum'
  if (node.properties) return 'object'

  return undefined
}

/**
 * Walks a standard JSON Schema and returns a flat list of {@link ContextPath}
 * descriptors — one per property — carrying the schema's `type` and
 * `description` so the Handlebars / JSONata editors can show them in
 * autocomplete. Unlike example-data extraction this is not limited by sample
 * depth or array contents, and it preserves the descriptions authors wrote.
 *
 * ```ts
 * <JsonataEditor contextPaths={jsonSchemaToContextPaths(mySchema)} />
 * <HandlebarsEditor contextPaths={jsonSchemaToContextPaths(mySchema, { arrayNotation: 'dot-index' })} />
 * ```
 */
export function jsonSchemaToContextPaths(
  schema: JsonSchemaNode | undefined,
  options: JsonSchemaToContextPathsOptions = {},
): ContextPath[] {
  const {
    arrayNotation = 'index',
    includeContainers = true,
    maxDepth = 8,
  } = options

  const out: ContextPath[] = []
  const seen = new Set<string>()

  const push = (cp: ContextPath) => {
    if (!cp.path || seen.has(cp.path)) return
    seen.add(cp.path)
    out.push(cp)
  }

  const arrayChildPrefix = (prefix: string): string => {
    if (arrayNotation === 'none') return prefix
    if (arrayNotation === 'dot-index') return prefix ? `${prefix}.[0]` : '[0]'

    return prefix ? `${prefix}[0]` : '[0]'
  }

  const walk = (
    node: JsonSchemaNode | undefined,
    prefix: string,
    depth: number,
  ) => {
    if (!node || depth > maxDepth) return

    const props = mergedProperties(node)
    const keys = Object.keys(props)

    if (keys.length > 0) {
      for (const key of keys) {
        if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue

        const child = props[key]
        const path = prefix ? `${prefix}.${key}` : key
        const container = isContainerNode(child)

        if (!container || includeContainers) {
          push({
            path,
            type: typeLabel(child),
            description: child?.description ?? child?.title,
          })
        }

        walk(child, path, depth + 1)
      }

      return
    }

    if (node.type === 'array' || node.items != null) {
      const items = Array.isArray(node.items) ? node.items[0] : node.items

      walk(items, arrayChildPrefix(prefix), depth + 1)
    }
  }

  walk(schema, '', 0)

  return out
}
