import {
  useCallback, useEffect, useMemo, useRef, useSyncExternalStore, type MouseEvent
} from 'react';

import {
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { toast } from 'sonner';

import { type Virtualizer } from '@tanstack/react-virtual';
import {
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
  type RowSelectionState,
  type SortingState,
  type TableMeta,
  type TableOptions,
  type TableState,
  type Updater
} from '@tanstack/react-table';

import { useDirection } from '@/components/ui/direction';

import { useAsRef } from '@/hooks/use-as-ref';
import { useIsomorphicLayoutEffect } from '@/hooks/use-isomorphic-layout-effect';
import { useLazyRef } from '@/hooks/use-lazy-ref';

import {
  type CellChange,
  type CellPosition,
  type CellUpdate,
  type ContextMenuState,
  type DataGridDisplayMode,
  type Direction,
  type FileCellData,
  type NavigationDirection,
  type PasteDialogState,
  type RowChange,
  type RowHeightValue,
  type SearchState,
  type SelectionState
} from '../types';
import {
  getCellKey,
  getEmptyCellValue,
  getIsFileCellData,
  getIsInPopover,
  getRowHeightValue,
  getScrollDirection,
  matchSelectOption,
  parseCellKey,
  scrollCellIntoView
} from '../lib/data-grid';
import { getFilterFn } from '../lib/data-grid-filters';
import {
  getGroupableCellVariant,
  normalizeGroupingValue
} from '../lib/data-grid-grouping';

const DEFAULT_ROW_HEIGHT = 'short';
const DEFAULT_DISPLAY_MODE: DataGridDisplayMode = 'table';
const OVERSCAN = 4;
const VIEWPORT_OFFSET = 1;
const HORIZONTAL_PAGE_SIZE = 5;
const SCROLL_SYNC_RETRY_COUNT = 16;
const MIN_COLUMN_SIZE = 60;
const MAX_COLUMN_SIZE = 800;
const DEFAULT_MAX_SELECT_CELLS = 20000;
const DEFAULT_MAX_SEARCH_MATCHES = 500;
const SEARCH_SHORTCUT_KEY = 'f';
const NON_NAVIGABLE_COLUMN_IDS = new Set(['select', 'actions']);

const DOMAIN_REGEX = /^[\w.-]+\.[a-z]{2,}(\/\S*)?$/i;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}.*)?$/;
const TRUTHY_BOOLEANS = new Set([
  'true',
  '1',
  'yes',
  'checked'
]);
const VALID_BOOLEANS = new Set([
  'true',
  'false',
  '1',
  '0',
  'yes',
  'no',
  'checked',
  'unchecked'
]);

interface DataGridState {
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  rowHeight: RowHeightValue;
  displayMode: DataGridDisplayMode;
  rowSelection: RowSelectionState;
  selectionState: SelectionState;
  focusedCell: CellPosition | null;
  editingCell: CellPosition | null;
  cutCells: Set<string>;
  contextMenu: ContextMenuState;
  searchQuery: string;
  searchMatches: Array<CellPosition>;
  matchIndex: number;
  searchOpen: boolean;
  lastClickedRowIndex: number | null;
  pasteDialog: PasteDialogState;
  changedCellsByRowId: Map<string, Set<string>>;
}

interface DataGridStore {
  subscribe: (callback: () => void) => () => void;
  getState: () => DataGridState;
  setState: <TKey extends keyof DataGridState>(
    key: TKey,
    value: DataGridState[TKey]
  ) => void;
  notify: () => void;
  batch: (fn: () => void) => void;
}

function useStore<T>(
  store: DataGridStore,
  selector: (state: DataGridState) => T
): T {
  const getSnapshot = useCallback(
    () => selector(store.getState()),
    [store, selector]
  );

  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}

interface UseDataGridProps<TData> extends Omit<
  TableOptions<TData>,
  'pageCount' | 'getCoreRowModel'
> {
  onDataChange?: (data: Array<TData>) => void;
  onRowAdd?: (
    event?: MouseEvent<HTMLDivElement>
  ) => Partial<CellPosition> | Promise<Partial<CellPosition> | null> | null;
  onRowsAdd?: (count: number) => void | Promise<void>;
  onRowsDelete?: (
    rows: Array<TData>,
    rowIndices: Array<number>
  ) => void | Promise<void>;
  onPaste?: (updates: Array<CellUpdate>) => void | Promise<void>;
  onFilesUpload?: (params: {
    files: Array<File>;
    rowIndex: number;
    columnId: string;
  }) => Promise<Array<FileCellData>>;
  onFilesDelete?: (params: {
    fileIds: Array<string>;
    rowIndex: number;
    columnId: string;
  }) => void | Promise<void>;
  rowHeight?: RowHeightValue;
  onRowHeightChange?: (rowHeight: RowHeightValue) => void;
  displayMode?: DataGridDisplayMode;
  onDisplayModeChange?: (displayMode: DataGridDisplayMode) => void;
  overscan?: number;
  /**
   * Enable dynamic row height measurement.
   * Only turn on when rows truly vary in height;
   * it triggers layout reads per row and can hurt performance on large sets.
   */
  measureRows?: boolean;
  dir?: Direction;
  autoFocus?: boolean | Partial<CellPosition>;
  enableSingleCellSelection?: boolean;
  enableColumnSelection?: boolean;
  enableSearch?: boolean;
  enablePaste?: boolean;
  enableGrouping?: boolean;
  readOnly?: boolean;
  enableChangeTracking?: boolean;
  onChangesSave?: (
    changes: Array<RowChange>,
    data: Array<TData>
  ) => void | Promise<void>;
  onChangesDiscard?: () => void;
  getRowLabel?: (row: TData, rowIndex: number) => string;
  /** Seçimde hücre üst limiti; yüksek değerler bellek kullanımını artırır. */
  maxSelectCells?: number;
  /** Arama eşleşmesi üst limiti; büyük tabloda CPU yükünü kontrol eder. */
  maxSearchMatches?: number;
}

interface ChangeMapEntry<TData> {
  originalRow: TData;
  dataIndex: number;
  changes: Map<string, { originalValue: unknown; newValue: unknown }>;
}

