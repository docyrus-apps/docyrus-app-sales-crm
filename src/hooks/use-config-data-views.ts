import { useQuery } from '@tanstack/react-query'
import type {
  ColumnFiltersState,
  ColumnPinningState,
  ColumnSort,
} from '@tanstack/react-table'
import type { RuleGroupType } from '@/components/docyrus/query-builder'
import type { SavedDataGridView } from '@/components/docyrus/data-grid'
import { getApiClient } from '@/lib/api'

interface ConfigDataViewRecord {
  id: string
  name: string
  description?: string | null
  columns?: unknown
  filters?: unknown
  sort?: unknown
  color_rules?: unknown
  sort_order?: number | null
  is_default?: boolean
}

interface ParseConfigDataViewsOptions {
  statusLabelById?: Record<string, string>
}

const EMPTY_FILTER_QUERY: RuleGroupType = {
  combinator: 'and',
  rules: [],
}

function parseMaybeJson<T>(value: unknown): T | null {
  if (!value) return null

  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T
    } catch {
      return null
    }
  }

  if (typeof value === 'object') {
    return value as T
  }

  return null
}

function parseColumnPinning(value: unknown): ColumnPinningState {
  if (!value || typeof value !== 'object') {
    return { left: [], right: [] }
  }

  const pinning = value as { left?: unknown; right?: unknown }

  return {
    left: Array.isArray(pinning.left)
      ? pinning.left.filter((item): item is string => typeof item === 'string')
      : [],
    right: Array.isArray(pinning.right)
      ? pinning.right.filter((item): item is string => typeof item === 'string')
      : [],
  }
}

function parseColumns(
  value: unknown,
): Pick<
  SavedDataGridView,
  'columnVisibility' | 'columnOrder' | 'columnPinning'
> {
  const parsed = parseMaybeJson<{
    visibility?: Record<string, boolean>
    order?: Array<string>
    pinning?: unknown
  }>(value)

  return {
    columnVisibility:
      parsed?.visibility && typeof parsed.visibility === 'object'
        ? parsed.visibility
        : {},
    columnOrder: Array.isArray(parsed?.order)
      ? parsed.order.filter((item): item is string => typeof item === 'string')
      : [],
    columnPinning: parseColumnPinning(parsed?.pinning),
  }
}

function parseSorting(value: unknown): Array<ColumnSort> | undefined {
  const parsed = parseMaybeJson<{ sorting?: unknown } | Array<unknown>>(value)
  const rawSorting = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.sorting)
      ? parsed.sorting
      : []

  const sorting = rawSorting.flatMap((item): Array<ColumnSort> => {
    if (!item || typeof item !== 'object') return []

    const candidate = item as { id?: unknown; desc?: unknown }

    if (
      typeof candidate.id !== 'string' ||
      typeof candidate.desc !== 'boolean'
    ) {
      return []
    }

    return [{ id: candidate.id, desc: candidate.desc }]
  })

  return sorting.length > 0 ? sorting : undefined
}

function translateRuleValue(
  field: string,
  value: unknown,
  statusLabelById: Record<string, string>,
): string | Array<string> | number | undefined {
  if (field === 'lead_status') {
    if (typeof value === 'string') {
      return statusLabelById[value] ?? value
    }

    if (Array.isArray(value)) {
      return value
        .map((item) =>
          typeof item === 'string'
            ? (statusLabelById[item] ?? item)
            : undefined,
        )
        .filter((item): item is string => typeof item === 'string')
    }
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    Array.isArray(value)
  ) {
    return value as string | Array<string> | number
  }

  return undefined
}

function parseColumnFilters(
  value: unknown,
  statusLabelById: Record<string, string>,
): ColumnFiltersState {
  const parsed = parseMaybeJson<RuleGroupType>(value)

  if (!parsed || !Array.isArray(parsed.rules)) return []

  return parsed.rules.flatMap((rule): ColumnFiltersState => {
    if (!rule || typeof rule !== 'object' || 'rules' in rule) {
      return []
    }

    const field = typeof rule.field === 'string' ? rule.field : null
    const operator = typeof rule.operator === 'string' ? rule.operator : null

    if (!field || !operator) return []

    const translatedValue = translateRuleValue(
      field,
      'value' in rule ? rule.value : undefined,
      statusLabelById,
    )

    if (operator === '=') {
      return [
        {
          id: field,
          value: {
            operator: 'is',
            value: translatedValue,
          },
        },
      ]
    }

    if (operator === '!=') {
      return [
        {
          id: field,
          value: {
            operator: 'isNot',
            value: translatedValue,
          },
        },
      ]
    }

    if (operator === 'in' && Array.isArray(translatedValue)) {
      return [
        {
          id: field,
          value: {
            operator: 'isAnyOf',
            value: translatedValue,
          },
        },
      ]
    }

    if (operator === 'not in' && Array.isArray(translatedValue)) {
      return [
        {
          id: field,
          value: {
            operator: 'isNoneOf',
            value: translatedValue,
          },
        },
      ]
    }

    return []
  })
}

export function parseConfigDataViews(
  data: Array<ConfigDataViewRecord>,
  options: ParseConfigDataViewsOptions = {},
): Array<SavedDataGridView> {
  const { statusLabelById = {} } = options

  return [...data]
    .sort(
      (left, right) =>
        (left.sort_order ?? Number.MAX_SAFE_INTEGER) -
        (right.sort_order ?? Number.MAX_SAFE_INTEGER),
    )
    .map((view) => {
      const filterQuery =
        parseMaybeJson<RuleGroupType>(view.filters) ?? undefined
      const { columnVisibility, columnOrder, columnPinning } = parseColumns(
        view.columns,
      )

      return {
        id: view.id,
        name: view.name,
        description: view.description ?? undefined,
        columnVisibility,
        columnOrder,
        columnPinning,
        sorting: parseSorting(view.sort),
        columnFilters: parseColumnFilters(view.filters, statusLabelById),
        grouping: [],
        filterQuery:
          filterQuery && Array.isArray(filterQuery.rules)
            ? filterQuery
            : EMPTY_FILTER_QUERY,
      }
    })
}

export function useConfigDataViews(appId: string, dataSourceId: string) {
  return useQuery({
    queryKey: ['config-data-views', appId, dataSourceId],
    queryFn: async () => {
      const apiClient = getApiClient()

      return apiClient.get<Array<ConfigDataViewRecord>>(
        `/v1/dev/apps/${appId}/config-data-views`,
        {
          dataSourceId,
        },
      )
    },
  })
}
