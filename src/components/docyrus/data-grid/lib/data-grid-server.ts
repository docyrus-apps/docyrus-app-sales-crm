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
  return Array.isArray(value) ? value : []
}

function toFilterValue(value: unknown): FilterValue | null {
  if (!value) return null

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

export function toServerRule(
  filter: ColumnFilter,
  fieldMap?: DataGridServerFieldMap,
): ICollectionFilterRule | null {
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

    return { field, operator: '=', value }
  }

  if (operator === 'notEquals') {
    if (value === undefined || (typeof value === 'string' && value === '')) {
      return null
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

  if (operator === 'includesAll') {
    const values = toArrayValue(value)

    if (values.length === 0) return null

    return { field, operator: 'contains all', value: values }
  }

  const values = toArrayValue(value)

  if (values.length === 0) return null

  return { field, operator: 'not contains', value: values }
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
    .filter((rule): rule is ICollectionFilterRule => Boolean(rule))

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
