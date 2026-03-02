'use client';

import {
  useCallback, useMemo, type ComponentProps, type KeyboardEvent, type MouseEvent, type ReactNode
} from 'react';

import { Plus, X } from 'lucide-react';

import {
  ActionBar,
  ActionBarClose,
  ActionBarGroup,
  ActionBarSelection,
  ActionBarSeparator
} from '@/components/ui/action-bar';

import { Button } from '@/components/ui/button';

import { useAsRef } from '@/hooks/use-as-ref';

import { cn } from '@/lib/utils';

import { type useDataGrid } from './hooks/use-data-grid';
import { type DataGridCardConfig, type Direction } from './types';

import { DataGridChangeActionBar } from './data-grid-change-action-bar';
import { DataGridColumnHeader } from './data-grid-column-header';
import { DataGridContextMenu } from './data-grid-context-menu';
import { DataGridGallery } from './data-grid-gallery';
import { DataGridPasteDialog } from './data-grid-paste-dialog';
import { DataGridRow } from './data-grid-row';
import { DataGridSearch } from './data-grid-search';

import {
  flexRender,
  getColumnBorderVisibility,
  getColumnPinningStyle
} from './lib/data-grid';

const EMPTY_CELL_SELECTION_SET = new Set<string>();

export interface DataGridAction<TData> {
  label: string;
  icon?: ReactNode;
  variant?: 'default' | 'destructive';
  onAction: (selectedRows: Array<TData>) => void;
}

