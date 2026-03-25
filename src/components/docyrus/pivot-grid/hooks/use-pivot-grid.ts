import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnPinningState,
  type ColumnSizingState
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';

import {
  buildPivotGridCsv,
  downloadTextFile,
  exportPivotGridExcel,
  exportPivotGridPdf,
  type PivotGridExportSnapshot
} from '../lib/pivot-grid-export';
import {
  buildPivotGridHeaderRows,
  buildPivotGridStructure,
  buildPivotGridView
} from '../lib/pivot-grid-model';
import {
  compilePivotGridCellColorRules,
  evaluatePivotGridCellColorRules
} from '../lib/pivot-grid-color-rules';
import {
  type PivotGridController,
  type PivotGridDrilldownState,
  type PivotGridLeafColumn,
  type PivotGridPinPosition,
  type PivotGridRenderedCell,
  type PivotGridRenderedRow,
  type UsePivotGridProps
} from '../types';

const OVERSCAN = 8;
const DEFAULT_ROW_HEIGHT = 40;
const DEFAULT_VALUE_COLUMN_WIDTH = 136;
const DEFAULT_SUBTOTAL_COLUMN_WIDTH = 144;
const DEFAULT_GRAND_TOTAL_COLUMN_WIDTH = 156;
const DEFAULT_ROW_HEADER_WIDTH = 220;
const DEFAULT_CHILD_ROW_HEADER_WIDTH = 180;
const GRAND_TOTAL_LABEL = 'Grand Total';

function createRowHeaderColumnId(index: number): string {
  return `__pivot_row_header_${index}`;
}

function arraysEqual(left: Array<string>, right: Array<string>): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}

function createExpandedState(
  ids: Array<string>,
  initial?: Record<string, boolean>
): Record<string, boolean> {
  const nextState: Record<string, boolean> = {};

  ids.forEach((id) => {
    nextState[id] = initial?.[id] ?? true;
  });

  return nextState;
}

function reconcileExpandedState(
  previousState: Record<string, boolean>,
  ids: Array<string>
): Record<string, boolean> {
  const nextState: Record<string, boolean> = {};

  ids.forEach((id) => {
    nextState[id] = previousState[id] ?? true;
  });

  return nextState;
}

function deriveValueColumnWidth<TData>(
  column: PivotGridLeafColumn<TData>
): number {
  switch (column.kind) {
    case 'grand-total':
      return DEFAULT_GRAND_TOTAL_COLUMN_WIDTH;

    case 'subtotal':
      return DEFAULT_SUBTOTAL_COLUMN_WIDTH;

    default:
      return DEFAULT_VALUE_COLUMN_WIDTH;
  }
}

function buildDefaultDrilldownColumns<TData>(
  rows: Array<TData>
): Array<ColumnDef<TData>> {
  const sampleRow = rows[0];

  if (!sampleRow || typeof sampleRow !== 'object') {
    return [];
  }

  return Object.keys(sampleRow as Record<string, unknown>).map((key) => {
    const value = (sampleRow as Record<string, unknown>)[key];
    const variant
      = typeof value === 'number' ? 'number' : typeof value === 'boolean' ? 'checkbox' : 'short-text';

    return {
      id: key,
      accessorFn: (row: TData) => {
        if (row && typeof row === 'object' && key in (row as Record<string, unknown>)) {
          return (row as Record<string, unknown>)[key];
        }

        return '';
      },
      header: key.replaceAll('_', ' '),
      meta: {
        label: key.replaceAll('_', ' '),
        cell: { variant }
      }
    } as ColumnDef<TData>;
  });
}

