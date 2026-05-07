'use client'

import { type ReactNode, useEffect, useRef, useState } from 'react'

import { X } from 'lucide-react'

import { Separator } from '@/components/ui/separator'

import { Button } from '@/components/ui/button'

import { getColumn } from '../lib/helpers'
import { FilterOperator } from './filter-operator'
import { FilterSubject } from './filter-subject'
import { FilterValue } from './filter-value'

import { type Locale } from '../lib/i18n'
import {
  type Column,
  type ColumnDataType,
  type DataTableFilterActions,
  type FilterModel,
  type FilterStrategy,
  type FiltersState,
} from '../core/types'

interface ActiveFiltersProps<TData> {
  columns: Array<Column<TData>>
  filters: FiltersState
  actions: DataTableFilterActions
  strategy: FilterStrategy
  locale?: Locale
}

export function ActiveFilters<TData>({
  columns,
  filters,
  actions,
  strategy,
  locale = 'en',
}: ActiveFiltersProps<TData>) {
  return (
    <>
      {filters.map((filter) => {
        const id = filter.columnId

        const column = getColumn(columns, id)

        if (!filter.values) return null

        return (
          <ActiveFilter
            key={`active-filter-${filter.columnId}`}
            filter={filter}
            column={column}
            actions={actions}
            strategy={strategy}
            locale={locale}
          />
        )
      })}
    </>
  )
}

interface ActiveFilterProps<TData, TType extends ColumnDataType> {
  filter: FilterModel<TType>
  column: Column<TData, TType>
  actions: DataTableFilterActions
  strategy: FilterStrategy
  locale?: Locale
}

export function ActiveFilter<TData, TType extends ColumnDataType>({
  filter,
  column,
  actions,
  strategy,
  locale = 'en',
}: ActiveFilterProps<TData, TType>) {
  return (
    <div className="flex h-7 items-center rounded-2xl border border-border bg-background shadow-xs text-xs">
      <FilterSubject column={column} />
      <Separator orientation="vertical" />
      <FilterOperator
        filter={filter}
        column={column}
        actions={actions}
        locale={locale}
      />
      <Separator orientation="vertical" />
      <FilterValue
        filter={filter}
        column={column}
        actions={actions}
        strategy={strategy}
        locale={locale}
      />
      <Separator orientation="vertical" />
      <Button
        variant="ghost"
        className="rounded-none rounded-r-2xl text-xs w-7 h-full"
        onClick={() => actions.removeFilter(filter.columnId)}
      >
        <X className="size-4 -translate-x-0.5" />
      </Button>
    </div>
  )
}

export function ActiveFiltersMobileContainer({
  children,
}: {
  children: ReactNode
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showLeftBlur, setShowLeftBlur] = useState(false)
  const [showRightBlur, setShowRightBlur] = useState(true)

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current

      setShowLeftBlur(scrollLeft > 0)

      /*
       * Show right blur if there's more content to scroll to the right
       * Add a small buffer (1px) to account for rounding errors
       */
      setShowRightBlur(scrollLeft + clientWidth < scrollWidth - 1)
    }
  }

  /*
   * Log blur states for debugging
   * useEffect(() => {
   *   console.log('left:', showLeftBlur, '  right:', showRightBlur)
   * }, [showLeftBlur, showRightBlur])
   */

  /*
   * Set up ResizeObserver to monitor container size
   * biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
   */
  useEffect(() => {
    if (scrollContainerRef.current) {
      const resizeObserver = new ResizeObserver(() => {
        checkScroll()
      })

      resizeObserver.observe(scrollContainerRef.current)

      return () => {
        resizeObserver.disconnect()
      }
    }
  }, [])

  /*
   * Update blur states when children change
   * biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
   */
  useEffect(() => {
    checkScroll()
  }, [children])

  return (
    <div className="relative w-full overflow-x-hidden">
      {/* Left blur effect */}
      {showLeftBlur && (
        <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none bg-gradient-to-r from-background to-transparent animate-in fade-in-0" />
      )}

      {/* Scrollable container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-2 overflow-x-scroll no-scrollbar"
        onScroll={checkScroll}
      >
        {children}
      </div>

      {/* Right blur effect */}
      {showRightBlur && (
        <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none bg-gradient-to-l from-background to-transparent animate-in fade-in-0 " />
      )}
    </div>
  )
}
