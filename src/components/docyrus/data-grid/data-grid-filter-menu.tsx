'use client'

// @ts-nocheck
/* eslint-disable */
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentProps,
  type SetStateAction,
} from 'react'

import {
  type Column,
  type ColumnFilter,
  type Table,
} from '@tanstack/react-table'

import { endOfDay, format, startOfDay } from 'date-fns'

import {
  CalendarIcon,
  CheckSquare2,
  Fingerprint,
  Hash,
  ListFilter,
  Type,
} from 'lucide-react'

import {
  type AsyncOptionsConfig,
  type ColumnConfig,
  type ColumnDataType,
  type FilterModel,
  type FiltersState,
} from '@/components/docyrus/data-table-filter/core/types'

import {
  DataTableFilter,
  useDataTableFilters,
} from '@/components/docyrus/data-table-filter'
import { isCompleteUuid } from '@/components/docyrus/data-table-filter/lib/helpers'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation'

import { type FilterOperator, type FilterValue } from './types'

type DataTableOperator =
  | 'contains'
  | 'does not contain'
  | 'is'
  | 'is not'
  | 'is less than'
  | 'is greater than or equal to'
  | 'is greater than'
  | 'is less than or equal to'
  | 'is between'
  | 'is not between'
  | 'is before'
  | 'is on or after'
  | 'is after'
  | 'is on or before'
  | 'is any of'
  | 'is none of'
  | 'include'
  | 'exclude'
  | 'include any of'
  | 'include all of'
  | 'exclude if any of'
  | 'exclude if all'
  | 'is empty'
  | 'is not empty'
  /*
   * Relative-date operators — shared 1:1 between client and grid
   * because they're conceptually a "value-less" comparison the
   * backend resolves against today at query time.
   */
  | 'today'
  | 'tomorrow'
  | 'yesterday'
  | 'last7Days'
  | 'last15Days'
  | 'last30Days'
  | 'last60Days'
  | 'last90Days'
  | 'last120Days'
  | 'next7Days'
  | 'next15Days'
  | 'next30Days'
  | 'next60Days'
  | 'next90Days'
  | 'next120Days'
  | 'lastWeek'
  | 'thisWeek'
  | 'nextWeek'
  | 'lastMonth'
  | 'thisMonth'
  | 'nextMonth'
  | 'beforeToday'
  | 'afterToday'
  | 'lastYear'
  | 'thisYear'
  | 'nextYear'
  | 'firstQuarter'
  | 'secondQuarter'
  | 'thirdQuarter'
  | 'fourthQuarter'
  | 'last3Months'
  | 'last6Months'
  | 'xDaysAgo'
  | 'xDaysLater'
  | 'beforeLastXDays'
  | 'inLastXDays'
  | 'afterLastXDays'
  | 'inNextXDays'

const RELATIVE_DATE_OPERATORS = new Set<DataTableOperator>([
  'today',
  'tomorrow',
  'yesterday',
  'last7Days',
  'last15Days',
  'last30Days',
  'last60Days',
  'last90Days',
  'last120Days',
  'next7Days',
  'next15Days',
  'next30Days',
  'next60Days',
  'next90Days',
  'next120Days',
  'lastWeek',
  'thisWeek',
  'nextWeek',
  'lastMonth',
  'thisMonth',
  'nextMonth',
  'beforeToday',
  'afterToday',
  'lastYear',
  'thisYear',
  'nextYear',
  'firstQuarter',
  'secondQuarter',
  'thirdQuarter',
  'fourthQuarter',
  'last3Months',
  'last6Months',
  'xDaysAgo',
  'xDaysLater',
  'beforeLastXDays',
  'inLastXDays',
  'afterLastXDays',
  'inNextXDays',
])

const X_DAYS_RELATIVE_DATE_OPERATORS = new Set<DataTableOperator>([
  'xDaysAgo',
  'xDaysLater',
  'beforeLastXDays',
  'inLastXDays',
  'afterLastXDays',
  'inNextXDays',
])

/**
 * Cell variants whose underlying column stores an ARRAY of values (Postgres
 * `uuid[]` / `text[]` — e.g. the `followers` system column, multi-select /
 * tag-select / user-multi-select pickers). They all surface in the filter UI
 * as the `multiOption` data type, but the backend rejects the scalar
 * operators (`=` / `in` / `not in`) on array columns with a 500. They must
 * serialize to the array-membership operators (`contains any` / `contains all`
 * / `not contains`) instead — see `toGridOperator` + `toServerRule`.
 *
 * Scalar reference variants (`user` / `relation`) deliberately stay OUT of
 * this set: each record holds a single value, so the many-to-one `=` / `in`
 * matching is correct and must not change.
 */
