// @ts-nocheck
/* eslint-disable */
import { isBefore } from 'date-fns'

import { type Column, type ColumnOption } from '../core/types'

export function getColumn<TData>(columns: Array<Column<TData>>, id: string) {
  const column = columns.find((c) => c.id === id)

  if (!column) {
    throw new Error(`Column with id ${id} not found`)
  }

  return column
}

export function createNumberFilterValue(
  values: Array<number> | undefined,
): Array<number> {
  if (!values || values.length === 0) return []
  if (values.length === 1) return [values[0] ?? 0]
  if (values.length === 2) return createNumberRange(values)

  return [values[0] ?? 0, values[1] ?? 0]
}

export function createDateFilterValue(
  values: [Date, Date] | [Date] | [] | undefined,
) {
  if (!values || values.length === 0) return []
  if (values.length === 1) return [values[0]]
  if (values.length === 2) return createDateRange(values)
  throw new Error('Cannot create date filter value from more than 2 values')
}

export function createDateRange(values: [Date, Date]) {
  const [a, b] = values
  const [min, max] = isBefore(a, b) ? [a, b] : [b, a]

  return [min, max]
}

export function createNumberRange(values: Array<number> | undefined) {
  let a = 0
  let b = 0

  if (!values || values.length === 0) return [a, b]
  if (values.length === 1) {
    a = values[0] ?? 0
  } else {
    a = values[0] ?? 0
    b = values[1] ?? 0
  }

  const [min, max] = a < b ? [a, b] : [b, a]

  return [min, max]
}

export function isColumnOption(value: unknown): value is ColumnOption {
  return (
    typeof value === 'object' &&
    value !== null &&
    'value' in value &&
    'label' in value
  )
}

export function isColumnOptionArray(
  value: unknown,
): value is Array<ColumnOption> {
  return Array.isArray(value) && value.every(isColumnOption)
}

export function isStringArray(value: unknown): value is Array<string> {
  return Array.isArray(value) && value.every((v) => typeof v === 'string')
}

export function isColumnOptionMap(
  value: unknown,
): value is Map<string, number> {
  if (!(value instanceof Map)) {
    return false
  }
  for (const key of value.keys()) {
    if (typeof key !== 'string') {
      return false
    }
  }
  for (const val of value.values()) {
    if (typeof val !== 'number') {
      return false
    }
  }

  return true
}

export function isMinMaxTuple(value: unknown): value is [number, number] {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === 'number' &&
    typeof value[1] === 'number'
  )
}

/*
 * Canonical RFC 4122 UUID shape (8-4-4-4-12 hex). Used to gate `uuid`-typed
 * filters: Postgres throws `invalid input syntax for type uuid` on a partial
 * value, so the filter rule is only emitted once the input is a complete
 * UUID. Case-insensitive; the surrounding code trims before testing.
 */
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isCompleteUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value.trim())
}
