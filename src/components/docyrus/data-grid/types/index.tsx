import {
  type FC,
  type MouseEvent,
  type ReactNode,
  type RefObject,
  type SVGProps,
} from 'react'

import {
  type Cell,
  type ColumnFiltersState,
  type ColumnPinningState,
  type RowData,
  type SortingState,
  type TableMeta,
} from '@tanstack/react-table'

import { type RuleGroupType } from 'react-querybuilder'

export type IFieldType =
  | 'field-text'
  | 'field-textarea'
  | 'field-email'
  | 'field-phone'
  | 'field-url'
  | 'field-color'
  | 'field-icon'
  | 'field-currency'
  | 'field-display'
  | 'field-htmlEditor'
  | 'field-emailEditor'
  | 'field-codeEditor'
  | 'field-formula'
  | 'field-relatedField'
  | 'field-enum'
  | 'field-code'
  | 'field-button'
  | 'field-number'
  | 'field-money'
  | 'field-percent'
  | 'field-duration'
  | 'field-rating'
  | 'field-identity'
  | 'field-autonumber'
  | 'field-checkbox'
  | 'field-switch'
  | 'field-date'
  | 'field-dateTime'
  | 'field-time'
  | 'field-dateRange'
  | 'field-select'
  | 'field-radioGroup'
  | 'field-status'
  | 'field-relation'
  | 'field-userSelect'
  | 'field-multiSelect'
  | 'field-tagSelect'
  | 'field-userMultiSelect'
  | 'field-json'
  | 'field-file'
  | 'field-image'
  | 'field-avatar'
  | 'field-docEditor'
  | 'field-inlineData'
  | 'field-inlineForm'
  | 'field-taskList'
  | 'field-approvalStatus'
  | 'field-locationSelect'
  | 'field-list'
  | 'field-todo'
  | 'field-conversationChannel'
  | 'field-queryBuilder'
  | 'field-dynamic'
  | 'field-schema'
  | 'field-schemaRepeater'
  | 'field-fileStorageFolder'
  | 'field-systemEnum'
  | 'field-systemBuffer'
  | 'field-systemVector'
  | 'field-systemTextArray'
  | 'field-systemUuidArray'

export interface DataGridRowColorRule {
  formula: string
  color: string
}

export interface DataGridCellColorRule {
  column: string
  formula: string
  color: string
}

export type Direction = 'ltr' | 'rtl'

export type RowHeightValue = 'short' | 'medium' | 'tall' | 'extra-tall'

export type DataGridDisplayMode = 'table' | 'gallery'

export interface DataGridCardConfig<TData> {
  /** Column ID whose value becomes the card title */
  titleField?: string
  /** Column ID whose value becomes the card description (subtitle) */
  descriptionField?: string
  /** Column ID whose value renders as a card thumbnail/image */
  imageField?: string
  /** Column IDs to display in the card body. If omitted, shows all visible columns except title/description/image */
  bodyFields?: Array<string>
  /** Custom card renderer — overrides the default card layout entirely */
  renderCard?: (row: TData, rowIndex: number) => ReactNode
}

export interface CellSelectOption {
  label: string
  value: string
  icon?: FC<SVGProps<SVGSVGElement>>
  iconStr?: string
  color?: string
  count?: number
}

export interface CellUserOption extends CellSelectOption {
  avatarUrl?: string
  initials?: string
}

