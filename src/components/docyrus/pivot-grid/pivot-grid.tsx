'use client';

import {
  useMemo,
  type CSSProperties
} from 'react';

import { type Column } from '@tanstack/react-table';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  Maximize2,
  MoreHorizontal,
  PinIcon,
  PinOffIcon
} from 'lucide-react';

import {
  AwesomeDialog,
  AwesomeDialogBody,
  AwesomeDialogHeader
} from '@/components/docyrus/awesome-dialog';
import {
  DataGrid,
  useDataGrid,
  type ColumnDef as DataGridColumnDef
} from '@/components/docyrus/data-grid';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import {
  getColumnBorderVisibility,
  getColumnPinningStyle
} from '@/components/docyrus/data-grid/lib/data-grid';

import { usePivotGrid } from './hooks/use-pivot-grid';

import {
  type PivotGridController,
  type PivotGridHeaderCell,
  type PivotGridProps,
  type PivotGridRenderedCell,
  type PivotGridRenderedRow
} from './types';

const HEADER_ROW_HEIGHT = 40;
const EMPTY_DRILLDOWN_COLUMNS: Array<DataGridColumnDef<Record<string, string>>> = [
  {
    id: '__empty__',
    accessorFn: () => 'No rows',
    header: 'No rows',
    meta: {
      label: 'No rows',
      cell: { variant: 'short-text' }
    }
  }
];

function getMergedHeaderWidth<TData>(
  columns: Array<Column<PivotGridRenderedRow<TData>>>
): number {
  return columns.reduce((width, column) => width + column.getSize(), 0);
}

function getMergedHeaderPinningStyle<TData>(params: {
  columns: Array<Column<PivotGridRenderedRow<TData>>>;
  background?: string;
}): CSSProperties {
  const { columns, background = 'var(--muted)' } = params;

  if (columns.length === 0) {
    return {};
  }

  const pinnedValues = Array.from(
    new Set(columns.map(column => column.getIsPinned()).filter(Boolean))
  );

  if (pinnedValues.length !== 1) {
    return {
      width: getMergedHeaderWidth(columns)
    };
  }

  const pinned = pinnedValues[0];
  const firstColumn = columns[0];
  const lastColumn = columns[columns.length - 1];

  if (!firstColumn || !lastColumn || !pinned) {
    return {
      width: getMergedHeaderWidth(columns)
    };
  }

  return {
    position: 'sticky',
    left: pinned === 'left' ? `${firstColumn.getStart('left')}px` : undefined,
    right: pinned === 'right' ? `${lastColumn.getAfter('right')}px` : undefined,
    width: getMergedHeaderWidth(columns),
    background,
    zIndex: 3,
    opacity: 0.98,
    boxShadow:
      pinned === 'left' && lastColumn.getIsLastColumn('left') ? '-4px 0 4px -4px var(--border) inset' : pinned === 'right' && firstColumn.getIsFirstColumn('right') ? '4px 0 4px -4px var(--border) inset' : undefined
  };
}

function getDrilldownColumns<TData>(
  controller: PivotGridController<TData>,
  rows: Array<TData>
): Array<DataGridColumnDef<TData | Record<string, string>>> {
  if (controller.drilldownColumns && controller.drilldownColumns.length > 0) {
    return controller.drilldownColumns as Array<DataGridColumnDef<TData | Record<string, string>>>;
  }

  if (rows.length === 0) {
    return EMPTY_DRILLDOWN_COLUMNS as Array<DataGridColumnDef<TData | Record<string, string>>>;
  }

  return [];
}

interface PivotGridViewProps<TData> {
  controller: PivotGridController<TData>;
}

function PivotGridDrilldownDialog<TData>({
  controller
}: {
  controller: PivotGridController<TData>;
}) {
  const drilldownRows = controller.drilldownState.cell ? controller.getDrilldownRows(controller.drilldownState.cell) : [];
  const drilldownColumns = getDrilldownColumns(controller, drilldownRows);
  const { table: drilldownTable, ...drilldownGridProps } = useDataGrid({
    data: drilldownRows.length > 0 ? drilldownRows : [{ __empty__: 'No rows' }] as Array<TData | Record<string, string>>,
    columns: drilldownColumns,
    readOnly: true,
    enableGrouping: false,
    enableSearch: false
  });

  return (
    <AwesomeDialog
      open={controller.drilldownState.open}
      onOpenChange={(open) => {
        if (!open) {
          controller.closeDrilldown();
        }
      }}
      container="modal"
      size="xl"
      resizable
      fullscreenable>
      <AwesomeDialogHeader
        title={controller.drilldownState.cell ? controller.getDrilldownTitle(controller.drilldownState.cell) : 'Drilldown'}
        description={controller.drilldownState.cell ? `${controller.drilldownState.cell.rawRowCount} contributing row(s)` : undefined} />
      <AwesomeDialogBody className="space-y-4">
        <TooltipProvider>
          <DataGrid
            table={drilldownTable}
            {...drilldownGridProps}
            height={420}
            stretchColumns />
        </TooltipProvider>
      </AwesomeDialogBody>
    </AwesomeDialog>
  );
}