const ARRAY_BACKED_VARIANTS = new Set([
  'multi-select',
  'tag-select',
  'user-multi-select',
])

function isArrayBackedVariant(variant?: string): boolean {
  return variant !== undefined && ARRAY_BACKED_VARIANTS.has(variant)
}

/**
 * `duration` columns persist a raw seconds count on the wire but render as
 * `HH:MM` and are filtered in decimal hours from the UI. We convert at the
 * DTF⇄grid boundary (×3600 forward, ÷3600 reverse + faceted accessor) so a
 * user typing "8" matches 8 hours instead of 8 seconds.
 */
const SECONDS_PER_HOUR = 3600

function isDurationVariant(variant?: string): boolean {
  return variant === 'duration'
}

interface DataGridFilterMenuProps<TData> extends ComponentProps<'div'> {
  table: Table<TData>
  disabled?: boolean
  /**
   * Resolves async-loaded option config for a column. Return `undefined`
   * for columns that should use static options. `useDocyrusDataGrid` wires
   * this for relation / user / userMulti fields so the filter menu can
   * search the server instead of shipping every option up front.
   */
  getAsyncOptions?: (
    column: Column<TData, unknown>,
  ) => AsyncOptionsConfig | undefined
}

function getColumnType(variant?: string): ColumnDataType | null {
  switch (variant) {
    case 'number':

    case 'currency':

    case 'currency-code':

    case 'percent':

    case 'rating':

    case 'duration':
      return 'number'

    case 'date':

    case 'datetime':

    case 'date-range':
      return 'date'

    case 'select':

    case 'status':

    case 'enum':
      return 'option'

    /*
     * Single-value relation/user fields still filter as multiOption: the
     * filter UI lets the user pick "is any of [a, b, c]" even though each
     * record holds a single value. The backend `in` operator handles the
     * many-to-one match.
     */
    case 'user':

    case 'relation':

    case 'multi-select':

    case 'tag-select':

    case 'user-multi-select':
      return 'multiOption'

    case 'checkbox':

    case 'switch':
      return 'boolean'

    case 'short-text':

    case 'long-text':

    case 'email':

    case 'phone':

    case 'url':

    case 'color':

    case 'icon':

    case 'time':
      return 'text'

    /*
     * uuid (identity / PK) columns filter by exact equality only. Treating
     * them as `text` wired `contains` → SQL `LIKE`, which Postgres rejects on
     * `uuid` columns (`operator does not exist: uuid ~~* unknown`) and 500'd
     * on every keystroke. The dedicated `uuid` type offers `is` / `is not` /
     * `is empty` / `is not empty` and only emits a rule for a complete UUID.
     */
    case 'uuid':
      return 'uuid'

    case 'file':

    case 'image':

    case 'chart':
      return null

    default:
      return 'text'
  }
}

function getColumnIcon(type: ColumnDataType) {
  switch (type) {
    case 'number':
      return Hash

    case 'date':
      return CalendarIcon

    case 'option':

    case 'multiOption':
      return CheckSquare2

    case 'uuid':
      return Fingerprint

    default:
      return Type
  }
}

function getColumnLabel<TData>(column: Column<TData, unknown>): string {
  const metaLabel = column.columnDef.meta?.label

  if (metaLabel) return metaLabel

  const { header } = column.columnDef

  if (typeof header === 'string') return header

  return column.id
}

function getNestedValue(row: unknown, accessorKey: string): unknown {
  return accessorKey.split('.').reduce<unknown>((value, segment) => {
    if (value === null || value === undefined) {
      return undefined
    }

    if (typeof value === 'object' && segment in value) {
      return (value as Record<string, unknown>)[segment]
    }

    return undefined
  }, row)
}

function getColumnValue<TData>(
  column: Column<TData, unknown>,
  row: TData,
): unknown {
  if (column.accessorFn) {
    return column.accessorFn(row, 0)
  }

  const accessorKey =
    'accessorKey' in column.columnDef ? column.columnDef.accessorKey : undefined

  if (typeof accessorKey === 'string') {
    return getNestedValue(row, accessorKey)
  }

  if (typeof row === 'object' && row !== null && column.id in row) {
    return (row as Record<string, unknown>)[column.id]
  }

  return undefined
}

