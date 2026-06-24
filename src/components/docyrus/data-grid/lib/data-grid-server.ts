// @ts-nocheck
/* eslint-disable */
import {
  type ColumnFilter,
  type ColumnFiltersState,
  type SortingState,
} from '@tanstack/react-table'

import {
  type FilterValue,
  type ICollectionFilterGroup,
  type ICollectionFilterRule,
  type ICollectionListParams,
  type ICollectionOrderBy,
} from '../types'

interface DataGridServerFieldConfig {
  sortField?: string
  filterField?: string
}

type DataGridServerFieldMapValue = string | DataGridServerFieldConfig

export type DataGridServerFieldMap = Record<string, DataGridServerFieldMapValue>

interface BuildDataGridServerListParamsOptions {
  sorting?: SortingState
  columnFilters?: ColumnFiltersState
  pageIndex?: number
  pageSize?: number
  keyword?: string
  baseFilters?: ICollectionFilterGroup
  fieldMap?: DataGridServerFieldMap
  defaultOrderBy?: ICollectionOrderBy | null
}

type DataGridAggregationCalculation = NonNullable<
  ICollectionListParams['calculations']
>[number]

interface BuildDataGridServerAggregationParamsOptions {
  columnFilters?: ColumnFiltersState
  keyword?: string
  baseFilters?: ICollectionFilterGroup
  fieldMap?: DataGridServerFieldMap
  groupBy: string | Array<string>
  calculations: Array<DataGridAggregationCalculation>
  orderBy?: ICollectionOrderBy | null
  limit?: number
}

type DataGridServerListParams = {
  filters?: ICollectionFilterGroup
  filterKeyword?: ICollectionListParams['filterKeyword']
  orderBy?: ICollectionOrderBy
  limit?: ICollectionListParams['limit']
  offset?: ICollectionListParams['offset']
}

type DataGridServerAggregationParams = Pick<
  ICollectionListParams,
  'columns' | 'calculations' | 'filters' | 'filterKeyword' | 'orderBy' | 'limit'
>

const DEFAULT_PAGE_SIZE = 50

function resolveField(
  columnId: string,
  mode: 'sort' | 'filter',
  fieldMap?: DataGridServerFieldMap,
): string {
  if (!fieldMap) return columnId

  const mapped = fieldMap[columnId]

  if (!mapped) return columnId

  if (typeof mapped === 'string') {
    return mapped
  }

  if (mode === 'sort') {
    return mapped.sortField ?? mapped.filterField ?? columnId
  }

  return mapped.filterField ?? mapped.sortField ?? columnId
}

function toArrayValue(value: unknown): Array<unknown> {
  if (!Array.isArray(value)) return []

  /*
   * Belt-and-suspenders: strip null/undefined and non-Date objects before
   * the array reaches the wire. The upstream `toStringValue` guard catches
   * `{}` placeholders today, but any future code path that lets a raw
   * object slip into a filter value should still serialize cleanly here.
   */
  return value.filter(
    (item) =>
      item !== null &&
      item !== undefined &&
      (typeof item !== 'object' || item instanceof Date),
  )
}

function toFilterValue(value: unknown): FilterValue | null {
  /*
   * Guard only against genuinely absent values — a raw `false` or `0` is a
   * legitimate filter target and must reach its typed branch below (the old
   * `if (!value)` swallowed boolean `false` / numeric `0`, breaking the
   * "is False" boolean filter). NaN is the only number we reject.
   */
  if (value == null) return null
  if (typeof value === 'number' && Number.isNaN(value)) return null

  if (
    typeof value === 'object' &&
    'operator' in value &&
    typeof value.operator === 'string'
  ) {
    return value as FilterValue
  }

  if (typeof value === 'number') {
    return {
      operator: 'equals',
      value,
    }
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()

    if (!trimmed) return null

    return {
      operator: 'contains',
      value: trimmed,
    }
  }

  if (typeof value === 'boolean') {
    return {
      operator: value ? 'isTrue' : 'isFalse',
    }
  }

  if (Array.isArray(value) && value.length > 0) {
    return {
      operator: 'isAnyOf',
      value: value as Array<string>,
    }
  }

  return null
}

/**
 * Frontend (camelCase) → backend (snake_case) operator map for the
 * relative-date filters. Mirrors the `FILTER_OPERATORS` constants in
 * `libs/shared/src/database/constants.ts` — keep these in sync when new
 * relative-date operators land on either side.
 */