function PivotGridColumnMenu<TData>({
  controller,
  headerCell
}: {
  controller: PivotGridController<TData>;
  headerCell: PivotGridHeaderCell;
}) {
  if (headerCell.columnIds.length === 0) {
    return null;
  }

  const pinnedPosition = headerCell.pinPosition;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          className="opacity-0 group-hover/header-cell:opacity-100">
          <MoreHorizontal className="size-3" />
          <span className="sr-only">Column actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem
          onSelect={() => controller.pinColumns(headerCell.columnIds, 'left')}>
          <PinIcon className="size-4" />
          Pin left
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => controller.pinColumns(headerCell.columnIds, 'right')}>
          <PinIcon className="size-4" />
          Pin right
        </DropdownMenuItem>
        {pinnedPosition ? (
          <DropdownMenuItem
            onSelect={() => controller.unpinColumns(headerCell.columnIds)}>
            <PinOffIcon className="size-4" />
            Unpin
          </DropdownMenuItem>
        ) : null}
        {headerCell.groupNodeId && headerCell.canCollapse ? (
          <DropdownMenuItem
            onSelect={() => {
              if (headerCell.groupNodeId) {
                controller.toggleColumn(headerCell.groupNodeId);
              }
            }}>
            {headerCell.isExpanded ? (
              <ChevronDownIcon className="size-4" />
            ) : (
              <ChevronRightIcon className="size-4" />
            )}
            {headerCell.isExpanded ? 'Collapse group' : 'Expand group'}
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PivotGridHeader<TData>({ controller }: PivotGridViewProps<TData>) {
  const rowHeaderColumns = controller.rowHeaderColumnIds
    .map(columnId => controller.table.getColumn(columnId))
    .filter((column): column is Column<PivotGridRenderedRow<TData>> => Boolean(column));
  const headerByColumnId = useMemo(
    () => new Map(
      controller.table.getFlatHeaders().map(header => [header.column.id, header])
    ),
    [controller.table]
  );

  return (
    <div
      role="rowgroup"
      className="sticky top-0 z-20 shrink-0 border-b bg-muted"
      style={{ minWidth: controller.table.getTotalSize() }}>
      {controller.headerRows.map((headerRow, level) => {
        const isBottomRow = level === controller.headerDepth - 1;

        return (
          <div
            key={headerRow.id}
            role="row"
            className="flex w-full"
            style={{ height: HEADER_ROW_HEIGHT }}>
            {rowHeaderColumns.map((column, index) => {
              const nextColumn = rowHeaderColumns[index + 1];
              const { showEndBorder } = getColumnBorderVisibility({
                column,
                nextColumn,
                isLastColumn: index === rowHeaderColumns.length - 1
              });
              const header = headerByColumnId.get(column.id);

              return (
                <div
                  key={`${column.id}-${level}`}
                  role="columnheader"
                  className={cn(
                    'group/header-cell relative flex shrink-0 items-center border-border px-3 text-sm font-medium text-foreground',
                    showEndBorder && 'border-e'
                  )}
                  style={{
                    ...getColumnPinningStyle({
                      column,
                      background: 'var(--muted)'
                    }),
                    width: column.getSize()
                  }}>
                  <span className="truncate">
                    {level === 0 ? String(column.columnDef.header ?? '') : ''}
                  </span>
                  {isBottomRow && header ? (
                    <div
                      role="separator"
                      aria-orientation="vertical"
                      aria-label={`Resize ${String(column.columnDef.header ?? '')} column`}
                      tabIndex={0}
                      className={cn(
                        "absolute -right-px top-0 z-30 h-full w-0.5 cursor-ew-resize bg-border opacity-0 transition-opacity hover:opacity-100 after:absolute after:inset-y-0 after:left-1/2 after:w-[18px] after:-translate-x-1/2 after:content-['']",
                        column.getIsResizing() && 'bg-primary opacity-100'
                      )}
                      onDoubleClick={() => column.resetSize()}
                      onMouseDown={header.getResizeHandler()}
                      onTouchStart={header.getResizeHandler()} />
                  ) : null}
                </div>
              );
            })}
            {headerRow.cells.map((cell, cellIndex) => {
              const leafColumns = cell.columnIds
                .map(columnId => controller.table.getColumn(columnId))
                .filter((column): column is Column<PivotGridRenderedRow<TData>> => Boolean(column));
              const firstColumn = leafColumns[0];
              const lastColumn = leafColumns[leafColumns.length - 1];
              const nextLeafId = headerRow.cells[cellIndex + 1]?.columnIds[0];
              const nextLeafColumn = nextLeafId ? controller.table.getColumn(nextLeafId) : undefined;
              const firstHeader = firstColumn ? headerByColumnId.get(firstColumn.id) : undefined;
              const showEndBorder = lastColumn ? getColumnBorderVisibility({
                column: lastColumn,
                nextColumn: nextLeafColumn,
                isLastColumn: nextLeafColumn === undefined
              }).showEndBorder : true;

              return (
                <div
                  key={cell.key}
                  role="columnheader"
                  className={cn(
                    'group/header-cell relative flex shrink-0 items-center gap-2 border-border px-3 text-sm font-medium text-foreground',
                    showEndBorder && 'border-e'
                  )}
                  style={getMergedHeaderPinningStyle({
                    columns: leafColumns,
                    background: 'var(--muted)'
                  })}>
                  {cell.groupNodeId && cell.canCollapse ? (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="shrink-0"
                      onClick={() => {
                        if (cell.groupNodeId) {
                          controller.toggleColumn(cell.groupNodeId);
                        }
                      }}>
                      {cell.isExpanded ? (
                        <ChevronDownIcon className="size-3.5" />
                      ) : (
                        <ChevronRightIcon className="size-3.5" />
                      )}
                      <span className="sr-only">
                        {cell.isExpanded ? 'Collapse column group' : 'Expand column group'}
                      </span>
                    </Button>
                  ) : null}
                  <span className="truncate">{cell.label}</span>
                  <PivotGridColumnMenu controller={controller} headerCell={cell} />
                  {isBottomRow && leafColumns.length === 1 && firstColumn && firstHeader ? (
                    <div
                      role="separator"
                      aria-orientation="vertical"
                      aria-label={`Resize ${cell.label || 'column'}`}
                      tabIndex={0}
                      className={cn(
                        "absolute -right-px top-0 z-30 h-full w-0.5 cursor-ew-resize bg-border opacity-0 transition-opacity hover:opacity-100 after:absolute after:inset-y-0 after:left-1/2 after:w-[18px] after:-translate-x-1/2 after:content-['']",
                        firstColumn.getIsResizing() && 'bg-primary opacity-100'
                      )}
                      onDoubleClick={() => firstColumn.resetSize()}
                      onMouseDown={firstHeader.getResizeHandler()}
                      onTouchStart={firstHeader.getResizeHandler()} />
                  ) : null}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function PivotGridRowHeaderCell<TData>({
  controller,
  row,
  columnIndex
}: {
  controller: PivotGridController<TData>;
  row: PivotGridRenderedRow<TData>;
  columnIndex: number;
}) {
  const headerCell = row.headerCells[columnIndex];

  if (!headerCell) {
    return <span />;
  }

  const summaryClassName = row.kind === 'grand-total' ? 'font-semibold text-foreground' : row.kind === 'subtotal' ? 'font-medium text-foreground' : row.kind === 'group' ? 'font-medium text-foreground' : 'text-foreground';

  return (
    <div className="flex min-w-0 items-center gap-2">
      {headerCell.canToggle && headerCell.groupNodeId ? (
        <Button
          variant="ghost"
          size="icon-xs"
          className="shrink-0"
          onClick={() => {
            if (headerCell.groupNodeId) {
              controller.toggleRow(headerCell.groupNodeId);
            }
          }}>
          {headerCell.isExpanded ? (
            <ChevronDownIcon className="size-3.5" />
          ) : (
            <ChevronRightIcon className="size-3.5" />
          )}
          <span className="sr-only">
            {headerCell.isExpanded ? 'Collapse row group' : 'Expand row group'}
          </span>
        </Button>
      ) : (
        <span className="inline-block size-6 shrink-0" />
      )}
      <span className={cn('truncate', summaryClassName)}>{headerCell.label}</span>
      {row.kind === 'group' && headerCell.isCurrentDepth ? (
        <span className="shrink-0 text-muted-foreground text-xs">
          ({row.rawRowCount})
        </span>
      ) : null}
    </div>
  );
}

function PivotGridValueCell<TData>({
  controller,
  row,
  cell,
  isLastColumn
}: {
  controller: PivotGridController<TData>;
  row: PivotGridRenderedRow<TData>;
  cell: PivotGridRenderedCell<TData> | undefined;
  isLastColumn: boolean;
}) {
  const colorRule = cell ? controller.cellColorMap.get(cell.id) : undefined;
  const backgroundStyle = colorRule ? { backgroundColor: colorRule } : undefined;
  const isSummary = row.kind === 'subtotal' || row.kind === 'grand-total';
  const content = cell?.formattedValue ?? '';

  return (
    <div
      className={cn(
        'group/value-cell flex h-full items-center justify-end gap-2 px-3 text-sm',
        !isLastColumn && 'border-e',
        row.kind === 'group' && 'bg-muted/25',
        row.kind === 'subtotal' && 'bg-muted/10 font-medium',
        row.kind === 'grand-total' && 'bg-muted font-semibold'
      )}
      style={backgroundStyle}>
      <span className={cn(
        'truncate text-right',
        isSummary && 'font-medium'
      )}>
        {content}
      </span>
      {cell ? (
        <Button
          variant="ghost"
          size="icon-xs"
          className="shrink-0 opacity-0 group-hover/value-cell:opacity-100"
          onClick={() => controller.openDrilldown(cell)}>
          <Maximize2 className="size-3" />
          <span className="sr-only">Open drilldown</span>
        </Button>
      ) : null}
    </div>
  );
}

export function PivotGridView<TData>({ controller }: PivotGridViewProps<TData>) {
  const rowHeaderColumns = controller.rowHeaderColumnIds
    .map(columnId => controller.table.getColumn(columnId))
    .filter((column): column is Column<PivotGridRenderedRow<TData>> => Boolean(column));
  const valueColumns = controller.valueColumnIds
    .map(columnId => controller.table.getColumn(columnId))
    .filter((column): column is Column<PivotGridRenderedRow<TData>> => Boolean(column));

  return (
    <>
      <div
        className={cn(
          'relative flex w-full flex-col',
          controller.className
        )}>
        <div
          ref={controller.dataGridRef}
          role="grid"
          aria-label="Pivot grid"
          className={cn(
            'relative overflow-auto rounded-md border',
            controller.height === 'auto' && 'h-full'
          )}
          style={{
            ...(controller.height === 'auto' ? { height: '100%' } : { maxHeight: `${controller.height}px` })
          }}>
          <PivotGridHeader controller={controller} />
          <div
            role="rowgroup"
            className="relative"
            style={{
              minWidth: controller.table.getTotalSize(),
              height: controller.virtualTotalSize
            }}>
            {controller.virtualItems.map((virtualItem) => {
              const row = controller.visibleRows[virtualItem.index];

              if (!row) {
                return null;
              }

              return (
                <div
                  key={row.id}
                  role="row"
                  className="absolute inset-x-0 flex"
                  style={{
                    height: virtualItem.size,
                    transform: `translateY(${virtualItem.start}px)`
                  }}>
                  {rowHeaderColumns.map((column, columnIndex) => {
                    const nextColumn = rowHeaderColumns[columnIndex + 1];
                    const { showEndBorder } = getColumnBorderVisibility({
                      column,
                      nextColumn,
                      isLastColumn: columnIndex === rowHeaderColumns.length - 1
                    });

                    return (
                      <div
                        key={`${row.id}:${column.id}`}
                        role="rowheader"
                        className={cn(
                          'flex shrink-0 items-center border-b border-border px-3 text-sm',
                          showEndBorder && 'border-e',
                          row.kind === 'group' && 'bg-muted/25',
                          row.kind === 'subtotal' && 'bg-muted/10',
                          row.kind === 'grand-total' && 'bg-muted'
                        )}
                        style={{
                          ...getColumnPinningStyle({
                            column,
                            background:
                              row.kind === 'grand-total' ? 'var(--muted)' : row.kind === 'subtotal' ? 'color-mix(in oklab, var(--muted) 35%, white)' : row.kind === 'group' ? 'color-mix(in oklab, var(--muted) 55%, white)' : 'var(--background)'
                          }),
                          width: column.getSize()
                        }}>
                        <PivotGridRowHeaderCell
                          controller={controller}
                          row={row}
                          columnIndex={columnIndex} />
                      </div>
                    );
                  })}
                  {valueColumns.map((column, columnIndex) => (
                    <div
                      key={`${row.id}:${column.id}`}
                      role="gridcell"
                      className="shrink-0 border-b border-border"
                      style={{
                        ...getColumnPinningStyle({
                          column,
                          background:
                            row.kind === 'grand-total' ? 'var(--muted)' : row.kind === 'subtotal' ? 'color-mix(in oklab, var(--muted) 35%, white)' : row.kind === 'group' ? 'color-mix(in oklab, var(--muted) 55%, white)' : 'var(--background)'
                        }),
                        width: column.getSize()
                      }}>
                      <PivotGridValueCell
                        controller={controller}
                        row={row}
                        cell={row.cellMap.get(column.id)}
                        isLastColumn={columnIndex === valueColumns.length - 1} />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {controller.drilldownState.open && (
        <PivotGridDrilldownDialog controller={controller} />
      )}
    </>
  );
}

export function PivotGrid<TData>(props: PivotGridProps<TData>) {
  const controller = usePivotGrid(props);

  return <PivotGridView controller={controller} />;
}