function toStringValue(value: unknown): string | undefined {
  if (value === null || value === undefined || value === '') return undefined

  /*
   * `String({})` returns "[object Object]" — a truthy string that then
   * sails downstream as a real filter value and corrupts the API
   * payload. Reject any non-Date object/array up front so the placeholder
   * `column.setFilterValue({})` seed from data-grid-column-header
   * normalizes to "no value" instead of "[object Object]".
   */
  if (typeof value === 'object' && !(value instanceof Date)) return undefined

  return String(value)
}

function toNumberValue(value: unknown): number | undefined {
  if (typeof value === 'number' && !Number.isNaN(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)

    if (!Number.isNaN(parsed)) {
      return parsed
    }
  }

  return undefined
}

/*
 * Matches date-only strings like `2026-06-04` (no time component, no `T`).
 * `new Date('2026-06-04')` parses as UTC midnight — wrong in any UTC− locale.
 * We detect this pattern and reconstruct as local midnight instead.
 */
const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/

function toDateValue(value: unknown): Date | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value
  }

  if (typeof value === 'string') {
    if (DATE_ONLY_RE.test(value)) {
      const [year, month, day] = value.split('-').map(Number) as [
        number,
        number,
        number,
      ]
      const local = new Date(year, month - 1, day)

      return Number.isNaN(local.getTime()) ? undefined : local
    }

    const parsed = new Date(value)

    return Number.isNaN(parsed.getTime()) ? undefined : parsed
  }

  if (typeof value === 'number') {
    const parsed = new Date(value)

    return Number.isNaN(parsed.getTime()) ? undefined : parsed
  }

  return undefined
}

function toStringArray(value: unknown): Array<string> {
  if (Array.isArray(value)) {
    return value
      .map((item) => toStringValue(item))
      .filter((item): item is string => Boolean(item))
  }

  const single = toStringValue(value)

  return single ? [single] : []
}

function toDataTableOperator(
  type: ColumnDataType,
  operator: FilterOperator | undefined,
): DataTableOperator {
  switch (type) {
    case 'text':
      return operator === 'notContains' ? 'does not contain' : 'contains'

    case 'number':
      switch (operator) {
        case 'notEquals':
          return 'is not'

        case 'lessThan':
          return 'is less than'

        case 'lessThanOrEqual':
          return 'is less than or equal to'

        case 'greaterThan':
          return 'is greater than'

        case 'greaterThanOrEqual':
          return 'is greater than or equal to'

        case 'isBetween':
          return 'is between'

        case 'isNotBetween':
          return 'is not between'

        default:
          return 'is'
      }

    case 'date':
      /*
       * Relative date operators (today / lastWeek / xDaysAgo / …) and
       * their snake_case backend twins are passed through 1:1 — same
       * string is valid on both sides.
       */
      if (
        operator &&
        RELATIVE_DATE_OPERATORS.has(operator as DataTableOperator)
      ) {
        return operator as DataTableOperator
      }
      switch (operator) {
        case 'notEquals':
          return 'is not'

        case 'before':
          return 'is before'

        case 'after':
          return 'is after'

        case 'onOrAfter':
          return 'is on or after'

        case 'onOrBefore':
          return 'is on or before'

        case 'isBetween':
          return 'is between'

        case 'isNotBetween':
          return 'is not between'

        default:
          return 'is'
      }

    case 'option':
      switch (operator) {
        case 'isNot':
          return 'is not'

        case 'isAnyOf':
          return 'is any of'

        case 'isNoneOf':
          return 'is none of'

        default:
          return 'is'
      }

    case 'multiOption':
      switch (operator) {
        case 'isNot':
          return 'exclude'

        case 'isAnyOf':

        case 'includesAny':
          return 'include any of'

        case 'includesAll':
          return 'include all of'

        case 'isNoneOf':

        case 'excludesAnyOf':
          return 'exclude if any of'

        case 'excludesIfAll':
          return 'exclude if all'

        default:
          return 'include'
      }

    case 'boolean':
      switch (operator) {
        case 'isEmpty':
          return 'is empty'

        case 'isNotEmpty':
          return 'is not empty'

        /*
         * Canonicalize both `isTrue` and `isFalse` to the generic `is`
         * operator — the actual truth lives in `values[0]` (the DTF boolean
         * toggle's representation). Mapping `isFalse → 'is not'` here made the
         * round-trip unstable once the forward path became value-aware (the
         * truth would get flipped twice). See `dataTableFiltersToColumnFilters`.
         */
        case 'isFalse':

        default:
          return 'is'
      }

    case 'uuid':
      switch (operator) {
        case 'notEquals':
          return 'is not'

        case 'isEmpty':
          return 'is empty'

        case 'isNotEmpty':
          return 'is not empty'

        default:
          return 'is'
      }
  }
}

