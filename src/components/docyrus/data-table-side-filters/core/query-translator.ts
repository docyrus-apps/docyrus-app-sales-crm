// @ts-nocheck
/* eslint-disable */
import { type RuleGroupType, type RuleType } from 'react-querybuilder'

import { endOfDay, format, startOfDay } from 'date-fns'

import {
  type ColumnConfig,
  type ColumnDataType,
  type FilterModel,
  type FiltersState,
} from '@/components/docyrus/data-table-filter/core/types'

import { DEFAULT_OPERATORS } from '@/components/docyrus/data-table-filter/core/operators'
import { isCompleteUuid } from '@/components/docyrus/data-table-filter/lib/helpers'

import { type SideFilterCombinator, type SideFilterOperatorMap } from './types'

export const DEFAULT_OPERATOR_MAP: SideFilterOperatorMap = {
  text: {
    contains: 'contains',
    'does not contain': 'doesNotContain',
  },
  number: {
    is: '=',
    'is not': '!=',
    'is less than': '<',
    'is greater than': '>',
    'is less than or equal to': '<=',
    'is greater than or equal to': '>=',
    'is between': 'between',
    'is not between': 'notBetween',
  },
  date: {
    is: '=',
    'is not': '!=',
    'is before': '<',
    'is after': '>',
    'is on or after': '>=',
    'is on or before': '<=',
    'is between': 'between',
    'is not between': 'notBetween',
  },
  option: {
    is: '=',
    'is not': '!=',
    'is any of': 'in',
    'is none of': 'notIn',
  },
  /*
   * Array-backed columns (uuid[] / text[] — e.g. `followers`, multi-select /
   * tag-select). The Docyrus backend rejects the scalar `in` / `not in` on
   * array columns with a 500, so multiOption side filters serialize to the
   * array-membership operators (`contains any` / `contains all` / `not
   * contains`) — matching the toolbar filter path (`toServerRule`). Scalar
   * reference columns should be modeled as `option` (which keeps `=` / `in`).
   */
  multiOption: {
    include: 'contains any',
    exclude: 'not contains',
    'include any of': 'contains any',
    'include all of': 'contains all',
    'exclude if any of': 'not contains',
    'exclude if all': 'not contains',
  },
  boolean: {
    is: '=',
    'is not': '!=',
    'is empty': 'null',
    'is not empty': 'notNull',
  },
  /*
   * uuid (identity / PK) columns. Exact equality only — Postgres has no
   * `LIKE` on `uuid`, so the `contains` operators that `text` exposes are
   * absent. A partial value is dropped before serialization (see
   * `filtersStateToRuleGroup`) so it never 500s with `invalid input syntax`.
   */
  uuid: {
    is: '=',
    'is not': '!=',
    'is empty': 'null',
    'is not empty': 'notNull',
  },
}

/*
 * QB operators whose right-hand value is an *end* boundary.
 * For `notBetween` the `to` value is the upper bound, same as `between`.
 */
const END_SIDE_QB_OPERATORS = new Set(['between', 'notBetween', '<', '<='])

const RANGE_QB_OPERATORS = new Set(['between', 'notBetween'])
const ARRAY_QB_OPERATORS = new Set([
  'in',
  'notIn',
  'containsAll',
  'doesNotContainAll',
  /*
   * Docyrus array-membership operators emitted for multiOption columns. They
   * must be array-valued even for a single selection — `contains any` with a
   * scalar value 500s on the backend.
   */
  'contains any',
  'contains all',
  'not contains',
])
const NULLARY_QB_OPERATORS = new Set(['null', 'notNull'])

function buildReverseMap(map: SideFilterOperatorMap) {
  const reverse: Record<ColumnDataType, Record<string, string>> = {
    text: {},
    number: {},
    date: {},
    option: {},
    multiOption: {},
    boolean: {},
    uuid: {},
  }

  for (const type of Object.keys(map) as Array<ColumnDataType>) {
    const sub = map[type] as Record<string, string>

    for (const [dtfOp, qbOp] of Object.entries(sub)) {
      if (!qbOp) continue
      const target = reverse[type] as Record<string, string>

      if (target[qbOp] === undefined) target[qbOp] = dtfOp
    }
  }

  return reverse
}

/*
 * Serialize a date value for the side-filter wire payload.
 *
 * Accepts both `Date` instances and date strings (DTF stores date values as
 * strings in some code paths — e.g. `"2026-06-04T00:00:00"` — so we must
 * handle both). Always emits a timezone-naive `yyyy-MM-dd'T'HH:mm:ss` string:
 *   - datetime columns (`includeTime=true`): preserve the wall-clock value.
 *   - date-only columns: start-side → 00:00:00, end-side → 23:59:59.
 *     End-side snapping to 23:59:59 ensures the picked boundary day is fully
 *     included — a `<=` against 00:00:00 drops all records created after
 *     midnight on that day.
 */
function isMidnight(date: Date): boolean {
  return (
    date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0
  )
}

function serializeSideFilterDate(
  value: Date | string,
  includeTime: boolean,
  isEnd: boolean,
): string {
  const date = value instanceof Date ? value : new Date(value)

  /*
   * For end-side boundaries we snap to 23:59:59 when:
   *   - date-only column (includeTime=false): always snap
   *   - datetime column (includeTime=true): snap only when time is still
   *     the default midnight, meaning the user didn't explicitly pick a time.
   *     An explicit pick like 17:00 is preserved as-is.
   */
  if (isEnd && (!includeTime || isMidnight(date))) {
    return format(endOfDay(date), "yyyy-MM-dd'T'HH:mm:ss")
  }

  if (!includeTime) {
    return format(startOfDay(date), "yyyy-MM-dd'T'HH:mm:ss")
  }

  return format(date, "yyyy-MM-dd'T'HH:mm:ss")
}

