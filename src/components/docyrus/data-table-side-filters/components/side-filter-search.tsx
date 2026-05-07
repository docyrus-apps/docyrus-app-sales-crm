'use client'

import { useCallback } from 'react'

import { Search } from 'lucide-react'

import {
  type Column,
  type DataTableFilterActions,
  type FiltersState,
} from '@/components/docyrus/data-table-filter/core/types'
import { type Locale, t } from '@/components/docyrus/data-table-filter/lib/i18n'
import { DebouncedInput } from '@/components/docyrus/data-table-filter/ui/debounced-input'

interface SideFilterSearchProps<TData> {
  /** Column id whose `text` filter the search input drives. */
  columnId: string
  columns: Array<Column<TData>>
  filters: FiltersState
  actions: DataTableFilterActions
  locale?: Locale
  placeholder?: string
}

export function SideFilterSearch<TData>({
  columnId,
  columns,
  filters,
  actions,
  locale = 'en',
  placeholder,
}: SideFilterSearchProps<TData>) {
  const column = columns.find((c) => c.id === columnId)
  const filter = filters.find((f) => f.columnId === columnId)
  const value = (filter?.values[0] as string | undefined) ?? ''

  const handleChange = useCallback(
    (next: string | number) => {
      if (!column) return
      const str = String(next)

      if (str.trim().length === 0) {
        actions.removeFilter(columnId)

        return
      }
      actions.setFilterValue(column as Column<TData, 'text'>, [str])
    },
    [actions, column, columnId],
  )

  if (!column || column.type !== 'text') return null

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <DebouncedInput
        type="search"
        value={value}
        onChange={handleChange}
        placeholder={placeholder ?? t('search', locale)}
        className="h-9 w-full pl-8"
      />
    </div>
  )
}