function toGridOperator(
  type: ColumnDataType,
  operator: DataTableOperator,
  isArrayColumn = false,
): FilterOperator {
  switch (type) {
    case 'text':
      return operator === 'does not contain' ? 'notContains' : 'contains'

    case 'number':
      switch (operator) {
        case 'is not':
          return 'notEquals'

        case 'is less than':
          return 'lessThan'

        case 'is less than or equal to':
          return 'lessThanOrEqual'

        case 'is greater than':
          return 'greaterThan'

        case 'is greater than or equal to':
          return 'greaterThanOrEqual'

        case 'is between':
          return 'isBetween'

        case 'is not between':
          return 'isNotBetween'

        default:
          return 'equals'
      }

    case 'date':
      if (RELATIVE_DATE_OPERATORS.has(operator)) {
        return operator as FilterOperator
      }
      switch (operator) {
        case 'is not':
          return 'notEquals'

        case 'is before':
          return 'before'

        case 'is after':
          return 'after'

        case 'is on or after':
          return 'onOrAfter'

        case 'is on or before':
          return 'onOrBefore'

        case 'is between':
          return 'isBetween'

        case 'is not between':
          return 'isNotBetween'

        default:
          return 'equals'
      }

    case 'option':
      switch (operator) {
        case 'is not':
          return 'isNot'

        case 'is any of':
          return 'isAnyOf'

        case 'is none of':
          return 'isNoneOf'

        default:
          return 'is'
      }

    case 'multiOption':
      /*
       * Array-backed columns (multi-select / tag-select / user-multi-select,
       * e.g. `followers` uuid[]) serialize to the array-membership operators
       * — the scalar `is` / `isAnyOf` (`=` / `in`) path 500s on the backend.
       * Scalar reference columns (`user` / `relation`) keep `is` / `isAnyOf`.
       */
      if (isArrayColumn) {
        switch (operator) {
          case 'exclude':

          case 'exclude if any of':
            return 'excludesAnyOf'

          case 'exclude if all':
            return 'excludesIfAll'

          case 'include all of':
            return 'includesAll'

          case 'include any of':

          case 'include':

          default:
            return 'includesAny'
        }
      }
      switch (operator) {
        case 'exclude':
          return 'isNot'

        case 'include any of':
          return 'isAnyOf'

        case 'include all of':
          return 'includesAll'

        case 'exclude if any of':
          return 'isNoneOf'

        case 'exclude if all':
          return 'excludesIfAll'

        default:
          return 'is'
      }

    case 'boolean':
      switch (operator) {
        case 'is not':
          return 'isFalse'

        case 'is empty':
          return 'isEmpty'

        case 'is not empty':
          return 'isNotEmpty'

        default:
          return 'isTrue'
      }

    case 'uuid':
      switch (operator) {
        case 'is not':
          return 'notEquals'

        case 'is empty':
          return 'isEmpty'

        case 'is not empty':
          return 'isNotEmpty'

        default:
          return 'equals'
      }
  }
}

