// @ts-nocheck
/* eslint-disable */
import { type LucideIcon } from 'lucide-react'

/** Primitive JSON Schema `type` values supported by the designer. */
export type JsonSchemaType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'object'
  | 'array'
  | 'null'

/**
 * A pragmatic JSON Schema shape (Draft 2020-12 / Draft-07 compatible).
 * Unknown keywords are preserved on round-trip via the index signature.
 */
export interface JsonSchema {
  $schema?: string
  $id?: string
  $ref?: string
  type?: JsonSchemaType | JsonSchemaType[]
  title?: string
  description?: string
  default?: unknown
  examples?: unknown[]
  enum?: unknown[]
  const?: unknown
  format?: string
  properties?: Record<string, JsonSchema>
  required?: string[]
  additionalProperties?: boolean | JsonSchema
  items?: JsonSchema | JsonSchema[]
  minItems?: number
  maxItems?: number
  uniqueItems?: boolean
  minLength?: number
  maxLength?: number
  pattern?: string
  minimum?: number
  maximum?: number
  exclusiveMinimum?: number
  exclusiveMaximum?: number
  multipleOf?: number
  [keyword: string]: unknown
}

/**
 * Internal editable representation of a single schema node. The designer
 * works with a tree of these and converts to/from {@link JsonSchema}.
 *
 * Every node has a uniform `children` array:
 * - `object` nodes  → child property nodes (each meaningful `key`)
 * - `array` nodes   → exactly one item node (`key` ignored)
 * - scalar nodes    → empty
 */
export interface SchemaNode {
  /** Stable internal id (used for selection + drag-and-drop). */
  id: string
  /** Property name within the parent object. Ignored for array items / root. */
  key: string
  type: JsonSchemaType
  title?: string
  description?: string
  /** Whether this property is listed in the parent object's `required`. */
  required?: boolean
  /** Emits `type: [type, 'null']` when true. */
  nullable?: boolean
  /** Tree collapse state (UI only — not serialized). */
  collapsed?: boolean
  defaultValue?: unknown
  /** `enum` keyword values. */
  enumValues?: unknown[]
  format?: string
  minLength?: number
  maxLength?: number
  pattern?: string
  minimum?: number
  maximum?: number
  exclusiveMinimum?: number
  exclusiveMaximum?: number
  multipleOf?: number
  minItems?: number
  maxItems?: number
  uniqueItems?: boolean
  additionalProperties?: boolean
  /** Object properties or the single array item node. */
  children: SchemaNode[]
  /** Unrecognized JSON Schema keywords preserved for lossless round-trip. */
  extra?: Record<string, unknown>
}

/** A {@link SchemaNode} projected into a flat list for rendering / DnD. */
export interface FlatSchemaNode {
  node: SchemaNode
  id: string
  parentId: string | null
  depth: number
  /** Index among siblings. */
  index: number
}

/** A draggable schema-type entry shown in the left toolbox pane. */
export interface ToolboxItemDef {
  id: string
  label: string
  description: string
  icon: LucideIcon
  category: string
  /** Partial node applied on top of the type defaults when created. */
  template: Partial<SchemaNode> & { type: JsonSchemaType }
  /** Lowercase search terms. */
  keywords: string[]
}

export type DesignerView = 'tree' | 'json'

export interface DesignerState {
  root: SchemaNode
  selectedId: string | null
  /**
   * When true, the designer constrains editing and output to OpenAI
   * Structured Outputs strict-mode rules (every object emits
   * `additionalProperties: false` and lists all keys as `required`).
   */
  strictMode: boolean
}

export type DesignerAction =
  | {
      type: 'ADD_NODE'
      payload: {
        parentId: string
        template: ToolboxItemDef['template']
        index?: number
        select?: boolean
      }
    }
  | { type: 'REMOVE_NODE'; payload: { id: string } }
  | { type: 'DUPLICATE_NODE'; payload: { id: string } }
  | {
      type: 'UPDATE_NODE'
      payload: { id: string; updates: Partial<SchemaNode> }
    }
  | { type: 'SET_COLLAPSED'; payload: { id: string; collapsed: boolean } }
  | { type: 'SET_ALL_COLLAPSED'; payload: { collapsed: boolean } }
  | { type: 'SELECT_NODE'; payload: { id: string | null } }
  | { type: 'SET_STRICT_MODE'; payload: { strictMode: boolean } }
  | { type: 'REPLACE_ROOT'; payload: { root: SchemaNode } }
  | { type: 'CLEAR_ALL' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
