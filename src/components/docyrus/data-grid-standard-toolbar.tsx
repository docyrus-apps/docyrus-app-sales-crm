'use client'

import { useCallback, useState, type ComponentProps } from 'react'

import { type Table } from '@tanstack/react-table'

import { DataGridToolbar } from '@/components/docyrus/data-grid'
import { SearchInput } from '@/components/docyrus/search-input'

interface DataGridStandardToolbarProps<TData> extends ComponentProps<'div'> {
  table: Table<TData>
  searchPlaceholder?: string
}

export function DataGridStandardToolbar<TData>({
  table,
  searchPlaceholder = 'Search...',
  className,
  ...props
}: DataGridStandardToolbarProps<TData>) {
  const [searchKeyword, setSearchKeyword] = useState('')

  const onSearch = useCallback(
    (value: string) => {
      const nextValue = value.trim()
      table.setGlobalFilter(nextValue.length > 0 ? nextValue : undefined)
    },
    [table],
  )

  const startContent = (
    <SearchInput
      value={searchKeyword}
      onValueChange={setSearchKeyword}
      onSearch={onSearch}
      placeholder={searchPlaceholder}
      size="sm"
      className="w-56 min-w-40"
    />
  )

  return (
    <DataGridToolbar
      table={table}
      enableView={false}
      enableDisplayMode
      enableGroup
      startContent={startContent}
      className={className}
      {...props}
    />
  )
}
