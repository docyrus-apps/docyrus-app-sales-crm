// @ts-nocheck
/* eslint-disable */
/**
 * Bidirectional adapter between our designer's `JsonSchema` (Draft-07 /
 * 2020-12 compatible) and the vendored extend-hq `SchemaBuilderSchema` shape.
 *
 * extend-hq's panel works exclusively with its own `SchemaBuilderProperty`
 * tree (recursive `properties[]` for objects, `items` for arrays, an `enum`
 * variant for `string`-with-`enum`). Our public API exposes plain JSON
 * Schema, so the controlled-value wiring between the two needs to translate
 * in both directions on every render.
 *
 * Important shape differences handled here:
 *   - extend-hq has NO per-property required toggle in the row UI. We model
 *     required as a global `strict` flag: when on, every property in every
 *     object emits in `required[]` (OpenAI Structured Outputs rules);
 *     when off, no `required[]` is emitted. Per-property required arrays
 *     from a controlled inbound `value` are intentionally collapsed
 *   - extend-hq models enum as a top-level `type === 'enum'` (always under a
 *     `string` carrier); standard JSON Schema represents the same data as
 *     `{ type: 'string', enum: [...] }`
 *   - extend-hq's array enum lives under `items.enumValues` rather than the
 *     standard `items.enum`
 *   - Property ids are internal-only and re-generated on every translation;
 *     they don't round-trip into the JSON Schema output
 */

import {
  type SchemaBuilderArrayItemType,
  type SchemaBuilderEnumValue,
  type SchemaBuilderFieldType,
  type SchemaBuilderProperty,
  type SchemaBuilderSchema,
} from './schema-builder'

import {
  type JsonSchema,
  type JsonSchemaType,
} from '../json-schema-designer-types'

const SCALAR_TYPES = new Set<JsonSchemaType>([
  'string',
  'number',
  'integer',
  'boolean',
  'null',
])

function generateId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID()
  }

  return `id-${Math.random().toString(36).slice(2, 11)}`
}

function generateEnumValueId(): string {
  return `enum-${generateId()}`
}

function resolveType(jsonType: JsonSchema['type']): JsonSchemaType {
  if (Array.isArray(jsonType)) {
    /*
     * Pick the first non-`null` entry — extend-hq doesn't model union types,
     * so a `["string", "null"]` (nullable string) collapses to `string`.
     */
    const real = jsonType.find((t) => t !== 'null')

    return (real ?? 'string') as JsonSchemaType
  }

  return (jsonType ?? 'string') as JsonSchemaType
}

function toBuilderProperties(
  properties: Record<string, JsonSchema> | undefined,
): SchemaBuilderProperty[] {
  if (!properties) return []

  return Object.entries(properties).map(([key, child]) =>
    toBuilderProperty(key, child),
  )
}

function toBuilderEnumValues(
  values: ReadonlyArray<unknown>,
  descriptions?: Record<string, unknown>,
): SchemaBuilderEnumValue[] {
  return values.map((raw) => {
    const value = String(raw)
    const description =
      descriptions && typeof descriptions[value] === 'string'
        ? (descriptions[value] as string)
        : ''

    return { id: generateEnumValueId(), value, description }
  })
}

function toBuilderProperty(
  key: string,
  schema: JsonSchema,
): SchemaBuilderProperty {
  const type = resolveType(schema.type)
  const description =
    typeof schema.description === 'string' ? schema.description : ''
  const enumDescriptionsRaw = schema['enumDescriptions']
  const enumDescriptions =
    enumDescriptionsRaw && typeof enumDescriptionsRaw === 'object'
      ? (enumDescriptionsRaw as Record<string, unknown>)
      : undefined

  if (
    type === 'string' &&
    Array.isArray(schema.enum) &&
    schema.enum.length > 0
  ) {
    return {
      id: generateId(),
      key,
      type: 'enum',
      description,
      enumValues: toBuilderEnumValues(schema.enum, enumDescriptions),
    } as SchemaBuilderProperty
  }

  if (type === 'object') {
    return {
      id: generateId(),
      key,
      type: 'object',
      description,
      properties: toBuilderProperties(schema.properties),
    } as SchemaBuilderProperty
  }

  if (type === 'array') {
    const items = Array.isArray(schema.items) ? schema.items[0] : schema.items
    const itemsType = resolveType(items?.type)
    let arrayItems: SchemaBuilderProperty['items']

    if (items && itemsType === 'object') {
      arrayItems = {
        type: 'object',
        properties: toBuilderProperties(items.properties),
      }
    } else if (
      items &&
      itemsType === 'string' &&
      Array.isArray(items.enum) &&
      items.enum.length > 0
    ) {
      const itemsEnumDescRaw = items['enumDescriptions']
      const itemsEnumDesc =
        itemsEnumDescRaw && typeof itemsEnumDescRaw === 'object'
          ? (itemsEnumDescRaw as Record<string, unknown>)
          : undefined

      arrayItems = {
        type: 'enum',
        enumValues: toBuilderEnumValues(items.enum, itemsEnumDesc),
      }
    } else {
      const safeItemsType = (
        itemsType === 'string' ||
        itemsType === 'number' ||
        itemsType === 'integer' ||
        itemsType === 'boolean'
          ? itemsType
          : 'string'
      ) as SchemaBuilderArrayItemType

      arrayItems = { type: safeItemsType }
    }

    return {
      id: generateId(),
      key,
      type: 'array',
      description,
      items: arrayItems,
    } as SchemaBuilderProperty
  }

  /*
   * Plain scalar / null carrier — also handle `string` with no enum.
   */
  const safeType = (
    SCALAR_TYPES.has(type) ? type : 'string'
  ) as SchemaBuilderFieldType

  return {
    id: generateId(),
    key,
    type: safeType,
    description,
  } as SchemaBuilderProperty
}