export function usePivotGrid<TData>(
  props: UsePivotGridProps<TData>
): PivotGridController<TData> {
  const {
    data,
    rowDimensions,
    columnDimensions,
    measures,
    getRowId,
    initialState,
    cellColorRules,
    drilldown,
    height = 600,
    className
  } = props;

  const dataGridRef = useRef<HTMLDivElement>(null);
  const getRowIdRef = useRef(getRowId);

  getRowIdRef.current = getRowId;

  const rowHeaderColumnIds = useMemo(
    () => rowDimensions.map((_, index) => createRowHeaderColumnId(index)),
    [rowDimensions]
  );

  const structure = useMemo(
    () => buildPivotGridStructure({
      data,
      rowDimensions,
      columnDimensions,
      measures,
      getRowId: getRowIdRef.current
    }),
    [
      data,
      rowDimensions,
      columnDimensions,
      measures
    ]
  );

  const [expandedRowIds, setExpandedRowIds] = useState<Record<string, boolean>>(
    () => createExpandedState(
      structure.allRowToggleIds,
      initialState?.expandedRowIds
    )
  );
  const [expandedColumnIds, setExpandedColumnIds] = useState<Record<string, boolean>>(
    () => createExpandedState(
      structure.allColumnToggleIds,
      initialState?.expandedColumnIds
    )
  );
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>(
    () => ({
      left: [
        ...rowHeaderColumnIds,
        ...((initialState?.columnPinning?.left ?? []).filter(
          columnId => !rowHeaderColumnIds.includes(columnId)
        ))
      ],
      right: (initialState?.columnPinning?.right ?? []).filter(
        columnId => !rowHeaderColumnIds.includes(columnId)
      )
    })
  );
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>(
    () => initialState?.columnSizing ?? {}
  );
  const [drilldownState, setDrilldownState] = useState<PivotGridDrilldownState<TData>>({
    open: false,
    cell: null
  });

  useEffect(() => {
    setExpandedRowIds((previousState) => {
      const nextState = reconcileExpandedState(
        previousState,
        structure.allRowToggleIds
      );

      return JSON.stringify(previousState) === JSON.stringify(nextState) ? previousState : nextState;
    });
  }, [structure.allRowToggleIds]);

  useEffect(() => {
    setExpandedColumnIds((previousState) => {
      const nextState = reconcileExpandedState(
        previousState,
        structure.allColumnToggleIds
      );

      return JSON.stringify(previousState) === JSON.stringify(nextState) ? previousState : nextState;
    });
  }, [structure.allColumnToggleIds]);

  useEffect(() => {
    const rowHeaderSet = new Set(rowHeaderColumnIds);

    setColumnPinning((previousState) => {
      const nextLeft = [
        ...rowHeaderColumnIds,
        ...((previousState.left ?? []).filter(
          columnId => !rowHeaderSet.has(columnId)
        ))
      ];
      const nextRight = (previousState.right ?? []).filter(
        columnId => !rowHeaderSet.has(columnId)
      );

      if (
        arraysEqual(nextLeft, previousState.left ?? [])
        && arraysEqual(nextRight, previousState.right ?? [])
      ) {
        return previousState;
      }

      return {
        left: nextLeft,
        right: nextRight
      };
    });
  }, [rowHeaderColumnIds]);

  useEffect(() => {
    if (!drilldownState.open) {
      return;
    }

    setDrilldownState((previousState) => {
      if (!previousState.cell) {
        return previousState;
      }

      const nextCell = previousState.cell.rawRowIndices.every(
        rawRowIndex => rawRowIndex < structure.data.length
      ) ? previousState.cell : null;

      return nextCell ? previousState : {
        open: false,
        cell: null
      };
    });
  }, [drilldownState.open, structure.data.length]);

  const viewModel = useMemo(
    () => buildPivotGridView({
      structure,
      expandedRowIds,
      expandedColumnIds
    }),
    [structure, expandedRowIds, expandedColumnIds]
  );

  const valueColumnsById = useMemo(
    () => new Map(viewModel.visibleLeafColumns.map(column => [column.id, column])),
    [viewModel.visibleLeafColumns]
  );

  const columns = useMemo<Array<ColumnDef<PivotGridRenderedRow<TData>>>>(
    () => [
      ...rowDimensions.map((dimension, index) => ({
        id: rowHeaderColumnIds[index] ?? createRowHeaderColumnId(index),
        accessorFn: (row: PivotGridRenderedRow<TData>) => row.headerCells[index]?.label ?? '',
        header: dimension.label,
        size: index === 0 ? DEFAULT_ROW_HEADER_WIDTH : DEFAULT_CHILD_ROW_HEADER_WIDTH,
        minSize: 120,
        maxSize: 360,
        enableHiding: false,
        enableResizing: true,
        enablePinning: false
      })),
      ...viewModel.visibleLeafColumns.map(column => ({
        id: column.id,
        accessorFn: (row: PivotGridRenderedRow<TData>) => {
          return row.cellMap.get(column.id)?.formattedValue ?? '';
        },
        header: column.headerPath[column.headerPath.length - 1] ?? column.measure.label,
        size: deriveValueColumnWidth(column),
        minSize: 92,
        maxSize: 420,
        enableHiding: false,
        enableResizing: true,
        enablePinning: true
      }))
    ],
    [rowDimensions, rowHeaderColumnIds, viewModel.visibleLeafColumns]
  );

  const table = useReactTable({
    data: viewModel.visibleRows,
    columns,
    state: {
      columnPinning,
      columnSizing
    },
    onColumnPinningChange: setColumnPinning,
    onColumnSizingChange: setColumnSizing,
    enableColumnPinning: true,
    columnResizeMode: 'onChange',
    getCoreRowModel: getCoreRowModel()
  });

  const visibleLeafTableColumns = table.getVisibleLeafColumns();
  const valueColumnIds = useMemo(
    () => visibleLeafTableColumns
      .map(column => column.id)
      .filter(columnId => !rowHeaderColumnIds.includes(columnId)),
    [visibleLeafTableColumns, rowHeaderColumnIds]
  );

  const pinPositionByColumnId = useMemo(() => {
    const map = new Map<string, PivotGridPinPosition>();

    valueColumnIds.forEach((columnId) => {
      map.set(columnId, table.getColumn(columnId)?.getIsPinned() ?? false);
    });

    return map;
  }, [table, valueColumnIds]);

  const headerRows = useMemo(
    () => buildPivotGridHeaderRows({
      columnsById: valueColumnsById,
      orderedColumnIds: valueColumnIds,
      pinPositionByColumnId,
      headerDepth: structure.headerDepth
    }),
    [
      valueColumnsById,
      valueColumnIds,
      pinPositionByColumnId,
      structure.headerDepth
    ]
  );

  const rowVirtualizer = useVirtualizer({
    count: viewModel.visibleRows.length,
    getScrollElement: () => dataGridRef.current,
    estimateSize: () => DEFAULT_ROW_HEIGHT,
    overscan: OVERSCAN
  });
  const virtualItems = rowVirtualizer.getVirtualItems();
  const virtualTotalSize = rowVirtualizer.getTotalSize();

  const compiledColorRules = useMemo(
    () => compilePivotGridCellColorRules(cellColorRules ?? []),
    [cellColorRules]
  );
  const visibleCells = useMemo(
    () => viewModel.visibleRows.flatMap((row) => {
      if (row.kind === 'group') {
        return [];
      }

      return [...row.cellMap.values()];
    }),
    [viewModel.visibleRows]
  );
  const [cellColorMap, setCellColorMap] = useState<Map<string, string>>(
    () => new Map()
  );

  useEffect(() => {
    if (compiledColorRules.length === 0) {
      setCellColorMap(new Map());

      return;
    }

    let cancelled = false;

    evaluatePivotGridCellColorRules(compiledColorRules, visibleCells).then((nextMap) => {
      if (!cancelled) {
        setCellColorMap(nextMap);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [compiledColorRules, visibleCells]);

  const toggleRow = useCallback((nodeId: string) => {
    setExpandedRowIds(previousState => ({
      ...previousState,
      [nodeId]: previousState[nodeId] === false
    }));
  }, []);

  const toggleColumn = useCallback((nodeId: string) => {
    setExpandedColumnIds(previousState => ({
      ...previousState,
      [nodeId]: previousState[nodeId] === false
    }));
  }, []);

  const expandAllRows = useCallback(() => {
    setExpandedRowIds(createExpandedState(structure.allRowToggleIds));
  }, [structure.allRowToggleIds]);

  const collapseAllRows = useCallback(() => {
    setExpandedRowIds(
      Object.fromEntries(
        structure.allRowToggleIds.map(nodeId => [nodeId, false])
      )
    );
  }, [structure.allRowToggleIds]);

  const expandAllColumns = useCallback(() => {
    setExpandedColumnIds(createExpandedState(structure.allColumnToggleIds));
  }, [structure.allColumnToggleIds]);

  const collapseAllColumns = useCallback(() => {
    setExpandedColumnIds(
      Object.fromEntries(
        structure.allColumnToggleIds.map(nodeId => [nodeId, false])
      )
    );
  }, [structure.allColumnToggleIds]);

  const pinColumns = useCallback(
    (
      requestedIds: Array<string>,
      position: Exclude<PivotGridPinPosition, false>
    ) => {
      setColumnPinning((previousState) => {
        const rowHeaderSet = new Set(rowHeaderColumnIds);
        const requestedSet = new Set(requestedIds);
        const orderedIds = [...requestedIds];
        const nextLeft = (previousState.left ?? []).filter(
          columnId => !rowHeaderSet.has(columnId) && !requestedSet.has(columnId)
        );
        const nextRight = (previousState.right ?? []).filter(
          columnId => !requestedSet.has(columnId)
        );

        return position === 'left' ? {
          left: [...rowHeaderColumnIds, ...nextLeft, ...orderedIds],
          right: nextRight
        } : {
          left: [...rowHeaderColumnIds, ...nextLeft],
          right: [...orderedIds, ...nextRight]
        };
      });
    },
    [rowHeaderColumnIds]
  );

  const unpinColumns = useCallback((requestedIds: Array<string>) => {
    const requestedSet = new Set(requestedIds);

    setColumnPinning(previousState => ({
      left: (previousState.left ?? []).filter(
        columnId => !requestedSet.has(columnId)
      ),
      right: (previousState.right ?? []).filter(
        columnId => !requestedSet.has(columnId)
      )
    }));
  }, []);

  const openDrilldown = useCallback((cell: PivotGridRenderedCell<TData>) => {
    setDrilldownState({
      open: true,
      cell
    });
  }, []);

  const closeDrilldown = useCallback(() => {
    setDrilldownState({
      open: false,
      cell: null
    });
  }, []);

  const getDrilldownRows = useCallback(
    (cell: PivotGridRenderedCell<TData>) => cell.rawRowIndices.map(
      rawRowIndex => structure.data[rawRowIndex]
    ).filter((row): row is TData => row !== undefined),
    [structure.data]
  );

  const getDrilldownTitle = useCallback(
    (cell: PivotGridRenderedCell<TData>) => {
      if (drilldown?.getTitle) {
        return drilldown.getTitle(cell);
      }

      const rowLabel = cell.rowPath.filter(Boolean).join(' / ') || GRAND_TOTAL_LABEL;
      const columnLabel = cell.columnPath.filter(Boolean).join(' / ') || GRAND_TOTAL_LABEL;

      return `${rowLabel} x ${columnLabel}`;
    },
    [drilldown]
  );

  const buildExportSnapshot = useCallback((): PivotGridExportSnapshot<TData> => ({
    fileName: 'pivot-grid',
    headerDepth: structure.headerDepth,
    rowHeaderLabels: rowDimensions.map(dimension => dimension.label),
    rowHeaderWidths: rowHeaderColumnIds.map((columnId, index) => {
      return table.getColumn(columnId)?.getSize()
        ?? (index === 0 ? DEFAULT_ROW_HEADER_WIDTH : DEFAULT_CHILD_ROW_HEADER_WIDTH);
    }),
    valueColumns: valueColumnIds.map((columnId) => {
      const column = valueColumnsById.get(columnId);

      return {
        id: columnId,
        headerPath: column?.headerPath ?? [],
        width: table.getColumn(columnId)?.getSize()
          ?? DEFAULT_VALUE_COLUMN_WIDTH,
        kind: column?.kind ?? 'leaf'
      };
    }),
    rows: viewModel.visibleRows
  }), [
    structure.headerDepth,
    rowDimensions,
    rowHeaderColumnIds,
    valueColumnIds,
    valueColumnsById,
    table,
    viewModel.visibleRows
  ]);

  const exportCsv = useCallback(async () => {
    const csv = buildPivotGridCsv(buildExportSnapshot());

    downloadTextFile(csv, 'pivot-grid.csv');
  }, [buildExportSnapshot]);

  const exportExcel = useCallback(async () => {
    await exportPivotGridExcel(buildExportSnapshot());
  }, [buildExportSnapshot]);

  const exportPdf = useCallback(async () => {
    if (!dataGridRef.current) {
      return;
    }

    await exportPivotGridPdf({
      element: dataGridRef.current,
      fileName: 'pivot-grid'
    });
  }, []);

  const drilldownColumns = useMemo(() => {
    if (drilldown?.columns) {
      return drilldown.columns;
    }

    const rows = drilldownState.cell ? getDrilldownRows(drilldownState.cell) : [];

    return buildDefaultDrilldownColumns(rows);
  }, [drilldown?.columns, drilldownState.cell, getDrilldownRows]);

  return useMemo(
    () => ({
      table,
      dataGridRef,
      height,
      className,
      rowHeaderColumnIds,
      valueColumnIds,
      visibleLeafColumns: viewModel.visibleLeafColumns,
      headerDepth: structure.headerDepth,
      headerRows,
      visibleRows: viewModel.visibleRows,
      virtualItems,
      virtualTotalSize,
      cellColorMap,
      drilldownColumns,
      drilldownState,
      toggleRow,
      toggleColumn,
      expandAllRows,
      collapseAllRows,
      expandAllColumns,
      collapseAllColumns,
      pinColumns,
      unpinColumns,
      openDrilldown,
      closeDrilldown,
      getDrilldownRows,
      getDrilldownTitle,
      exportCsv,
      exportExcel,
      exportPdf
    }),
    [
      table,
      height,
      className,
      rowHeaderColumnIds,
      valueColumnIds,
      viewModel.visibleLeafColumns,
      structure.headerDepth,
      headerRows,
      viewModel.visibleRows,
      virtualItems,
      virtualTotalSize,
      cellColorMap,
      drilldownColumns,
      drilldownState,
      toggleRow,
      toggleColumn,
      expandAllRows,
      collapseAllRows,
      expandAllColumns,
      collapseAllColumns,
      pinColumns,
      unpinColumns,
      openDrilldown,
      closeDrilldown,
      getDrilldownRows,
      getDrilldownTitle,
      exportCsv,
      exportExcel,
      exportPdf
    ]
  );
}