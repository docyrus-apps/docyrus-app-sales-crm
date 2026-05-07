import { type DocyrusFieldLike } from '@/hooks/use-docyrus-field-component'

import {
  type AnalysedFile,
  type ImportPayloadOptions,
  type MappingValidationResult,
  type WizardMappingMap,
} from '../types'

import { slugify } from './auto-mapping'

const SECONDARY_SLUG_BY_TYPE: Record<string, string> = {
  'field-money': '__amount_currency',
  'field-phone': '__phone_country',
}

/** Field types whose values we pre-resolve into `uniqueData` for the import endpoint. */
const ENUM_LIKE_TYPES = new Set<string>([
  'field-status',
  'field-enum',
  'field-systemEnum',
  'field-select',
  'field-radioGroup',
  'field-multiSelect',
  'field-tagSelect',
])

const RELATION_LIKE_TYPES = new Set<string>([
  'field-relation',
  'field-relatedField',
  'field-userSelect',
  'field-userMultiSelect',
])

export function getSecondarySlug(
  fieldType: string | undefined,
): string | undefined {
  if (!fieldType) return undefined

  return SECONDARY_SLUG_BY_TYPE[fieldType]
}

export function isEnumLikeType(fieldType: string | undefined): boolean {
  return fieldType ? ENUM_LIKE_TYPES.has(fieldType) : false
}

export function isRelationLikeType(fieldType: string | undefined): boolean {
  return fieldType ? RELATION_LIKE_TYPES.has(fieldType) : false
}

/**
 * Convert the wizard's column-mapping UI state into the payload shape the
 * import endpoint expects. Pure function — does not pre-resolve relation /
 * enum lookups (the hook does that asynchronously before posting).
 */
export function buildImportOptions(
  mapping: WizardMappingMap,
  fields: ReadonlyArray<DocyrusFieldLike>,
  upsertUniqueFields: boolean,
  preResolvedUniqueData?: ImportPayloadOptions['uniqueData'],
): ImportPayloadOptions {
  const fieldsBySlug = new Map<string, DocyrusFieldLike>()

  for (const field of fields) {
    if (field.slug) fieldsBySlug.set(String(field.slug), field)
  }

  const fieldMapping: Record<string, string> = {}
  const fieldOptions: Record<
    string,
    { reference_key?: string; format?: string | ReadonlyArray<string> }
  > = {}

  for (const entry of Object.values(mapping)) {
    if (!entry.targetSlug) continue

    fieldMapping[entry.sourceColumn] = entry.targetSlug

    const matched = fieldsBySlug.get(entry.targetSlug)

    if (
      entry.fieldOptions &&
      (entry.fieldOptions.reference_key || entry.fieldOptions.format)
    ) {
      const opts: {
        reference_key?: string
        format?: string | ReadonlyArray<string>
      } = {}

      if (entry.fieldOptions.reference_key)
        opts.reference_key = entry.fieldOptions.reference_key
      if (entry.fieldOptions.format !== undefined)
        opts.format = entry.fieldOptions.format
      fieldOptions[entry.sourceColumn] = opts
    }

    if (matched && entry.companionSourceColumn) {
      const secondarySlug = getSecondarySlug(String(matched.type))

      if (secondarySlug) {
        fieldMapping[entry.companionSourceColumn] = secondarySlug
      }
    }
  }

  const payload: ImportPayloadOptions = {
    fieldMapping,
    upsertUniqueFields,
  }

  if (Object.keys(fieldOptions).length > 0) payload.fieldOptions = fieldOptions
  if (preResolvedUniqueData && Object.keys(preResolvedUniqueData).length > 0)
    payload.uniqueData = preResolvedUniqueData

  return payload
}

/**
 * Identify the columns whose mapped field is enum-like or relation-like
 * (the categories that benefit from `uniqueData` pre-resolution).
 */
export interface UniqueDataLookupSpec {
  sourceColumn: string
  targetSlug: string
  field: DocyrusFieldLike
  /** Distinct stringified values seen in the analysed rows. */
  values: ReadonlyArray<string>
}

