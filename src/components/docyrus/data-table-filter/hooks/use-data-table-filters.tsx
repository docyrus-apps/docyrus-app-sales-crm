'use client'

// @ts-nocheck
/* eslint-disable */
import { type Dispatch, type SetStateAction, useMemo, useState } from 'react'

import {
  type ColumnConfig,
  type ColumnDataType,
  type ColumnOption,
  type DataTableFilterActions,
  type FilterModel,
  type FilterStrategy,
  type FiltersState,
  type NumberColumnIds,
  type OptionBasedColumnDataType,
  type OptionColumnIds,
} from '../core/types'

import { createColumns } from '../core/filters'
import { DEFAULT_OPERATORS, determineNewOperator } from '../core/operators'
import { addUniq, removeUniq, uniq } from '../lib/array'
import {
  createDateFilterValue,
  createNumberFilterValue,
  isColumnOptionArray,
  isColumnOptionMap,
  isMinMaxTuple,
} from '../lib/helpers'

export interface DataTableFiltersOptions<
  TData,
  TColumns extends ReadonlyArray<ColumnConfig<TData, any, any, any>>,
  TStrategy extends FilterStrategy,
> {
  strategy: TStrategy
  data: Array<TData>
  columnsConfig: TColumns
  defaultFilters?: FiltersState
  filters?: FiltersState
  onFiltersChange?: Dispatch<SetStateAction<FiltersState>>
  /**
   * Calculate faceted values from data.
   * Disable when you supply faceted/options externally (e.g., server strategy) to avoid heavy recomputation.
   * Defaults to true.
   */
  calculateFacets?: boolean
  options?: Partial<
    Record<OptionColumnIds<TColumns>, Array<ColumnOption> | undefined>
  >
  faceted?: Partial<
    | Record<OptionColumnIds<TColumns>, Map<string, number> | undefined>
    | Record<NumberColumnIds<TColumns>, [number, number] | undefined>
  >
}

export function useDataTableFilters<
  TData,
  TColumns extends ReadonlyArray<ColumnConfig<TData, any, any, any>>,
  TStrategy extends FilterStrategy,
