import { type RefObject } from 'react';

import {
  type ColumnDef,
  type ColumnPinningState,
  type ColumnSizingState,
  type Table
} from '@tanstack/react-table';
import { type VirtualItem } from '@tanstack/react-virtual';

export type PivotGridAggregate = 'sum' | 'count' | 'avg' | 'min' | 'max';

export type PivotGridColorScope = 'leaf' | 'subtotal' | 'total' | 'grand-total';

export type PivotGridPinPosition = 'left' | 'right' | false;

export type PivotGridRenderedRowKind
  = | 'group'
    | 'leaf'
    | 'subtotal'
    | 'grand-total';

export type PivotGridRenderedColumnKind
  = | 'leaf'
    | 'subtotal'
    | 'grand-total';

export interface PivotGridDimension<TData> {
  id: string;
  label: string;
  getValue: (row: TData) => unknown;
  formatValue?: (value: unknown) => string;
  sort?: (a: unknown, b: unknown) => number;
  emptyLabel?: string;
}

export interface PivotGridMeasure<TData> {
  id: string;
  label: string;
  getValue?: (row: TData) => number | null | undefined;
  aggregate: PivotGridAggregate;
  formatValue?: (value: number) => string;
}

export interface PivotGridCellColorRule {
  formula: string;
  color: string;
  scope?: PivotGridColorScope;
}

export interface PivotGridState {
  expandedRowIds: Record<string, boolean>;
  expandedColumnIds: Record<string, boolean>;
  columnPinning: ColumnPinningState;
  columnSizing: ColumnSizingState;
}

export interface PivotGridDrilldown<TData> {
  columns?: Array<ColumnDef<TData>>;
  getTitle?: (cell: PivotGridRenderedCell<TData>) => string;
}

export interface UsePivotGridProps<TData> {
  data: Array<TData>;
  rowDimensions: Array<PivotGridDimension<TData>>;
  columnDimensions: Array<PivotGridDimension<TData>>;
  measures: Array<PivotGridMeasure<TData>>;
  getRowId?: (row: TData, index: number) => string;
  initialState?: Partial<PivotGridState>;
  cellColorRules?: Array<PivotGridCellColorRule>;
  drilldown?: PivotGridDrilldown<TData>;
  height?: number | 'auto';
  className?: string;
}

export type PivotGridProps<TData> = UsePivotGridProps<TData>;

export interface PivotGridHeaderPathSegment {
  key: string;
  label: string;
  groupNodeId?: string;
  canCollapse?: boolean;
  isExpanded?: boolean;
}

export interface PivotGridLeafColumn<TData> {
  id: string;
  ownerNodeId?: string;
  measure: PivotGridMeasure<TData>;
  kind: PivotGridRenderedColumnKind;
  headerPath: Array<string>;
  headerPathSegments: Array<PivotGridHeaderPathSegment | null>;
  pathLabels: Array<string>;
}

export interface PivotGridRowHeaderCell {
  key: string;
  label: string;
  kind: PivotGridRenderedRowKind | 'blank';
  depth: number;
  isCurrentDepth: boolean;
  canToggle: boolean;
  isExpanded: boolean;
  groupNodeId?: string;
  rawRowCount: number;
  title?: string;
}

export interface PivotGridRenderedCell<_TData> {
  id: string;
  rowId: string;
  columnId: string;
  measureId: string;
  value: number;
  formattedValue: string;
  rowPath: Array<string>;
  columnPath: Array<string>;
  rawRowCount: number;
  rawRowIndices: Array<number>;
  rawRowIds: Array<string>;
  kind: PivotGridRenderedColumnKind;
  isSubtotal: boolean;
  isTotal: boolean;
  isGrandTotal: boolean;
}

export interface PivotGridRenderedRow<TData> {
  id: string;
  kind: PivotGridRenderedRowKind;
  depth: number;
  pathLabels: Array<string>;
  headerCells: Array<PivotGridRowHeaderCell>;
  rawRowIndices: Array<number>;
  rawRowIds: Array<string>;
  rawRowCount: number;
  cellMap: Map<string, PivotGridRenderedCell<TData>>;
}

export interface PivotGridHeaderCell {
  key: string;
  label: string;
  level: number;
  columnIds: Array<string>;
  colSpan: number;
  pinPosition: PivotGridPinPosition;
  groupNodeId?: string;
  canCollapse: boolean;
  isExpanded: boolean;
}

export interface PivotGridHeaderRow {
  id: string;
  level: number;
  cells: Array<PivotGridHeaderCell>;
}

export interface PivotGridDrilldownState<TData> {
  open: boolean;
  cell: PivotGridRenderedCell<TData> | null;
}

export interface PivotGridController<TData> {
  table: Table<PivotGridRenderedRow<TData>>;
  dataGridRef: RefObject<HTMLDivElement | null>;
  height: number | 'auto';
  className?: string;
  rowHeaderColumnIds: Array<string>;
  valueColumnIds: Array<string>;
  visibleLeafColumns: Array<PivotGridLeafColumn<TData>>;
  headerDepth: number;
  headerRows: Array<PivotGridHeaderRow>;
  visibleRows: Array<PivotGridRenderedRow<TData>>;
  virtualItems: Array<VirtualItem>;
  virtualTotalSize: number;
  cellColorMap: Map<string, string>;
  drilldownColumns?: Array<ColumnDef<TData>>;
  drilldownState: PivotGridDrilldownState<TData>;
  toggleRow: (nodeId: string) => void;
  toggleColumn: (nodeId: string) => void;
  expandAllRows: () => void;
  collapseAllRows: () => void;
  expandAllColumns: () => void;
  collapseAllColumns: () => void;
  pinColumns: (columnIds: Array<string>, position: Exclude<PivotGridPinPosition, false>) => void;
  unpinColumns: (columnIds: Array<string>) => void;
  openDrilldown: (cell: PivotGridRenderedCell<TData>) => void;
  closeDrilldown: () => void;
  getDrilldownRows: (cell: PivotGridRenderedCell<TData>) => Array<TData>;
  getDrilldownTitle: (cell: PivotGridRenderedCell<TData>) => string;
  exportCsv: () => Promise<void>;
  exportExcel: () => Promise<void>;
  exportPdf: () => Promise<void>;
}