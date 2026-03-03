'use client'

import { type Table } from '@tanstack/react-table'

import { LayoutGrid, Table2 } from 'lucide-react'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

import { type DataGridDisplayMode } from './types'

interface DataGridDisplayMenuProps<TData> {
  table: Table<TData>
  disabled?: boolean
  className?: string
}

export function DataGridDisplayMenu<TData>({
  table,
  disabled,
  className,
}: DataGridDisplayMenuProps<TData>) {
  const displayMode = table.options.meta?.displayMode ?? 'table'
  const onDisplayModeChange = table.options.meta?.onDisplayModeChange

  return (
    <ToggleGroup
      type="single"
      value={displayMode}
      onValueChange={(value: string) => {
        if (value) {
          onDisplayModeChange?.(value as DataGridDisplayMode)
        }
      }}
      variant="outline"
      size="sm"
      disabled={disabled}
      className={className}
    >
      <ToggleGroupItem
        value="table"
        aria-label="Table view"
        className="size-8 px-0"
      >
        <Table2 className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="gallery"
        aria-label="Gallery view"
        className="size-8 px-0"
      >
        <LayoutGrid className="size-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