function useDataGrid<TData>({
  data,
  columns,
  rowHeight: rowHeightProp = DEFAULT_ROW_HEIGHT,
  displayMode: displayModeProp = DEFAULT_DISPLAY_MODE,
  overscan = OVERSCAN,
  measureRows = false,
  dir: dirProp,
  enableGrouping = true,
  initialState,
  maxSelectCells = DEFAULT_MAX_SELECT_CELLS,
  maxSearchMatches = DEFAULT_MAX_SEARCH_MATCHES,
  ...props
}: UseDataGridProps<TData>) {
  const dir = useDirection(dirProp);
  const dataGridRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<ReturnType<typeof useReactTable<TData>>>(null);
  const rowVirtualizerRef
    = useRef<Virtualizer<HTMLDivElement, Element>>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const rowMapRef = useRef<Map<number, HTMLDivElement>>(new Map());
  const cellMapRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const footerRef = useRef<HTMLDivElement>(null);
  const focusGuardRef = useRef(false);

  const originalDataRef = useRef<Array<TData> | null>(null);
  const changeMapRef = useRef<Map<string, ChangeMapEntry<TData>>>(new Map());

  const propsRef = useAsRef({
    ...props,
    data,
    columns,
    initialState
  });

  const groupingAwareColumns = useMemo<Array<ColumnDef<TData>>>(() => {
    if (!enableGrouping) {
      return columns;
    }

    function getNestedValue(row: unknown, accessorKey: string): unknown {
      return accessorKey.split('.').reduce<unknown>((current, segment) => {
        if (current === null || current === undefined) {
          return undefined;
        }

        if (typeof current === 'object' && segment in current) {
          return (current as Record<string, unknown>)[segment];
        }

        return undefined;
      }, row);
    }

    function withGroupingDefinition(
      column: ColumnDef<TData>
    ): ColumnDef<TData> {
      const nestedColumns
        = 'columns' in column && Array.isArray(column.columns)
          ? (column.columns as Array<ColumnDef<TData>>)
          : null;

      if (nestedColumns) {
        return {
          ...column,
          columns: nestedColumns.map(withGroupingDefinition)
        };
      }

      const variant = getGroupableCellVariant(column.meta?.cell);

      if (!variant) {
        if (column.enableGrouping === false) {
          return column;
        }

        return {
          ...column,
          enableGrouping: false
        };
      }

      return {
        ...column,
        enableGrouping: column.enableGrouping ?? true,
        getGroupingValue: (row: TData) => {
          let rawValue: unknown;

          if (
            'accessorFn' in column
            && typeof column.accessorFn === 'function'
          ) {
            rawValue = column.accessorFn(row, 0);
          } else {
            const accessorKey
              = 'accessorKey' in column ? column.accessorKey : undefined;

            if (typeof accessorKey === 'string') {
              rawValue = getNestedValue(row, accessorKey);
            } else if (
              column.id
              && row !== null
              && typeof row === 'object'
              && column.id in (row as Record<string, unknown>)
            ) {
              rawValue = (row as Record<string, unknown>)[column.id];
            }
          }

          return normalizeGroupingValue(variant, rawValue);
        }
      };
    }

    return columns.map(withGroupingDefinition);
  }, [columns, enableGrouping]);

  const listenersRef = useLazyRef(() => new Set<() => void>());

  const stateRef = useLazyRef<DataGridState>(() => {
    return {
      sorting: initialState?.sorting ?? [],
      columnFilters: initialState?.columnFilters ?? [],
      rowHeight: rowHeightProp,
      displayMode: displayModeProp,
      rowSelection: initialState?.rowSelection ?? {},
      selectionState: {
        selectedCells: new Set(),
        fullSelection: false,
        selectionRange: null,
        isSelecting: false
      },
      focusedCell: null,
      editingCell: null,
      cutCells: new Set(),
      contextMenu: {
        open: false,
        x: 0,
        y: 0
      },
      searchQuery: '',
      searchMatches: [],
      matchIndex: -1,
      searchOpen: false,
      lastClickedRowIndex: null,
      pasteDialog: {
        open: false,
        rowsNeeded: 0,
        clipboardText: ''
      },
      changedCellsByRowId: new Map()
    };
  });

  const store = useMemo<DataGridStore>(() => {
    let isBatching = false;
    let pendingNotification = false;

    return {
      subscribe: (callback) => {
        listenersRef.current.add(callback);

        return () => listenersRef.current.delete(callback);
      },
      getState: () => stateRef.current,
      setState: (key, value) => {
        if (Object.is(stateRef.current[key], value)) return;
        stateRef.current[key] = value;

        if (isBatching) {
          pendingNotification = true;
        } else {
          if (!pendingNotification) {
            pendingNotification = true;
            queueMicrotask(() => {
              pendingNotification = false;
              store.notify();
            });
          }
        }
      },
      notify: () => {
        for (const listener of listenersRef.current) {
          listener();
        }
      },
      batch: (fn) => {
        if (isBatching) {
          fn();

          return;
        }

        isBatching = true;
        const wasPending = pendingNotification;

        pendingNotification = false;

        try {
          fn();
        } finally {
          isBatching = false;
          if (pendingNotification || wasPending) {
            pendingNotification = false;
            store.notify();
          }
        }
      }
    };
  }, [listenersRef, stateRef]);

  const focusedCell = useStore(store, state => state.focusedCell);
  const editingCell = useStore(store, state => state.editingCell);
  const selectionState = useStore(store, state => state.selectionState);
  const searchQuery = useStore(store, state => state.searchQuery);
  const searchMatches = useStore(store, state => state.searchMatches);
  const matchIndex = useStore(store, state => state.matchIndex);
  const searchOpen = useStore(store, state => state.searchOpen);
  const sorting = useStore(store, state => state.sorting);
  const columnFilters = useStore(store, state => state.columnFilters);
  const rowSelection = useStore(store, state => state.rowSelection);
  const rowHeight = useStore(store, state => state.rowHeight);
  const displayMode = useStore(store, state => state.displayMode);
  const contextMenu = useStore(store, state => state.contextMenu);
  const pasteDialog = useStore(store, state => state.pasteDialog);
  const changedCellsByRowId = useStore(
    store,
    state => state.changedCellsByRowId
  );
  const isFullSelection = selectionState.fullSelection;

  useEffect(() => {
    if (
      propsRef.current.enableChangeTracking
      && changeMapRef.current.size === 0
    ) {
      originalDataRef.current = [...data];
    }
  }, [data, propsRef]);

  const rowHeightValue = getRowHeightValue(rowHeight);

  const columnIds = useMemo(() => {
    return groupingAwareColumns
      .map((c) => {
        if (c.id) return c.id;
        if ('accessorKey' in c) return c.accessorKey as string;

        return undefined;
      })
      .filter((id): id is string => Boolean(id));
  }, [groupingAwareColumns]);

  const navigableColumnIds = useMemo(() => {
    return columnIds.filter(c => !NON_NAVIGABLE_COLUMN_IDS.has(c));
  }, [columnIds]);

  const prevCellSelectionMapRef = useLazyRef(
    () => new Map<number, Set<string>>()
  );

  /*
   * Memoize per-row selection sets to prevent unnecessary row re-renders
   * Each row gets a stable Set reference that only changes when its cells' selection changes
   */
  const { selectedCells } = selectionState;

  const cellSelectionMap = useMemo(() => {
    if (selectionState.fullSelection) {
      const rows = tableRef.current?.getRowModel().rows ?? [];
      const map = new Map<number, Set<string>>();

      for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        const set = new Set<string>();

        for (const columnId of columnIds) {
          set.add(getCellKey(rowIndex, columnId));
        }
        map.set(rowIndex, set);
      }

      return map;
    }

    if (selectedCells.size === 0) {
      prevCellSelectionMapRef.current.clear();

      return null;
    }

    const newRowCells = new Map<number, Set<string>>();

    for (const cellKey of selectedCells) {
      const { rowIndex } = parseCellKey(cellKey);
      let rowSet = newRowCells.get(rowIndex);

      if (!rowSet) {
        rowSet = new Set<string>();
        newRowCells.set(rowIndex, rowSet);
      }
      rowSet.add(cellKey);
    }

    const stableMap = new Map<number, Set<string>>();

    for (const [rowIndex, newSet] of newRowCells) {
      const prevSet = prevCellSelectionMapRef.current.get(rowIndex);

      if (
        prevSet
        && prevSet.size === newSet.size
        && [...newSet].every(key => prevSet.has(key))
      ) {
        stableMap.set(rowIndex, prevSet);
      } else {
        stableMap.set(rowIndex, newSet);
      }
    }

    prevCellSelectionMapRef.current = stableMap;

    return stableMap;
  }, [
    selectionState.fullSelection,
    selectedCells,
    prevCellSelectionMapRef,
    columnIds
  ]);

  const visualRowIndexCacheRef = useRef<{
    rows: Array<Row<TData>> | null;
    map: Map<string, number>;
  } | null>(null);

  useEffect(() => {
    const rowMap = rowMapRef.current;
    const cellMap = cellMapRef.current;
    const prevMap = prevCellSelectionMapRef.current;

    return () => {
      rowMap?.clear();
      cellMap?.clear();
      prevMap?.clear();
      visualRowIndexCacheRef.current = null;
    };
  }, [prevCellSelectionMapRef]);

  /*
   * Pre-compute visual row index map for O(1) lookups (used by select column)
   * Cache is invalidated when row model identity changes (sorting/filtering)
   */
  const getVisualRowIndex = useCallback(
    (rowId: string): number | undefined => {
      const rows = tableRef.current?.getRowModel().rows;

      if (!rows) return undefined;

      if (visualRowIndexCacheRef.current?.rows !== rows) {
        const map = new Map<string, number>();

        for (const [i, row] of rows.entries()) {
          map.set(row.id, i + 1);
        }
        visualRowIndexCacheRef.current = { rows, map };
      }

      return visualRowIndexCacheRef.current.map.get(rowId);
    },
    []
  );

  const onDataUpdate = useCallback(
    (updates: CellUpdate | Array<CellUpdate>) => {
      if (propsRef.current.readOnly) return;

      const updateArray = Array.isArray(updates) ? updates : [updates];

      if (updateArray.length === 0) return;

      const currentTable = tableRef.current;
      const currentData = propsRef.current.data;
      const rows = currentTable?.getRowModel().rows;
      const isTracking = propsRef.current.enableChangeTracking;

      const rowUpdatesMap = new Map<number, Record<string, unknown>>();
      const affectedRows = new Map<
        number,
        { row: Row<TData>; updates: Map<string, unknown> }
      >();

      for (const update of updateArray) {
        let targetIndex = update.rowIndex;
        let row: Row<TData> | undefined;

        if (rows && currentTable) {
          row = rows[update.rowIndex];

          if (!row || row.getIsGrouped()) continue;

          const originalRowIndex = currentData.indexOf(row.original);

          if (originalRowIndex === -1) continue;

          targetIndex = originalRowIndex;
        }

        if (targetIndex < 0 || targetIndex >= currentData.length) {
          continue;
        }

        const currentRow = rowUpdatesMap.get(targetIndex);

        if (currentRow) {
          currentRow[update.columnId] = update.value;
        } else {
          const baseRow = currentData[targetIndex] as Record<string, unknown>;

          rowUpdatesMap.set(targetIndex, {
            ...baseRow,
            [update.columnId]: update.value
          });
        }

        if (isTracking && row) {
          let affected = affectedRows.get(targetIndex);

          if (!affected) {
            affected = { row, updates: new Map() };
            affectedRows.set(targetIndex, affected);
          }

          affected.updates.set(update.columnId, update.value);
        }
      }

      if (rowUpdatesMap.size === 0) return;

      const newData = [...currentData];

      for (const [rowIndex, updatedRow] of rowUpdatesMap.entries()) {
        newData[rowIndex] = updatedRow as TData;
      }

      if (isTracking) {
        const originalData = originalDataRef.current;

        if (originalData) {
          for (const [dataIndex, { row, updates: cellUpdates }] of affectedRows) {
            const rowId = row.id;
            let entry = changeMapRef.current.get(rowId);

            if (!entry) {
              entry = {
                originalRow: originalData[dataIndex] as TData,
                dataIndex,
                changes: new Map()
              };
              changeMapRef.current.set(rowId, entry);
            }

            const originalRow = entry.originalRow as Record<string, unknown>;

            for (const [columnId, newValue] of cellUpdates) {
              const originalValue = originalRow[columnId];

              if (Object.is(originalValue, newValue)) {
                entry.changes.delete(columnId);
              } else {
                entry.changes.set(columnId, { originalValue, newValue });
              }
            }

            if (entry.changes.size === 0) {
              changeMapRef.current.delete(rowId);
            }
          }

          const newChangedCells = new Map<string, Set<string>>();

          for (const [rowId, entry] of changeMapRef.current) {
            newChangedCells.set(rowId, new Set(entry.changes.keys()));
          }

          store.setState('changedCellsByRowId', newChangedCells);
        }
      }

      propsRef.current.onDataChange?.(newData);
    },
    [propsRef, store]
  );

  const getIsCellSelected = useCallback(
    (rowIndex: number, columnId: string) => {
      const currentSelectionState = store.getState().selectionState;

      if (currentSelectionState.fullSelection) {
        return true;
      }

      return currentSelectionState.selectedCells.has(
        getCellKey(rowIndex, columnId)
      );
    },
    [store]
  );

  const getIsCellCut = useCallback(
    (rowIndex: number, columnId: string) => {
      return store.getState().cutCells.has(getCellKey(rowIndex, columnId));
    },
    [store]
  );

  const getIsCellChanged = useCallback(
    (rowId: string, columnId: string): boolean => {
      return (
        store.getState().changedCellsByRowId.get(rowId)?.has(columnId) ?? false
      );
    },
    [store]
  );

  const onSelectionClear = useCallback(() => {
    store.batch(() => {
      store.setState('selectionState', {
        selectedCells: new Set(),
        fullSelection: false,
        selectionRange: null,
        isSelecting: false
      });
      store.setState('rowSelection', {});
    });
  }, [store]);

  const selectAll = useCallback(() => {
    const currentTable = tableRef.current;
    const rows = currentTable?.getRowModel().rows ?? [];
    const rowCount = rows.length ?? propsRef.current.data.length;

    const totalCells = rowCount * columnIds.length;

    if (totalCells > maxSelectCells) {
      toast.error(
        `Select all limited to ${maxSelectCells.toLocaleString()} cells. `
        + `Try narrowing filters or selecting a smaller range.`
      );

      return;
    }

    const firstColumnId = columnIds[0];
    const lastColumnId = columnIds[columnIds.length - 1];

    store.setState('selectionState', {
      selectedCells: new Set(),
      fullSelection: true,
      selectionRange:
        columnIds.length > 0 && rowCount > 0 && firstColumnId && lastColumnId
          ? {
              start: { rowIndex: 0, columnId: firstColumnId },
              end: { rowIndex: rowCount - 1, columnId: lastColumnId }
            }
          : null,
      isSelecting: false
    });
  }, [
    columnIds,
    propsRef,
    store,
    maxSelectCells
  ]);

  const selectColumn = useCallback(
    (columnId: string) => {
      const currentTable = tableRef.current;
      const rows = currentTable?.getRowModel().rows ?? [];
      const rowCount = rows.length ?? propsRef.current.data.length;

      if (rowCount === 0) return;

      if (rowCount > maxSelectCells) {
        toast.error(
          `Column selection limited to ${maxSelectCells.toLocaleString()} cells.`
        );

        return;
      }

      const selectedCells = new Set<string>();

      for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
        selectedCells.add(getCellKey(rowIndex, columnId));
      }

      store.setState('selectionState', {
        selectedCells,
        fullSelection: false,
        selectionRange: {
          start: { rowIndex: 0, columnId },
          end: { rowIndex: rowCount - 1, columnId }
        },
        isSelecting: false
      });
    },
    [propsRef, store, maxSelectCells]
  );

  const selectRange = useCallback(
    (start: CellPosition, end: CellPosition, isSelecting = false) => {
      const startColIndex = columnIds.indexOf(start.columnId);
      const endColIndex = columnIds.indexOf(end.columnId);

      const minRow = Math.min(start.rowIndex, end.rowIndex);
      const maxRow = Math.max(start.rowIndex, end.rowIndex);
      const minCol = Math.min(startColIndex, endColIndex);
      const maxCol = Math.max(startColIndex, endColIndex);

      const totalCells = (maxRow - minRow + 1) * (maxCol - minCol + 1);

      if (totalCells > maxSelectCells) {
        toast.error(
          `Selection limited to ${maxSelectCells.toLocaleString()} cells.`
        );

        return;
      }

      const selectedCells = new Set<string>();

      for (let rowIndex = minRow; rowIndex <= maxRow; rowIndex++) {
        for (let colIndex = minCol; colIndex <= maxCol; colIndex++) {
          const columnId = columnIds[colIndex];

          if (columnId) {
            selectedCells.add(getCellKey(rowIndex, columnId));
          }
        }
      }

      store.setState('selectionState', {
        selectedCells,
        fullSelection: false,
        selectionRange: { start, end },
        isSelecting
      });
    },
    [columnIds, store, maxSelectCells]
  );

  const serializeCellsToTsv = useCallback(() => {
    const currentState = store.getState();
    const selection = currentState.selectionState;

    let selectedCellsArray: Array<string>;

    const currentTable = tableRef.current;
    const rows = currentTable?.getRowModel().rows;

    if (!rows) return null;

    if (selection.fullSelection) {
      const totalCells = rows.length * columnIds.length;

      if (totalCells > maxSelectCells) {
        toast.error(
          `Copy limited to ${maxSelectCells.toLocaleString()} cells.`
        );

        return null;
      }

      selectedCellsArray = [];
      for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        for (const columnId of columnIds) {
          selectedCellsArray.push(getCellKey(rowIndex, columnId));
        }
      }
    } else if (!selection.selectedCells.size) {
      if (!currentState.focusedCell) return null;
      const focusedCellKey = getCellKey(
        currentState.focusedCell.rowIndex,
        currentState.focusedCell.columnId
      );

      selectedCellsArray = [focusedCellKey];
    } else {
      selectedCellsArray = Array.from(selection.selectedCells);
    }

    const selectedColumnIds: Array<string> = [];
    const seenColumnIds = new Set<string>();
    const cellData = new Map<string, string>();
    const rowIndices = new Set<number>();
    const rowCellMaps = new Map<
      number,
      Map<string, ReturnType<Row<TData>['getVisibleCells']>[number]>
    >();

    for (const cellKey of selectedCellsArray) {
      const { rowIndex, columnId } = parseCellKey(cellKey);

      if (columnId && !seenColumnIds.has(columnId)) {
        seenColumnIds.add(columnId);
        selectedColumnIds.push(columnId);
      }

      rowIndices.add(rowIndex);

      const row = rows[rowIndex];

      if (row) {
        let cellMap = rowCellMaps.get(rowIndex);

        if (!cellMap) {
          cellMap = new Map(row.getVisibleCells().map(c => [c.column.id, c]));
          rowCellMaps.set(rowIndex, cellMap);
        }
        const cell = cellMap.get(columnId);

        if (cell) {
          const value = cell.getValue();
          const cellVariant = cell.column.columnDef?.meta?.cell?.variant;

          let serializedValue = '';

          if (cellVariant === 'file' || cellVariant === 'multi-select') {
            serializedValue = value ? JSON.stringify(value) : '';
          } else if (value instanceof Date) {
            serializedValue = value.toISOString();
          } else {
            serializedValue = String(value ?? '');
          }

          cellData.set(cellKey, serializedValue);
        }
      }
    }

    const colIndices = new Set<number>();

    for (const cellKey of selectedCellsArray) {
      const { columnId } = parseCellKey(cellKey);
      const colIndex = selectedColumnIds.indexOf(columnId);

      if (colIndex >= 0) {
        colIndices.add(colIndex);
      }
    }

    const sortedRowIndices = Array.from(rowIndices).sort((a, b) => a - b);
    const sortedColIndices = Array.from(colIndices).sort((a, b) => a - b);
    const sortedColumnIds = sortedColIndices.map(i => selectedColumnIds[i]);

    const tsvData = sortedRowIndices
      .map(rowIndex => sortedColumnIds
        .map((columnId) => {
          const cellKey = `${rowIndex}:${columnId}`;

          return cellData.get(cellKey) ?? '';
        })
        .join('\t'))
      .join('\n');

    return { tsvData, selectedCellsArray };
  }, [store, columnIds, maxSelectCells]);

  const onCellsCopy = useCallback(async () => {
    const result = serializeCellsToTsv();

    if (!result) return;

    const { tsvData, selectedCellsArray } = result;

    try {
      await navigator.clipboard.writeText(tsvData);

      const currentState = store.getState();

      if (currentState.cutCells.size > 0) {
        store.setState('cutCells', new Set());
      }

      toast.success(
        `${selectedCellsArray.length} cell${
          selectedCellsArray.length !== 1 ? 's' : ''
        } copied`
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to copy to clipboard'
      );
    }
  }, [store, serializeCellsToTsv]);

  const onCellsCut = useCallback(async () => {
    if (propsRef.current.readOnly) return;

    const result = serializeCellsToTsv();

    if (!result) return;

    const { tsvData, selectedCellsArray } = result;

    try {
      await navigator.clipboard.writeText(tsvData);

      store.setState('cutCells', new Set(selectedCellsArray));

      toast.success(
        `${selectedCellsArray.length} cell${
          selectedCellsArray.length !== 1 ? 's' : ''
        } cut`
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to cut to clipboard'
      );
    }
  }, [store, propsRef, serializeCellsToTsv]);

  const restoreFocus = useCallback((element: HTMLDivElement | null) => {
    if (element && document.activeElement !== element) {
      requestAnimationFrame(() => {
        element.focus();
      });
    }
  }, []);

  const onCellsPaste = useCallback(
    async (expandRows = false) => {
      if (propsRef.current.readOnly) return;

      const currentState = store.getState();

      if (!currentState.focusedCell) return;

      const currentTable = tableRef.current;
      const rows = currentTable?.getRowModel().rows;

      if (!rows) return;

      try {
        let { clipboardText } = currentState.pasteDialog;

        if (!clipboardText) {
          clipboardText = await navigator.clipboard.readText();
          if (!clipboardText) return;
        }

        const pastedRows = clipboardText
          .split('\n')
          .filter(row => row.length > 0);
        const pastedData = pastedRows.map(row => row.split('\t'));

        const startRowIndex = currentState.focusedCell.rowIndex;
        const startColIndex = navigableColumnIds.indexOf(
          currentState.focusedCell.columnId
        );

        if (startColIndex === -1) return;

        const rowCount = rows.length ?? propsRef.current.data.length;
        const rowsNeeded = startRowIndex + pastedData.length - rowCount;

        if (
          rowsNeeded > 0
          && !expandRows
          && propsRef.current.onRowAdd
          && !currentState.pasteDialog.clipboardText
        ) {
          store.setState('pasteDialog', {
            open: true,
            rowsNeeded,
            clipboardText
          });

          return;
        }

        if (expandRows && rowsNeeded > 0) {
          const expectedRowCount = rowCount + rowsNeeded;

          if (propsRef.current.onRowsAdd) {
            await propsRef.current.onRowsAdd(rowsNeeded);
          } else if (propsRef.current.onRowAdd) {
            for (let i = 0; i < rowsNeeded; i++) {
              await propsRef.current.onRowAdd();
            }
          }

          let attempts = 0;
          const maxAttempts = 50;
          let currentTableRowCount
            = tableRef.current?.getRowModel().rows.length ?? 0;

          while (
            currentTableRowCount < expectedRowCount
            && attempts < maxAttempts
          ) {
            await new Promise(resolve => setTimeout(resolve, 100));
            currentTableRowCount
              = tableRef.current?.getRowModel().rows.length ?? 0;
            attempts++;
          }
        }

        const updates: Array<CellUpdate> = [];
        const tableColumns = currentTable?.getAllColumns() ?? [];
        let cellsUpdated = 0;
        let endRowIndex = startRowIndex;
        let endColIndex = startColIndex;

        const updatedTable = tableRef.current;
        const updatedRows = updatedTable?.getRowModel().rows;
        const currentRowCount = updatedRows?.length ?? 0;

        let cellsSkipped = 0;

        const columnMap = new Map(tableColumns.map(c => [c.id, c]));

        for (
          let pasteRowIdx = 0;
          pasteRowIdx < pastedData.length;
          pasteRowIdx++
        ) {
          const pasteRow = pastedData[pasteRowIdx];

          if (!pasteRow) continue;

          const targetRowIndex = startRowIndex + pasteRowIdx;

          if (targetRowIndex >= currentRowCount) break;

          for (
            let pasteColIdx = 0;
            pasteColIdx < pasteRow.length;
            pasteColIdx++
          ) {
            const targetColIndex = startColIndex + pasteColIdx;

            if (targetColIndex >= navigableColumnIds.length) break;

            const targetColumnId = navigableColumnIds[targetColIndex];

            if (!targetColumnId) continue;

            const pastedValue = pasteRow[pasteColIdx] ?? '';
            const column = columnMap.get(targetColumnId);
            const cellOpts = column?.columnDef?.meta?.cell;
            const cellVariant = cellOpts?.variant;

            let processedValue: unknown = pastedValue;
            let shouldSkip = false;

            switch (cellVariant) {
              case 'number':

              case 'currency':

              case 'percent': {
                if (!pastedValue) {
                  processedValue = null;
                } else {
                  const num = Number.parseFloat(pastedValue);

                  if (Number.isNaN(num)) shouldSkip = true;
                  else processedValue = num;
                }
                break;
              }

              case 'checkbox': {
                if (!pastedValue) {
                  processedValue = false;
                } else {
                  const lower = pastedValue.toLowerCase();

                  if (VALID_BOOLEANS.has(lower)) {
                    processedValue = TRUTHY_BOOLEANS.has(lower);
                  } else {
                    shouldSkip = true;
                  }
                }
                break;
              }

              case 'date': {
                if (!pastedValue) {
                  processedValue = null;
                } else {
                  const date = new Date(pastedValue);

                  if (Number.isNaN(date.getTime())) shouldSkip = true;
                  else processedValue = date;
                }
                break;
              }

              case 'datetime': {
                if (!pastedValue) {
                  processedValue = null;
                } else {
                  const date = new Date(pastedValue);

                  if (Number.isNaN(date.getTime())) shouldSkip = true;
                  else processedValue = date.toISOString();
                }
                break;
              }

              case 'select':

              case 'status': {
                const options = cellOpts?.options ?? [];

                if (!pastedValue) {
                  processedValue = '';
                } else {
                  const matched = matchSelectOption(pastedValue, options);

                  if (matched) processedValue = matched;
                  else shouldSkip = true;
                }
                break;
              }

              case 'enum': {
                const options = cellOpts?.options ?? [];

                if (!pastedValue) {
                  processedValue = '';
                } else if (options.length === 0) {
                  processedValue = pastedValue;
                } else {
                  const matched = matchSelectOption(pastedValue, options);

                  if (matched) processedValue = matched;
                  else shouldSkip = true;
                }
                break;
              }

              case 'multi-select': {
                const options = cellOpts?.options ?? [];
                let values: Array<string> = [];

                try {
                  const parsed = JSON.parse(pastedValue);

                  if (Array.isArray(parsed)) {
                    values = parsed.filter(
                      (v): v is string => typeof v === 'string'
                    );
                  }
                } catch {
                  values = pastedValue
                    ? pastedValue.split(',').map(v => v.trim())
                    : [];
                }

                const validated = values
                  .map(v => matchSelectOption(v, options))
                  .filter(Boolean) as Array<string>;

                if (values.length > 0 && validated.length === 0) {
                  shouldSkip = true;
                } else {
                  processedValue = validated;
                }
                break;
              }

              case 'file': {
                if (!pastedValue) {
                  processedValue = [];
                } else {
                  try {
                    const parsed = JSON.parse(pastedValue);

                    if (!Array.isArray(parsed)) {
                      shouldSkip = true;
                    } else {
                      const validFiles = parsed.filter(getIsFileCellData);

                      if (parsed.length > 0 && validFiles.length === 0) {
                        shouldSkip = true;
                      } else {
                        processedValue = validFiles;
                      }
                    }
                  } catch {
                    shouldSkip = true;
                  }
                }
                break;
              }

              case 'url': {
                if (!pastedValue) {
                  processedValue = '';
                } else {
                  const firstChar = pastedValue[0];

                  if (firstChar === '[' || firstChar === '{') {
                    shouldSkip = true;
                  } else {
                    try {
                      new URL(pastedValue);
                      processedValue = pastedValue;
                    } catch {
                      if (DOMAIN_REGEX.test(pastedValue)) {
                        processedValue = pastedValue;
                      } else {
                        shouldSkip = true;
                      }
                    }
                  }
                }
                break;
              }

              default: {
                if (!pastedValue) {
                  processedValue = '';
                  break;
                }

                if (ISO_DATE_REGEX.test(pastedValue)) {
                  const date = new Date(pastedValue);

                  if (!Number.isNaN(date.getTime())) {
                    processedValue = date.toLocaleDateString();
                    break;
                  }
                }

                const firstChar = pastedValue[0];

                if (
                  firstChar === '['
                  || firstChar === '{'
                  || firstChar === 't'
                  || firstChar === 'f'
                ) {
                  try {
                    const parsed = JSON.parse(pastedValue);

                    if (Array.isArray(parsed)) {
                      if (
                        parsed.length > 0
                        && parsed.every(getIsFileCellData)
                      ) {
                        processedValue = parsed.map(f => f.name).join(', ');
                      } else if (parsed.every(v => typeof v === 'string')) {
                        processedValue = parsed.join(', ');
                      }
                    } else if (typeof parsed === 'boolean') {
                      processedValue = parsed ? 'Checked' : 'Unchecked';
                    }
                  } catch {
                    const lower = pastedValue.toLowerCase();

                    if (lower === 'true' || lower === 'false') {
                      processedValue
                        = lower === 'true' ? 'Checked' : 'Unchecked';
                    }
                  }
                }
              }
            }

            if (shouldSkip) {
              cellsSkipped++;
              endRowIndex = Math.max(endRowIndex, targetRowIndex);
              endColIndex = Math.max(endColIndex, targetColIndex);
              continue;
            }

            updates.push({
              rowIndex: targetRowIndex,
              columnId: targetColumnId,
              value: processedValue
            });
            cellsUpdated++;

            endRowIndex = Math.max(endRowIndex, targetRowIndex);
            endColIndex = Math.max(endColIndex, targetColIndex);
          }
        }

        if (updates.length > 0) {
          if (propsRef.current.onPaste) {
            await propsRef.current.onPaste(updates);
          }

          const allUpdates = [...updates];

          if (currentState.cutCells.size > 0) {
            const columnById = new Map(tableColumns.map(c => [c.id, c]));

            for (const cellKey of currentState.cutCells) {
              const { rowIndex, columnId } = parseCellKey(cellKey);
              const column = columnById.get(columnId);
              const cellVariant = column?.columnDef?.meta?.cell?.variant;
              const emptyValue = getEmptyCellValue(cellVariant);

              allUpdates.push({ rowIndex, columnId, value: emptyValue });
            }

            store.setState('cutCells', new Set());
          }

          onDataUpdate(allUpdates);

          if (cellsSkipped > 0) {
            toast.success(
              `${cellsUpdated} cell${
                cellsUpdated !== 1 ? 's' : ''
              } pasted, ${cellsSkipped} skipped`
            );
          } else {
            toast.success(
              `${cellsUpdated} cell${cellsUpdated !== 1 ? 's' : ''} pasted`
            );
          }

          const endColumnId = navigableColumnIds[endColIndex];

          if (endColumnId) {
            selectRange(
              {
                rowIndex: startRowIndex,
                columnId: currentState.focusedCell.columnId
              },
              { rowIndex: endRowIndex, columnId: endColumnId }
            );
          }

          restoreFocus(dataGridRef.current);
        } else if (cellsSkipped > 0) {
          toast.error(
            `${cellsSkipped} cell${
              cellsSkipped !== 1 ? 's' : ''
            } skipped pasting for invalid data`
          );
        }

        if (currentState.pasteDialog.open) {
          store.setState('pasteDialog', {
            open: false,
            rowsNeeded: 0,
            clipboardText: ''
          });
        }
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to paste. Please try again.'
        );
      }
    },
    [
      store,
      navigableColumnIds,
      propsRef,
      onDataUpdate,
      selectRange,
      restoreFocus
    ]
  );

  /*
   * Release focus guard after delay to allow async data re-renders to settle.
   * 300ms accounts for db sync and virtualized cell mounting.
   */
  const releaseFocusGuard = useCallback((immediate = false) => {
    if (immediate) {
      focusGuardRef.current = false;

      return;
    }

    setTimeout(() => {
      focusGuardRef.current = false;
    }, 300);
  }, []);

  const focusCellWrapper = useCallback(
    (rowIndex: number, columnId: string) => {
      focusGuardRef.current = true;

      requestAnimationFrame(() => {
        const cellKey = getCellKey(rowIndex, columnId);
        const cellWrapperElement = cellMapRef.current.get(cellKey);

        if (!cellWrapperElement) {
          const container = dataGridRef.current;

          if (container) {
            container.focus();
          }
          releaseFocusGuard();

          return;
        }

        cellWrapperElement.focus();
        releaseFocusGuard();
      });
    },
    [releaseFocusGuard]
  );

  const focusCell = useCallback(
    (rowIndex: number, columnId: string) => {
      store.batch(() => {
        store.setState('focusedCell', { rowIndex, columnId });
        store.setState('editingCell', null);
      });

      const currentState = store.getState();

      if (currentState.searchOpen) return;

      focusCellWrapper(rowIndex, columnId);
    },
    [store, focusCellWrapper]
  );

  const onRowsDelete = useCallback(
    async (rowIndices: Array<number>) => {
      if (
        propsRef.current.readOnly
        || !propsRef.current.onRowsDelete
        || rowIndices.length === 0
      )
        return;

      const currentTable = tableRef.current;
      const rows = currentTable?.getRowModel().rows;

      if (!rows || rows.length === 0) return;

      const currentState = store.getState();
      const currentFocusedColumn
        = currentState.focusedCell?.columnId ?? navigableColumnIds[0];

      const minDeletedRowIndex = Math.min(...rowIndices);

      const rowsToDelete: Array<TData> = [];

      for (const rowIndex of rowIndices) {
        const row = rows[rowIndex];

        if (row) {
          rowsToDelete.push(row.original);
        }
      }

      await propsRef.current.onRowsDelete(rowsToDelete, rowIndices);

      store.batch(() => {
        store.setState('selectionState', {
          selectedCells: new Set(),
          fullSelection: false,
          selectionRange: null,
          isSelecting: false
        });
        store.setState('rowSelection', {});
        store.setState('editingCell', null);
      });

      if (propsRef.current.enableChangeTracking && rows) {
        let changed = false;

        for (const rowIndex of rowIndices) {
          const row = rows[rowIndex];

          if (row && changeMapRef.current.delete(row.id)) {
            changed = true;
          }
        }

        if (changed) {
          const newChangedCells = new Map<string, Set<string>>();

          for (const [rowId, entry] of changeMapRef.current) {
            newChangedCells.set(rowId, new Set(entry.changes.keys()));
          }

          store.setState('changedCellsByRowId', newChangedCells);
        }
      }

      requestAnimationFrame(() => {
        const currentTable = tableRef.current;
        const currentRows = currentTable?.getRowModel().rows ?? [];
        const newRowCount = currentRows.length ?? propsRef.current.data.length;

        if (newRowCount > 0 && currentFocusedColumn) {
          const targetRowIndex = Math.min(minDeletedRowIndex, newRowCount - 1);

          focusCell(targetRowIndex, currentFocusedColumn);
        }
      });
    },
    [
      propsRef,
      store,
      navigableColumnIds,
      focusCell
    ]
  );

  const handleChangesSave = useCallback(async () => {
    const map = changeMapRef.current;

    if (map.size === 0) return;

    const changes: Array<RowChange> = [];

    for (const [rowId, entry] of map) {
      const cellChanges = new Map<string, CellChange>();

      for (const [colId, change] of entry.changes) {
        cellChanges.set(colId, {
          columnId: colId,
          originalValue: change.originalValue,
          newValue: change.newValue
        });
      }

      changes.push({
        rowId,
        rowIndex: entry.dataIndex,
        changes: cellChanges
      });
    }

    await propsRef.current.onChangesSave?.(changes, propsRef.current.data);

    changeMapRef.current.clear();
    originalDataRef.current = [...propsRef.current.data];
    store.setState('changedCellsByRowId', new Map());
  }, [propsRef, store]);

  const handleChangesDiscard = useCallback(() => {
    const originalData = originalDataRef.current;

    if (!originalData) return;

    changeMapRef.current.clear();
    store.setState('changedCellsByRowId', new Map());

    propsRef.current.onDataChange?.(originalData);
    propsRef.current.onChangesDiscard?.();
  }, [propsRef, store]);

  const navigateCell = useCallback(
    (direction: NavigationDirection) => {
      const currentState = store.getState();

      if (!currentState.focusedCell) return;

      const { rowIndex, columnId } = currentState.focusedCell;
      const currentColIndex = navigableColumnIds.indexOf(columnId);
      const rowVirtualizer = rowVirtualizerRef.current;
      const currentTable = tableRef.current;
      const rows = currentTable?.getRowModel().rows ?? [];
      const rowCount = rows.length ?? propsRef.current.data.length;

      let newRowIndex = rowIndex;
      let newColumnId = columnId;

      const isRtl = dir === 'rtl';

      switch (direction) {
        case 'up':
          newRowIndex = Math.max(0, rowIndex - 1);
          break;

        case 'down':
          newRowIndex = Math.min(rowCount - 1, rowIndex + 1);
          break;

        case 'left':
          if (isRtl) {
            if (currentColIndex < navigableColumnIds.length - 1) {
              const nextColumnId = navigableColumnIds[currentColIndex + 1];

              if (nextColumnId) newColumnId = nextColumnId;
            }
          } else {
            if (currentColIndex > 0) {
              const prevColumnId = navigableColumnIds[currentColIndex - 1];

              if (prevColumnId) newColumnId = prevColumnId;
            }
          }
          break;

        case 'right':
          if (isRtl) {
            if (currentColIndex > 0) {
              const prevColumnId = navigableColumnIds[currentColIndex - 1];

              if (prevColumnId) newColumnId = prevColumnId;
            }
          } else {
            if (currentColIndex < navigableColumnIds.length - 1) {
              const nextColumnId = navigableColumnIds[currentColIndex + 1];

              if (nextColumnId) newColumnId = nextColumnId;
            }
          }
          break;

        case 'home':
          if (navigableColumnIds.length > 0) {
            newColumnId = navigableColumnIds[0] ?? columnId;
          }
          break;

        case 'end':
          if (navigableColumnIds.length > 0) {
            newColumnId
              = navigableColumnIds[navigableColumnIds.length - 1] ?? columnId;
          }
          break;

        case 'ctrl+home':
          newRowIndex = 0;
          if (navigableColumnIds.length > 0) {
            newColumnId = navigableColumnIds[0] ?? columnId;
          }
          break;

        case 'ctrl+end':
          newRowIndex = Math.max(0, rowCount - 1);
          if (navigableColumnIds.length > 0) {
            newColumnId
              = navigableColumnIds[navigableColumnIds.length - 1] ?? columnId;
          }
          break;

        case 'ctrl+up':
          newRowIndex = 0;
          break;

        case 'ctrl+down':
          newRowIndex = Math.max(0, rowCount - 1);
          break;

        case 'pageup':
          if (rowVirtualizer) {
            const visibleRange = rowVirtualizer.getVirtualItems();
            const pageSize = visibleRange.length ?? 10;

            newRowIndex = Math.max(0, rowIndex - pageSize);
          } else {
            newRowIndex = Math.max(0, rowIndex - 10);
          }
          break;

        case 'pagedown':
          if (rowVirtualizer) {
            const visibleRange = rowVirtualizer.getVirtualItems();
            const pageSize = visibleRange.length ?? 10;

            newRowIndex = Math.min(rowCount - 1, rowIndex + pageSize);
          } else {
            newRowIndex = Math.min(rowCount - 1, rowIndex + 10);
          }
          break;

        case 'pageleft':
          if (currentColIndex > 0) {
            const targetIndex = Math.max(
              0,
              currentColIndex - HORIZONTAL_PAGE_SIZE
            );
            const targetColumnId = navigableColumnIds[targetIndex];

            if (targetColumnId) newColumnId = targetColumnId;
          }
          break;

        case 'pageright':
          if (currentColIndex < navigableColumnIds.length - 1) {
            const targetIndex = Math.min(
              navigableColumnIds.length - 1,
              currentColIndex + HORIZONTAL_PAGE_SIZE
            );
            const targetColumnId = navigableColumnIds[targetIndex];

            if (targetColumnId) newColumnId = targetColumnId;
          }
          break;
      }

      if (newRowIndex !== rowIndex || newColumnId !== columnId) {
        focusCell(newRowIndex, newColumnId);

        const container = dataGridRef.current;

        if (!container) return;

        const targetRow = rowMapRef.current.get(newRowIndex);
        const cellKey = getCellKey(newRowIndex, newColumnId);
        const targetCell = cellMapRef.current.get(cellKey);

        if (!targetRow) {
          if (rowVirtualizer) {
            const align
              = direction === 'up'
                || direction === 'pageup'
                || direction === 'ctrl+up'
                || direction === 'ctrl+home'
                ? 'start'
                : direction === 'down'
                  || direction === 'pagedown'
                  || direction === 'ctrl+down'
                  || direction === 'ctrl+end'
                  ? 'end'
                  : 'center';

            rowVirtualizer.scrollToIndex(newRowIndex, { align });

            if (newColumnId !== columnId) {
              requestAnimationFrame(() => {
                const cellKeyRetry = getCellKey(newRowIndex, newColumnId);
                const targetCellRetry = cellMapRef.current.get(cellKeyRetry);

                if (targetCellRetry) {
                  const scrollDirection = getScrollDirection(direction);

                  scrollCellIntoView({
                    container,
                    targetCell: targetCellRetry,
                    tableRef,
                    viewportOffset: VIEWPORT_OFFSET,
                    direction: scrollDirection,
                    isRtl: dir === 'rtl'
                  });
                }
              });
            }
          } else {
            const rowHeightValue = getRowHeightValue(rowHeight);
            const estimatedScrollTop = newRowIndex * rowHeightValue;

            container.scrollTop = estimatedScrollTop;
          }

          return;
        }

        if (newRowIndex !== rowIndex && targetRow) {
          requestAnimationFrame(() => {
            const containerRect = container.getBoundingClientRect();
            const headerHeight
              = headerRef.current?.getBoundingClientRect().height ?? 0;
            const footerHeight
              = footerRef.current?.getBoundingClientRect().height ?? 0;
            const viewportTop
              = containerRect.top + headerHeight + VIEWPORT_OFFSET;
            const viewportBottom
              = containerRect.bottom - footerHeight - VIEWPORT_OFFSET;

            const rowRect = targetRow.getBoundingClientRect();
            const isFullyVisible
              = rowRect.top >= viewportTop && rowRect.bottom <= viewportBottom;

            if (!isFullyVisible) {
              const isVerticalNavigation
                = direction === 'up'
                  || direction === 'down'
                  || direction === 'pageup'
                  || direction === 'pagedown'
                  || direction === 'ctrl+up'
                  || direction === 'ctrl+down'
                  || direction === 'ctrl+home'
                  || direction === 'ctrl+end';

              if (isVerticalNavigation) {
                if (
                  direction === 'down'
                  || direction === 'pagedown'
                  || direction === 'ctrl+down'
                  || direction === 'ctrl+end'
                ) {
                  container.scrollTop += rowRect.bottom - viewportBottom;
                } else {
                  container.scrollTop -= viewportTop - rowRect.top;
                }
              }
            }
          });
        }

        if (newColumnId !== columnId && targetCell) {
          requestAnimationFrame(() => {
            const scrollDirection = getScrollDirection(direction);

            scrollCellIntoView({
              container,
              targetCell,
              tableRef,
              viewportOffset: VIEWPORT_OFFSET,
              direction: scrollDirection,
              isRtl: dir === 'rtl'
            });
          });
        }
      }
    },
    [
      dir,
      store,
      navigableColumnIds,
      focusCell,
      propsRef,
      rowHeight
    ]
  );

  const onCellEditingStart = useCallback(
    (rowIndex: number, columnId: string) => {
      if (propsRef.current.readOnly) return;

      store.batch(() => {
        store.setState('focusedCell', { rowIndex, columnId });
        store.setState('editingCell', { rowIndex, columnId });
      });
    },
    [store, propsRef]
  );

  const onCellEditingStop = useCallback(
    (opts?: { moveToNextRow?: boolean; direction?: NavigationDirection }) => {
      const currentState = store.getState();
      const currentEditing = currentState.editingCell;

      store.setState('editingCell', null);

      if (opts?.moveToNextRow && currentEditing) {
        const { rowIndex, columnId } = currentEditing;
        const currentTable = tableRef.current;
        const rows = currentTable?.getRowModel().rows ?? [];
        const rowCount = rows.length ?? propsRef.current.data.length;

        const nextRowIndex = rowIndex + 1;

        if (nextRowIndex < rowCount) {
          requestAnimationFrame(() => {
            focusCell(nextRowIndex, columnId);
          });
        }
      } else if (opts?.direction && currentEditing) {
        const { rowIndex, columnId } = currentEditing;

        focusCell(rowIndex, columnId);
        requestAnimationFrame(() => {
          navigateCell(opts.direction ?? 'right');
        });
      } else if (currentEditing) {
        const { rowIndex, columnId } = currentEditing;

        focusCellWrapper(rowIndex, columnId);
      }
    },
    [
      store,
      propsRef,
      focusCell,
      navigateCell,
      focusCellWrapper
    ]
  );

  const onSearchOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        store.setState('searchOpen', true);

        return;
      }

      const currentState = store.getState();
      const currentMatch
        = currentState.matchIndex >= 0
          && currentState.searchMatches[currentState.matchIndex];

      store.batch(() => {
        store.setState('searchOpen', false);
        store.setState('searchQuery', '');
        store.setState('searchMatches', []);
        store.setState('matchIndex', -1);

        if (currentMatch) {
          store.setState('focusedCell', {
            rowIndex: currentMatch.rowIndex,
            columnId: currentMatch.columnId
          });
        }
      });

      if (
        dataGridRef.current
        && document.activeElement !== dataGridRef.current
      ) {
        dataGridRef.current.focus();
      }
    },
    [store]
  );

  const onSearch = useCallback(
    (query: string) => {
      if (!query.trim()) {
        store.batch(() => {
          store.setState('searchMatches', []);
          store.setState('matchIndex', -1);
        });

        return;
      }

      const matches: Array<CellPosition> = [];
      const currentTable = tableRef.current;
      const rows = currentTable?.getRowModel().rows ?? [];

      const lowerQuery = query.toLowerCase();

      for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        const row = rows[rowIndex];

        if (!row) continue;

        const cellById = new Map(
          row.getVisibleCells().map(c => [c.column.id, c])
        );

        for (const columnId of columnIds) {
          const cell = cellById.get(columnId);

          if (!cell) continue;

          const value = cell.getValue();
          const stringValue = String(value ?? '').toLowerCase();

          if (stringValue.includes(lowerQuery)) {
            matches.push({ rowIndex, columnId });

            if (matches.length >= maxSearchMatches) {
              break;
            }
          }
        }

        if (matches.length >= maxSearchMatches) {
          break;
        }
      }

      store.batch(() => {
        store.setState('searchMatches', matches);
        store.setState('matchIndex', matches.length > 0 ? 0 : -1);
      });

      if (matches.length === maxSearchMatches) {
        toast.info(
          `Showing first ${maxSearchMatches} matches. Refine search to narrow results.`
        );
      }

      if (matches.length > 0 && matches[0]) {
        const firstMatch = matches[0];

        rowVirtualizerRef.current?.scrollToIndex(firstMatch.rowIndex, {
          align: 'center'
        });
      }
    },
    [columnIds, store, maxSearchMatches]
  );

  const onSearchQueryChange = useCallback(
    (query: string) => store.setState('searchQuery', query),
    [store]
  );

  const onNavigateToPrevMatch = useCallback(() => {
    const currentState = store.getState();

    if (currentState.searchMatches.length === 0) return;

    const prevIndex
      = currentState.matchIndex - 1 < 0
        ? currentState.searchMatches.length - 1
        : currentState.matchIndex - 1;
    const match = currentState.searchMatches[prevIndex];

    if (match) {
      rowVirtualizerRef.current?.scrollToIndex(match.rowIndex, {
        align: 'center'
      });

      requestAnimationFrame(() => {
        store.setState('matchIndex', prevIndex);
        requestAnimationFrame(() => {
          focusCell(match.rowIndex, match.columnId);
        });
      });
    }
  }, [store, focusCell]);

  const onNavigateToNextMatch = useCallback(() => {
    const currentState = store.getState();

    if (currentState.searchMatches.length === 0) return;

    const nextIndex
      = (currentState.matchIndex + 1) % currentState.searchMatches.length;
    const match = currentState.searchMatches[nextIndex];

    if (match) {
      rowVirtualizerRef.current?.scrollToIndex(match.rowIndex, {
        align: 'center'
      });

      requestAnimationFrame(() => {
        store.setState('matchIndex', nextIndex);
        requestAnimationFrame(() => {
          focusCell(match.rowIndex, match.columnId);
        });
      });
    }
  }, [store, focusCell]);

  const searchMatchSet = useMemo(() => {
    return new Set(searchMatches.map(m => getCellKey(m.rowIndex, m.columnId)));
  }, [searchMatches]);

  const getIsSearchMatch = useCallback(
    (rowIndex: number, columnId: string) => {
      return searchMatchSet.has(getCellKey(rowIndex, columnId));
    },
    [searchMatchSet]
  );

  const getIsActiveSearchMatch = useCallback(
    (rowIndex: number, columnId: string) => {
      const currentState = store.getState();

      if (currentState.matchIndex < 0) return false;
      const currentMatch = currentState.searchMatches[currentState.matchIndex];

      return (
        currentMatch?.rowIndex === rowIndex
        && currentMatch?.columnId === columnId
      );
    },
    [store]
  );

  /*
   * Compute search match data for targeted row re-renders
   * Maps rowIndex -> Set of columnIds that have matches in that row
   */
  const searchMatchesByRow = useMemo(() => {
    if (searchMatches.length === 0) return null;
    const rowMap = new Map<number, Set<string>>();

    for (const match of searchMatches) {
      let columnSet = rowMap.get(match.rowIndex);

      if (!columnSet) {
        columnSet = new Set<string>();
        rowMap.set(match.rowIndex, columnSet);
      }
      columnSet.add(match.columnId);
    }

    return rowMap;
  }, [searchMatches]);

  const activeSearchMatch = useMemo<CellPosition | null>(() => {
    if (matchIndex < 0 || searchMatches.length === 0) return null;

    return searchMatches[matchIndex] ?? null;
  }, [searchMatches, matchIndex]);

  const blurCell = useCallback(() => {
    const currentState = store.getState();

    if (
      currentState.editingCell
      && document.activeElement instanceof HTMLElement
    ) {
      document.activeElement.blur();
    }

    store.batch(() => {
      store.setState('focusedCell', null);
      store.setState('editingCell', null);
    });
  }, [store]);

  const onCellClick = useCallback(
    (rowIndex: number, columnId: string, event?: MouseEvent) => {
      if (event?.button === 2) {
        return;
      }

      const currentState = store.getState();
      const currentFocused = currentState.focusedCell;

      function scrollToCell() {
        requestAnimationFrame(() => {
          const container = dataGridRef.current;
          const cellKey = getCellKey(rowIndex, columnId);
          const targetCell = cellMapRef.current.get(cellKey);

          if (container && targetCell) {
            scrollCellIntoView({
              container,
              targetCell,
              tableRef,
              viewportOffset: VIEWPORT_OFFSET,
              isRtl: dir === 'rtl'
            });
          }
        });
      }

      if (event) {
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          const cellKey = getCellKey(rowIndex, columnId);
          const newSelectedCells = new Set(
            currentState.selectionState.selectedCells
          );

          if (newSelectedCells.has(cellKey)) {
            newSelectedCells.delete(cellKey);
          } else {
            newSelectedCells.add(cellKey);
          }

          store.setState('selectionState', {
            selectedCells: newSelectedCells,
            fullSelection: false,
            selectionRange: null,
            isSelecting: false
          });
          focusCell(rowIndex, columnId);
          scrollToCell();

          return;
        }

        if (event.shiftKey && currentState.focusedCell) {
          event.preventDefault();
          selectRange(currentState.focusedCell, { rowIndex, columnId });
          scrollToCell();

          return;
        }
      }

      const hasSelectedCells
        = currentState.selectionState.fullSelection
          || currentState.selectionState.selectedCells.size > 0;
      const hasSelectedRows = Object.keys(currentState.rowSelection).length > 0;

      if (hasSelectedCells && !currentState.selectionState.isSelecting) {
        const cellKey = getCellKey(rowIndex, columnId);
        const isClickingSelectedCell
          = currentState.selectionState.fullSelection
            || currentState.selectionState.selectedCells.has(cellKey);

        if (!isClickingSelectedCell) {
          onSelectionClear();
        } else {
          focusCell(rowIndex, columnId);
          scrollToCell();

          return;
        }
      } else if (hasSelectedRows && columnId !== 'select') {
        onSelectionClear();
      }

      if (
        currentFocused?.rowIndex === rowIndex
        && currentFocused?.columnId === columnId
      ) {
        onCellEditingStart(rowIndex, columnId);
      } else {
        focusCell(rowIndex, columnId);
        scrollToCell();
      }
    },
    [
      store,
      focusCell,
      onCellEditingStart,
      selectRange,
      onSelectionClear,
      dir
    ]
  );

  const onCellDoubleClick = useCallback(
    (rowIndex: number, columnId: string, event?: MouseEvent) => {
      if (event?.defaultPrevented) return;

      onCellEditingStart(rowIndex, columnId);
    },
    [onCellEditingStart]
  );

  const onCellMouseDown = useCallback(
    (rowIndex: number, columnId: string, event: MouseEvent) => {
      if (event.button === 2) {
        return;
      }

      event.preventDefault();

      if (!event.ctrlKey && !event.metaKey && !event.shiftKey) {
        const cellKey = getCellKey(rowIndex, columnId);

        store.batch(() => {
          store.setState('selectionState', {
            selectedCells: propsRef.current.enableSingleCellSelection
              ? new Set([cellKey])
              : new Set(),
            fullSelection: false,
            selectionRange: {
              start: { rowIndex, columnId },
              end: { rowIndex, columnId }
            },
            isSelecting: true
          });
          store.setState('rowSelection', {});
        });
      }
    },
    [store, propsRef]
  );

  const onCellMouseEnter = useCallback(
    (rowIndex: number, columnId: string) => {
      const currentState = store.getState();

      if (
        currentState.selectionState.isSelecting
        && currentState.selectionState.selectionRange
      ) {
        const { start } = currentState.selectionState.selectionRange;
        const end = { rowIndex, columnId };

        if (
          currentState.focusedCell?.rowIndex !== start.rowIndex
          || currentState.focusedCell?.columnId !== start.columnId
        ) {
          focusCell(start.rowIndex, start.columnId);
        }

        selectRange(start, end, true);
      }
    },
    [store, selectRange, focusCell]
  );

  const onCellMouseUp = useCallback(() => {
    const currentState = store.getState();

    store.setState('selectionState', {
      ...currentState.selectionState,
      isSelecting: false
    });
  }, [store]);

  const onCellContextMenu = useCallback(
    (rowIndex: number, columnId: string, event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const currentState = store.getState();
      const cellKey = getCellKey(rowIndex, columnId);
      const isTargetCellSelected
        = currentState.selectionState.fullSelection
          || currentState.selectionState.selectedCells.has(cellKey);

      if (!isTargetCellSelected) {
        store.batch(() => {
          store.setState('selectionState', {
            selectedCells: new Set([cellKey]),
            fullSelection: false,
            selectionRange: {
              start: { rowIndex, columnId },
              end: { rowIndex, columnId }
            },
            isSelecting: false
          });
          store.setState('focusedCell', { rowIndex, columnId });
        });
      }

      store.setState('contextMenu', {
        open: true,
        x: event.clientX,
        y: event.clientY
      });
    },
    [store]
  );

  const onContextMenuOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        const currentMenu = store.getState().contextMenu;

        store.setState('contextMenu', {
          open: false,
          x: currentMenu.x,
          y: currentMenu.y
        });
      }
    },
    [store]
  );

  const onSortingChange = useCallback(
    (updater: Updater<SortingState>) => {
      const currentState = store.getState();
      const newSorting
        = typeof updater === 'function' ? updater(currentState.sorting) : updater;

      store.setState('sorting', newSorting);

      propsRef.current.onSortingChange?.(newSorting);
    },
    [store, propsRef]
  );

  const onColumnFiltersChange = useCallback(
    (updater: Updater<ColumnFiltersState>) => {
      const currentState = store.getState();
      const newColumnFilters
        = typeof updater === 'function'
          ? updater(currentState.columnFilters)
          : updater;

      store.setState('columnFilters', newColumnFilters);

      propsRef.current.onColumnFiltersChange?.(newColumnFilters);
    },
    [store, propsRef]
  );

  const onRowSelectionChange = useCallback(
    (updater: Updater<RowSelectionState>) => {
      const currentState = store.getState();
      const newRowSelection
        = typeof updater === 'function'
          ? updater(currentState.rowSelection)
          : updater;

      const selectedRows = Object.keys(newRowSelection).filter(
        key => newRowSelection[key]
      );

      const selectedCells = new Set<string>();
      const rows = tableRef.current?.getRowModel().rows ?? [];

      for (const rowId of selectedRows) {
        const rowIndex = rows.findIndex(r => r.id === rowId);

        if (rowIndex === -1) continue;

        for (const columnId of columnIds) {
          selectedCells.add(getCellKey(rowIndex, columnId));
        }
      }

      store.batch(() => {
        store.setState('rowSelection', newRowSelection);
        store.setState('selectionState', {
          selectedCells,
          fullSelection: false,
          selectionRange: null,
          isSelecting: false
        });
        store.setState('focusedCell', null);
        store.setState('editingCell', null);
      });
    },
    [store, columnIds]
  );

  const onRowSelect = useCallback(
    (rowIndex: number, selected: boolean, shiftKey: boolean) => {
      const currentState = store.getState();
      const rows = tableRef.current?.getRowModel().rows ?? [];
      const currentRow = rows[rowIndex];

      if (!currentRow) return;

      if (shiftKey && currentState.lastClickedRowIndex !== null) {
        const startIndex = Math.min(currentState.lastClickedRowIndex, rowIndex);
        const endIndex = Math.max(currentState.lastClickedRowIndex, rowIndex);

        const newRowSelection: RowSelectionState = {
          ...currentState.rowSelection
        };

        for (let i = startIndex; i <= endIndex; i++) {
          const row = rows[i];

          if (row) {
            newRowSelection[row.id] = selected;
          }
        }

        onRowSelectionChange(newRowSelection);
      } else {
        onRowSelectionChange({
          ...currentState.rowSelection,
          [currentRow.id]: selected
        });
      }

      store.setState('lastClickedRowIndex', rowIndex);
    },
    [store, onRowSelectionChange]
  );

  const onRowHeightChange = useCallback(
    (updater: Updater<RowHeightValue>) => {
      const currentState = store.getState();
      const newRowHeight
        = typeof updater === 'function'
          ? updater(currentState.rowHeight)
          : updater;

      store.setState('rowHeight', newRowHeight);
      propsRef.current.onRowHeightChange?.(newRowHeight);
    },
    [store, propsRef]
  );

  const onDisplayModeChange = useCallback(
    (mode: DataGridDisplayMode) => {
      store.setState('displayMode', mode);
      propsRef.current.onDisplayModeChange?.(mode);
    },
    [store, propsRef]
  );

  const onColumnClick = useCallback(
    (columnId: string) => {
      if (!propsRef.current.enableColumnSelection) {
        onSelectionClear();

        return;
      }

      selectColumn(columnId);
    },
    [propsRef, selectColumn, onSelectionClear]
  );

  const onPasteDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        store.setState('pasteDialog', {
          open: false,
          rowsNeeded: 0,
          clipboardText: ''
        });
      }
    },
    [store]
  );

  const defaultColumn: Partial<ColumnDef<TData>> = useMemo(
    () => ({
      /*
       * Note: cell is rendered directly in DataGridRow to bypass flexRender's
       * unstable cell.getContext() (see TanStack Table issue #4794)
       */
      minSize: MIN_COLUMN_SIZE,
      maxSize: MAX_COLUMN_SIZE,
      filterFn: getFilterFn<TData>()
    }),
    []
  );

  const tableMeta = useMemo<TableMeta<TData>>(() => {
    return {
      ...propsRef.current.meta,
      dataGridRef,
      cellMapRef,
      get focusedCell() {
        return store.getState().focusedCell;
      },
      get editingCell() {
        return store.getState().editingCell;
      },
      get selectionState() {
        return store.getState().selectionState;
      },
      get searchOpen() {
        return store.getState().searchOpen;
      },
      get contextMenu() {
        return store.getState().contextMenu;
      },
      get pasteDialog() {
        return store.getState().pasteDialog;
      },
      get rowHeight() {
        return store.getState().rowHeight;
      },
      get displayMode() {
        return store.getState().displayMode;
      },
      get readOnly() {
        return propsRef.current.readOnly;
      },
      getIsCellSelected,
      getIsCellCut,
      getIsCellChanged,
      getIsSearchMatch,
      getIsActiveSearchMatch,
      getVisualRowIndex,
      onRowHeightChange,
      onDisplayModeChange,
      onRowSelect,
      onDataUpdate,
      onRowsDelete: propsRef.current.onRowsDelete ? onRowsDelete : undefined,
      onColumnClick,
      onCellClick,
      onCellDoubleClick,
      onCellMouseDown,
      onCellMouseEnter,
      onCellMouseUp,
      onCellContextMenu,
      onCellEditingStart,
      onCellEditingStop,
      onCellsCopy,
      onCellsCut,
      onCellsPaste,
      onSelectionClear,
      onFilesUpload: propsRef.current.onFilesUpload
        ? propsRef.current.onFilesUpload
        : undefined,
      onFilesDelete: propsRef.current.onFilesDelete
        ? propsRef.current.onFilesDelete
        : undefined,
      onContextMenuOpenChange,
      onPasteDialogOpenChange
    };
  }, [
    propsRef,
    store,
    getIsCellSelected,
    getIsCellCut,
    getIsCellChanged,
    getIsSearchMatch,
    getIsActiveSearchMatch,
    getVisualRowIndex,
    onRowHeightChange,
    onDisplayModeChange,
    onRowSelect,
    onDataUpdate,
    onRowsDelete,
    onColumnClick,
    onCellClick,
    onCellDoubleClick,
    onCellMouseDown,
    onCellMouseEnter,
    onCellMouseUp,
    onCellContextMenu,
    onCellEditingStart,
    onCellEditingStop,
    onCellsCopy,
    onCellsCut,
    onCellsPaste,
    onSelectionClear,
    onContextMenuOpenChange,
    onPasteDialogOpenChange
  ]);

  const getMemoizedCoreRowModel = useMemo(() => getCoreRowModel(), []);
  const getMemoizedFilteredRowModel = useMemo(
    () => getFilteredRowModel(),
    []
  );
  const getMemoizedSortedRowModel = useMemo(() => getSortedRowModel(), []);
  const getMemoizedGroupedRowModel = useMemo(
    () => getGroupedRowModel(),
    []
  );
  const getMemoizedExpandedRowModel = useMemo(
    () => getExpandedRowModel(),
    []
  );

  const tableState = useMemo<Partial<TableState>>(
    () => ({
      ...propsRef.current.state,
      sorting,
      columnFilters,
      rowSelection
    }),
    [
      propsRef,
      sorting,
      columnFilters,
      rowSelection
    ]
  );

  const tableOptions = useMemo<TableOptions<TData>>(() => {
    return {
      ...propsRef.current,
      data,
      columns: groupingAwareColumns,
      defaultColumn,
      initialState: propsRef.current.initialState,
      state: tableState,
      onRowSelectionChange,
      onSortingChange,
      onColumnFiltersChange,
      enableGrouping,
      groupedColumnMode: false,
      columnResizeMode: 'onChange',
      columnResizeDirection: dir,
      getCoreRowModel: getMemoizedCoreRowModel,
      getFilteredRowModel: getMemoizedFilteredRowModel,
      getGroupedRowModel: getMemoizedGroupedRowModel,
      getSortedRowModel: getMemoizedSortedRowModel,
      getExpandedRowModel: getMemoizedExpandedRowModel,
      meta: tableMeta
    };
  }, [
    propsRef,
    data,
    groupingAwareColumns,
    defaultColumn,
    tableState,
    dir,
    enableGrouping,
    onRowSelectionChange,
    onSortingChange,
    onColumnFiltersChange,
    getMemoizedCoreRowModel,
    getMemoizedFilteredRowModel,
    getMemoizedGroupedRowModel,
    getMemoizedSortedRowModel,
    getMemoizedExpandedRowModel,
    tableMeta
  ]);

  const table = useReactTable(tableOptions);

  if (!tableRef.current) {
    tableRef.current = table;
  }

  const { columnPinning: tableColumnPinning } = table.getState();

  const columnSizeVars = useMemo(() => {
    const headers = table.getFlatHeaders();
    const colSizes: { [key: string]: number } = {};

    for (const header of headers) {
      colSizes[`--header-${header.id}-size`] = header.getSize();
      colSizes[`--col-${header.column.id}-size`] = header.column.getSize();
    }

    return colSizes;
  }, [table]);

  const isFirefox = useSyncExternalStore(
    useCallback(() => () => {}, []),
    useCallback(() => {
      if (typeof window === 'undefined' || typeof navigator === 'undefined') {
        return false;
      }

      return navigator.userAgent.indexOf('Firefox') !== -1;
    }, []),
    useCallback(() => false, [])
  );

  const adjustLayout = useMemo(() => (
    isFirefox
    && ((tableColumnPinning.left?.length ?? 0) > 0
      || (tableColumnPinning.right?.length ?? 0) > 0)
  ), [isFirefox, tableColumnPinning]);

  const shouldMeasureRows = measureRows && !isFirefox;

  const rowVirtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => dataGridRef.current,
    estimateSize: () => rowHeightValue,
    overscan,
    measureElement: shouldMeasureRows
      ? element => element?.getBoundingClientRect().height
      : undefined
  });

  if (!rowVirtualizerRef.current) {
    rowVirtualizerRef.current = rowVirtualizer;
  }

  const onScrollToRow = useCallback(
    async (opts: Partial<CellPosition>) => {
      const rowIndex = opts?.rowIndex ?? 0;
      const columnId = opts?.columnId;

      focusGuardRef.current = true;

      const navigableIds = propsRef.current.columns
        .map((c) => {
          if (c.id) return c.id;
          if ('accessorKey' in c) return c.accessorKey as string;

          return undefined;
        })
        .filter((id): id is string => Boolean(id))
        .filter(c => !NON_NAVIGABLE_COLUMN_IDS.has(c));

      const targetColumnId = columnId ?? navigableIds[0];

      if (!targetColumnId) {
        releaseFocusGuard(true);

        return;
      }

      async function onScrollAndFocus(retryCount: number) {
        if (!targetColumnId) return;
        const currentRowCount = propsRef.current.data.length;

        if (rowIndex >= currentRowCount && retryCount > 0) {
          await new Promise(resolve => setTimeout(resolve, 50));
          await onScrollAndFocus(retryCount - 1);

          return;
        }

        const safeRowIndex = Math.min(
          rowIndex,
          Math.max(0, currentRowCount - 1)
        );

        const isBottomHalf = safeRowIndex > currentRowCount / 2;

        rowVirtualizer.scrollToIndex(safeRowIndex, {
          align: isBottomHalf ? 'end' : 'start'
        });

        await new Promise(resolve => requestAnimationFrame(resolve));

        const container = dataGridRef.current;
        const targetRow = rowMapRef.current.get(safeRowIndex);

        if (container && targetRow) {
          const containerRect = container.getBoundingClientRect();
          const headerHeight
            = headerRef.current?.getBoundingClientRect().height ?? 0;
          const footerHeight
            = footerRef.current?.getBoundingClientRect().height ?? 0;

          const viewportTop = containerRect.top + headerHeight + VIEWPORT_OFFSET;
          const viewportBottom
            = containerRect.bottom - footerHeight - VIEWPORT_OFFSET;

          const rowRect = targetRow.getBoundingClientRect();
          const isFullyVisible
            = rowRect.top >= viewportTop && rowRect.bottom <= viewportBottom;

          if (!isFullyVisible) {
            if (rowRect.top < viewportTop) {
              container.scrollTop -= viewportTop - rowRect.top;
            } else if (rowRect.bottom > viewportBottom) {
              container.scrollTop += rowRect.bottom - viewportBottom;
            }
          }
        }

        store.batch(() => {
          store.setState('focusedCell', {
            rowIndex: safeRowIndex,
            columnId: targetColumnId
          });
          store.setState('editingCell', null);
        });

        const cellKey = getCellKey(safeRowIndex, targetColumnId);
        const cellElement = cellMapRef.current.get(cellKey);

        if (cellElement) {
          cellElement.focus();
          releaseFocusGuard();
        } else if (retryCount > 0) {
          await new Promise(resolve => requestAnimationFrame(resolve));
          await onScrollAndFocus(retryCount - 1);
        } else {
          dataGridRef.current?.focus();
          releaseFocusGuard();
        }
      }

      await onScrollAndFocus(SCROLL_SYNC_RETRY_COUNT);
    },
    [
      rowVirtualizer,
      propsRef,
      store,
      releaseFocusGuard
    ]
  );

  const onRowAdd = useCallback(
    async (event?: MouseEvent<HTMLDivElement>) => {
      if (propsRef.current.readOnly || !propsRef.current.onRowAdd) return;

      const initialRowCount = propsRef.current.data.length;

      let result: Partial<CellPosition> | null;

      try {
        result = await propsRef.current.onRowAdd(event);
      } catch {
        return;
      }

      if (result === null || event?.defaultPrevented) return;

      onSelectionClear();

      /*
       * Trust the returned rowIndex from the callback
       * onScrollToRow will handle retries if the row isn't rendered yet
       */
      const targetRowIndex = result.rowIndex ?? initialRowCount;
      const targetColumnId = result.columnId;

      onScrollToRow({
        rowIndex: targetRowIndex,
        columnId: targetColumnId
      });
    },
    [propsRef, onScrollToRow, onSelectionClear]
  );

  const onDataGridKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const currentState = store.getState();
      const {
        key, ctrlKey, metaKey, shiftKey, altKey
      } = event;
      const isCtrlPressed = ctrlKey || metaKey;

      if (
        propsRef.current.enableSearch
        && isCtrlPressed
        && !shiftKey
        && key === SEARCH_SHORTCUT_KEY
      ) {
        event.preventDefault();
        onSearchOpenChange(true);

        return;
      }

      if (
        propsRef.current.enableSearch
        && currentState.searchOpen
        && !currentState.editingCell
      ) {
        if (key === 'Enter') {
          event.preventDefault();
          if (shiftKey) {
            onNavigateToPrevMatch();
          } else {
            onNavigateToNextMatch();
          }

          return;
        }
        if (key === 'Escape') {
          event.preventDefault();
          onSearchOpenChange(false);

          return;
        }

        return;
      }

      /*
       * Cell editing keyboard events (Enter, Tab, Escape) are handled by the cell variants
       * to ensure proper value commitment before navigation
       */
      if (currentState.editingCell) return;

      if (
        isCtrlPressed
        && (key === 'Backspace' || key === 'Delete')
        && !propsRef.current.readOnly
        && propsRef.current.onRowsDelete
      ) {
        const rowIndices = new Set<number>();

        const selectedRowIds = Object.keys(currentState.rowSelection);

        if (selectedRowIds.length > 0) {
          const currentTable = tableRef.current;
          const rows = currentTable?.getRowModel().rows ?? [];

          for (const row of rows) {
            if (currentState.rowSelection[row.id]) {
              rowIndices.add(row.index);
            }
          }
        } else if (currentState.selectionState.fullSelection) {
          const rowCount = tableRef.current?.getRowModel().rows.length ?? 0;

          for (let i = 0; i < rowCount; i++) {
            rowIndices.add(i);
          }
        } else if (currentState.selectionState.selectedCells.size > 0) {
          for (const cellKey of currentState.selectionState.selectedCells) {
            const { rowIndex } = parseCellKey(cellKey);

            rowIndices.add(rowIndex);
          }
        } else if (currentState.focusedCell) {
          rowIndices.add(currentState.focusedCell.rowIndex);
        }

        if (rowIndices.size > 0) {
          event.preventDefault();
          onRowsDelete(Array.from(rowIndices));
        }

        return;
      }

      if (!currentState.focusedCell) return;

      let direction: NavigationDirection | null = null;

      if (isCtrlPressed && !shiftKey && key === 'a') {
        event.preventDefault();
        selectAll();

        return;
      }

      if (isCtrlPressed && !shiftKey && key === 'c') {
        event.preventDefault();
        onCellsCopy();

        return;
      }

      if (
        isCtrlPressed
        && !shiftKey
        && key === 'x'
        && !propsRef.current.readOnly
      ) {
        event.preventDefault();
        onCellsCut();

        return;
      }

      if (
        propsRef.current.enablePaste
        && isCtrlPressed
        && !shiftKey
        && key === 'v'
        && !propsRef.current.readOnly
      ) {
        event.preventDefault();
        onCellsPaste();

        return;
      }

      if (
        (key === 'Delete' || key === 'Backspace')
        && !isCtrlPressed
        && !propsRef.current.readOnly
      ) {
        let cellsToClear: Array<string> = [];

        if (currentState.selectionState.fullSelection) {
          const rows = tableRef.current?.getRowModel().rows ?? [];
          const totalCells = rows.length * columnIds.length;

          if (totalCells > maxSelectCells) {
            toast.error(
              `Clear operation limited to ${maxSelectCells.toLocaleString()} cells.`
            );

            return;
          }

          for (let r = 0; r < rows.length; r++) {
            for (const columnId of columnIds) {
              cellsToClear.push(getCellKey(r, columnId));
            }
          }
        } else if (currentState.selectionState.selectedCells.size > 0) {
          cellsToClear = Array.from(currentState.selectionState.selectedCells);
        } else if (currentState.focusedCell) {
          cellsToClear = [
            getCellKey(
              currentState.focusedCell.rowIndex,
              currentState.focusedCell.columnId
            )
          ];
        }

        if (cellsToClear.length > 0) {
          event.preventDefault();

          const updates: Array<{
            rowIndex: number;
            columnId: string;
            value: unknown;
          }> = [];

          const currentTable = tableRef.current;
          const tableColumns = currentTable?.getAllColumns() ?? [];
          const columnById = new Map(tableColumns.map(c => [c.id, c]));

          for (const cellKey of cellsToClear) {
            const { rowIndex, columnId } = parseCellKey(cellKey);
            const column = columnById.get(columnId);
            const cellVariant = column?.columnDef?.meta?.cell?.variant;
            const emptyValue = getEmptyCellValue(cellVariant);

            updates.push({ rowIndex, columnId, value: emptyValue });
          }

          onDataUpdate(updates);

          if (
            currentState.selectionState.fullSelection
            || currentState.selectionState.selectedCells.size > 0
          ) {
            onSelectionClear();
          }

          if (currentState.cutCells.size > 0) {
            store.setState('cutCells', new Set());
          }
        }

        return;
      }

      if (
        key === 'Enter'
        && shiftKey
        && !propsRef.current.readOnly
        && propsRef.current.onRowAdd
      ) {
        event.preventDefault();
        const initialRowCount = propsRef.current.data.length;
        const currentColumnId = currentState.focusedCell.columnId;

        Promise.resolve(propsRef.current.onRowAdd())
          .then((result) => {
            if (result === null) return;

            onSelectionClear();

            const targetRowIndex = result.rowIndex ?? initialRowCount;
            const targetColumnId = result.columnId ?? currentColumnId;

            onScrollToRow({
              rowIndex: targetRowIndex,
              columnId: targetColumnId
            });
          })
          .catch(() => {
          });

        return;
      }

      switch (key) {
        case 'ArrowUp':
          if (altKey && !isCtrlPressed && !shiftKey) {
            direction = 'pageup';
          } else if (isCtrlPressed && shiftKey) {
            const selectionEdge
              = currentState.selectionState.selectionRange?.end
                || currentState.focusedCell;
            const currentColIndex = navigableColumnIds.indexOf(
              selectionEdge.columnId
            );
            const selectionStart
              = currentState.selectionState.selectionRange?.start
                || currentState.focusedCell;

            selectRange(selectionStart, {
              rowIndex: 0,
              columnId:
                navigableColumnIds[currentColIndex] ?? selectionEdge.columnId
            });

            const rowVirtualizer = rowVirtualizerRef.current;

            if (rowVirtualizer) {
              rowVirtualizer.scrollToIndex(0, { align: 'start' });
            }

            restoreFocus(dataGridRef.current);

            event.preventDefault();

            return;
          } else if (isCtrlPressed && !shiftKey) {
            direction = 'ctrl+up';
          } else {
            direction = 'up';
          }
          break;

        case 'ArrowDown':
          if (altKey && !isCtrlPressed && !shiftKey) {
            direction = 'pagedown';
          } else if (isCtrlPressed && shiftKey) {
            const rowCount
              = tableRef.current?.getRowModel().rows.length
                || propsRef.current.data.length;
            const selectionEdge
              = currentState.selectionState.selectionRange?.end
                || currentState.focusedCell;
            const currentColIndex = navigableColumnIds.indexOf(
              selectionEdge.columnId
            );
            const selectionStart
              = currentState.selectionState.selectionRange?.start
                || currentState.focusedCell;

            selectRange(selectionStart, {
              rowIndex: Math.max(0, rowCount - 1),
              columnId:
                navigableColumnIds[currentColIndex] ?? selectionEdge.columnId
            });

            const rowVirtualizer = rowVirtualizerRef.current;

            if (rowVirtualizer) {
              rowVirtualizer.scrollToIndex(Math.max(0, rowCount - 1), {
                align: 'end'
              });
            }

            restoreFocus(dataGridRef.current);

            event.preventDefault();

            return;
          } else if (isCtrlPressed && !shiftKey) {
            direction = 'ctrl+down';
          } else {
            direction = 'down';
          }
          break;

        case 'ArrowLeft':
          if (isCtrlPressed && shiftKey) {
            const selectionEdge
              = currentState.selectionState.selectionRange?.end
                || currentState.focusedCell;
            const selectionStart
              = currentState.selectionState.selectionRange?.start
                || currentState.focusedCell;
            const targetColumnId
              = dir === 'rtl'
                ? navigableColumnIds[navigableColumnIds.length - 1]
                : navigableColumnIds[0];

            if (targetColumnId) {
              selectRange(selectionStart, {
                rowIndex: selectionEdge.rowIndex,
                columnId: targetColumnId
              });

              const container = dataGridRef.current;
              const cellKey = getCellKey(selectionEdge.rowIndex, targetColumnId);
              const targetCell = cellMapRef.current.get(cellKey);

              if (container && targetCell) {
                scrollCellIntoView({
                  container,
                  targetCell,
                  tableRef,
                  viewportOffset: VIEWPORT_OFFSET,
                  direction: 'home',
                  isRtl: dir === 'rtl'
                });
              }

              restoreFocus(container);
            }
            event.preventDefault();

            return;
          } else if (isCtrlPressed && !shiftKey) {
            direction = 'home';
          } else {
            direction = 'left';
          }
          break;

        case 'ArrowRight':
          if (isCtrlPressed && shiftKey) {
            const selectionEdge
              = currentState.selectionState.selectionRange?.end
                || currentState.focusedCell;
            const selectionStart
              = currentState.selectionState.selectionRange?.start
                || currentState.focusedCell;
            const targetColumnId
              = dir === 'rtl'
                ? navigableColumnIds[0]
                : navigableColumnIds[navigableColumnIds.length - 1];

            if (targetColumnId) {
              selectRange(selectionStart, {
                rowIndex: selectionEdge.rowIndex,
                columnId: targetColumnId
              });

              const container = dataGridRef.current;
              const cellKey = getCellKey(selectionEdge.rowIndex, targetColumnId);
              const targetCell = cellMapRef.current.get(cellKey);

              if (container && targetCell) {
                scrollCellIntoView({
                  container,
                  targetCell,
                  tableRef,
                  viewportOffset: VIEWPORT_OFFSET,
                  direction: 'end',
                  isRtl: dir === 'rtl'
                });
              }

              restoreFocus(container);
            }
            event.preventDefault();

            return;
          } else if (isCtrlPressed && !shiftKey) {
            direction = 'end';
          } else {
            direction = 'right';
          }
          break;

        case 'Home':
          direction = isCtrlPressed ? 'ctrl+home' : 'home';
          break;

        case 'End':
          direction = isCtrlPressed ? 'ctrl+end' : 'end';
          break;

        case 'PageUp':
          direction = altKey ? 'pageleft' : 'pageup';
          break;

        case 'PageDown':
          direction = altKey ? 'pageright' : 'pagedown';
          break;

        case 'Escape':
          event.preventDefault();
          if (
            currentState.selectionState.fullSelection
            || currentState.selectionState.selectedCells.size > 0
            || Object.keys(currentState.rowSelection).length > 0
          ) {
            onSelectionClear();
          } else {
            blurCell();
          }

          return;

        case 'Tab':
          event.preventDefault();
          if (dir === 'rtl') {
            direction = event.shiftKey ? 'right' : 'left';
          } else {
            direction = event.shiftKey ? 'left' : 'right';
          }
          break;
      }

      if (direction) {
        event.preventDefault();

        if (shiftKey && key !== 'Tab' && currentState.focusedCell) {
          const selectionEdge
            = currentState.selectionState.selectionRange?.end
              || currentState.focusedCell;

          const currentColIndex = navigableColumnIds.indexOf(
            selectionEdge.columnId
          );
          let newRowIndex = selectionEdge.rowIndex;
          let newColumnId = selectionEdge.columnId;

          const isRtl = dir === 'rtl';

          const rowCount
            = tableRef.current?.getRowModel().rows.length
              || propsRef.current.data.length;

          switch (direction) {
            case 'up':
              newRowIndex = Math.max(0, selectionEdge.rowIndex - 1);
              break;

            case 'down':
              newRowIndex = Math.min(rowCount - 1, selectionEdge.rowIndex + 1);
              break;

            case 'left':
              if (isRtl) {
                if (currentColIndex < navigableColumnIds.length - 1) {
                  const nextColumnId = navigableColumnIds[currentColIndex + 1];

                  if (nextColumnId) newColumnId = nextColumnId;
                }
              } else {
                if (currentColIndex > 0) {
                  const prevColumnId = navigableColumnIds[currentColIndex - 1];

                  if (prevColumnId) newColumnId = prevColumnId;
                }
              }
              break;

            case 'right':
              if (isRtl) {
                if (currentColIndex > 0) {
                  const prevColumnId = navigableColumnIds[currentColIndex - 1];

                  if (prevColumnId) newColumnId = prevColumnId;
                }
              } else {
                if (currentColIndex < navigableColumnIds.length - 1) {
                  const nextColumnId = navigableColumnIds[currentColIndex + 1];

                  if (nextColumnId) newColumnId = nextColumnId;
                }
              }
              break;

            case 'home':
              if (navigableColumnIds.length > 0) {
                newColumnId = navigableColumnIds[0] ?? newColumnId;
              }
              break;

            case 'end':
              if (navigableColumnIds.length > 0) {
                newColumnId
                  = navigableColumnIds[navigableColumnIds.length - 1]
                    ?? newColumnId;
              }
              break;
          }

          const selectionStart
            = currentState.selectionState.selectionRange?.start
              || currentState.focusedCell;

          selectRange(selectionStart, {
            rowIndex: newRowIndex,
            columnId: newColumnId
          });

          const container = dataGridRef.current;
          const targetRow = rowMapRef.current.get(newRowIndex);
          const cellKey = getCellKey(newRowIndex, newColumnId);
          const targetCell = cellMapRef.current.get(cellKey);

          if (
            newRowIndex !== selectionEdge.rowIndex
            && (direction === 'up' || direction === 'down')
          ) {
            if (container && targetRow) {
              const containerRect = container.getBoundingClientRect();
              const headerHeight
                = headerRef.current?.getBoundingClientRect().height ?? 0;
              const footerHeight
                = footerRef.current?.getBoundingClientRect().height ?? 0;

              const viewportTop
                = containerRect.top + headerHeight + VIEWPORT_OFFSET;
              const viewportBottom
                = containerRect.bottom - footerHeight - VIEWPORT_OFFSET;

              const rowRect = targetRow.getBoundingClientRect();
              const isFullyVisible
                = rowRect.top >= viewportTop && rowRect.bottom <= viewportBottom;

              if (!isFullyVisible) {
                const scrollNeeded
                  = direction === 'down'
                    ? rowRect.bottom - viewportBottom
                    : viewportTop - rowRect.top;

                if (direction === 'down') {
                  container.scrollTop += scrollNeeded;
                } else {
                  container.scrollTop -= scrollNeeded;
                }

                restoreFocus(container);
              }
            } else {
              const rowVirtualizer = rowVirtualizerRef.current;

              if (rowVirtualizer) {
                const align = direction === 'up' ? 'start' : 'end';

                rowVirtualizer.scrollToIndex(newRowIndex, { align });

                restoreFocus(container);
              }
            }
          }

          if (
            newColumnId !== selectionEdge.columnId
            && (direction === 'left'
              || direction === 'right'
              || direction === 'home'
              || direction === 'end')
          ) {
            if (container && targetCell) {
              scrollCellIntoView({
                container,
                targetCell,
                tableRef,
                viewportOffset: VIEWPORT_OFFSET,
                direction,
                isRtl
              });
            }
          }
        } else {
          if (
            currentState.selectionState.fullSelection
            || currentState.selectionState.selectedCells.size > 0
          ) {
            onSelectionClear();
          }
          navigateCell(direction);
        }
      }
    },
    [
      dir,
      store,
      propsRef,
      blurCell,
      navigateCell,
      selectAll,
      onCellsCopy,
      onCellsCut,
      onCellsPaste,
      onDataUpdate,
      onSelectionClear,
      navigableColumnIds,
      selectRange,
      onSearchOpenChange,
      onNavigateToNextMatch,
      onNavigateToPrevMatch,
      onRowsDelete,
      restoreFocus,
      onScrollToRow,
      columnIds,
      maxSelectCells
    ]
  );

  const searchState = useMemo<SearchState | undefined>(() => {
    if (!propsRef.current.enableSearch) return undefined;

    return {
      searchMatches,
      matchIndex,
      searchOpen,
      onSearchOpenChange,
      searchQuery,
      onSearchQueryChange,
      onSearch,
      onNavigateToNextMatch,
      onNavigateToPrevMatch
    };
  }, [
    propsRef,
    searchMatches,
    matchIndex,
    searchOpen,
    onSearchOpenChange,
    searchQuery,
    onSearchQueryChange,
    onSearch,
    onNavigateToNextMatch,
    onNavigateToPrevMatch
  ]);

  useEffect(() => {
    const dataGridElement = dataGridRef.current;

    if (!dataGridElement) return;

    dataGridElement.addEventListener('keydown', onDataGridKeyDown);

    return () => {
      dataGridElement.removeEventListener('keydown', onDataGridKeyDown);
    };
  }, [dataGridRef, onDataGridKeyDown]);

  useEffect(() => {
    function onGlobalKeyDown(event: KeyboardEvent) {
      const dataGridElement = dataGridRef.current;

      if (!dataGridElement) return;

      const { target } = event;

      if (!(target instanceof HTMLElement)) return;

      const {
        key, ctrlKey, metaKey, shiftKey
      } = event;
      const isCommandPressed = ctrlKey || metaKey;

      if (
        propsRef.current.enableSearch
        && isCommandPressed
        && !shiftKey
        && key === SEARCH_SHORTCUT_KEY
      ) {
        const isInInput
          = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
        const isInDataGrid = dataGridElement.contains(target);
        const isInSearchInput = target.closest('[role="search"]') !== null;

        if (isInDataGrid || isInSearchInput || !isInInput) {
          event.preventDefault();
          event.stopPropagation();

          const nextSearchOpen = !store.getState().searchOpen;

          onSearchOpenChange(nextSearchOpen);

          if (nextSearchOpen && !isInDataGrid && !isInSearchInput) {
            requestAnimationFrame(() => {
              dataGridElement.focus();
            });
          }

          return;
        }
      }

      const isInDataGrid = dataGridElement.contains(target);

      if (!isInDataGrid) return;

      if (key === 'Escape') {
        const currentState = store.getState();
        const hasSelections
          = currentState.selectionState.fullSelection
            || currentState.selectionState.selectedCells.size > 0
            || Object.keys(currentState.rowSelection).length > 0;

        if (hasSelections) {
          event.preventDefault();
          event.stopPropagation();
          onSelectionClear();
        }
      }
    }

    window.addEventListener('keydown', onGlobalKeyDown, true);

    return () => {
      window.removeEventListener('keydown', onGlobalKeyDown, true);
    };
  }, [
    propsRef,
    onSearchOpenChange,
    store,
    onSelectionClear
  ]);

  useEffect(() => {
    const currentState = store.getState();
    const { autoFocus } = propsRef.current;

    if (
      autoFocus
      && data.length > 0
      && columns.length > 0
      && !currentState.focusedCell
    ) {
      if (navigableColumnIds.length > 0) {
        const rafId = requestAnimationFrame(() => {
          if (typeof autoFocus === 'object') {
            const { rowIndex, columnId } = autoFocus;

            if (columnId) {
              focusCell(rowIndex ?? 0, columnId);
            }

            return;
          }

          const firstColumnId = navigableColumnIds[0];

          if (firstColumnId) {
            focusCell(0, firstColumnId);
          }
        });

        return () => cancelAnimationFrame(rafId);
      }
    }
  }, [
    store,
    propsRef,
    data,
    columns,
    navigableColumnIds,
    focusCell
  ]);

  useEffect(() => {
    const container = dataGridRef.current;

    if (!container) return;

    function onFocusOut(event: FocusEvent) {
      if (focusGuardRef.current) return;

      const currentContainer = dataGridRef.current;

      if (!currentContainer) return;

      const currentState = store.getState();

      if (!currentState.focusedCell || currentState.editingCell) return;

      const { relatedTarget } = event;

      const isFocusMovingOutsideGrid
        = !relatedTarget || !currentContainer.contains(relatedTarget as Node);

      const isFocusMovingToPopover = getIsInPopover(relatedTarget);

      if (isFocusMovingOutsideGrid && !isFocusMovingToPopover) {
        const { rowIndex, columnId } = currentState.focusedCell;
        const cellKey = getCellKey(rowIndex, columnId);
        const cellElement = cellMapRef.current.get(cellKey);

        requestAnimationFrame(() => {
          if (focusGuardRef.current) return;

          if (cellElement && document.body.contains(cellElement)) {
            cellElement.focus();
          } else {
            currentContainer.focus();
          }
        });
      }
    }

    container.addEventListener('focusout', onFocusOut);

    return () => {
      container.removeEventListener('focusout', onFocusOut);
    };
  }, [dataGridRef, cellMapRef, store]);

  useEffect(() => {
    function onOutsideClick(event: globalThis.MouseEvent) {
      if (event.button === 2) {
        return;
      }

      if (
        dataGridRef.current
        && !dataGridRef.current.contains(event.target as Node)
      ) {
        const elements = document.elementsFromPoint(
          event.clientX,
          event.clientY
        );

        const isInsidePopover = elements.some(element => getIsInPopover(element));

        if (!isInsidePopover) {
          blurCell();
          const currentState = store.getState();

          if (
            currentState.selectionState.fullSelection
            || currentState.selectionState.selectedCells.size > 0
            || Object.keys(currentState.rowSelection).length > 0
          ) {
            onSelectionClear();
          }
        }
      }
    }

    document.addEventListener('mousedown', onOutsideClick);

    return () => {
      document.removeEventListener('mousedown', onOutsideClick);
    };
  }, [
    dataGridRef,
    store,
    blurCell,
    onSelectionClear
  ]);

  useEffect(() => {
    function onSelectStart(event: Event) {
      event.preventDefault();
    }

    function onContextMenu(event: Event) {
      event.preventDefault();
    }

    function onCleanup() {
      document.removeEventListener('selectstart', onSelectStart);
      document.removeEventListener('contextmenu', onContextMenu);
      document.body.style.userSelect = '';
    }

    const onUnsubscribe = store.subscribe(() => {
      const currentState = store.getState();

      if (currentState.selectionState.isSelecting) {
        document.addEventListener('selectstart', onSelectStart);
        document.addEventListener('contextmenu', onContextMenu);
        document.body.style.userSelect = 'none';
      } else {
        onCleanup();
      }
    });

    return () => {
      onCleanup();
      onUnsubscribe();
    };
  }, [store]);

  useIsomorphicLayoutEffect(() => {
    const rafId = requestAnimationFrame(() => {
      rowVirtualizer.measure();
    });

    return () => cancelAnimationFrame(rafId);
  }, [
    rowHeight,
    table.getState().columnFilters,
    table.getState().columnOrder,
    table.getState().columnPinning,
    table.getState().columnSizing,
    table.getState().columnVisibility,
    table.getState().expanded,
    table.getState().globalFilter,
    table.getState().grouping,
    table.getState().rowSelection,
    table.getState().sorting
  ]);

  const virtualTotalSize = rowVirtualizer.getTotalSize();
  const virtualItems = rowVirtualizer.getVirtualItems();
  const measureElement = shouldMeasureRows ? rowVirtualizer.measureElement : undefined;

  return useMemo(
    () => ({
      dataGridRef,
      headerRef,
      rowMapRef,
      footerRef,
      dir,
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
      onRowAdd: propsRef.current.onRowAdd ? onRowAdd : undefined,
      adjustLayout,
      changedCellsByRowId:
        propsRef.current.enableChangeTracking ? changedCellsByRowId : null,
      changedRowCount: propsRef.current.enableChangeTracking
        ? changedCellsByRowId.size
        : 0,
      onChangesSave: propsRef.current.enableChangeTracking
        ? handleChangesSave
        : undefined,
      onChangesDiscard: propsRef.current.enableChangeTracking
        ? handleChangesDiscard
        : undefined,
      changeMapRef: propsRef.current.enableChangeTracking
        ? changeMapRef
        : undefined,
      getRowLabel: propsRef.current.getRowLabel
    }),
    [
      propsRef,
      dir,
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
      onRowAdd,
      adjustLayout,
      changedCellsByRowId,
      handleChangesSave,
      handleChangesDiscard
    ]
  );
}

export {
  useDataGrid,
  type UseDataGridProps
};