function columnFiltersToDataTableFilters(
  filters: Array<ColumnFilter>,
  columnTypeById: Map<string, ColumnDataType>,
  columnIsDurationById: Map<string, boolean>,
): FiltersState {
  const mapped: FiltersState = []

  for (const filter of filters) {
    const type = columnTypeById.get(filter.id)
    const isDuration = columnIsDurationById.get(filter.id) === true

    if (!type) continue

    const value =
      filter.value &&
      typeof filter.value === 'object' &&
      'operator' in filter.value
        ? (filter.value as FilterValue)
        : ({ value: filter.value } as FilterValue)

    const operator = toDataTableOperator(type, value.operator)
    const values: Array<string | number | Date> = []

    if (type === 'text' || type === 'uuid') {
      const normalized = toStringValue(value.value)

      if (normalized) {
        values.push(normalized)
      }
    }

    if (type === 'number') {
      const fromWire = (n: number | undefined) =>
        n === undefined ? undefined : isDuration ? n / SECONDS_PER_HOUR : n
      const start = fromWire(toNumberValue(value.value))
      const end = fromWire(toNumberValue(value.endValue))

      if (operator === 'is between' || operator === 'is not between') {
        if (start !== undefined) values.push(start)
        if (end !== undefined) values.push(end)
      } else if (start !== undefined) {
        values.push(start)
      }
    }

    if (type === 'date') {
      if (RELATIVE_DATE_OPERATORS.has(operator)) {
        /*
         * Relative operators carry a numeric `N` value only for the
         * *XDays variants. Everything else has no value at all and
         * stays as an empty `values` array.
         */
        if (X_DAYS_RELATIVE_DATE_OPERATORS.has(operator)) {
          const n = toNumberValue(value.value)

          if (n !== undefined) values.push(n)
        }
      } else {
        const start = toDateValue(value.value)
        const end = toDateValue(value.endValue)

        if (typeof window !== 'undefined') {
          // eslint-disable-next-line no-console
          console.log(
            '[data-grid-filter-menu] columnFiltersToDataTableFilters date',
            {
              columnId: filter.id,
              rawValue: value.value,
              rawEndValue: value.endValue,
              parsedStart: start,
              parsedStartIso: start?.toISOString(),
              parsedEnd: end,
              parsedEndIso: end?.toISOString(),
            },
          )
        }

        if (operator === 'is between' || operator === 'is not between') {
          if (start) values.push(start)
          if (end) values.push(end)
        } else if (start) {
          values.push(start)
        }
      }
    }

    if (type === 'option' || type === 'multiOption') {
      values.push(...toStringArray(value.value))
    }

    if (type === 'boolean') {
      if (value.operator === 'isTrue' || value.value === 'true') {
        values.push('true')
      } else if (value.operator === 'isFalse' || value.value === 'false') {
        values.push('false')
      }
    }

    mapped.push({
      columnId: filter.id,
      type,
      operator,
      values,
    } as FilterModel)
  }

  return mapped
}

/*
 * Operators whose right-hand date is an *end* boundary. For date-only
 * columns, these must snap to 23:59:59 instead of 00:00:00 so the picked
 * day is fully included (a `<=` against 00:00:00 drops every record
 * created after midnight on that day).
 */
const END_SIDE_DATE_OPERATORS = new Set<FilterOperator>([
  'isBetween',
  'before',
  'onOrBefore',
])

/**
 * Serialize a `Date` for the server filter payload while preserving the
 * user's local timezone. We deliberately avoid `.toISOString()` here —
 * that converts to UTC, so a user picking 17:00 in UTC+3 becomes 14:00
 * on the server after PostgreSQL casts the `+03:00` offset into a naive
 * timestamp (issue #66 follow-up). Emitting a timezone-naive string
 * (`2026-04-16T17:00:00`) keeps the wall-clock hour the user actually
 * chose all the way through to the database comparison.
 *
 * For date-only columns (`includeTime=false`):
 *   - start-side operators snap to 00:00:00 (startOfDay)
 *   - end-side operators snap to 23:59:59 (endOfDay) so the picked day
 *     is fully included — previously snapping end bounds to 00:00:00
 *     dropped all records created after midnight on the boundary day.
 */
function serializeDateForServer(
  value: Date,
  includeTime: boolean,
  operator: FilterOperator,
  isEnd = false,
): string {
  let target = value

  if (!includeTime) {
    target =
      (isEnd || END_SIDE_DATE_OPERATORS.has(operator)) && isEnd
        ? endOfDay(value)
        : startOfDay(value)
  }

  return format(target, "yyyy-MM-dd'T'HH:mm:ss")
}