export type CellOpts =
  | {
      variant: 'short-text'
    }
  | {
      variant: 'long-text'
    }
  | {
      variant: 'email'
    }
  | {
      variant: 'phone'
    }
  | {
      variant: 'number'
      min?: number
      max?: number
      step?: number
    }
  | {
      variant: 'currency'
      currency?: string
      min?: number
      max?: number
      step?: number
    }
  | {
      variant: 'percent'
      min?: number
      max?: number
      step?: number
    }
  | {
      variant: 'select'
      options: Array<CellSelectOption>
      /** Render as 'badge' (default) or 'text' (plain label with optional color dot). */
      display?: 'badge' | 'text'
    }
  | {
      variant: 'status'
      options: Array<CellSelectOption>
      /** Render as 'badge' (default) or 'text' (plain label with optional color dot). */
      display?: 'badge' | 'text'
    }
  | {
      variant: 'enum'
      appSlug: string
      dataSourceSlug: string
      fieldSlug: string
      options?: Array<CellSelectOption>
      /** Render as 'badge' (default) or 'text' (plain label with optional color dot). */
      display?: 'badge' | 'text'
    }
  | {
      variant: 'user'
      options: Array<CellUserOption>
    }
  | {
      variant: 'multi-select'
      options: Array<CellSelectOption>
    }
  | {
      variant: 'checkbox'
      /**
       * Label shown for the `true` value in the filter picker. Defaults to
       * the i18n `true` string ("True" / "Doğru" etc). Use this to express
       * domain-specific names like `Billable` / `Non-billable`.
       */
      trueLabel?: string
      /** Label shown for the `false` value in the filter picker. */
      falseLabel?: string
    }
  | {
      variant: 'date'
    }
  | {
      variant: 'datetime'
    }
  | {
      variant: 'url'
    }
  | {
      variant: 'file'
      maxFileSize?: number
      maxFiles?: number
      accept?: string
      multiple?: boolean
    }
  | {
      variant: 'switch'
      /** Label shown for the `true` value in the filter picker. */
      trueLabel?: string
      /** Label shown for the `false` value in the filter picker. */
      falseLabel?: string
    }
  | {
      variant: 'rating'
      max?: number
    }
  | {
      variant: 'duration'
    }
  | {
      variant: 'time'
    }
  | {
      variant: 'date-range'
    }
  | {
      variant: 'color'
    }
  | {
      variant: 'icon'
    }
  | {
      variant: 'currency-code'
    }
  | {
      variant: 'image'
      maxFileSize?: number
      accept?: string
    }
  | {
      variant: 'relation'
      /** UUID of the related data source. Always populated from `field.relation_data_source_id`. */
      dataSourceId: string
      /**
       * REST path components for the related data source. Captured directly
       * from `field.relation_data_source_app_slug` / `relation_data_source_slug`
       * so cell editors / filter pickers can hit
       * `/v1/apps/{appSlug}/data-sources/{slug}/items` without round-tripping
       * the UUID through `/v1/apps/data-sources` first.
       */
      relationAppSlug?: string
      relationDataSourceSlug?: string
      displayField?: string
    }
  | {
      variant: 'user-multi-select'
      options: Array<CellUserOption>
    }
  | {
      variant: 'tag-select'
      options: Array<CellSelectOption>
    }
  | {
      variant: 'chart'
      /** 'sparkline' (line) or 'bar' (mini bars). Default: 'sparkline' */
      chartType?: 'sparkline' | 'bar'
      /** Key to read from each data point object. Default: 'value' */
      dataKey?: string
      /** Stroke/fill color (any CSS color). Default: 'hsl(var(--primary))' */
      color?: string
      /** Render expanded content in a popover. Receives row.original. Only shows expand icon when provided. */
      expandedCellContent?: (rowData: unknown) => ReactNode
    }
  | {
      variant: 'uuid'
      /**
       * When true, render only a copy-icon button instead of the full UUID
       * value. Clicking the button copies the value to the clipboard.
       */
      showCopyButton?: boolean
    }

export interface CellUpdate {
  rowIndex: number
  columnId: string
  value: unknown
}

export interface CellChange {
  columnId: string
  originalValue: unknown
  newValue: unknown
}

