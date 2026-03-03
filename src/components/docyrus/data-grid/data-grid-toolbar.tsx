'use client'

import { type ComponentProps, type ReactNode } from 'react'

import { type Table } from '@tanstack/react-table'

import { cn } from '@/lib/utils'

import { DataGridDisplayMenu } from './data-grid-display-menu'
import { DataGridFilterMenu } from './data-grid-filter-menu'
import { DataGridGroupMenu } from './data-grid-group-menu'
import { DataGridKeyboardShortcuts } from './data-grid-keyboard-shortcuts'
import { DataGridRowHeightMenu } from './data-grid-row-height-menu'
import { DataGridSortMenu } from './data-grid-sort-menu'
import { DataGridViewMenu } from './data-grid-view-menu'

interface DataGridToolbarProps<TData> extends ComponentProps<'div'> {
  table: Table<TData>
  enableFilter?: boolean
  enableSort?: boolean
  enableRowHeight?: boolean
  enableView?: boolean
  enableDisplayMode?: boolean
  enableGroup?: boolean
  enableSearch?: boolean
  enablePaste?: boolean
  enableRowAdd?: boolean
  enableRowsDelete?: boolean
  enableUndoRedo?: boolean
  disabled?: boolean
  startContent?: ReactNode
  endContent?: ReactNode
}

export function DataGridToolbar<TData>({
  table,
  enableFilter = true,
  enableSort = true,
  enableRowHeight = true,
  enableView = true,
  enableDisplayMode = false,
  enableGroup = false,
  enableSearch = false,
  enablePaste = false,
  enableRowAdd = false,
  enableRowsDelete = false,
  enableUndoRedo = false,
  disabled = false,
  startContent,
  endContent,
  className,
  ...props
}: DataGridToolbarProps<TData>) {
  return (
    <div
      data-slot="grid-toolbar"
      data-grid-popover
      className={cn('flex items-center gap-2 border-b px-3 py-2', className)}
      {...props}
    >
      {startContent}
      {enableFilter && <DataGridFilterMenu table={table} disabled={disabled} />}
      {enableSort && <DataGridSortMenu table={table} disabled={disabled} />}
      {enableGroup && <DataGridGroupMenu table={table} disabled={disabled} />}
      {enableRowHeight && (
        <DataGridRowHeightMenu table={table} disabled={disabled} />
      )}
      {enableDisplayMode && (
        <DataGridDisplayMenu table={table} disabled={disabled} />
      )}
      {enableView && <DataGridViewMenu table={table} disabled={disabled} />}
      <DataGridKeyboardShortcuts
        enableSearch={enableSearch}
        enablePaste={enablePaste}
        enableRowAdd={enableRowAdd}
        enableRowsDelete={enableRowsDelete}
        enableUndoRedo={enableUndoRedo}
      />
      {endContent}
    </div>
  )
}
