'use client'

import {
  Fragment,
  useCallback,
  useMemo,
  type ComponentProps,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react'

import { Inbox, Loader2, Plus, SearchX, X } from 'lucide-react'

import {
  ActionBar,
  ActionBarClose,
  ActionBarGroup,
  ActionBarSelection,
  ActionBarSeparator,
} from '@/components/ui/action-bar'

import { Button } from '@/components/ui/button'

import { useAsRef } from '@/hooks/use-as-ref'

import { cn } from '@/lib/utils'

import { useUiTranslation } from '@/lib/use-ui-translation'

import { type useDataGrid } from './hooks/use-data-grid'
import {
  type DataGridCardConfig,
  type DataGridPagingMode,
  type Direction,
} from './types'

import { DataGridChangeActionBar } from './data-grid-change-action-bar'
import { DataGridColumnHeader } from './data-grid-column-header'
import { DataGridContextMenu } from './data-grid-context-menu'
import { DataGridGallery } from './data-grid-gallery'
import { DataGridPaginationFooter } from './data-grid-pagination-footer'
import { DataGridPasteDialog } from './data-grid-paste-dialog'
import { DataGridRow } from './data-grid-row'
import { DataGridSearch } from './data-grid-search'

import {
  flexRender,
  getColumnBorderVisibility,
  getColumnPinningStyle,
} from './lib/data-grid'

const EMPTY_CELL_SELECTION_SET = new Set<string>()

export interface DataGridAction<TData> {
  /** Stable key for React reconciliation (defaults to `label`). */
  key?: string
  label: string
  icon?: ReactNode
  variant?: 'default' | 'destructive'
  /** Click handler. Ignored when `render` is supplied. */
  onAction?: (selectedRows: Array<TData>) => void
  /**
   * Custom renderer for when a simple `<Button>` isn't enough — e.g. an
   * Export action that opens a `<DropdownMenu>`. Receives the currently
   * selected rows so the renderer can wire up its own handlers.
   */
  render?: (selectedRows: Array<TData>) => ReactNode
}

interface DataGridProps<TData>
  extends
    Omit<ReturnType<typeof useDataGrid<TData>>, 'dir' | 'pagingMode'>,
    Omit<ComponentProps<'div'>, 'contextMenu'> {
  dir?: Direction
  height?: number | 'auto'
  stretchColumns?: boolean
  addRowLabel?: string
  actions?: Array<DataGridAction<TData>>
  cardConfig?: DataGridCardConfig<TData>
  /**
   * Row layout mode. When `'standard'`, the grid renders a paging footer
   * with prev/next/page-size controls. When `'virtual-scroll'` (default)
   * the grid behaves like before — all loaded rows in a single virtualized
   * viewport, no footer.
   *
   * Defaults to whatever `useDataGrid` returns (which itself reads from
   * `pagingMode` on its options or, in `useDocyrusDataGrid`, from the
   * active view's paging settings) — so spreading `{...gridProps}` flows
   * the correct value through automatically.
   */
  pagingMode?: DataGridPagingMode
  /**
   * True while a background refetch is in flight (e.g. the toolbar reload
   * button). Shows a translucent overlay + spinner over the grid body so
   * users get visual feedback that data is being reloaded without blowing
   * away the current rows. The initial-mount load uses the empty-state
   * skeleton instead.
   */
  isReloading?: boolean
}

export function DataGrid<TData>({
  dataGridRef,
  headerRef,
  rowMapRef,
  footerRef,
  dir = 'ltr',
  table,
  tableMeta,
  virtualTotalSize,
  virtualItems,
  measureElement,
  columns,
  columnSizeVars,
  searchState,
  searchMatchesByRow,
  activeSearchMatch,
  cellSelectionMap,
  focusedCell,
  editingCell,
  isFullSelection,
  rowHeight,
  displayMode,
  contextMenu,
  pasteDialog,
  onRowAdd: onRowAddProp,
  addRowLabel,
  height = 600,
  stretchColumns = false,
  adjustLayout = false,
  actions,
  cardConfig,
  rowColorMap,
  cellColorMap,
  changedCellsByRowId,
  changedRowCount = 0,
  onChangesSave,
  onChangesDiscard,
  changeMapRef,
  getRowLabel,
  pagingMode,
  isReloading = false,
  className,
  ...props
}: DataGridProps<TData>) {
  const { t } = useUiTranslation()
  const resolvedAddRowLabel = addRowLabel ?? t('ui.dataGrid.addRow', 'Add row')
  const { rows } = table.getRowModel()
  const readOnly = tableMeta?.readOnly ?? false
  const { columnVisibility } = table.getState()
  const { columnPinning } = table.getState()
  const { columnFilters } = table.getState()
  const hasActiveFilters =
    columnFilters.length > 0 || (searchState?.searchQuery?.length ?? 0) > 0
  const showEmptyState = rows.length === 0

  const onClearFilters = useCallback(() => {
    if (columnFilters.length > 0) table.resetColumnFilters()
    if (searchState?.searchQuery) searchState.onSearch('')
  }, [columnFilters.length, table, searchState])

  const { rowSelection } = table.getState()
  const selectedRowCount = Object.keys(rowSelection).length
  const showActionBar = !!actions && actions.length > 0 && selectedRowCount > 0

  const onActionBarOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        table.resetRowSelection()
      }
    },
    [table],
  )

  const selectedRows = useMemo(() => {
    if (!showActionBar) return []
    void rowSelection

    return table.getSelectedRowModel().rows.map((r) => r.original)
  }, [showActionBar, table, rowSelection])

  const onRowAddRef = useAsRef(onRowAddProp)

  const onRowAdd = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      onRowAddRef.current?.(event)
    },
    [onRowAddRef],
  )

  const onDataGridContextMenu = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      event.preventDefault()
    },
    [],
  )

  const onFooterCellKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (!onRowAddRef.current) return

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        onRowAddRef.current()
      }
    },
    [onRowAddRef],
  )

  return (
    <div
      data-slot="grid-wrapper"
      dir={dir}
      {...props}
      className={cn(
        'relative flex w-full flex-col',
        height === 'auto' && 'h-full',
        className,
      )}
    >
      {searchState && <DataGridSearch {...searchState} />}
      <DataGridContextMenu
        tableMeta={tableMeta}
        columns={columns}
        contextMenu={contextMenu}
      />
      <DataGridPasteDialog tableMeta={tableMeta} pasteDialog={pasteDialog} />
      {displayMode === 'gallery' ? (
        <DataGridGallery
          table={table}
          tableMeta={tableMeta}
          cardConfig={cardConfig}
          height={height}
        />
      ) : (
        <div
          role="grid"
          aria-label="Data grid"
          aria-rowcount={rows.length + (onRowAddProp ? 1 : 0)}
          aria-colcount={columns.length}
          data-slot="grid"
          tabIndex={0}
          ref={dataGridRef}
          className={cn(
            'relative flex flex-col select-none overflow-auto border focus:outline-none',
            /*
             * When the standard paging footer is rendered as a sibling we
             * drop the grid's bottom rounding + bottom border so the footer
             * can seamlessly continue the container, and only the footer
             * carries `rounded-b-md`.
             */
            pagingMode === 'standard'
              ? 'rounded-t-md border-b-0'
              : 'rounded-md',
          )}
          style={{
            ...columnSizeVars,
            ...(height === 'auto'
              ? { height: '100%' }
              : { maxHeight: `${height}px` }),
          }}
          onContextMenu={onDataGridContextMenu}
        >
          <div
            role="rowgroup"
            data-slot="grid-header"
            ref={headerRef}
            className="sticky top-0 z-10 shrink-0 grid border-b bg-muted"
            style={{ minWidth: table.getTotalSize() }}
          >
            {table.getHeaderGroups().map((headerGroup, rowIndex) => (
              <div
                key={headerGroup.id}
                role="row"
                aria-rowindex={rowIndex + 1}
                data-slot="grid-header-row"
                tabIndex={-1}
                className="flex w-full"
              >
                {headerGroup.headers.map((header, colIndex) => {
                  const { sorting } = table.getState()
                  const currentSort = sorting.find(
                    (sort) => sort.id === header.column.id,
                  )
                  const isSortable = header.column.getCanSort()

                  const nextHeader = headerGroup.headers[colIndex + 1]
                  const isLastColumn =
                    colIndex === headerGroup.headers.length - 1

                  const { showEndBorder, showStartBorder } =
                    getColumnBorderVisibility({
                      column: header.column,
                      nextColumn: nextHeader?.column,
                      isLastColumn,
                    })

                  return (
                    <div
                      key={header.id}
                      role="columnheader"
                      aria-colindex={colIndex + 1}
                      aria-sort={
                        currentSort?.desc === false
                          ? 'ascending'
                          : currentSort?.desc === true
                            ? 'descending'
                            : isSortable
                              ? 'none'
                              : undefined
                      }
                      data-slot="grid-header-cell"
                      tabIndex={-1}
                      className={cn('relative', {
                        grow:
                          stretchColumns &&
                          header.column.id !== 'select' &&
                          header.column.id !== 'actions',
                        'border-e':
                          showEndBorder && header.column.id !== 'select',
                        'border-s':
                          showStartBorder && header.column.id !== 'select',
                      })}
                      style={{
                        ...getColumnPinningStyle({
                          column: header.column,
                          dir,
                          background: 'var(--muted)',
                        }),
                        width: `calc(var(--header-${header.id}-size) * 1px)`,
                      }}
                    >
                      {header.isPlaceholder ? null : typeof header.column
                          .columnDef.header === 'function' ? (
                        <div className="size-full px-3 py-1.5">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                        </div>
                      ) : (
                        <DataGridColumnHeader header={header} table={table} />
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
          <div
            role="rowgroup"
            data-slot="grid-body"
            className="relative shrink-0 grid"
            style={{
              height: `${virtualTotalSize}px`,
              minWidth: table.getTotalSize(),
              contain: adjustLayout ? 'layout paint' : 'strict',
            }}
          >
            {virtualItems.map((virtualItem) => {
              const row = rows[virtualItem.index]

              if (!row) return null

              const cellSelectionKeys =
                cellSelectionMap?.get(virtualItem.index) ??
                EMPTY_CELL_SELECTION_SET

              const searchMatchColumns =
                searchMatchesByRow?.get(virtualItem.index) ?? null
              const isActiveSearchRow =
                activeSearchMatch?.rowIndex === virtualItem.index

              const changedColumns = changedCellsByRowId?.get(row.id) ?? null

              const rowBgColor = rowColorMap?.get(row.id) ?? null
              const cellColorsByColumn = cellColorMap?.get(row.id) ?? null

              return (
                <DataGridRow
                  key={row.id}
                  row={row}
                  tableMeta={tableMeta}
                  rowMapRef={rowMapRef}
                  virtualItem={virtualItem}
                  measureElement={measureElement}
                  rowHeight={rowHeight}
                  columnVisibility={columnVisibility}
                  columnPinning={columnPinning}
                  focusedCell={focusedCell}
                  editingCell={editingCell}
                  cellSelectionKeys={cellSelectionKeys}
                  isFullSelection={isFullSelection}
                  searchMatchColumns={searchMatchColumns}
                  activeSearchMatch={
                    isActiveSearchRow ? activeSearchMatch : null
                  }
                  changedColumns={changedColumns}
                  rowBgColor={rowBgColor}
                  cellColorsByColumn={cellColorsByColumn}
                  dir={dir}
                  adjustLayout={adjustLayout}
                  stretchColumns={stretchColumns}
                  readOnly={readOnly}
                />
              )
            })}
          </div>
          {showEmptyState && (
            <div
              role="status"
              data-slot="grid-empty-state"
              className="sticky inset-x-0 flex flex-col items-center justify-center gap-3 px-6 py-12 text-center text-sm text-muted-foreground"
              style={{ left: 0, right: 0 }}
            >
              {hasActiveFilters ? (
                <>
                  <SearchX className="size-8 text-muted-foreground/60" />
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">
                      {t('ui.dataGrid.emptyFilteredTitle', 'No results found')}
                    </p>
                    <p>
                      {t(
                        'ui.dataGrid.emptyFilteredDescription',
                        "Try adjusting your filters or search to find what you're looking for.",
                      )}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={onClearFilters}>
                    {t('ui.dataGrid.clearFilters', 'Clear filters')}
                  </Button>
                </>
              ) : (
                <>
                  <Inbox className="size-8 text-muted-foreground/60" />
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">
                      {t('ui.dataGrid.emptyTitle', 'No data')}
                    </p>
                    <p>
                      {t(
                        'ui.dataGrid.emptyDescription',
                        'There are no records to display.',
                      )}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
          {!readOnly && onRowAddProp && (
            <div
              role="rowgroup"
              data-slot="grid-footer"
              ref={footerRef}
              className="sticky bottom-0 z-10 shrink-0 grid border-t bg-muted"
              style={{ minWidth: table.getTotalSize() }}
            >
              <div
                role="row"
                aria-rowindex={rows.length + 2}
                data-slot="grid-add-row"
                tabIndex={-1}
                className="flex w-full"
              >
                <div
                  role="gridcell"
                  tabIndex={0}
                  className="relative flex h-9 grow items-center transition-colors hover:bg-accent/40 focus:bg-accent/40 focus:outline-none"
                  style={{
                    width: table.getTotalSize(),
                    minWidth: table.getTotalSize(),
                  }}
                  onClick={onRowAdd}
                  onKeyDown={onFooterCellKeyDown}
                >
                  <div className="sticky inset-s-0 flex items-center gap-2 px-3 text-muted-foreground">
                    <Plus className="size-3.5" />
                    <span className="text-sm">{resolvedAddRowLabel}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {showActionBar && (
        <ActionBar open onOpenChange={onActionBarOpenChange} data-grid-popover>
          <ActionBarSelection>
            {selectedRowCount} selected
            <ActionBarSeparator />
            <ActionBarClose>
              <X />
            </ActionBarClose>
          </ActionBarSelection>
          <ActionBarSeparator />
          <ActionBarGroup>
            {actions.map((action) => {
              const key = action.key ?? action.label

              if (action.render) {
                return (
                  <Fragment key={key}>{action.render(selectedRows)}</Fragment>
                )
              }

              return (
                <Button
                  key={key}
                  variant={
                    action.variant === 'destructive'
                      ? 'destructive'
                      : 'secondary'
                  }
                  size="sm"
                  onClick={() => action.onAction?.(selectedRows)}
                >
                  {action.icon}
                  {action.label}
                </Button>
              )
            })}
          </ActionBarGroup>
        </ActionBar>
      )}
      {changedRowCount > 0 &&
        onChangesSave &&
        onChangesDiscard &&
        changeMapRef && (
          <DataGridChangeActionBar
            changedRowCount={changedRowCount}
            changeMapRef={changeMapRef}
            table={table}
            onSave={onChangesSave}
            onDiscard={onChangesDiscard}
            sideOffset={showActionBar ? 72 : 16}
            getRowLabel={getRowLabel}
          />
        )}
      {pagingMode === 'standard' && <DataGridPaginationFooter table={table} />}
      {isReloading && (
        <div
          aria-hidden
          data-slot="grid-reload-overlay"
          /*
           * `absolute inset-0` overlays the whole grid-wrapper (search bar +
           * body) — the toolbar lives outside `<DataGrid>` so it's not
           * covered. Pointer events are blocked so users can't interact
           * with stale rows mid-fetch.
           */
          className="absolute inset-0 z-30 flex items-center justify-center rounded-md bg-background/55 backdrop-blur-[1px]"
        >
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  )
}
