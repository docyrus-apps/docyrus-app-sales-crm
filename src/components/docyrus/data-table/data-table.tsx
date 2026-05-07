'use client'

import {
  flexRender,
  type Row,
  type Table as TanStackTable,
} from '@tanstack/react-table'
import { ChevronDown, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

import { DataGridPaginationFooter } from '../data-grid/data-grid-pagination-footer'

export interface DataTableProps<TData> {
  table: TanStackTable<TData>
  className?: string
  containerClassName?: string
  tableClassName?: string
  headerClassName?: string
  bodyClassName?: string
  rowClassName?: string | ((row: Row<TData>) => string | undefined)
  cellClassName?: string
  emptyText?: string
  isLoading?: boolean
  loadingText?: string
  pagination?: boolean
}

export function DataTable<TData>({
  table,
  className,
  containerClassName,
  tableClassName,
  headerClassName,
  bodyClassName,
  rowClassName,
  cellClassName,
  emptyText = 'No results.',
  isLoading = false,
  loadingText = 'Loading...',
  pagination = false,
}: DataTableProps<TData>) {
  const { rows } = table.getRowModel()
  const visibleColumnCount = table.getVisibleLeafColumns().length

  return (
    <div className={cn('flex min-h-0 flex-col gap-2', className)}>
      <div
        className={cn(
          /*
           * Single scroll container that owns both axes. The sticky thead
           * below keeps the header pinned during vertical scroll while
           * still travelling with the body during horizontal scroll. The
           * pagination footer is rendered as a sibling so it never scrolls
           * with the rows.
           */
          'relative min-h-0 flex-1 overflow-auto rounded-md border',
          containerClassName,
        )}
      >
        <table className={cn('w-full caption-bottom text-sm', tableClassName)}>
          <TableHeader
            className={cn('sticky top-0 z-10 bg-background', headerClassName)}
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className={bodyClassName}>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumnCount}
                  className="h-24 text-center text-muted-foreground"
                >
                  {loadingText}
                </TableCell>
              </TableRow>
            ) : rows.length > 0 ? (
              rows.map((row) => (
                <DataTableRow
                  key={row.id}
                  row={row}
                  className={
                    typeof rowClassName === 'function'
                      ? rowClassName(row)
                      : rowClassName
                  }
                  cellClassName={cellClassName}
                />
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={visibleColumnCount}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyText}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </table>
      </div>
      {pagination && (
        <DataGridPaginationFooter table={table} className="shrink-0" />
      )}
    </div>
  )
}

interface DataTableRowProps<TData> {
  row: Row<TData>
  className?: string
  cellClassName?: string
}

function DataTableRow<TData>({
  row,
  className,
  cellClassName,
}: DataTableRowProps<TData>) {
  const isGrouped = row.getIsGrouped()

  return (
    <TableRow
      data-state={row.getIsSelected() && 'selected'}
      aria-expanded={isGrouped ? row.getIsExpanded() : undefined}
      className={className}
    >
      {row.getVisibleCells().map((cell) => {
        if (cell.getIsGrouped()) {
          return (
            <TableCell
              key={cell.id}
              className={cn(
                'bg-muted/35 font-medium',
                cellClassName,
                cell.column.columnDef.meta?.cellClassName,
              )}
              style={{ width: cell.column.getSize() }}
            >
              <div className="flex min-w-0 items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="size-6 shrink-0"
                  aria-label={
                    row.getIsExpanded() ? 'Collapse group' : 'Expand group'
                  }
                  onClick={row.getToggleExpandedHandler()}
                >
                  {row.getIsExpanded() ? (
                    <ChevronDown className="size-4" />
                  ) : (
                    <ChevronRight className="size-4" />
                  )}
                </Button>
                <span className="min-w-0 truncate">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  ({row.subRows.length})
                </span>
              </div>
            </TableCell>
          )
        }

        if (cell.getIsAggregated()) {
          return (
            <TableCell
              key={cell.id}
              className={cn(
                'bg-muted/35',
                cellClassName,
                cell.column.columnDef.meta?.cellClassName,
              )}
              style={{ width: cell.column.getSize() }}
            >
              {flexRender(
                cell.column.columnDef.aggregatedCell ??
                  cell.column.columnDef.cell,
                cell.getContext(),
              )}
            </TableCell>
          )
        }

        if (cell.getIsPlaceholder()) {
          return (
            <TableCell
              key={cell.id}
              className={cn(
                'bg-muted/35',
                cellClassName,
                cell.column.columnDef.meta?.cellClassName,
              )}
              style={{ width: cell.column.getSize() }}
            />
          )
        }

        return (
          <TableCell
            key={cell.id}
            className={cn(
              cellClassName,
              cell.column.columnDef.meta?.cellClassName,
            )}
            style={{ width: cell.column.getSize() }}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        )
      })}
    </TableRow>
  )
}
