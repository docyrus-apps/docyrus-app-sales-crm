'use client'

// @ts-nocheck
/* eslint-disable */
import {
  memo,
  useCallback,
  useMemo,
  type ComponentProps,
  type RefObject,
} from 'react'

import {
  type ColumnPinningState,
  type Row,
  type TableMeta,
  type VisibilityState,
} from '@tanstack/react-table'
import { type VirtualItem } from '@tanstack/react-virtual'

import { useComposedRefs } from '@/lib/compose-refs'

import { cn } from '@/lib/utils'

import {
  type CellPosition,
  type DataGridColumnOptions,
  type Direction,
  type RowHeightValue,
} from './types'

import { DataGridCell } from './data-grid-cell'
import {
  flexRender,
  getCellKey,
  getColumnBorderVisibility,
  getColumnPinningStyle,
  getRowHeightValue,
} from './lib/data-grid'

interface DataGridRowProps<TData> extends ComponentProps<'div'> {
  row: Row<TData>
  tableMeta: TableMeta<TData>
  virtualItem: VirtualItem
  measureElement?: (node: Element | null) => void
  rowMapRef: RefObject<Map<number, HTMLDivElement>>
  rowHeight: RowHeightValue
  columnVisibility: VisibilityState
  columnPinning: ColumnPinningState
  focusedCell: CellPosition | null
  editingCell: CellPosition | null
  cellSelectionKeys: Set<string>
  isFullSelection: boolean
  searchMatchColumns: Set<string> | null
  activeSearchMatch: CellPosition | null
  changedColumns: Set<string> | null
  rowBgColor: string | null
  cellColorsByColumn: Map<string, string> | null
  dir: Direction
  readOnly: boolean
  stretchColumns: boolean
  adjustLayout: boolean
  /**
   * Per-column runtime overrides snapshot (e.g. relation
   * `showAutonumber`). Passed as an explicit prop — not read from
   * `tableMeta` — so the row memo comparator can detect changes by
   * reference. The wrapping `tableMeta` object is referentially stable
   * (its `columnOptions` field is a getter), so reading it inside the
   * comparator would always return the same current snapshot.
   */
  columnOptions?: Record<string, DataGridColumnOptions>
}

export const DataGridRow = memo(DataGridRowImpl, (prev, next) => {
  const prevRowIndex = prev.virtualItem.index
  const nextRowIndex = next.virtualItem.index

  if (prev.row.id !== next.row.id) {
    return false
  }

  if (prev.row.original !== next.row.original) {
    return false
  }

  if (prev.row.getIsGrouped() !== next.row.getIsGrouped()) {
    return false
  }

  if (prev.row.getIsExpanded() !== next.row.getIsExpanded()) {
    return false
  }

  if ((prev.row.groupingValue ?? '') !== (next.row.groupingValue ?? '')) {
    return false
  }

  if ((prev.row.groupingColumnId ?? '') !== (next.row.groupingColumnId ?? '')) {
    return false
  }

  if (prev.row.subRows.length !== next.row.subRows.length) {
    return false
  }

  if (prev.virtualItem.start !== next.virtualItem.start) {
    return false
  }

  const prevHasFocus = prev.focusedCell?.rowIndex === prevRowIndex
  const nextHasFocus = next.focusedCell?.rowIndex === nextRowIndex

  if (prevHasFocus !== nextHasFocus) {
    return false
  }

  if (nextHasFocus && prevHasFocus) {
    if (prev.focusedCell.columnId !== next.focusedCell.columnId) {
      return false
    }
  }

  const prevHasEditing = prev.editingCell?.rowIndex === prevRowIndex
  const nextHasEditing = next.editingCell?.rowIndex === nextRowIndex

  if (prevHasEditing !== nextHasEditing) {
    return false
  }

  if (nextHasEditing && prevHasEditing) {
    if (prev.editingCell.columnId !== next.editingCell.columnId) {
      return false
    }
  }

  /*
   * Re-render if this row's selected cells changed
   * Using stable Set reference that only includes this row's cells
   */
  if (prev.cellSelectionKeys !== next.cellSelectionKeys) {
    return false
  }

  if (prev.isFullSelection !== next.isFullSelection) {
    return false
  }

  if (prev.columnVisibility !== next.columnVisibility) {
    return false
  }

  if (prev.rowHeight !== next.rowHeight) {
    return false
  }

  if (prev.columnPinning !== next.columnPinning) {
    return false
  }

  if (prev.readOnly !== next.readOnly) {
    return false
  }

  if (prev.searchMatchColumns !== next.searchMatchColumns) {
    return false
  }

  if (prev.activeSearchMatch?.columnId !== next.activeSearchMatch?.columnId) {
    return false
  }

  if (prev.changedColumns !== next.changedColumns) {
    return false
  }

  if (prev.rowBgColor !== next.rowBgColor) {
    return false
  }

  if (prev.cellColorsByColumn !== next.cellColorsByColumn) {
    return false
  }

  if (prev.dir !== next.dir) {
    return false
  }

  if (prev.adjustLayout !== next.adjustLayout) {
    return false
  }

  if (prev.stretchColumns !== next.stretchColumns) {
    return false
  }

  /*
   * Re-render every row when the per-column override map reference
   * changes — toggling something like a relation column's
   * `showAutonumber` needs to repaint all rows, not just the focused
   * one. The map reference is replaced on every `setColumnOptions`
   * call, so a shallow check is enough.
   */
  if (prev.columnOptions !== next.columnOptions) {
    return false
  }

  return true
}) as typeof DataGridRowImpl