function dataTableFiltersToColumnFilters(
  filters: FiltersState,
  columnTypeById: Map<string, ColumnDataType>,
  columnIncludeTimeById: Map<string, boolean>,
  columnIsArrayById: Map<string, boolean>,
  columnIsDurationById: Map<string, boolean>,
): Array<ColumnFilter> {
  return filters.flatMap((filter): Array<ColumnFilter> => {
    const type = columnTypeById.get(filter.columnId)
    const includeTime = columnIncludeTimeById.get(filter.columnId) === true
    const isArrayColumn = columnIsArrayById.get(filter.columnId) === true
    const isDuration = columnIsDurationById.get(filter.columnId) === true

    if (!type) return []

    const operator = toGridOperator(
      type,
      filter.operator as DataTableOperator,
      isArrayColumn,
    )
    const values = filter.values as Array<string | number | Date>
    let emittedOperator: FilterOperator = operator
    let value: FilterValue['value']
    let endValue: FilterValue['endValue']

    if (type === 'text') {
      value = toStringValue(values[0])
    }

    if (type === 'uuid') {
      /*
       * Only emit a server rule for a COMPLETE uuid. A partial value 500s on
       * the backend (`invalid input syntax for type uuid`), so leave `value`
       * undefined while the user is mid-type — `toServerRule` then drops the
       * `=` / `!=` rule instead of querying. The `isEmpty` / `isNotEmpty`
       * operators carry no value and are serialized to `empty` / `not empty`.
       */
      if (operator === 'equals' || operator === 'notEquals') {
        const candidate = toStringValue(values[0])

        value = isCompleteUuid(candidate) ? candidate.trim() : undefined
      }
    }

    if (type === 'number') {
      const toWire = (n: number | undefined) =>
        n === undefined ? undefined : isDuration ? n * SECONDS_PER_HOUR : n
      const start = toWire(toNumberValue(values[0]))
      const end = toWire(toNumberValue(values[1]))

      if (operator === 'isBetween' || operator === 'isNotBetween') {
        value = start
        endValue = end
      } else {
        value = start
      }
    }

    if (type === 'date') {
      if (RELATIVE_DATE_OPERATORS.has(operator as DataTableOperator)) {
        if (X_DAYS_RELATIVE_DATE_OPERATORS.has(operator as DataTableOperator)) {
          value = toNumberValue(values[0])
        }
      } else {
        const start = toDateValue(values[0])
        const end = toDateValue(values[1])

        if (operator === 'isBetween' || operator === 'isNotBetween') {
          value = start
            ? serializeDateForServer(start, includeTime, operator)
            : undefined
          endValue = end
            ? serializeDateForServer(end, includeTime, operator, true)
            : undefined
        } else if (
          (operator === 'equals' || operator === 'notEquals') &&
          includeTime &&
          start
        ) {
          /*
           * Datetime (timestamp) columns: `is` / `is not` mean day-granularity,
           * NOT exact-second equality against the picked midnight (issue #106).
           * A real timestamp never equals `<day>T00:00:00`, so `=` returned 0
           * rows and `!=` returned everything. Carry the day's [start, end]
           * bounds so `toServerRule` expands `is` → `between` and `is not` →
           * an OR group (`< start OR > end`). The operator stays
           * `equals` / `notEquals` so the chip keeps reading "is" / "is not"
           * and a saved filter re-hydrates as "is" rather than "is between".
           * Date-only columns (`includeTime === false`) fall through to the
           * single-value path below — `= '<day>T00:00:00'` already day-matches
           * a date-typed column.
           */
          value = serializeDateForServer(startOfDay(start), true, operator)
          endValue = serializeDateForServer(
            endOfDay(start),
            true,
            operator,
            true,
          )
        } else {
          value = start
            ? serializeDateForServer(start, includeTime, operator)
            : undefined
        }
      }
    }

    if (type === 'option') {
      if (operator === 'isAnyOf' || operator === 'isNoneOf') {
        value = toStringArray(values)
      } else {
        value = toStringValue(values[0])
      }
    }

    if (type === 'multiOption') {
      if (
        operator === 'isAnyOf' ||
        operator === 'isNoneOf' ||
        operator === 'includesAll' ||
        operator === 'excludesIfAll' ||
        operator === 'includesAny' ||
        operator === 'excludesAnyOf'
      ) {
        value = toStringArray(values)
      } else {
        value = toStringValue(values[0])
      }
    }

    if (type === 'boolean') {
      if (operator === 'isEmpty' || operator === 'isNotEmpty') {
        value = undefined
      } else {
        /*
         * The DTF boolean toggle stores the pick in `values[0]`
         * (`true` / `false`) under a generic `is` operator, so
         * `toGridOperator` can only ever resolve `isTrue`. XOR the
         * operator-derived truth with `values[0]` so picking "False"
         * wires `isFalse` instead of silently filtering True.
         */
        const operatorTrue = operator !== 'isFalse'
        const first = values[0] as unknown
        const valueFalse = first === false || first === 'false'

        emittedOperator = (valueFalse ? !operatorTrue : operatorTrue)
          ? 'isTrue'
          : 'isFalse'
        value = undefined
      }
    }

    return [
      {
        id: filter.columnId,
        value: {
          operator: emittedOperator,
          value,
          endValue,
        } satisfies FilterValue,
      },
    ]
  })
}

