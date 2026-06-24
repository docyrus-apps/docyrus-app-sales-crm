'use client'

// @ts-nocheck
/* eslint-disable */
import { useCallback } from 'react'

import {
  type Column,
  type DataTableFilterActions,
  type FilterModel,
} from '@/components/docyrus/data-table-filter/core/types'
import { type Locale, t } from '@/components/docyrus/data-table-filter/lib/i18n'
import { DebouncedInput } from '@/components/docyrus/data-table-filter/ui/debounced-input'

interface SideFilterTextProps<TData> {
  column: Column<TData, 'text'>
  filter?: FilterModel<'text'>
  actions: DataTableFilterActions
  locale?: Locale
  placeholder?: string
}

export function SideFilterText<TData>({
  column,
  filter,
  actions,
  locale = 'en',
  placeholder,
}: SideFilterTextProps<TData>) {
  const value = filter?.values[0] ?? ''
  const handleChange = useCallback(
    (next: string | number) => {
      const str = String(next)

      if (str.trim().length === 0) {
        actions.removeFilter(column.id)

        return
      }
      actions.setFilterValue(column, [str])
    },
    [actions, column],
  )

  return (
    <DebouncedInput
      type="search"
      value={value}
      onChange={handleChange}
      placeholder={placeholder ?? t('search', locale)}
      className="h-9 w-full"
    />
  )
}
