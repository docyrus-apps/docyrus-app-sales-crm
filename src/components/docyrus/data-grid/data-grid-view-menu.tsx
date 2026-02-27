'use client';

import {
  useCallback, useEffect, useMemo, useState, type ComponentProps
} from 'react';

import {
  type Column,
  type ColumnFiltersState,
  type ColumnPinningState,
  type SortingState,
  type Table
} from '@tanstack/react-table';

import {
  Check, GripVertical, RotateCcw, Settings2, Trash2
} from 'lucide-react';

import { useDirection } from '@/components/ui/direction';

import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle
} from '@/components/ui/sortable';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import { type DataGridDisplayMode, type RowHeightValue } from './types';

interface SavedDataGridView {
  id: string;
  name: string;
  columnVisibility: Record<string, boolean>;
  columnOrder: Array<string>;
  columnPinning: ColumnPinningState;
  rowHeight?: RowHeightValue;
  displayMode?: DataGridDisplayMode;
  sorting?: SortingState;
  columnFilters?: ColumnFiltersState;
  grouping?: Array<string>;
}

interface DataGridViewMenuProps<TData> extends ComponentProps<
  typeof PopoverContent
> {
  table: Table<TData>;
  disabled?: boolean;
  storageKey?: string;
}

function isSavedDataGridView(value: unknown): value is SavedDataGridView {
  if (!value || typeof value !== 'object') return false;

  const item = value as Record<string, unknown>;

  return (
    typeof item.id === 'string'
    && typeof item.name === 'string'
    && Array.isArray(item.columnOrder)
    && item.columnOrder.every(columnId => typeof columnId === 'string')
    && item.columnVisibility !== null
    && typeof item.columnVisibility === 'object'
    && item.columnPinning !== null
    && typeof item.columnPinning === 'object'
    && (item.sorting === undefined
      || (Array.isArray(item.sorting)
        && item.sorting.every(
          sortRule => sortRule
            && typeof sortRule === 'object'
            && typeof sortRule.id === 'string'
            && typeof sortRule.desc === 'boolean'
        )))
        && (item.columnFilters === undefined
          || (Array.isArray(item.columnFilters)
            && item.columnFilters.every(
              filterRule => filterRule
                && typeof filterRule === 'object'
                && typeof filterRule.id === 'string'
            )))
            && (item.grouping === undefined
              || (Array.isArray(item.grouping)
                && item.grouping.every(columnId => typeof columnId === 'string')))
  );
}

function getColumnLabel<TData>(column: Column<TData, unknown>): string {
  const label = column.columnDef.meta?.label;

  if (label) return label;

  const { header } = column.columnDef;

  if (typeof header === 'string') return header;

  return column.id;
}

function getGeneratedViewId(): string {
  if (
    typeof crypto !== 'undefined'
    && typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }

  return `view-${Date.now()}`;
}