function getFiltersKey(filters: FiltersState): string {
  return JSON.stringify(filters)
}

function getOptionsForColumn<TData>(
  column: Column<TData, unknown>,
  data: Array<TData>,
  type: ColumnDataType,
) {
  const cellMeta = column.columnDef.meta?.cell

  if (
    cellMeta?.variant === 'select' ||
    cellMeta?.variant === 'status' ||
    cellMeta?.variant === 'enum' ||
    cellMeta?.variant === 'user' ||
    cellMeta?.variant === 'multi-select' ||
    cellMeta?.variant === 'tag-select' ||
    cellMeta?.variant === 'user-multi-select'
  ) {
    const options = cellMeta.options ?? []

    return options.map((option) => {
      const { avatarUrl } = option as { avatarUrl?: string }

      return {
        label: option.label,
        value: option.value,
        icon: option.icon,
        ...(option.color ? { color: option.color } : {}),
        ...(avatarUrl ? { imageUrl: avatarUrl } : {}),
      }
    })
  }

  if (type !== 'option' && type !== 'multiOption') {
    return undefined
  }

  const values = new Set<string>()

  for (const row of data) {
    const columnValue = getColumnValue(column, row)

    if (Array.isArray(columnValue)) {
      for (const item of columnValue) {
        const normalized = toStringValue(item)

        if (normalized) {
          values.add(normalized)
        }
      }
      continue
    }

    const normalized = toStringValue(columnValue)

    if (normalized) {
      values.add(normalized)
    }
  }

  return Array.from(values).map((value) => ({
    label: value,
    value,
  }))
}