export interface RowChange {
  rowId: string
  rowIndex: number
  changes: Map<string, CellChange>
}

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    label?: string
    group?: string
    cell?: CellOpts
    /**
     * Optional CSS class applied to every cell wrapper in this column.
     * Use this from app-level column definitions to control per-column
     * styling (e.g. `text-xs leading-snug` for description columns) without
     * forking the core cell components.
     */
    cellClassName?: string
    visibleOnHover?: boolean
    format?: (value: TValue, row: TData) => string
    /**
     * Force the column to be selectable in the grouping picker, regardless of
     * its cell variant. Use this for fields whose default cell variant isn't
     * in `GROUPABLE_VARIANTS` but should still be groupable (e.g. relation /
     * user fields rendered with `short-text` fallback).
     */
    groupable?: boolean
    /**
     * Optional override for the row group header value render. Receives the
     * original (un-normalized) value pulled from the first sub-row plus the
     * full record. Used by `useDocyrusDataGrid` to render group headers via
     * the field's value-renderer (e.g. `SelectValue`, `StatusValue`,
     * `RelationValue`) instead of the default presentation logic.
     */
    renderGroupValue?: (params: {
      value: unknown
      record: TData | undefined
    }) => ReactNode
    /**
     * When `true`, this column is non-editable even if the table itself is
     * in edit mode (`tableMeta.readOnly === false`). Combines forced
     * locks (identity / metadata-flagged fields) with per-view user
     * choices — the row render checks this single flag to gate editing.
     */
    readOnly?: boolean
    /**
     * `true` when the column is read-only for *structural* reasons —
     * identity / autonumber columns, or fields the data source itself
     * flags as `readOnly: true`. These cannot be toggled editable from
     * the view editor; the inline-editing section reads this flag through
     * `buildDraftColumns` to render a locked checkbox state.
     */
    forcedReadOnly?: boolean
  }

  interface TableMeta<TData extends RowData> {
    onRowClick?: (row: TData) => void
    dataGridRef?: RefObject<HTMLElement | null>
    cellMapRef?: RefObject<Map<string, HTMLDivElement>>
    focusedCell?: CellPosition | null
    editingCell?: CellPosition | null
    selectionState?: SelectionState
    searchOpen?: boolean
    getIsCellSelected?: (rowIndex: number, columnId: string) => boolean
    getIsCellCut?: (rowIndex: number, columnId: string) => boolean
    getIsSearchMatch?: (rowIndex: number, columnId: string) => boolean
    getIsActiveSearchMatch?: (rowIndex: number, columnId: string) => boolean
    getIsCellChanged?: (rowId: string, columnId: string) => boolean
    getVisualRowIndex?: (rowId: string) => number | undefined
    rowHeight?: RowHeightValue
    onRowHeightChange?: (value: RowHeightValue) => void
    onRowSelect?: (rowId: string, checked: boolean, shiftKey: boolean) => void
    onDataUpdate?: (params: CellUpdate | Array<CellUpdate>) => void
    onRowsDelete?: (rowIndices: Array<number>) => void | Promise<void>
    onColumnClick?: (columnId: string) => void
    onCellClick?: (
      rowIndex: number,
      columnId: string,
      event?: MouseEvent,
    ) => void
    onCellDoubleClick?: (rowIndex: number, columnId: string) => void
    onCellMouseDown?: (
      rowIndex: number,
      columnId: string,
      event: MouseEvent,
    ) => void
    onCellMouseEnter?: (rowIndex: number, columnId: string) => void
    onCellMouseUp?: () => void
    onCellContextMenu?: (
      rowIndex: number,
      columnId: string,
      event: MouseEvent,
    ) => void
    onCellEditingStart?: (rowIndex: number, columnId: string) => void
    onCellEditingStop?: (opts?: {
      direction?: NavigationDirection
      moveToNextRow?: boolean
    }) => void
    onCellsCopy?: () => void
    onCellsCut?: () => void
    onCellsPaste?: (expand?: boolean) => void
    onSelectionClear?: () => void
    onFilesUpload?: (params: {
      files: Array<File>
      rowIndex: number
      columnId: string
    }) => Promise<Array<FileCellData>>
    onFilesDelete?: (params: {
      fileIds: Array<string>
      rowIndex: number
      columnId: string
    }) => void | Promise<void>
    contextMenu?: ContextMenuState
    onContextMenuOpenChange?: (open: boolean) => void
    pasteDialog?: PasteDialogState
    onPasteDialogOpenChange?: (open: boolean) => void
    readOnly?: boolean
    displayMode?: DataGridDisplayMode
    onDisplayModeChange?: (mode: DataGridDisplayMode) => void
    /** Custom date formatter for DateCell display. Falls back to toLocaleDateString(). */
    formatDate?: (value: unknown) => string
    /** Custom datetime formatter for DateTimeCell display. Falls back to toLocaleString(). */
    formatDateTime?: (value: unknown) => string
    /**
     * Custom numeric formatter for NumberCell / CurrencyCell / PercentCell display.
     * Falls back to the built-in `formatNumberDisplayValue`. Wired by
     * `useDocyrusDataGrid` to `numberUtils.formatNumber` /
     * `numberUtils.formatCurrency` from `@docyrus/app-utils` so cells respect
     * the tenant's locale + decimal/thousand separator preferences.
     */
    formatNumber?: (
      value: unknown,
      opts?: { variant?: 'number' | 'currency' | 'percent'; currency?: string },
    ) => string
    /**
     * Load options for a column whose cell variant requires async lookup
     * (e.g. `relation`, `user`, `user-multi-select`). The data-grid is
     * backend-agnostic on its own, so the loader is wired by the host (see
     * `useDocyrusDataGrid`) to hit the right endpoint based on the column's
     * `meta.cell` configuration.
     *
     * `column` is the TanStack `Column` instance — implementations read
     * `column.columnDef.meta.cell` to decide what to fetch.
     */
    loadCellOptions?: (
      column: { columnDef: { meta?: { cell?: unknown } } },
      params: {
        search: string
        page: number
        pageSize: number
        signal?: AbortSignal
      },
    ) => Promise<{
      items: Array<{
        value: string
        label: string
        secondaryLabel?: string
        imageUrl?: string
      }>
      hasMore?: boolean
    }>
  }
}