>({
  strategy,
  data,
  columnsConfig,
  defaultFilters,
  filters: externalFilters,
  onFiltersChange,
  calculateFacets = true,
  options,
  faceted,
}: DataTableFiltersOptions<TData, TColumns, TStrategy>) {
  const [internalFilters, setInternalFilters] = useState<FiltersState>(
    defaultFilters ?? [],
  )

  if (
    (externalFilters && !onFiltersChange) ||
    (!externalFilters && onFiltersChange)
  ) {
    const msg =
      'If using controlled state, you must specify both filters and onFiltersChange.'

    throw new Error(msg)
  }

  const filters = externalFilters ?? internalFilters
  const setFilters = onFiltersChange ?? setInternalFilters

  const columns = useMemo(() => {
    const enhancedConfigs = columnsConfig.map((config) => {
      let final = config

      if (
        options &&
        (config.type === 'option' || config.type === 'multiOption')
      ) {
        const optionsInput = options[config.id as OptionColumnIds<TColumns>]

        if (!optionsInput || !isColumnOptionArray(optionsInput)) return config

        final = { ...final, options: optionsInput }
      }

      if (
        faceted &&
        (config.type === 'option' || config.type === 'multiOption')
      ) {
        const facetedOptionsInput =
          faceted[config.id as OptionColumnIds<TColumns>]

        if (!facetedOptionsInput || !isColumnOptionMap(facetedOptionsInput))
          return config

        final = { ...final, facetedOptions: facetedOptionsInput }
      }

      if (config.type === 'number' && faceted) {
        const minMaxTuple = faceted[config.id as NumberColumnIds<TColumns>]

        if (!minMaxTuple || !isMinMaxTuple(minMaxTuple)) return config

        final = {
          ...final,
          min: minMaxTuple[0],
          max: minMaxTuple[1],
        }
      }

      return final
    })

    const facetSource = calculateFacets ? data : []

    return createColumns(facetSource, enhancedConfigs, strategy)
  }, [calculateFacets, data, columnsConfig, options, faceted, strategy])

  const actions: DataTableFilterActions = useMemo(
    () => ({
      addFilterValue<TData, TType extends OptionBasedColumnDataType>(
        column: ColumnConfig<TData, TType>,
        values: FilterModel<TType>['values'],
      ) {
        if (column.type === 'option') {
          setFilters((prev) => {
            /*
             * Don't gate on `filter.values.length > 0`. The Docyrus toolbar
             * "Filter by this column" inserts a placeholder filter with
             * empty values so the chip appears before the user picks a
             * value — gating on length appended a SECOND filter for the
             * same column when the user picked, producing duplicate chips
             * and corrupted query payloads. Whenever a filter for this
             * column already exists, upgrade it in place.
             */
            const filter = prev.find((f) => f.columnId === column.id)

            if (!filter) {
              return [
                ...prev,
                {
                  columnId: column.id,
                  type: column.type,
                  operator:
                    values.length > 1
                      ? DEFAULT_OPERATORS[column.type].multiple
                      : DEFAULT_OPERATORS[column.type].single,
                  values,
                },
              ]
            }
            const oldValues = filter.values
            const newValues = addUniq(filter.values, values)
            const newOperator = determineNewOperator(
              'option',
              oldValues,
              newValues,
              filter.operator,
            )

            return prev.map((f) =>
              f.columnId === column.id
                ? {
                    columnId: column.id,
                    type: column.type,
                    operator: newOperator,
                    values: newValues,
                  }
                : f,
            )
          })

          return
        }
        if (column.type === 'multiOption') {
          setFilters((prev) => {
            const filter = prev.find((f) => f.columnId === column.id)

            if (!filter) {
              return [
                ...prev,
                {
                  columnId: column.id,
                  type: column.type,
                  operator:
                    values.length > 1
                      ? DEFAULT_OPERATORS[column.type].multiple
                      : DEFAULT_OPERATORS[column.type].single,
                  values,
                },
              ]
            }
            const oldValues = filter.values
            const newValues = addUniq(filter.values, values)
            const newOperator = determineNewOperator(
              'multiOption',
              oldValues,
              newValues,
              filter.operator,
            )

            if (newValues.length === 0) {
              return prev.filter((f) => f.columnId !== column.id)
            }

            return prev.map((f) =>
              f.columnId === column.id
                ? {
                    columnId: column.id,
                    type: column.type,
                    operator: newOperator,
                    values: newValues,
                  }
                : f,
            )
          })

          return
        }
        throw new Error(
          '[data-table-filter] addFilterValue() is only supported for option columns',
        )
      },
      removeFilterValue<TData, TType extends OptionBasedColumnDataType>(
        column: ColumnConfig<TData, TType>,
        value: FilterModel<TType>['values'],
      ) {
        if (column.type === 'option') {
          setFilters((prev) => {
            const filter = prev.find((f) => f.columnId === column.id)
            const isColumnFiltered = filter && filter.values.length > 0

            if (!isColumnFiltered) {
              return [...prev]
            }
            const newValues = removeUniq(filter.values, value)
            const oldValues = filter.values
            const newOperator = determineNewOperator(
              'option',
              oldValues,
              newValues,
              filter.operator,
            )

            if (newValues.length === 0) {
              return prev.filter((f) => f.columnId !== column.id)
            }

            return prev.map((f) =>
              f.columnId === column.id
                ? {
                    columnId: column.id,
                    type: column.type,
                    operator: newOperator,
                    values: newValues,
                  }
                : f,
            )
          })

          return
        }
        if (column.type === 'multiOption') {
          setFilters((prev) => {
            const filter = prev.find((f) => f.columnId === column.id)
            const isColumnFiltered = filter && filter.values.length > 0

            if (!isColumnFiltered) {
              return [...prev]
            }
            const newValues = removeUniq(filter.values, value)
            const oldValues = filter.values
            const newOperator = determineNewOperator(
              'multiOption',
              oldValues,
              newValues,
              filter.operator,
            )

            if (newValues.length === 0) {
              return prev.filter((f) => f.columnId !== column.id)
            }

            return prev.map((f) =>
              f.columnId === column.id
                ? {
                    columnId: column.id,
                    type: column.type,
                    operator: newOperator,
                    values: newValues,
                  }
                : f,
            )
          })

          return
        }
        throw new Error(
          '[data-table-filter] removeFilterValue() is only supported for option columns',
        )
      },
      setFilterValue<TData, TType extends ColumnDataType>(
        column: ColumnConfig<TData, TType>,
        values: FilterModel<TType>['values'],
      ) {
        setFilters((prev) => {
          const filter = prev.find((f) => f.columnId === column.id)
          /*
           * A column has at most one filter. Treat ANY existing filter as
           * present — even a pending one with empty `values` (e.g. an X-days
           * relative-date operator before its N is entered). The old
           * `filter.values.length > 0` check saw the pending filter as absent
           * and APPENDED a second filter with the default operator (`is`),
           * which then serialized the numeric N through the absolute-date
           * branch as `new Date(N)` → `1970-01-01` (issue #102, bug 1).
           * `determineNewOperator` already preserves the operator on a 0→1
           * value transition, so updating in place keeps the X-days operator.
           */
          const isColumnFiltered = !!filter
          const newValues =
            column.type === 'number'
              ? createNumberFilterValue(values as Array<number>)
              : column.type === 'date'
                ? createDateFilterValue(
                    values as [Date, Date] | [Date] | [] | undefined,
                  )
                : uniq(values)

          if (newValues.length === 0) return prev
          if (!isColumnFiltered) {
            return [
              ...prev,
              {
                columnId: column.id,
                type: column.type,
                operator:
                  values.length > 1
                    ? DEFAULT_OPERATORS[column.type].multiple
                    : DEFAULT_OPERATORS[column.type].single,
                values: newValues,
              },
            ]
          }
          const oldValues = filter.values
          const newOperator = determineNewOperator(
            column.type,
            oldValues,
            newValues,
            filter.operator,
          )
          const newFilter = {
            columnId: column.id,
            type: column.type,
            operator: newOperator,
            values: newValues as any,
          } satisfies FilterModel<TType>

          return prev.map((f) => (f.columnId === column.id ? newFilter : f))
        })
      },
      setFilterOperator<TType extends ColumnDataType>(
        columnId: string,
        operator: FilterModel<TType>['operator'],
      ) {
        setFilters((prev) =>
          prev.map((f) => (f.columnId === columnId ? { ...f, operator } : f)),
        )
      },
      removeFilter(columnId: string) {
        setFilters((prev) => prev.filter((f) => f.columnId !== columnId))
      },
      removeAllFilters() {
        setFilters([])
      },
    }),
    [setFilters],
  )

  return {
    columns,
    filters,
    actions,
    strategy,
  } // columns is Column<TData>[]
}