export function DataGridFilterMenu<TData>({
  table,
  disabled,
  className,
  getAsyncOptions,
  ...props
}: DataGridFilterMenuProps<TData>) {
  const { t } = useUiTranslation()
  const tableData = table.options.data
  const { columnFilters } = table.getState()

  /**
   * Depend on `getAllColumns()` (TanStack memoizes it and only returns a new
   * reference when the column defs change), NOT on the referentially stable
   * `table` instance. Data-source fields load asynchronously, so on a fresh
   * page load the filter menu first renders before the columns (and their cell
   * `variant`s) register. A memo keyed on `[table]` alone would freeze on that
   * empty/partial snapshot, leaving `columnTypeById` stale — array-backed fields
   * (`field-userMultiSelect` / multiSelect / tagSelect, e.g. `followers`) would
   * then serialize as a scalar `=` filter instead of `contains any` + array,
   * producing malformed-array-literal 500s on the backend.
   */
  const allColumns = table.getAllColumns()

  const columnsConfig = useMemo(() => {
    const filterableColumns = allColumns.filter((column) => {
      if (!column.getCanFilter() || column.id === 'select') return false

      const meta = column.columnDef.meta as { filterable?: boolean } | undefined

      if (meta?.filterable === false) return false

      const type = getColumnType(column.columnDef.meta?.cell?.variant)

      return type !== null
    })

    return filterableColumns.map((column) => {
      const cellMeta = column.columnDef.meta?.cell
      const type = getColumnType(cellMeta?.variant) ?? 'text'
      const asyncOptions =
        (type === 'option' || type === 'multiOption') && getAsyncOptions
          ? getAsyncOptions(column)
          : undefined
      const options = asyncOptions
        ? undefined
        : getOptionsForColumn(column, tableData, type)
      const isBoolean =
        type === 'boolean' &&
        (cellMeta?.variant === 'checkbox' || cellMeta?.variant === 'switch')
      const isDateTime = type === 'date' && cellMeta?.variant === 'datetime'
      const isDuration = isDurationVariant(cellMeta?.variant)

      return {
        id: column.id,
        displayName: isDuration
          ? `${getColumnLabel(column)} (h)`
          : getColumnLabel(column),
        accessor: (row: TData) => {
          const raw = getColumnValue(column, row)

          return isDuration && typeof raw === 'number'
            ? raw / SECONDS_PER_HOUR
            : raw
        },
        icon: getColumnIcon(type),
        type,
        ...(options ? { options } : {}),
        ...(asyncOptions ? { asyncOptions } : {}),
        ...(isBoolean && cellMeta.trueLabel
          ? { trueLabel: cellMeta.trueLabel }
          : {}),
        ...(isBoolean && cellMeta.falseLabel
          ? { falseLabel: cellMeta.falseLabel }
          : {}),
        ...(isDateTime ? { includeTime: true } : {}),
      } satisfies ColumnConfig<TData>
    })
  }, [allColumns, tableData, getAsyncOptions])

  const columnTypeById = useMemo(() => {
    return new Map(columnsConfig.map((column) => [column.id, column.type]))
  }, [columnsConfig])

  const columnIncludeTimeById = useMemo(() => {
    return new Map(
      columnsConfig.map((column) => [column.id, column.includeTime === true]),
    )
  }, [columnsConfig])

  /*
   * Which filterable columns are array-backed (uuid[] / text[] — multi-select
   * / tag-select / user-multi-select, e.g. `followers`). Drives the
   * variant-aware operator mapping in `dataTableFiltersToColumnFilters` so
   * these serialize to `contains any` / `not contains` instead of the scalar
   * `=` / `in` that the backend rejects with a 500.
   */
  const columnIsArrayById = useMemo(() => {
    return new Map(
      allColumns.map((column) => [
        column.id,
        isArrayBackedVariant(column.columnDef.meta?.cell?.variant),
      ]),
    )
  }, [allColumns])

  /*
   * Which filterable columns are `duration` variants (seconds on the wire,
   * filtered in decimal hours). Drives the ×/÷3600 conversion in
   * `dataTableFiltersToColumnFilters` / `columnFiltersToDataTableFilters`.
   */
  const columnIsDurationById = useMemo(() => {
    return new Map(
      allColumns.map((column) => [
        column.id,
        isDurationVariant(column.columnDef.meta?.cell?.variant),
      ]),
    )
  }, [allColumns])

  const filtersFromTable = useMemo(() => {
    return columnFiltersToDataTableFilters(
      columnFilters,
      columnTypeById,
      columnIsDurationById,
    )
  }, [columnFilters, columnTypeById, columnIsDurationById])

  const [filters, setFilters] = useState<FiltersState>(filtersFromTable)

  useEffect(() => {
    const currentKey = getFiltersKey(filters)
    const nextKey = getFiltersKey(filtersFromTable)

    if (currentKey !== nextKey) {
      queueMicrotask(() => setFilters(filtersFromTable))
    }
  }, [filters, filtersFromTable])

  const onFiltersChange = useCallback(
    (updater: SetStateAction<FiltersState>) => {
      setFilters((currentFilters) => {
        const nextFilters =
          typeof updater === 'function' ? updater(currentFilters) : updater

        table.setColumnFilters(
          dataTableFiltersToColumnFilters(
            nextFilters,
            columnTypeById,
            columnIncludeTimeById,
            columnIsArrayById,
            columnIsDurationById,
          ),
        )

        return nextFilters
      })
    },
    [
      table,
      columnTypeById,
      columnIncludeTimeById,
      columnIsArrayById,
      columnIsDurationById,
    ],
  )

  /*
   * Server-paginated grids (manualFiltering=true) only have the current page
   * in memory. Feeding that page to the facet engine produces counts that sum
   * to the page size, not the full dataset — misleading the user. Pass an
   * empty data array so the facet map stays empty (size=0); the badge hides
   * itself via the `counts.size > 0` guard in FilterValueOptionController.
   * Options lists still come from `columnsConfig.options`, which is unaffected.
   */
  const filterState = useDataTableFilters({
    strategy: 'client',
    data: table.options.manualFiltering ? [] : tableData,
    columnsConfig,
    filters,
    onFiltersChange,
  })

  if (columnsConfig.length === 0) {
    return (
      <div className={cn('flex items-center gap-2', className)} {...props}>
        <Button variant="outline" size="sm" disabled>
          <ListFilter className="text-muted-foreground" />
          {t('ui.dataGrid.filter', 'Filter')}
        </Button>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex min-w-0 items-center',
        disabled && 'opacity-60',
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          'flex-1 min-w-0 w-full',
          disabled && 'pointer-events-none',
        )}
      >
        <DataTableFilter
          columns={filterState.columns}
          filters={filterState.filters}
          actions={filterState.actions}
          strategy={filterState.strategy}
        />
      </div>
    </div>
  )
}