/**
 * Convert our designer's controlled `JsonSchema` into the extend-hq
 * `SchemaBuilderSchema` the vendored panel consumes. Treats the input as the
 * root object schema; non-object roots collapse to an empty builder schema.
 */
export function jsonSchemaToBuilder(
  schema: JsonSchema | undefined,
): SchemaBuilderSchema {
  if (!schema || resolveType(schema.type) !== 'object') {
    return { properties: [] }
  }

  return {
    properties: toBuilderProperties(schema.properties),
  }
}

function serializeEnumValues(values: SchemaBuilderEnumValue[]): {
  enumList: string[]
  enumDescriptions: Record<string, string>
} {
  const enumList = values.map((option) => option.value)
  const enumDescriptions = Object.fromEntries(
    values
      .filter((option) => option.description.trim())
      .map((option) => [option.value, option.description]),
  )

  return { enumList, enumDescriptions }
}

function serializeProperty(
  property: SchemaBuilderProperty,
  strict: boolean,
): JsonSchema {
  const description = property.description.trim()
  const base: JsonSchema = description ? { description } : {}

  if (property.type === 'enum') {
    const { enumList, enumDescriptions } = serializeEnumValues(
      property.enumValues ?? [],
    )
    const serialized: JsonSchema = {
      type: 'string',
      ...base,
      enum: enumList,
    }

    if (Object.keys(enumDescriptions).length > 0) {
      serialized['enumDescriptions'] = enumDescriptions
    }

    return serialized
  }

  if (property.type === 'object') {
    return { ...base, ...buildObjectSchema(property.properties ?? [], strict) }
  }

  if (property.type === 'array') {
    const items = property.items ?? { type: 'string' as const }
    let itemsSchema: JsonSchema

    if (items.type === 'object') {
      itemsSchema = buildObjectSchema(items.properties ?? [], strict)
    } else if (items.type === 'enum') {
      const { enumList, enumDescriptions } = serializeEnumValues(
        items.enumValues ?? [],
      )

      itemsSchema = { type: 'string', enum: enumList }

      if (Object.keys(enumDescriptions).length > 0) {
        itemsSchema['enumDescriptions'] = enumDescriptions
      }
    } else {
      itemsSchema = { type: items.type }
    }

    return {
      type: 'array',
      ...base,
      items: itemsSchema,
    }
  }

  return { type: property.type as JsonSchemaType, ...base }
}

function buildObjectSchema(
  properties: SchemaBuilderProperty[],
  strict: boolean,
): JsonSchema {
  const valid = properties.filter((p) => p.key.trim())
  const out: JsonSchema = {
    type: 'object',
    properties: Object.fromEntries(
      valid.map((property) => [
        property.key.trim(),
        serializeProperty(property, strict),
      ]),
    ),
  }

  if (strict && valid.length > 0) {
    out.required = valid.map((property) => property.key.trim())
  }

  if (strict) {
    out.additionalProperties = false
  }

  return out
}

/**
 * Convert the extend-hq panel's working `SchemaBuilderSchema` back into a
 * standard JSON Schema. When `strict` is true, every object emits
 * `additionalProperties: false` and lists every property in `required` —
 * matching OpenAI Structured Outputs strict-mode rules.
 */
export function builderToJsonSchema(
  builder: SchemaBuilderSchema,
  strict = false,
): JsonSchema {
  return buildObjectSchema(builder.properties, strict)
}