const RELATIVE_DATE_OPERATOR_TO_SERVER: Record<string, string> = {
  today: 'today',
  tomorrow: 'tomorrow',
  yesterday: 'yesterday',
  last7Days: 'last_7_days',
  last15Days: 'last_15_days',
  last30Days: 'last_30_days',
  last60Days: 'last_60_days',
  last90Days: 'last_90_days',
  last120Days: 'last_120_days',
  next7Days: 'next_7_days',
  next15Days: 'next_15_days',
  next30Days: 'next_30_days',
  next60Days: 'next_60_days',
  next90Days: 'next_90_days',
  next120Days: 'next_120_days',
  lastWeek: 'last_week',
  thisWeek: 'this_week',
  nextWeek: 'next_week',
  lastMonth: 'last_month',
  thisMonth: 'this_month',
  nextMonth: 'next_month',
  beforeToday: 'before_today',
  afterToday: 'after_today',
  lastYear: 'last_year',
  thisYear: 'this_year',
  nextYear: 'next_year',
  firstQuarter: 'first_quarter',
  secondQuarter: 'second_quarter',
  thirdQuarter: 'third_quarter',
  fourthQuarter: 'fourth_quarter',
  last3Months: 'last_3_months',
  last6Months: 'last_6_months',
  xDaysAgo: 'x_days_ago',
  xDaysLater: 'x_days_later',
  beforeLastXDays: 'before_last_x_days',
  inLastXDays: 'in_last_x_days',
  afterLastXDays: 'after_last_x_days',
  inNextXDays: 'in_next_x_days',
}

const X_DAYS_SERVER_OPERATORS = new Set([
  'x_days_ago',
  'x_days_later',
  'before_last_x_days',
  'in_last_x_days',
  'after_last_x_days',
  'in_next_x_days',
])

