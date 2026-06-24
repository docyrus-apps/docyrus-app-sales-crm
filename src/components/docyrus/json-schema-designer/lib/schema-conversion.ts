// @ts-nocheck
/* eslint-disable */
import {
  type JsonSchema,
  type JsonSchemaType,
  type SchemaNode,
} from '../json-schema-designer-types'
import { createNodeId } from './schema-node'
import {
  isForbiddenStrictKeyword,
  stripForbiddenStrictKeywords,
} from './strict-mode'

export const DEFAULT_SCHEMA_DIALECT =
  'https://json-schema.org/draft/2020-12/schema'

const VALID_TYPES: ReadonlySet<string> = new Set([
  'string',
  'number',
  'integer',
  'boolean',
  'object',
  'array',
  'null',
])

/**
 * Keywords the designer maps onto dedicated `SchemaNode` fields. Anything else
 * is captured in `node.extra` so unknown keywords survive a round-trip.
 */
const MANAGED_KEYWORDS: ReadonlySet<string> = new Set([
  'type',
  'title',
  'description',
  'default',
  'enum',
  'format',
  'properties',
  'required',
  'additionalProperties',
  'items',
  'minLength',
  'maxLength',
  'pattern',
  'minimum',
  'maximum',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'multipleOf',
  'minItems',
  'maxItems',
  'uniqueItems',
])

function nodeToSchema(node: SchemaNode, strict: boolean): JsonSchema {
  const schema: JsonSchema = {}

  schema.type = node.nullable ? [node.type, 'null'] : node.type

  if (node.title) schema.title = node.title
  if (node.description) schema.description = node.description
  if (node.format && !strict) schema.format = node.format
  if (node.defaultValue !== undefined && !strict)
    schema.default = node.defaultValue
  if (node.enumValues && node.enumValues.length > 0)
    schema.enum = [...node.enumValues]

  if (node.type === 'string') {
    if (node.minLength !== undefined && !strict)
      schema.minLength = node.minLength
    if (node.maxLength !== undefined && !strict)
      schema.maxLength = node.maxLength
    if (node.pattern && !strict) schema.pattern = node.pattern
  }

  if (node.type === 'number' || node.type === 'integer') {
    if (node.minimum !== undefined && !strict) schema.minimum = node.minimum
    if (node.maximum !== undefined && !strict) schema.maximum = node.maximum
    if (node.exclusiveMinimum !== undefined && !strict)
      schema.exclusiveMinimum = node.exclusiveMinimum
    if (node.exclusiveMaximum !== undefined && !strict)
      schema.exclusiveMaximum = node.exclusiveMaximum
    if (node.multipleOf !== undefined && !strict)
      schema.multipleOf = node.multipleOf
  }

  if (node.type === 'object') {
    const properties: Record<string, JsonSchema> = {}
    const required: string[] = []

    for (const child of node.children) {
      properties[child.key] = nodeToSchema(child, strict)

      if (strict || child.required) required.push(child.key)
    }

    if (node.children.length > 0) schema.properties = properties
    if (required.length > 0) schema.required = required
    if (strict || node.additionalProperties === false)
      schema.additionalProperties = false
  }

  if (node.type === 'array') {
    const item = node.children[0]

    if (item) schema.items = nodeToSchema(item, strict)
    if (node.minItems !== undefined && !strict) schema.minItems = node.minItems
    if (node.maxItems !== undefined && !strict) schema.maxItems = node.maxItems
    if (node.uniqueItems && !strict) schema.uniqueItems = true
  }

  if (node.extra) {
    if (strict) {
      for (const [key, value] of Object.entries(node.extra)) {
        if (!isForbiddenStrictKeyword(key)) schema[key] = value
      }
    } else {
      Object.assign(schema, node.extra)
    }
  }

  if (strict) stripForbiddenStrictKeywords(schema)

  return schema
}

/**
 * Convert the internal node tree into a standard JSON Schema document.
 *
 * @param strict - when true, emit an OpenAI Structured Outputs strict-mode
 *   schema: every object gets `additionalProperties: false` and lists all of
 *   its property keys in `required`.
 */
export function treeToSchema(root: SchemaNode, strict = false): JsonSchema {
  const schema = nodeToSchema(root, strict)

  if (typeof schema.$schema !== 'string')
    schema.$schema = DEFAULT_SCHEMA_DIALECT

  return schema
}