export interface CellPosition {
  rowIndex: number
  columnId: string
}

export interface CellRange {
  start: CellPosition
  end: CellPosition
}

export interface SelectionState {
  selectedCells: Set<string>
  fullSelection: boolean
  selectionRange: CellRange | null
  isSelecting: boolean
}

export interface ContextMenuState {
  open: boolean
  x: number
  y: number
}

export interface PasteDialogState {
  open: boolean
  rowsNeeded: number
  clipboardText: string
}

export type NavigationDirection =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'home'
  | 'end'
  | 'ctrl+up'
  | 'ctrl+down'
  | 'ctrl+home'
  | 'ctrl+end'
  | 'pageup'
  | 'pagedown'
  | 'pageleft'
  | 'pageright'

export interface SearchState {
  searchMatches: Array<CellPosition>
  matchIndex: number
  searchOpen: boolean
  onSearchOpenChange: (open: boolean) => void
  searchQuery: string
  onSearchQueryChange: (query: string) => void
  onSearch: (query: string) => void
  onNavigateToNextMatch: () => void
  onNavigateToPrevMatch: () => void
}

export interface DataGridCellProps<TData> {
  cell: Cell<TData, unknown>
  tableMeta: TableMeta<TData>
  rowIndex: number
  columnId: string
  rowHeight: RowHeightValue
  isEditing: boolean
  isFocused: boolean
  isSelected: boolean
  isSearchMatch: boolean
  isActiveSearchMatch: boolean
  isChanged: boolean
  readOnly: boolean
  colorRuleBg?: string | null
}

export interface FileCellData {
  id: string
  name: string
  size: number
  type: string
  url?: string
}

export type TextFilterOperator =
  | 'contains'
  | 'notContains'
  | 'equals'
  | 'notEquals'
  | 'startsWith'
  | 'endsWith'
  | 'isEmpty'
  | 'isNotEmpty'

export type NumberFilterOperator =
  | 'equals'
  | 'notEquals'
  | 'lessThan'
  | 'lessThanOrEqual'
  | 'greaterThan'
  | 'greaterThanOrEqual'
  | 'isBetween'
  | 'isEmpty'
  | 'isNotEmpty'

export type DateFilterOperator =
  | 'equals'
  | 'notEquals'
  | 'before'
  | 'after'
  | 'onOrBefore'
  | 'onOrAfter'
  | 'isBetween'
  | 'isEmpty'
  | 'isNotEmpty'

export type SelectFilterOperator =
  | 'is'
  | 'isNot'
  | 'isAnyOf'
  | 'isNoneOf'
  | 'isEmpty'
  | 'isNotEmpty'

export type MultiSelectFilterOperator = 'includesAll' | 'excludesIfAll'

export type BooleanFilterOperator =
  | 'isTrue'
  | 'isFalse'
  | 'isEmpty'
  | 'isNotEmpty'

export type FilterOperator =
  | TextFilterOperator
  | NumberFilterOperator
  | DateFilterOperator
  | SelectFilterOperator
  | MultiSelectFilterOperator
  | BooleanFilterOperator

export interface FilterValue {
  operator: FilterOperator
  value?: string | number | Array<string>
  endValue?: string | number
}

export interface ICollectionFilterRule {
  field: string
  operator: string
  value?: unknown
}

export interface ICollectionFilterGroup {
  combinator: 'and' | 'or'
  rules: Array<ICollectionFilterRule | ICollectionFilterGroup>
}

export type ICollectionOrderBy = string

export interface ICollectionListParams {
  filters?: ICollectionFilterGroup
  filterKeyword?: string
  orderBy?: ICollectionOrderBy
  limit?: number
  offset?: number
  columns?: Array<string>
  calculations?: Array<{
    field: string
    function: string
    alias?: string
  }>
}

/**
 * How the grid renders its row list.
 * - `virtual-scroll` (default): all loaded rows are virtualized in a single
 *   scrollable viewport, no footer.
 * - `standard`: rows are paginated client-side and a paging footer is shown
 *   with prev/next/page-size controls.
 */
