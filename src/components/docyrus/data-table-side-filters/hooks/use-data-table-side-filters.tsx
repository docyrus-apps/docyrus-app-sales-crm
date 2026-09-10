'use client'

// @ts-nocheck
/* eslint-disable */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { type RuleGroupType } from 'react-querybuilder'

import {
  type DataTableFiltersOptions,
  useDataTableFilters,
} from '@/components/docyrus/data-table-filter/hooks/use-data-table-filters'
import {
  type ColumnConfig,
  type FilterStrategy,
  type FiltersState,
} from '@/components/docyrus/data-table-filter/core/types'

import {
  DEFAULT_OPERATOR_MAP,
  filtersStateToRuleGroup,
  ruleGroupToFiltersState,
} from '../core/query-translator'
import {
  type SideFilterCombinator,
  type SideFilterDefaults,
  type SideFilterOperatorMap,
  type SideFilterSectionGroup,
} from '../core/types'

export interface DataTableSideFiltersOptions<
  TData,
  TColumns extends ReadonlyArray<ColumnConfig<TData, any, any, any>>,
  TStrategy extends FilterStrategy,
> extends Omit<
  DataTableFiltersOptions<TData, TColumns, TStrategy>,
  'defaultFilters' | 'filters' | 'onFiltersChange'
> {
  /** Uncontrolled initial query. Translated to internal FiltersState on mount. */
  defaultQuery?: RuleGroupType
  /** Controlled query. Pair with `onQueryChange`. */
  query?: RuleGroupType
  onQueryChange?: (query: RuleGroupType) => void
  /** Top-level combinator for the emitted RuleGroupType. Default `'and'`. */
  combinator?: SideFilterCombinator
  /** Override the DTF→QB operator vocabulary. */
  operatorMap?: SideFilterOperatorMap
  /** Per-column UI hints (collapsed / mode / threshold / etc.). */
  defaults?: SideFilterDefaults
  /** Optional grouping of filter sections into named blocks. */
  sections?: ReadonlyArray<SideFilterSectionGroup>
}

function rulesEqual(a: RuleGroupType, b: RuleGroupType): boolean {
  if (a === b) return true
  if (a.combinator !== b.combinator) return false
  if (a.rules.length !== b.rules.length) return false
  try {
    return JSON.stringify(a.rules) === JSON.stringify(b.rules)
  } catch {
    return false
  }
}

export function useDataTableSideFilters<
  TData,
  TColumns extends ReadonlyArray<ColumnConfig<TData, any, any, any>>,
  TStrategy extends FilterStrategy,
>(options: DataTableSideFiltersOptions<TData, TColumns, TStrategy>) {
  const {
    defaultQuery,
    query,
    onQueryChange,
    combinator = 'and',
    operatorMap = DEFAULT_OPERATOR_MAP,
    defaults,
    sections,
    columnsConfig,
    ...rest
  } = options

  const [filters, setFilters] = useState<FiltersState>(() => {
    if (!defaultQuery) return []

    return ruleGroupToFiltersState(
      defaultQuery,
      columnsConfig as ReadonlyArray<ColumnConfig<unknown>>,
      operatorMap,
    )
  })

  const lastEmittedRef = useRef<RuleGroupType | null>(null)

  useEffect(() => {
    if (!query) return
    if (lastEmittedRef.current && rulesEqual(query, lastEmittedRef.current))
      return
    const next = ruleGroupToFiltersState(
      query,
      columnsConfig as ReadonlyArray<ColumnConfig<unknown>>,
      operatorMap,
    )

    queueMicrotask(() => setFilters(next))
  }, [query, columnsConfig, operatorMap])

  const dtf = useDataTableFilters<TData, TColumns, TStrategy>({
    ...rest,
    columnsConfig,
    filters,
    onFiltersChange: setFilters,
  })

  useEffect(() => {
    if (!onQueryChange) return
    const ruleGroup = filtersStateToRuleGroup(
      filters,
      combinator,
      operatorMap,
      columnsConfig as ReadonlyArray<ColumnConfig<unknown>>,
    )

    lastEmittedRef.current = ruleGroup
    onQueryChange(ruleGroup)
  }, [filters, combinator, operatorMap, onQueryChange, columnsConfig])

  const ruleGroup = useMemo(
    () =>
      filtersStateToRuleGroup(
        filters,
        combinator,
        operatorMap,
        columnsConfig as ReadonlyArray<ColumnConfig<unknown>>,
      ),
    [filters, combinator, operatorMap, columnsConfig],
  )

  const reset = useCallback(() => setFilters([]), [])

  return {
    ...dtf,
    query: ruleGroup,
    defaults,
    sections,
    reset,
  }
}

export type UseDataTableSideFiltersReturn = ReturnType<
  typeof useDataTableSideFilters
>
