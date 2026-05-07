'use client'

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

import {
  CalendarIcon,
  CheckSquare2,
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
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { useUiTranslation } from '@/lib/use-ui-translation'

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

    case 'uuid':
      return 'text'

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

function toDateValue(value: unknown): Date | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value)

    if (!Number.isNaN(parsed.getTime())) {
      return parsed
    }
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

        default:
          return 'is'
      }

    case 'date':
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
          return 'include any of'

        case 'includesAll':
          return 'include all of'

        case 'isNoneOf':
          return 'exclude if any of'

        case 'excludesIfAll':
          return 'exclude if all'

        default:
          return 'include'
      }

    case 'boolean':
      switch (operator) {
        case 'isFalse':
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

        case 'is not between':
          return 'isBetween'

        default:
          return 'equals'
      }

    case 'date':
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

        case 'is not between':
          return 'isBetween'

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
  }
}

function columnFiltersToDataTableFilters(
  filters: Array<ColumnFilter>,
  columnTypeById: Map<string, ColumnDataType>,
): FiltersState {
  const mapped: FiltersState = []

  for (const filter of filters) {
    const type = columnTypeById.get(filter.id)

    if (!type) continue

    const value =
      filter.value &&
      typeof filter.value === 'object' &&
      'operator' in filter.value
        ? (filter.value as FilterValue)
        : ({ value: filter.value } as FilterValue)

    const operator = toDataTableOperator(type, value.operator)
    const values: Array<string | number | Date> = []

    if (type === 'text') {
      const normalized = toStringValue(value.value)

      if (normalized) {
        values.push(normalized)
      }
    }

    if (type === 'number') {
      const start = toNumberValue(value.value)
      const end = toNumberValue(value.endValue)

      if (operator === 'is between' || operator === 'is not between') {
        if (start !== undefined) values.push(start)
        if (end !== undefined) values.push(end)
      } else if (start !== undefined) {
        values.push(start)
      }
    }

    if (type === 'date') {
      const start = toDateValue(value.value)
      const end = toDateValue(value.endValue)

      if (operator === 'is between' || operator === 'is not between') {
        if (start) values.push(start)
        if (end) values.push(end)
      } else if (start) {
        values.push(start)
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

function dataTableFiltersToColumnFilters(
  filters: FiltersState,
  columnTypeById: Map<string, ColumnDataType>,
): Array<ColumnFilter> {
  return filters.flatMap((filter): Array<ColumnFilter> => {
    const type = columnTypeById.get(filter.columnId)

    if (!type) return []

    const operator = toGridOperator(type, filter.operator as DataTableOperator)
    const values = filter.values as Array<string | number | Date>
    let value: FilterValue['value']
    let endValue: FilterValue['endValue']

    if (type === 'text') {
      value = toStringValue(values[0])
    }

    if (type === 'number') {
      const start = toNumberValue(values[0])
      const end = toNumberValue(values[1])

      if (operator === 'isBetween') {
        value = start
        endValue = end
      } else {
        value = start
      }
    }

    if (type === 'date') {
      const start = toDateValue(values[0])
      const end = toDateValue(values[1])

      if (operator === 'isBetween') {
        value = start?.toISOString()
        endValue = end?.toISOString()
      } else {
        value = start?.toISOString()
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
        operator === 'excludesIfAll'
      ) {
        value = toStringArray(values)
      } else {
        value = toStringValue(values[0])
      }
    }

    if (type === 'boolean') {
      if (operator === 'isEmpty' || operator === 'isNotEmpty') {
        value = undefined
      } else if (operator === 'isFalse') {
        value = 'false'
      } else {
        value = 'true'
      }
    }

    return [
      {
        id: filter.columnId,
        value: {
          operator,
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

  const columnsConfig = useMemo(() => {
    const filterableColumns = table.getAllColumns().filter((column) => {
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

      return {
        id: column.id,
        displayName: getColumnLabel(column),
        accessor: (row: TData) => getColumnValue(column, row),
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
      } satisfies ColumnConfig<TData>
    })
  }, [table, tableData, getAsyncOptions])

  const columnTypeById = useMemo(() => {
    return new Map(columnsConfig.map((column) => [column.id, column.type]))
  }, [columnsConfig])

  const filtersFromTable = useMemo(() => {
    return columnFiltersToDataTableFilters(columnFilters, columnTypeById)
  }, [columnFilters, columnTypeById])

  const [filters, setFilters] = useState<FiltersState>(filtersFromTable)

  useEffect(() => {
    const currentKey = getFiltersKey(filters)
    const nextKey = getFiltersKey(filtersFromTable)

    if (currentKey !== nextKey) {
      setFilters(filtersFromTable)
    }
  }, [filters, filtersFromTable])

  const onFiltersChange = useCallback(
    (updater: SetStateAction<FiltersState>) => {
      setFilters((currentFilters) => {
        const nextFilters =
          typeof updater === 'function' ? updater(currentFilters) : updater

        table.setColumnFilters(
          dataTableFiltersToColumnFilters(nextFilters, columnTypeById),
        )

        return nextFilters
      })
    },
    [table, columnTypeById],
  )

  const filterState = useDataTableFilters({
    strategy: 'client',
    data: tableData,
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
