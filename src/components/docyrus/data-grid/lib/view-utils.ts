import { type Column, type Table } from '@tanstack/react-table'

import {
  DATA_GRID_DEFAULT_PAGE_SIZE,
  type DataGridDisplayMode,
  type RowHeightValue,
  type SavedDataGridView,
} from '../types'

export function getGeneratedViewId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID()
  }

  return `view-${Date.now()}`
}

export function getColumnLabel<TData>(column: Column<TData, unknown>): string {
  const label = column.columnDef.meta?.label

  if (label) return label

  const { header } = column.columnDef

  if (typeof header === 'string') return header

  return column.id
}

export function getManagedColumns<TData>(
  table: Table<TData>,
): Array<Column<TData, unknown>> {
  return table
    .getAllLeafColumns()
    .filter(
      (column) =>
        typeof column.accessorFn !== 'undefined' &&
        column.id !== 'select' &&
        column.id !== 'actions',
    )
}

export function captureViewSnapshot<TData>(
  table: Table<TData>,
): Omit<SavedDataGridView, 'id' | 'name'> {
  const state = table.getState()
  const allLeafColumns = table.getAllLeafColumns()

  return {
    columnVisibility: { ...state.columnVisibility },
    columnOrder:
      state.columnOrder.length > 0
        ? [...state.columnOrder]
        : allLeafColumns.map((column) => column.id),
    columnPinning: {
      left: [...(state.columnPinning.left ?? [])],
      right: [...(state.columnPinning.right ?? [])],
    },
    rowHeight: table.options.meta?.rowHeight,
    displayMode: table.options.meta?.displayMode,
    sorting: [...state.sorting],
    columnFilters: [...state.columnFilters],
    grouping: [...state.grouping],
  }
}

export function applyViewToTable<TData>(
  table: Table<TData>,
  view: SavedDataGridView,
): void {
  table.setColumnVisibility(view.columnVisibility)
  table.setColumnOrder(view.columnOrder)
  table.setColumnPinning(view.columnPinning)
  table.setSorting(view.sorting ?? [])
  table.setColumnFilters(view.columnFilters ?? [])

  const grouping = view.grouping ?? []

  table.setGrouping(grouping)

  if (grouping.length > 0) {
    table.setExpanded(true)
  }

  if (view.rowHeight) {
    table.options.meta?.onRowHeightChange?.(view.rowHeight as RowHeightValue)
  }

  if (view.displayMode) {
    table.options.meta?.onDisplayModeChange?.(
      view.displayMode as DataGridDisplayMode,
    )
  }

  /*
   * Pagination: only partition rows when the view explicitly enables
   * paging in `standard` mode. In every other case (no paging, or
   * virtual-scroll) we want every loaded row to land in the virtualized
   * viewport, so we use a very large page size as a "disable" signal.
   * Always reset to page 0 on view switch.
   */
  const usesStandardPaging =
    view.pagingEnabled === true &&
    (view.pagingMode ?? 'virtual-scroll') === 'standard'

  table.setPagination({
    pageIndex: 0,
    pageSize: usesStandardPaging
      ? (view.pageSize ?? DATA_GRID_DEFAULT_PAGE_SIZE)
      : Number.MAX_SAFE_INTEGER,
  })
}