export function collectUniqueDataLookups(
  mapping: WizardMappingMap,
  fields: ReadonlyArray<DocyrusFieldLike>,
  analysedFile: AnalysedFile,
): ReadonlyArray<UniqueDataLookupSpec> {
  const fieldsBySlug = new Map<string, DocyrusFieldLike>()

  for (const field of fields) {
    if (field.slug) fieldsBySlug.set(String(field.slug), field)
  }

  const specs: Array<UniqueDataLookupSpec> = []

  for (const entry of Object.values(mapping)) {
    if (!entry.targetSlug) continue

    const field = fieldsBySlug.get(entry.targetSlug)

    if (!field) continue

    const fieldType = String(field.type)

    if (!isEnumLikeType(fieldType) && !isRelationLikeType(fieldType)) continue

    const seen = new Set<string>()

    for (const row of analysedFile.rows) {
      const raw = (row as Record<string, unknown>)[entry.sourceColumn]

      if (raw === null || raw === undefined || raw === '') continue

      if (Array.isArray(raw)) {
        for (const item of raw) {
          if (item === null || item === undefined || item === '') continue
          seen.add(String(item).trim())
        }
      } else if (
        typeof raw === 'string' &&
        raw.includes(',') &&
        fieldType !== 'field-relation'
      ) {
        for (const token of raw.split(',')) {
          const trimmed = token.trim()

          if (trimmed) seen.add(trimmed)
        }
      } else {
        seen.add(String(raw).trim())
      }
    }

    if (seen.size === 0) continue

    specs.push({
      sourceColumn: entry.sourceColumn,
      targetSlug: entry.targetSlug,
      field,
      values: Array.from(seen),
    })
  }

  return specs
}

/**
 * Merge a pre-resolved `matchedId` map with the unique-data lookup spec to
 * produce the `uniqueData` payload entry expected by the import endpoint.
 */
export function buildUniqueDataPayload(
  specs: ReadonlyArray<UniqueDataLookupSpec>,
  resolvedById: Record<string, Record<string, string | null>>,
): ImportPayloadOptions['uniqueData'] {
  const out: NonNullable<ImportPayloadOptions['uniqueData']> = {}

  for (const spec of specs) {
    const map = resolvedById[spec.sourceColumn] ?? {}
    const entries = spec.values.map((rawValue) => ({
      id: slugify(rawValue),
      rowValue: rawValue,
      matchedId: map[rawValue] ?? null,
    }))

    if (entries.length > 0) out[spec.sourceColumn] = entries
  }

  return out
}

/**
 * Validate the wizard mapping. Returns a structured result so callers can
 * highlight specific errors in the UI without reformatting strings.
 */
export function validateMapping(
  mapping: WizardMappingMap,
  requiredSlugs: ReadonlyArray<string>,
): MappingValidationResult {
  const claimedTargets = new Map<string, number>()
  const claimedCompanionColumns = new Set<string>()

  for (const entry of Object.values(mapping)) {
    if (!entry.targetSlug) continue

    claimedTargets.set(
      entry.targetSlug,
      (claimedTargets.get(entry.targetSlug) ?? 0) + 1,
    )

    if (entry.companionSourceColumn)
      claimedCompanionColumns.add(entry.companionSourceColumn)
  }

  const duplicateTargets: Array<string> = []

  for (const [target, count] of claimedTargets.entries()) {
    if (count > 1) duplicateTargets.push(target)
  }

  const missing = requiredSlugs.filter((slug) => !claimedTargets.has(slug))

  for (const [column, entry] of Object.entries(mapping)) {
    if (claimedCompanionColumns.has(column) && entry.targetSlug) {
      duplicateTargets.push(`${column} (companion conflict)`)
    }
  }

  return {
    valid: missing.length === 0 && duplicateTargets.length === 0,
    missing,
    duplicateTargets,
  }
}