export type DataGridPagingMode = 'virtual-scroll' | 'standard'

export const DATA_GRID_PAGE_SIZE_OPTIONS = [25, 50, 100, 200, 250, 500] as const

export const DATA_GRID_DEFAULT_PAGE_SIZE = 50

export interface SavedDataGridView {
  id: string
  name: string
  description?: string
  columnVisibility: Record<string, boolean>
  columnOrder: Array<string>
  columnPinning: ColumnPinningState
  rowHeight?: RowHeightValue
  displayMode?: DataGridDisplayMode
  sorting?: SortingState
  columnFilters?: ColumnFiltersState
  grouping?: Array<string>
  filterQuery?: RuleGroupType
  rowColorRules?: Array<DataGridRowColorRule>
  cellColorRules?: Array<DataGridCellColorRule>
  /** When `true`, the grid uses pagination and shows a paging footer. */
  pagingEnabled?: boolean
  /** How the grid lays out rows when paging is enabled. Default `virtual-scroll`. */
  pagingMode?: DataGridPagingMode
  /** Page size when paging is enabled. Defaults to `DATA_GRID_DEFAULT_PAGE_SIZE`. */
  pageSize?: number
  /**
   * Master switch for the data-grid's inline cell editing feature. When
   * `false` / unset, every cell is read-only. When `true`, cells become
   * editable except for columns covered by the auto-protected list (id /
   * autonumber_id / fields with metadata `readOnly: true`) or the
   * caller-supplied `readOnlyColumns` whitelist.
   */
  inlineEditingEnabled?: boolean
  /**
   * Per-column read-only override applied on top of `inlineEditingEnabled`.
   * Only meaningful when inline editing is on; columns listed here render
   * as read-only even though the rest of the grid is editable.
   */
  readOnlyColumns?: Array<string>
  /**
   * Whether this is a developer-defined system view. System views always
   * appear before user-saved views, cannot be edited or deleted, but can
   * still be hidden from the tab list (with the hidden state typically
   * persisted to `localStorage`).
   */
  isSystem?: boolean
  /**
   * Whether this view should be picked as the initial active view when no
   * other selection is persisted. Mirrors the backend `is_default` flag.
   */
  isDefault?: boolean
  /**
   * Optional Docyrus icon identifier (e.g. `"huge file-list-table"`,
   * `"fas table"`, `"📋"`). Rendered through `<DocyrusIcon>` in the view
   * picker tabs/dropdown and the manage-views dialog. Picked in the view
   * editor.
   */
  icon?: string
}

export function isSavedDataGridView(
  value: unknown,
): value is SavedDataGridView {
  if (!value || typeof value !== 'object') return false

  const item = value as Record<string, unknown>

  return (
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    Array.isArray(item.columnOrder) &&
    item.columnOrder.every((columnId) => typeof columnId === 'string') &&
    item.columnVisibility !== null &&
    typeof item.columnVisibility === 'object' &&
    item.columnPinning !== null &&
    typeof item.columnPinning === 'object' &&
    (item.sorting === undefined ||
      (Array.isArray(item.sorting) &&
        item.sorting.every(
          (sortRule) =>
            sortRule &&
            typeof sortRule === 'object' &&
            typeof sortRule.id === 'string' &&
            typeof sortRule.desc === 'boolean',
        ))) &&
    (item.columnFilters === undefined ||
      (Array.isArray(item.columnFilters) &&
        item.columnFilters.every(
          (filterRule) =>
            filterRule &&
            typeof filterRule === 'object' &&
            typeof filterRule.id === 'string',
        ))) &&
    (item.grouping === undefined ||
      (Array.isArray(item.grouping) &&
        item.grouping.every((columnId) => typeof columnId === 'string'))) &&
    (item.rowColorRules === undefined ||
      (Array.isArray(item.rowColorRules) &&
        item.rowColorRules.every(
          (rule) =>
            rule &&
            typeof rule === 'object' &&
            typeof rule.formula === 'string' &&
            typeof rule.color === 'string',
        ))) &&
    (item.cellColorRules === undefined ||
      (Array.isArray(item.cellColorRules) &&
        item.cellColorRules.every(
          (rule) =>
            rule &&
            typeof rule === 'object' &&
            typeof rule.column === 'string' &&
            typeof rule.formula === 'string' &&
            typeof rule.color === 'string',
        )))
  )
}