/** Serialize a node tree to a pretty-printed JSON Schema string. */
export function treeToJsonString(root: SchemaNode, strict = false): string {
  return JSON.stringify(treeToSchema(root, strict), null, 2)
}

function resolveType(schema: JsonSchema): {
  type: JsonSchemaType
  nullable: boolean
} {
  let raw = schema.type
  let nullable = false

  if (Array.isArray(raw)) {
    nullable = raw.includes('null')
    raw = raw.find((entry) => entry !== 'null')
  }

  let type =
    typeof raw === 'string' && VALID_TYPES.has(raw)
      ? (raw as JsonSchemaType)
      : undefined

  if (!type) {
    if (schema.properties) type = 'object'
    else if (schema.items) type = 'array'
    else type = 'string'
  }

  return { type, nullable }
}

function numberKeyword(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function schemaToNode(schema: JsonSchema, key: string): SchemaNode {
  const { type, nullable } = resolveType(schema)

  const node: SchemaNode = {
    id: createNodeId(),
    key,
    type,
    children: [],
  }

  if (nullable) node.nullable = true
  if (typeof schema.title === 'string') node.title = schema.title
  if (typeof schema.description === 'string')
    node.description = schema.description
  if (typeof schema.format === 'string') node.format = schema.format
  if (schema.default !== undefined) node.defaultValue = schema.default
  if (Array.isArray(schema.enum) && schema.enum.length > 0)
    node.enumValues = [...schema.enum]

  if (type === 'string') {
    node.minLength = numberKeyword(schema.minLength)
    node.maxLength = numberKeyword(schema.maxLength)

    if (typeof schema.pattern === 'string') node.pattern = schema.pattern
  }

  if (type === 'number' || type === 'integer') {
    node.minimum = numberKeyword(schema.minimum)
    node.maximum = numberKeyword(schema.maximum)
    node.exclusiveMinimum = numberKeyword(schema.exclusiveMinimum)
    node.exclusiveMaximum = numberKeyword(schema.exclusiveMaximum)
    node.multipleOf = numberKeyword(schema.multipleOf)
  }

  if (type === 'array') {
    node.minItems = numberKeyword(schema.minItems)
    node.maxItems = numberKeyword(schema.maxItems)

    if (schema.uniqueItems === true) node.uniqueItems = true

    const items = Array.isArray(schema.items) ? schema.items[0] : schema.items

    if (items && typeof items === 'object') {
      node.children = [schemaToNode(items, 'item')]
    }
  }

  if (type === 'object') {
    if (schema.additionalProperties === false) node.additionalProperties = false

    const required = Array.isArray(schema.required) ? schema.required : []
    const { properties } = schema

    if (properties && typeof properties === 'object') {
      node.children = Object.entries(properties).map(
        ([childKey, childSchema]) => {
          const child = schemaToNode(childSchema ?? {}, childKey)

          if (required.includes(childKey)) child.required = true

          return child
        },
      )
    }
  }

  const extra: Record<string, unknown> = {}

  for (const keyword of Object.keys(schema)) {
    if (!MANAGED_KEYWORDS.has(keyword)) extra[keyword] = schema[keyword]
  }

  if (Object.keys(extra).length > 0) node.extra = extra

  return node
}

/**
 * Convert a JSON Schema document into the internal node tree. Non-object input
 * (or a boolean schema) falls back to an empty object root.
 */
export function schemaToTree(
  schema: JsonSchema | null | undefined,
): SchemaNode {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
    return {
      id: createNodeId(),
      key: 'root',
      type: 'object',
      children: [],
    }
  }

  const root = schemaToNode(schema, 'root')

  root.required = false
  root.nullable = false

  return root
}

/**
 * Parse a JSON string into a node tree.
 *
 * @returns `{ root }` on success or `{ error }` with a human-readable message.
 */
export function parseJsonToTree(
  input: string,
): { root: SchemaNode } | { error: string } {
  let parsed: unknown

  try {
    parsed = JSON.parse(input)
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Invalid JSON' }
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { error: 'Root schema must be a JSON object' }
  }

  return { root: schemaToTree(parsed as JsonSchema) }
}