export function toServerRule(
  filter: ColumnFilter,
  fieldMap?: DataGridServerFieldMap,
): ICollectionFilterRule | ICollectionFilterGroup | null {
  const field = resolveField(filter.id, 'filter', fieldMap).trim()

  if (!field) return null

  const filterValue = toFilterValue(filter.value)

  if (!filterValue) return null

  const { operator, value, endValue } = filterValue

  if (operator === 'isEmpty') {
    return { field, operator: 'empty' }
  }

  if (operator === 'isNotEmpty') {
    return { field, operator: 'not empty' }
  }

  const serverOperator = RELATIVE_DATE_OPERATOR_TO_SERVER[operator]

  if (serverOperator) {
    if (X_DAYS_SERVER_OPERATORS.has(serverOperator)) {
      const n = typeof value === 'number' ? value : Number(value)

      if (!Number.isFinite(n)) return null

      return { field, operator: serverOperator, value: n }
    }

    return { field, operator: serverOperator }
  }

  if (operator === 'isTrue') {
    return { field, operator: 'true' }
  }

  if (operator === 'isFalse') {
    return { field, operator: 'false' }
  }

  if (operator === 'contains') {
    const text = typeof value === 'string' ? value.trim() : ''

    if (!text) return null

    return { field, operator: 'like', value: `%${text}%` }
  }

  if (operator === 'notContains') {
    const text = typeof value === 'string' ? value.trim() : ''

    if (!text) return null

    return { field, operator: 'not like', value: `%${text}%` }
  }

  if (operator === 'startsWith') {
    const text = typeof value === 'string' ? value.trim() : ''

    if (!text) return null

    return { field, operator: 'starts with', value: text }
  }

  if (operator === 'endsWith') {
    const text = typeof value === 'string' ? value.trim() : ''

    if (!text) return null

    return { field, operator: 'ends with', value: text }
  }

  if (operator === 'equals') {
    if (value === undefined || (typeof value === 'string' && value === '')) {
      return null
    }

    /*
     * Day-granularity equality on datetime columns (issue #106). The filter
     * menu hands us the day's [start, end] bounds via `endValue` when the
     * column carries a time-of-day; exact-second `=` against midnight never
     * matched a real timestamp, so expand to a range instead.
     */
    if (endValue !== undefined && endValue !== '') {
      return { field, operator: 'between', value: [value, endValue] }
    }

    return { field, operator: '=', value }
  }

  if (operator === 'notEquals') {
    if (value === undefined || (typeof value === 'string' && value === '')) {
      return null
    }

    /*
     * Mirror of the datetime `is` day-range (issue #106): "not on this day" ⇔
     * before the day starts OR after it ends. The backend has no `not between`
     * operator (issue #105), so emit an explicit OR group.
     */
    if (endValue !== undefined && endValue !== '') {
      return {
        combinator: 'or',
        rules: [
          { field, operator: '<', value },
          { field, operator: '>', value: endValue },
        ],
      }
    }

    return { field, operator: '!=', value }
  }

  if (operator === 'lessThan') {
    if (value === undefined || (typeof value === 'string' && value === '')) {
      return null
    }

    return { field, operator: '<', value }
  }

  if (operator === 'lessThanOrEqual') {
    if (value === undefined || (typeof value === 'string' && value === '')) {
      return null
    }

    return { field, operator: '<=', value }
  }

  if (operator === 'greaterThan') {
    if (value === undefined || (typeof value === 'string' && value === '')) {
      return null
    }

    return { field, operator: '>', value }
  }

  if (operator === 'greaterThanOrEqual') {
    if (value === undefined || (typeof value === 'string' && value === '')) {
      return null
    }

    return { field, operator: '>=', value }
  }

  if (operator === 'isBetween') {
    if (
      value === undefined ||
      endValue === undefined ||
      (typeof value === 'string' && value === '') ||
      (typeof endValue === 'string' && endValue === '')
    ) {
      return null
    }

    return {
      field,
      operator: 'between',
      value: [value, endValue],
    }
  }

  if (operator === 'isNotBetween') {
    if (
      value === undefined ||
      endValue === undefined ||
      (typeof value === 'string' && value === '') ||
      (typeof endValue === 'string' && endValue === '')
    ) {
      return null
    }

    /*
     * The backend has no `not between` operator (issue #105) — it 400s for
     * every value shape. The negation is the union of "below the range" and
     * "above the range", so emit an explicit OR group. The end boundary was
     * already snapped to end-of-day for datetime columns upstream, so day B
     * is fully excluded.
     */
    return {
      combinator: 'or',
      rules: [
        { field, operator: '<', value },
        { field, operator: '>', value: endValue },
      ],
    }
  }

  if (operator === 'before') {
    if (value === undefined || (typeof value === 'string' && value === '')) {
      return null
    }

    return { field, operator: '<', value }
  }

  if (operator === 'after') {
    if (value === undefined || (typeof value === 'string' && value === '')) {
      return null
    }

    return { field, operator: '>', value }
  }

  if (operator === 'onOrBefore') {
    if (value === undefined || (typeof value === 'string' && value === '')) {
      return null
    }

    return { field, operator: '<=', value }
  }

  if (operator === 'onOrAfter') {
    if (value === undefined || (typeof value === 'string' && value === '')) {
      return null
    }

    return { field, operator: '>=', value }
  }

  if (operator === 'is') {
    if (Array.isArray(value) && value.length > 0) {
      return { field, operator: 'in', value }
    }
    if (value === undefined || (typeof value === 'string' && value === '')) {
      return null
    }

    return { field, operator: '=', value }
  }

  if (operator === 'isNot') {
    if (Array.isArray(value) && value.length > 0) {
      return { field, operator: 'not in', value }
    }
    if (value === undefined || (typeof value === 'string' && value === '')) {
      return null
    }

    return { field, operator: '!=', value }
  }

  if (operator === 'isAnyOf') {
    const values = toArrayValue(value)

    if (values.length === 0) return null

    return { field, operator: 'in', value: values }
  }

  if (operator === 'isNoneOf') {
    const values = toArrayValue(value)

    if (values.length === 0) return null

    return { field, operator: 'not in', value: values }
  }

  /*
   * Array-column membership operators (multi-select / tag-select /
   * user-multi-select — e.g. `followers` uuid[]). The backend rejects the
   * scalar `=` / `in` / `not in` on array columns with a 500; these map to
   * the array-aware `contains any` / `contains all` / `not contains`
   * operators instead. The value is always an array (even a single
   * selection) since those are the only shapes Postgres accepts here.
   */
  if (operator === 'includesAny') {
    const values = toArrayValue(value)

    if (values.length === 0) return null

    return { field, operator: 'contains any', value: values }
  }

  if (operator === 'includesAll') {
    const values = toArrayValue(value)

    if (values.length === 0) return null

    return { field, operator: 'contains all', value: values }
  }

  if (operator === 'excludesAnyOf' || operator === 'excludesIfAll') {
    const values = toArrayValue(value)

    if (values.length === 0) return null

    return { field, operator: 'not contains', value: values }
  }

  return null
}