export function DataGridViewMenu<TData>({
  table,
  disabled,
  storageKey = 'default',
  className,
  ...props
}: DataGridViewMenuProps<TData>) {
  const dir = useDirection();
  const [open, setOpen] = useState(false);
  const [savedViews, setSavedViews] = useState<Array<SavedDataGridView>>(
    []
  );

  const localStorageKey = useMemo(() => {
    return `docyrus:data-grid:views:${storageKey}`;
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const raw = window.localStorage.getItem(localStorageKey);

      if (!raw) {
        setSavedViews([]);

        return;
      }

      const parsed = JSON.parse(raw) as unknown;

      if (!Array.isArray(parsed)) {
        setSavedViews([]);

        return;
      }

      setSavedViews(parsed.filter(isSavedDataGridView));
    } catch {
      setSavedViews([]);
    }
  }, [localStorageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(localStorageKey, JSON.stringify(savedViews));
    } catch {
    }
  }, [localStorageKey, savedViews]);

  const allLeafColumns = table.getAllLeafColumns();

  const managedColumns = useMemo(
    () => allLeafColumns.filter(
      column => typeof column.accessorFn !== 'undefined'
        && column.id !== 'select'
        && column.id !== 'actions'
    ),
    [allLeafColumns]
  );

  const effectiveColumnOrder = useMemo(() => {
    const { columnOrder } = table.getState();

    if (columnOrder.length > 0) {
      return columnOrder;
    }

    return allLeafColumns.map(column => column.id);
  }, [allLeafColumns, table]);

  const managedColumnsOrdered = useMemo(() => {
    const orderById = new Map(
      effectiveColumnOrder.map((columnId, index) => [columnId, index])
    );

    return [...managedColumns].sort((a, b) => {
      return (
        (orderById.get(a.id) ?? Number.MAX_SAFE_INTEGER)
        - (orderById.get(b.id) ?? Number.MAX_SAFE_INTEGER)
      );
    });
  }, [effectiveColumnOrder, managedColumns]);

  const onColumnsReorder = useCallback(
    (nextColumns: Array<Column<TData, unknown>>) => {
      const managedColumnIds = nextColumns.map(column => column.id);
      const managedColumnSet = new Set(managedColumnIds);

      let nextManagedIndex = 0;
      const nextOrder = effectiveColumnOrder.map((columnId) => {
        if (!managedColumnSet.has(columnId)) {
          return columnId;
        }

        const nextColumnId = managedColumnIds.at(nextManagedIndex);

        nextManagedIndex += 1;

        return nextColumnId ?? columnId;
      });

      for (const columnId of managedColumnIds) {
        if (!nextOrder.includes(columnId)) {
          nextOrder.push(columnId);
        }
      }

      table.setColumnOrder(nextOrder);
    },
    [effectiveColumnOrder, table]
  );

  const onColumnToggle = useCallback((column: Column<TData, unknown>) => {
    if (!column.getCanHide()) return;
    column.toggleVisibility(!column.getIsVisible());
  }, []);

  const getCurrentViewSnapshot = useCallback(() => {
    const state = table.getState();

    return {
      columnVisibility: { ...state.columnVisibility },
      columnOrder:
        state.columnOrder.length > 0
          ? [...state.columnOrder]
          : allLeafColumns.map(column => column.id),
      columnPinning: {
        left: [...(state.columnPinning.left ?? [])],
        right: [...(state.columnPinning.right ?? [])]
      },
      rowHeight: table.options.meta?.rowHeight,
      displayMode: table.options.meta?.displayMode,
      sorting: [...state.sorting],
      columnFilters: [...state.columnFilters],
      grouping: [...state.grouping]
    };
  }, [allLeafColumns, table]);

  const onSaveCurrentView = useCallback(() => {
    // eslint-disable-next-line no-alert
    const name = window.prompt('Save current view as:');
    const normalizedName = name?.trim();

    if (!normalizedName) return;

    const snapshot = getCurrentViewSnapshot();

    setSavedViews((currentViews) => {
      const existing = currentViews.find(
        view => view.name.toLowerCase() === normalizedName.toLowerCase()
      );

      const nextView: SavedDataGridView = {
        id: existing?.id ?? getGeneratedViewId(),
        name: normalizedName,
        ...snapshot
      };

      if (existing) {
        return currentViews.map(view => view.id === existing.id ? nextView : view);
      }

      return [nextView, ...currentViews];
    });
  }, [getCurrentViewSnapshot]);

  const onApplyView = useCallback(
    (view: SavedDataGridView) => {
      table.setColumnVisibility(view.columnVisibility);
      table.setColumnOrder(view.columnOrder);
      table.setColumnPinning(view.columnPinning);
      table.setSorting(view.sorting ?? []);
      table.setColumnFilters(view.columnFilters ?? []);
      table.setGrouping(view.grouping ?? []);

      if (view.rowHeight) {
        table.options.meta?.onRowHeightChange?.(view.rowHeight);
      }

      if (view.displayMode) {
        table.options.meta?.onDisplayModeChange?.(view.displayMode);
      }

      setOpen(false);
    },
    [table]
  );

  const onViewDelete = useCallback((viewId: string) => {
    setSavedViews(currentViews => currentViews.filter(view => view.id !== viewId));
  }, []);

  const onResetView = useCallback(() => {
    table.resetColumnVisibility();
    table.resetColumnOrder();
    table.resetColumnPinning();
    table.resetSorting();
    table.resetColumnFilters();
    table.resetGrouping();
    table.options.meta?.onRowHeightChange?.('short');
    table.options.meta?.onDisplayModeChange?.('table');
  }, [table]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          aria-label="Toggle columns"
          role="button"
          dir={dir}
          variant="outline"
          size="sm"
          className="h-8 font-normal"
          disabled={disabled}>
          <Settings2 className="text-muted-foreground" />
          View
        </Button>
      </PopoverTrigger>
      <PopoverContent
        dir={dir}
        className={cn('w-[360px] p-3', className)}
        {...props}>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="font-medium text-sm">Columns</p>
            <Button
              variant="outline"
              size="sm"
              className="h-7"
              onClick={onSaveCurrentView}
              disabled={disabled}>
              Save current
            </Button>
          </div>

          <Sortable
            value={managedColumnsOrdered}
            getItemValue={column => column.id}
            onValueChange={onColumnsReorder}
            orientation="vertical">
            <SortableContent className="max-h-[240px] space-y-1 overflow-y-auto">
              {managedColumnsOrdered.map((column) => {
                const isVisible = column.getIsVisible();
                const canHide = column.getCanHide();

                return (
                  <SortableItem key={column.id} value={column.id} asChild>
                    <div className="flex items-center gap-1 rounded-sm border px-1 py-0.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 min-w-0 flex-1 justify-start px-1.5"
                        onClick={() => onColumnToggle(column)}
                        disabled={!canHide}>
                        <Check
                          className={cn(
                            'size-4 shrink-0',
                            isVisible ? 'opacity-100' : 'opacity-0'
                          )} />
                        <span className="truncate text-sm">
                          {getColumnLabel(column)}
                        </span>
                      </Button>
                      <SortableItemHandle asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground"
                          aria-label={`Reorder ${getColumnLabel(column)} column`}>
                          <GripVertical className="size-4" />
                        </Button>
                      </SortableItemHandle>
                    </div>
                  </SortableItem>
                );
              })}
            </SortableContent>
          </Sortable>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7"
              onClick={onResetView}
              disabled={disabled}>
              <RotateCcw className="size-3.5" />
              Reset view
            </Button>
          </div>

          {savedViews.length > 0 && (
            <div className="flex flex-col gap-1.5 border-t pt-2">
              <p className="font-medium text-sm">Saved views</p>
              <div className="max-h-[160px] space-y-1 overflow-y-auto">
                {savedViews.map(view => (
                  <div
                    key={view.id}
                    className="flex items-center gap-1 rounded-sm border px-1 py-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 min-w-0 flex-1 justify-start px-1.5"
                      onClick={() => onApplyView(view)}>
                      <span className="truncate text-sm">{view.name}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-destructive"
                      onClick={() => onViewDelete(view.id)}
                      aria-label={`Delete ${view.name} view`}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}