interface DataGridProps<TData>
  extends
  Omit<ReturnType<typeof useDataGrid<TData>>, 'dir'>,
  Omit<ComponentProps<'div'>, 'contextMenu'> {
  dir?: Direction;
  height?: number | 'auto';
  stretchColumns?: boolean;
  addRowLabel?: string;
  actions?: Array<DataGridAction<TData>>;
  cardConfig?: DataGridCardConfig<TData>;
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
  addRowLabel = 'Add row',
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
  className,
  ...props
}: DataGridProps<TData>) {
  const { rows } = table.getRowModel();
  const readOnly = tableMeta?.readOnly ?? false;
  const { columnVisibility } = table.getState();
  const { columnPinning } = table.getState();

  const { rowSelection } = table.getState();
  const selectedRowCount = Object.keys(rowSelection).length;
  const showActionBar = !!actions && actions.length > 0 && selectedRowCount > 0;

  const onActionBarOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        table.resetRowSelection();
      }
    },
    [table]
  );

  const selectedRows = useMemo(() => {
    if (!showActionBar) return [];
    void rowSelection;

    return table.getSelectedRowModel().rows.map(r => r.original);
  }, [showActionBar, table, rowSelection]);

  const onRowAddRef = useAsRef(onRowAddProp);

  const onRowAdd = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      onRowAddRef.current?.(event);
    },
    [onRowAddRef]
  );

  const onDataGridContextMenu = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      event.preventDefault();
    },
    []
  );

  const onFooterCellKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (!onRowAddRef.current) return;

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onRowAddRef.current();
      }
    },
    [onRowAddRef]
  );

  return (
    <div
      data-slot="grid-wrapper"
      dir={dir}
      {...props}
      className={cn(
        'relative flex w-full flex-col',
        height === 'auto' && 'h-full',
        className
      )}>
      {searchState && <DataGridSearch {...searchState} />}
      <DataGridContextMenu
        tableMeta={tableMeta}
        columns={columns}
        contextMenu={contextMenu} />
      <DataGridPasteDialog tableMeta={tableMeta} pasteDialog={pasteDialog} />
      {displayMode === 'gallery' ? (
        <DataGridGallery
          table={table}
          tableMeta={tableMeta}
          cardConfig={cardConfig}
          height={height} />
      ) : (
        <div
          role="grid"
          aria-label="Data grid"
          aria-rowcount={rows.length + (onRowAddProp ? 1 : 0)}
          aria-colcount={columns.length}
          data-slot="grid"
          tabIndex={0}
          ref={dataGridRef}
          className="relative grid select-none overflow-auto rounded-md border focus:outline-none"
          style={{
            ...columnSizeVars,
            ...(height === 'auto'
              ? { height: '100%' }
              : { maxHeight: `${height}px` })
          }}
          onContextMenu={onDataGridContextMenu}>
          <div
            role="rowgroup"
            data-slot="grid-header"
            ref={headerRef}
            className="sticky top-0 z-10 grid border-b bg-muted">
            {table.getHeaderGroups().map((headerGroup, rowIndex) => (
              <div
                key={headerGroup.id}
                role="row"
                aria-rowindex={rowIndex + 1}
                data-slot="grid-header-row"
                tabIndex={-1}
                className="flex w-full">
                {headerGroup.headers.map((header, colIndex) => {
                  const { sorting } = table.getState();
                  const currentSort = sorting.find(
                    sort => sort.id === header.column.id
                  );
                  const isSortable = header.column.getCanSort();

                  const nextHeader = headerGroup.headers[colIndex + 1];
                  const isLastColumn = colIndex === headerGroup.headers.length - 1;

                  const { showEndBorder, showStartBorder }
                    = getColumnBorderVisibility({
                      column: header.column,
                      nextColumn: nextHeader?.column,
                      isLastColumn
                    });

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
                        grow: stretchColumns && header.column.id !== 'select',
                        'border-e':
                            showEndBorder && header.column.id !== 'select',
                        'border-s':
                            showStartBorder && header.column.id !== 'select'
                      })}
                      style={{
                        ...getColumnPinningStyle({ column: header.column, dir }),
                        width: `calc(var(--header-${header.id}-size) * 1px)`
                      }}>
                      {header.isPlaceholder ? null : typeof header.column
                        .columnDef.header === 'function' ? (
                            <div className="size-full px-3 py-1.5">
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                            </div>
                          ) : (
                            <DataGridColumnHeader header={header} table={table} />
                          )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div
            role="rowgroup"
            data-slot="grid-body"
            className="relative grid"
            style={{
              height: `${virtualTotalSize}px`,
              contain: adjustLayout ? 'layout paint' : 'strict'
            }}>
            {virtualItems.map((virtualItem) => {
              const row = rows[virtualItem.index];

              if (!row) return null;

              const cellSelectionKeys
                = cellSelectionMap?.get(virtualItem.index)
                  ?? EMPTY_CELL_SELECTION_SET;

              const searchMatchColumns
                = searchMatchesByRow?.get(virtualItem.index) ?? null;
              const isActiveSearchRow
                = activeSearchMatch?.rowIndex === virtualItem.index;

              const changedColumns
                = changedCellsByRowId?.get(row.id) ?? null;

              const rowBgColor = rowColorMap?.get(row.id) ?? null;
              const cellColorsByColumn = cellColorMap?.get(row.id) ?? null;

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
                  activeSearchMatch={isActiveSearchRow ? activeSearchMatch : null}
                  changedColumns={changedColumns}
                  rowBgColor={rowBgColor}
                  cellColorsByColumn={cellColorsByColumn}
                  dir={dir}
                  adjustLayout={adjustLayout}
                  stretchColumns={stretchColumns}
                  readOnly={readOnly} />
              );
            })}
          </div>
          {!readOnly && onRowAdd && (
            <div
              role="rowgroup"
              data-slot="grid-footer"
              ref={footerRef}
              className="sticky bottom-0 z-10 grid border-t bg-muted">
              <div
                role="row"
                aria-rowindex={rows.length + 2}
                data-slot="grid-add-row"
                tabIndex={-1}
                className="flex w-full">
                <div
                  role="gridcell"
                  tabIndex={0}
                  className="relative flex h-9 grow items-center transition-colors hover:bg-accent/40 focus:bg-accent/40 focus:outline-none"
                  style={{
                    width: table.getTotalSize(),
                    minWidth: table.getTotalSize()
                  }}
                  onClick={onRowAdd}
                  onKeyDown={onFooterCellKeyDown}>
                  <div className="sticky inset-s-0 flex items-center gap-2 px-3 text-muted-foreground">
                    <Plus className="size-3.5" />
                    <span className="text-sm">{addRowLabel}</span>
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
            {actions.map(action => (
              <Button
                key={action.label}
                variant={action.variant === 'destructive' ? 'destructive' : 'secondary'}
                size="sm"
                onClick={() => action.onAction(selectedRows)}>
                {action.icon}
                {action.label}
              </Button>
            ))}
          </ActionBarGroup>
        </ActionBar>
      )}
      {changedRowCount > 0
        && onChangesSave
        && onChangesDiscard
        && changeMapRef && (
        <DataGridChangeActionBar
          changedRowCount={changedRowCount}
          changeMapRef={changeMapRef}
          table={table}
          onSave={onChangesSave}
          onDiscard={onChangesDiscard}
          sideOffset={showActionBar ? 72 : 16}
          getRowLabel={getRowLabel} />
      )}
    </div>
  );
}