function DataGridRowImpl<TData>({
  row,
  tableMeta,
  virtualItem,
  measureElement,
  rowMapRef,
  rowHeight,
  columnVisibility,
  columnPinning,
  focusedCell,
  editingCell,
  cellSelectionKeys,
  isFullSelection,
  searchMatchColumns,
  activeSearchMatch,
  changedColumns,
  rowBgColor,
  cellColorsByColumn,
  dir,
  readOnly,
  stretchColumns,
  adjustLayout,
  columnOptions,
  className,
  style,
  ref,
  ...props
}: DataGridRowProps<TData>) {
  const virtualRowIndex = virtualItem.index

  const onRowChange = useCallback(
    (node: HTMLDivElement | null) => {
      if (typeof virtualRowIndex === 'undefined') return

      if (node) {
        measureElement?.(node)
        rowMapRef.current.set(virtualRowIndex, node)
      } else {
        rowMapRef.current.delete(virtualRowIndex)
      }
    },
    [virtualRowIndex, measureElement, rowMapRef],
  )

  const rowRef = useComposedRefs(ref, onRowChange)

  const isRowSelected = row.getIsSelected()

  /*
   * Memoize visible cells to avoid recreating cell array on every render
   * columnVisibility and columnPinning are used as deps to trigger recalculation
   * when column visibility or pinning changes, even if the row reference is stable
   */
  const visibleCells = useMemo(() => {
    void columnVisibility
    void columnPinning

    return row.getVisibleCells()
  }, [row, columnVisibility, columnPinning])

  const isGroupRow = row.getIsGrouped()

  const groupedCell = useMemo(() => {
    if (!isGroupRow) return null

    return visibleCells.find((c) => c.getIsGrouped())
  }, [isGroupRow, visibleCells])

  return (
    <div
      key={row.id}
      role="row"
      aria-rowindex={virtualRowIndex + 2}
      aria-selected={isRowSelected}
      data-index={virtualRowIndex}
      data-slot="grid-row"
      tabIndex={-1}
      {...props}
      ref={rowRef}
      className={cn(
        'group/grid-row absolute flex min-w-full border-b hover:bg-primary/5',
        !adjustLayout && 'will-change-transform',
        isGroupRow && 'bg-muted/40',
        className,
      )}
      style={{
        height: `${getRowHeightValue(rowHeight)}px`,
        ...(adjustLayout
          ? { top: `${virtualItem.start}px` }
          : { transform: `translateY(${virtualItem.start}px)` }),
        ...(rowBgColor && !isGroupRow
          ? { backgroundColor: rowBgColor }
          : undefined),
        ...style,
      }}
    >
      {isGroupRow && groupedCell ? (
        <div
          role="gridcell"
          aria-colindex={1}
          data-slot="grid-cell"
          tabIndex={-1}
          className="grow"
        >
          <DataGridCell
            cell={groupedCell}
            tableMeta={tableMeta}
            rowIndex={virtualRowIndex}
            columnId={groupedCell.column.id}
            rowHeight={rowHeight}
            isFocused={false}
            isEditing={false}
            isSelected={false}
            isSearchMatch={false}
            isActiveSearchMatch={false}
            isChanged={false}
            readOnly
            columnOption={columnOptions?.[groupedCell.column.id]}
          />
        </div>
      ) : (
        visibleCells.map((cell, colIndex) => {
          const columnId = cell.column.id

          const isCellFocused =
            focusedCell?.rowIndex === virtualRowIndex &&
            focusedCell.columnId === columnId
          const isCellEditing =
            editingCell?.rowIndex === virtualRowIndex &&
            editingCell.columnId === columnId
          const isCellSelected =
            isFullSelection ||
            cellSelectionKeys.has(getCellKey(virtualRowIndex, columnId))

          const isSearchMatch = searchMatchColumns?.has(columnId) ?? false
          const isActiveSearchMatch = activeSearchMatch?.columnId === columnId
          const isChanged = changedColumns?.has(columnId) ?? false

          const nextColumn =
            colIndex < visibleCells.length - 1
              ? visibleCells[colIndex + 1]?.column
              : undefined
          const isLastColumn = colIndex === visibleCells.length - 1
          const { showEndBorder, showStartBorder } = getColumnBorderVisibility({
            column: cell.column,
            nextColumn,
            isLastColumn,
          })

          return (
            <div
              key={cell.id}
              role="gridcell"
              aria-colindex={colIndex + 1}
              data-highlighted={isCellFocused ? '' : undefined}
              data-slot="grid-cell"
              tabIndex={-1}
              className={cn({
                grow:
                  stretchColumns &&
                  columnId !== 'select' &&
                  columnId !== 'actions',
                'border-e': showEndBorder && columnId !== 'select',
                'border-s': showStartBorder && columnId !== 'select',
              })}
              style={{
                ...getColumnPinningStyle({ column: cell.column, dir }),
                width: `calc(var(--col-${columnId}-size) * 1px)`,
              }}
            >
              {typeof cell.column.columnDef.header === 'function' ? (
                <div
                  className={cn(
                    'size-full py-1.5',
                    columnId === 'actions' ? 'ps-0 pe-3' : 'px-3',
                    isRowSelected && 'bg-primary/10',
                    cell.column.columnDef.meta?.visibleOnHover &&
                      '[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/grid-row:opacity-100 transition-opacity',
                  )}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </div>
              ) : (
                <DataGridCell
                  cell={cell}
                  tableMeta={tableMeta}
                  rowIndex={virtualRowIndex}
                  columnId={columnId}
                  rowHeight={rowHeight}
                  isFocused={isCellFocused}
                  isEditing={isCellEditing}
                  isSelected={isCellSelected}
                  isSearchMatch={isSearchMatch}
                  isActiveSearchMatch={isActiveSearchMatch}
                  isChanged={isChanged}
                  /*
                   * Cell is read-only when the table-wide flag is set OR the
                   * column itself is marked as such (`columnDef.meta.readOnly`).
                   * The latter lets `useDocyrusDataGrid` lock down identity
                   * columns and view-level read-only overrides without flipping
                   * the entire grid back to read-only mode.
                   */
                  readOnly={
                    readOnly || cell.column.columnDef.meta?.readOnly === true
                  }
                  colorRuleBg={cellColorsByColumn?.get(columnId)}
                  columnOption={columnOptions?.[columnId]}
                />
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