function buildFilters({
  columnFilters,
  baseFilters,
  fieldMap,
}: Pick<
  BuildDataGridServerListParamsOptions,
  'columnFilters' | 'baseFilters' | 'fieldMap'
>): ICollectionFilterGroup | undefined {
  const filterRules = (columnFilters ?? [])
    .map((filter) => toServerRule(filter, fieldMap))
    .filter((rule): rule is ICollectionFilterRule | ICollectionFilterGroup =>
      Boolean(rule),
    )

  if (!baseFilters && filterRules.length === 0) {
    return undefined
  }

  if (baseFilters && filterRules.length === 0) {
    return baseFilters
  }

  if (!baseFilters) {
    return {
      combinator: 'and',
      rules: filterRules,
    }
  }

  return {
    combinator: 'and',
    rules: [baseFilters, ...filterRules],
  }
}

function buildOrderBy({
  sorting,
  fieldMap,
  defaultOrderBy,
}: Pick<
  BuildDataGridServerListParamsOptions,
  'sorting' | 'fieldMap' | 'defaultOrderBy'
>): ICollectionOrderBy | undefined {
  const sortRules = (sorting ?? [])
    .map((sort) => {
      const field = resolveField(sort.id, 'sort', fieldMap).trim()

      if (!field) return null

      return `${field} ${sort.desc ? 'DESC' : 'ASC'}`
    })
    .filter((value): value is string => Boolean(value))

  if (sortRules.length > 0) {
    return sortRules.join(', ')
  }

  return defaultOrderBy ?? undefined
}

export function buildDataGridServerListParams({
  sorting = [],
  columnFilters = [],
  pageIndex = 0,
  pageSize = DEFAULT_PAGE_SIZE,
  keyword,
  baseFilters,
  fieldMap,
  defaultOrderBy,
}: BuildDataGridServerListParamsOptions): DataGridServerListParams {
  const safePageSize =
    Number.isFinite(pageSize) && pageSize > 0
      ? Math.floor(pageSize)
      : DEFAULT_PAGE_SIZE
  const safePageIndex =
    Number.isFinite(pageIndex) && pageIndex >= 0 ? Math.floor(pageIndex) : 0

  const params: DataGridServerListParams = {
    limit: safePageSize,
    offset: safePageIndex * safePageSize,
  }

  const filters = buildFilters({ columnFilters, baseFilters, fieldMap })

  if (filters) {
    params.filters = filters
  }

  const orderBy = buildOrderBy({ sorting, fieldMap, defaultOrderBy })

  if (orderBy) {
    params.orderBy = orderBy
  }

  const trimmedKeyword = keyword?.trim()

  if (trimmedKeyword) {
    params.filterKeyword = trimmedKeyword
  }

  return params
}

export function buildDataGridServerAggregationParams({
  columnFilters = [],
  keyword,
  baseFilters,
  fieldMap,
  groupBy,
  calculations,
  orderBy,
  limit,
}: BuildDataGridServerAggregationParamsOptions): DataGridServerAggregationParams {
  const groupByColumns = Array.isArray(groupBy) ? groupBy : [groupBy]
  const resolvedColumns = groupByColumns
    .map((columnId) => resolveField(columnId, 'filter', fieldMap).trim())
    .filter((columnId) => columnId.length > 0)

  const params: DataGridServerAggregationParams = {
    columns: resolvedColumns,
    calculations,
  }

  const filters = buildFilters({ columnFilters, baseFilters, fieldMap })

  if (filters) {
    params.filters = filters
  }

  const trimmedKeyword = keyword?.trim()

  if (trimmedKeyword) {
    params.filterKeyword = trimmedKeyword
  }

  if (orderBy) {
    params.orderBy = orderBy
  }

  if (typeof limit === 'number' && Number.isFinite(limit) && limit > 0) {
    params.limit = Math.floor(limit)
  }

  return params
}
