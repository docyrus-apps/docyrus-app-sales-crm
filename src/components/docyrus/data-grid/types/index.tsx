import {
  type FC,
  type MouseEvent,
  type ReactNode,
  type RefObject,
  type SVGProps,
} from 'react'

import { type Cell, type RowData, type TableMeta } from '@tanstack/react-table'

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
    }
  | {
      variant: 'status'
      options: Array<CellSelectOption>
    }
  | {
      variant: 'enum'
      appSlug: string
      dataSourceSlug: string
      fieldSlug: string
      options?: Array<CellSelectOption>
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
      dataSourceId: string
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    label?: string
    cell?: CellOpts
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
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
    onRowSelect?: (
      rowIndex: number,
      checked: boolean,
      shiftKey: boolean,
    ) => void
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

export type BooleanFilterOperator = 'isTrue' | 'isFalse'

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
