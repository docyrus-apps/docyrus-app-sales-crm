import { type DocyrusFieldLike } from '@/hooks/use-docyrus-field-component'

import {
  RESERVED_TARGET_SLUGS,
  type ColumnMappingState,
  type WizardMappingMap,
} from '../types'

/**
 * Normalize a string for fuzzy matching: lowercase, strip diacritics,
 * collapse runs of non-alphanumerics into single underscores. Used as the
 * primary similarity key when auto-mapping spreadsheet headers to fields.
 */
export function normalizeKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

/** kebab-case slug used as the `uniqueData.id` for enum / relation lookups. */
export function slugify(value: unknown): string {
  if (value === null || value === undefined) return ''

  return String(value)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function tokenize(value: string): Array<string> {
  if (!value) return []

  const split = value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((token) => token.toLowerCase())

  return split
}

function jaccardScore(
  a: ReadonlyArray<string>,
  b: ReadonlyArray<string>,
): number {
  if (a.length === 0 || b.length === 0) return 0

  const setA = new Set(a)
  const setB = new Set(b)
  let intersection = 0

  for (const token of setA) {
    if (setB.has(token)) intersection += 1
  }

  const union = setA.size + setB.size - intersection

  if (union === 0) return 0

  return Math.round((intersection / union) * 70)
}

/**
 * Common header synonyms for the four reserved slugs on `simple` data sources.
 * Hand-curated rather than fuzzy-matched so we don't accidentally claim every
 * column called "name".
 */
const RESERVED_SYNONYMS: Record<string, string> = {
  name: 'name',
  title: 'name',
  label: 'name',
  description: 'description',
  desc: 'description',
  notes: 'description',
  remarks: 'description',
  created_on: 'created_on',
  created_at: 'created_on',
  createdat: 'created_on',
  date_created: 'created_on',
  autonumber: 'autonumber_id',
  autonumber_id: 'autonumber_id',
  id: 'autonumber_id',
}

interface ScoredCandidate {
  column: string
  fieldKey: string
  score: number
}

function scoreColumnAgainstField(
  column: string,
  field: DocyrusFieldLike,
): number {
  const columnNorm = normalizeKey(column)

  if (!columnNorm) return 0

  const slug = String(field.slug ?? '')
  const slugNorm = normalizeKey(slug)
  const nameNorm = normalizeKey(String(field.name ?? ''))

  if (slugNorm && columnNorm === slugNorm) return 100
  if (nameNorm && columnNorm === nameNorm) return 90
  if (slugNorm && columnNorm.replace(/_/g, '') === slugNorm.replace(/_/g, ''))
    return 80
  if (nameNorm && columnNorm.replace(/_/g, '') === nameNorm.replace(/_/g, ''))
    return 80

  return jaccardScore(tokenize(column), [
    ...tokenize(slug),
    ...tokenize(String(field.name ?? '')),
  ])
}

function scoreColumnAgainstReservedSlug(
  column: string,
  reservedSlug: string,
): number {
  const columnNorm = normalizeKey(column)

  if (!columnNorm) return 0

  if (columnNorm === reservedSlug) return 95

  const synonym = RESERVED_SYNONYMS[columnNorm]

  if (synonym === reservedSlug) return 85

  return 0
}

/**
 * Build an auto-suggested mapping from spreadsheet columns to data source fields.
 *
 * Greedy assignment: every (column × candidate-target) pair is scored, then we
 * walk the pairs in descending score order and bind whichever side hasn't
 * already been claimed. A score of 0 means "no signal" — those columns are
 * left as `targetSlug: null` so the user can map them manually.
 *
 * Reserved slugs (`name`, `description`, …) are only matched via the curated
 * synonym list to avoid hijacking real fields named "title" / "id" / etc.
 */
export function buildAutoMapping(
  columns: ReadonlyArray<string>,
  fields: ReadonlyArray<DocyrusFieldLike>,
  options: { includeReserved?: boolean } = {},
): WizardMappingMap {
  const { includeReserved = true } = options
  const candidates: Array<ScoredCandidate> = []

  for (const column of columns) {
    for (const field of fields) {
      if (!field.slug) continue

      const score = scoreColumnAgainstField(column, field)

      if (score > 0) {
        candidates.push({ column, fieldKey: String(field.slug), score })
      }
    }

    if (includeReserved) {
      for (const reserved of RESERVED_TARGET_SLUGS) {
        const score = scoreColumnAgainstReservedSlug(column, reserved)

        if (score > 0) {
          candidates.push({ column, fieldKey: reserved, score })
        }
      }
    }
  }

  candidates.sort((a, b) => b.score - a.score)

  const usedColumns = new Set<string>()
  const usedFieldKeys = new Set<string>()
  const result: WizardMappingMap = {}

  for (const column of columns) {
    result[column] = { sourceColumn: column, targetSlug: null }
  }

  for (const candidate of candidates) {
    if (usedColumns.has(candidate.column)) continue
    if (usedFieldKeys.has(candidate.fieldKey)) continue

    usedColumns.add(candidate.column)
    usedFieldKeys.add(candidate.fieldKey)

    const matched = fields.find(
      (field) => String(field.slug) === candidate.fieldKey,
    )
    const next: ColumnMappingState = {
      sourceColumn: candidate.column,
      targetSlug: candidate.fieldKey,
    }

    if (matched) {
      const inferred = inferFieldOptions(matched)

      if (inferred) next.fieldOptions = inferred
    }

    result[candidate.column] = next
  }

  return result
}

/**
 * Default per-type field options the import endpoint expects. Returns
 * `undefined` for types that don't need any option metadata (text, number, etc).
 */
export function inferFieldOptions(
  field: DocyrusFieldLike,
): ColumnMappingState['fieldOptions'] | undefined {
  switch (field.type) {
    case 'field-relation':

    case 'field-relatedField':

    case 'field-userSelect':

    case 'field-userMultiSelect':
      return { reference_key: 'name' }

    case 'field-phone':
      return { format: '+90' }

    case 'field-date':

    case 'field-dateTime':

    case 'field-dateRange':
      return { format: ['DAY', 'MONTH', 'YEAR'] }

    default:
      return undefined
  }
}