function isDateValue(v: unknown): v is Date | string {
  return v instanceof Date || (typeof v === 'string' && v.length > 0)
}

function ruleValueFromFilter<TType extends ColumnDataType>(
  filter: FilterModel<TType>,
  qbOperator: string,
  includeTime: boolean,
): unknown {
  if (NULLARY_QB_OPERATORS.has(qbOperator)) return null

  const isDateType = filter.type === 'date'

  if (RANGE_QB_OPERATORS.has(qbOperator)) {
    const [from, to] = filter.values as Array<unknown>

    if (isDateType) {
      return [
        isDateValue(from)
          ? serializeSideFilterDate(from, includeTime, false)
          : from,
        isDateValue(to) ? serializeSideFilterDate(to, includeTime, true) : to,
      ]
    }

    return [from, to]
  }

  if (ARRAY_QB_OPERATORS.has(qbOperator)) return [...filter.values]

  const single = filter.values.length <= 1 ? filter.values[0] : filter.values
  const isEndOp = END_SIDE_QB_OPERATORS.has(qbOperator)

  if (isDateType && isDateValue(single)) {
    return serializeSideFilterDate(single, includeTime, isEndOp)
  }

  return single
}

export function filtersStateToRuleGroup(
  state: FiltersState,
  combinator: SideFilterCombinator = 'and',
  operatorMap: SideFilterOperatorMap = DEFAULT_OPERATOR_MAP,
  columns: ReadonlyArray<ColumnConfig<unknown>> = [],
): RuleGroupType {
  const colById = new Map(columns.map((c) => [c.id, c]))

  const rules: Array<RuleType> = state
    .filter(
      (f) =>
        f.values.length > 0 ||
        f.operator === 'is empty' ||
        f.operator === 'is not empty',
    )
    /*
     * Drop uuid equality filters whose value isn't a complete UUID — a
     * partial value serializes to `id = '<partial>'` and 500s on Postgres
     * (`invalid input syntax for type uuid`). Presence operators carry no
     * value and pass through untouched.
     */
    .filter(
      (f) =>
        f.type !== 'uuid' ||
        f.operator === 'is empty' ||
        f.operator === 'is not empty' ||
        isCompleteUuid(f.values[0]),
    )
    .map((filter) => {
      const filterType = filter.type as ColumnDataType
      const sub = operatorMap[filterType] as Record<string, string> | undefined
      const qbOperator = sub?.[filter.operator] ?? filter.operator
      const colConfig = colById.get(filter.columnId)
      const includeTime =
        filterType === 'date' && colConfig?.includeTime === true

      return {
        field: filter.columnId,
        operator: qbOperator,
        value: ruleValueFromFilter(filter, qbOperator, includeTime),
      } satisfies RuleType
    })

  return { combinator, rules }
}

function valuesFromRule(rule: RuleType, type: ColumnDataType): Array<unknown> {
  const value = rule.value as unknown

  if (NULLARY_QB_OPERATORS.has(rule.operator)) return []
  if (Array.isArray(value)) return value
  if (
    typeof value === 'string' &&
    (RANGE_QB_OPERATORS.has(rule.operator) ||
      ARRAY_QB_OPERATORS.has(rule.operator))
  ) {
    return value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)
  }

  if (value === null || value === undefined || value === '') return []

  if (type === 'date' && !(value instanceof Date)) {
    const str = value as string | number
    let parsed: Date

    /*
     * date-only strings (e.g. "2026-06-04") parse as UTC midnight in most
     * runtimes — wrong in UTC− locales. Reconstruct as local midnight instead.
     */
    if (typeof str === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [y, m, d] = str.split('-').map(Number) as [number, number, number]

      parsed = new Date(y, m - 1, d)
    } else {
      parsed = new Date(str)
    }

    return Number.isNaN(parsed.getTime()) ? [] : [parsed]
  }

  if (type === 'number' && typeof value !== 'number') {
    const parsed = Number(value)

    return Number.isNaN(parsed) ? [] : [parsed]
  }

  return [value]
}

function flattenRules(group: RuleGroupType): Array<RuleType> {
  const out: Array<RuleType> = []

  for (const r of group.rules) {
    if (typeof r === 'string') continue
    if ('rules' in r) {
      out.push(...flattenRules(r))
    } else {
      out.push(r)
    }
  }

  return out
}

export function ruleGroupToFiltersState(
  group: RuleGroupType,
  columns: ReadonlyArray<ColumnConfig<unknown>>,
  operatorMap: SideFilterOperatorMap = DEFAULT_OPERATOR_MAP,
): FiltersState {
  const reverse = buildReverseMap(operatorMap)
  const byId = new Map(columns.map((c) => [c.id, c]))
  const out: FiltersState = []

  for (const rule of flattenRules(group)) {
    const column = byId.get(rule.field)

    if (!column) continue
    const type = column.type as ColumnDataType
    const reverseSub = reverse[type] as Record<string, string>
    const dtfOperator =
      reverseSub[rule.operator] ??
      (rule.operator in (operatorMap[type] as object)
        ? rule.operator
        : undefined) ??
      DEFAULT_OPERATORS[type].single
    const values = valuesFromRule(rule, type)

    if (
      values.length === 0 &&
      dtfOperator !== 'is empty' &&
      dtfOperator !== 'is not empty'
    ) {
      continue
    }

    out.push({
      columnId: column.id,
      type,
      operator: dtfOperator,
      values,
    } as FilterModel)
  }

  return out
}
