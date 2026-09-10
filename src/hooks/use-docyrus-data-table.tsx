'use client'

import {
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'

import { type DataSourceField } from '@docyrus/app-utils'

import type { RuleGroupType } from 'react-querybuilder'

import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import {
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnSort,
  type ExpandedState,
  type GroupingState,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type VisibilityState
} from '@tanstack/react-table'
import {
  Download,
  Loader2,
  Pencil,
  RotateCw,
  Search,
  Trash2
} from 'lucide-react'

import {
  useDocyrusDataExport,
  type DocyrusDataExportPayload
} from './use-docyrus-data-export'

import {
  GROUPABLE_FIELD_TYPES,
  VALUE_RENDERER_MAP,
  extractEnumOptions,
  getCellOpts,
  getFieldValue,
  toIField,
  type DocyrusFieldLike
} from './use-docyrus-field-component'
import { useDocyrusDataViewSelect } from './use-docyrus-data-view-select'
import type {
  UseDocyrusDataViewSelectOptions,
  UseDocyrusDataViewSelectResult
} from './use-docyrus-data-view-select'

import type {
  DocyrusDataGridBulkAction,
  DocyrusDataGridCollection,
  DocyrusDataGridListParams
} from './use-docyrus-data-grid'

import {
  DataGridDisplayMenu,
  DataGridFilterMenu,
  DataGridGallery,
  DataGridGroupMenu,
  DataGridSidePanel,
  DataGridSortMenu,
  applyViewToTable
} from '@/components/docyrus/data-grid'
import type {
  DataGridAction,
  DataGridCardConfig,
  DataGridDisplayMode,
  SavedDataGridView
} from '@/components/docyrus/data-grid'
import { toServerRule } from '@/components/docyrus/data-grid/lib/data-grid-server'

import type { CellUserOption } from '@/components/docyrus/data-grid/types'
import type {
  AsyncOptionsConfig,
  ColumnConfig,
  FilterStrategy
} from '@/components/docyrus/data-table-filter/core/types'
import type { Locale as DataTableFilterLocale } from '@/components/docyrus/data-table-filter/lib/i18n'

import {
  DataTableSideFilters,
  useDataTableSideFilters
} from '@/components/docyrus/data-table-side-filters'
import type {
  DataTableSideFiltersProps,
  SideFilterDefaults,
  SideFilterSectionGroup
} from '@/components/docyrus/data-table-side-filters'
import { DataGridViewSelect } from '@/components/docyrus/data-grid-view-select'
import type { DataGridViewSelectVariant } from '@/components/docyrus/data-grid-view-select'
import { BulkUpdateDialog } from '@/components/docyrus/bulk-update-dialog'
import { RecordDeleteConfirmDialog } from '@/components/docyrus/record-delete-confirm-dialog'
import {
  DocyrusDataExportMenu,
  encodeDocyrusDataExportColumn
} from '@/components/docyrus/docyrus-data-export-menu'
import type {
  DocyrusDataExportFieldOption,
  DocyrusDataExportSelection
} from '@/components/docyrus/docyrus-data-export-menu'
import { DocyrusIcon } from '@/components/docyrus/docyrus-icon'
import {
  DataTable,
  getDataTableSelectColumn
} from '@/components/docyrus/data-table'
import type { DataTableProps } from '@/components/docyrus/data-table'
import { TextValue } from '@/components/docyrus/value-renderers'
import type { IFieldType } from '@/components/docyrus/value-renderers'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { normalizeSavedViewFilterQuery } from '@/lib/docyrus-filter-normalization'
import { cn } from '@/lib/utils'

import { useDataExport } from '@/hooks/use-data-export'
import type { DataExportColumn } from '@/hooks/use-data-export'

const DEFAULT_SERVER_EXPORT_EXCLUDED_SLUGS: ReadonlyArray<string> = [
  'data',
  'document',
  'parent_data_source_id',
  'parent_record_id',
  'icon',
  'color',
  'mentions',
  'followers',
  'type',
  'tenant_view_id',
  'tenant_data_source_id',
  'sort_order',
  'editor_view_id'
]

const DEFAULT_SERVER_EXPORT_EXCLUDED_TYPES: ReadonlyArray<string> = ['field-action', 'action']

/**
 * Configuration for the optional side-panel filter rail rendered alongside
 * the table. The hook wires the panel's emitted `RuleGroupType` into the
 * items request, ANDed with the saved view's `filterQuery` and any
 * toolbar filter menu rules.
 */
export interface DocyrusDataTableSideFiltersConfig<TData> {
  columnsConfig: ReadonlyArray<ColumnConfig<TData, any, any, any>>;
  strategy?: FilterStrategy;
  defaults?: SideFilterDefaults;
  sections?: ReadonlyArray<SideFilterSectionGroup>;
  variant?: DataTableSideFiltersProps<TData>['variant'];
  title?: DataTableSideFiltersProps<TData>['title'];
  showActiveChips?: boolean;
  showClearAll?: boolean;
  searchable?: boolean | string;
  clearAllLabel?: string;
  clearLabel?: string;
  locale?: DataTableFilterLocale;
  className?: string;
  collapseAriaLabel?: string;
  expandAriaLabel?: string;
  collapsedWidth?: number | string;
}

export interface UseDocyrusDataTableOptions<
  TData,
> extends UseDocyrusDataViewSelectOptions {
  data?: Array<TData>;
  collection?: DocyrusDataGridCollection<TData>;
  listParams?: DocyrusDataGridListParams;
  defaultLimit?: number;
  enableItemsQuery?: boolean;
  showSelectColumn?: boolean;
  enableRowNumbers?: boolean;
  selectColumn?: ColumnDef<TData>;
  actionsColumn?: ColumnDef<TData>;
  extraColumns?: Array<ColumnDef<TData>>;
  mapColumn?: (
    field: DataSourceField,
    defaultColumn: ColumnDef<TData>
  ) => ColumnDef<TData> | null;
  enableViewSelect?: boolean;
  viewSelectVariant?: DataGridViewSelectVariant;
  viewSelectMaxVisible?: number;
  enableSearchInput?: boolean;
  enableFilterMenu?: boolean;
  enableGroupMenu?: boolean;
  enableSortMenu?: boolean;
  /**
   * Show the table/gallery display-mode toggle in the toolbar. Default `false`.
   * When enabled, the hook tracks the selected display mode and the returned
   * `view` element switches between `<DataTable>` and `<DataGridGallery>`.
   */
  enableDisplayMenu?: boolean;
  /** Initial display mode when uncontrolled. Default `'table'`. */
  defaultDisplayMode?: DataGridDisplayMode;
  /** Controlled display mode. Pair with `onDisplayModeChange`. */
  displayMode?: DataGridDisplayMode;
  /** Called when the user toggles the display-mode menu. */
  onDisplayModeChange?: (mode: DataGridDisplayMode) => void;
  /** Card layout config used by the gallery view. */
  cardConfig?: DataGridCardConfig<TData>;
  /**
   * Height passed to `<DataGridGallery>` when rendering the gallery view.
   * Default `'auto'` — fills the parent container.
   */
  galleryHeight?: number | 'auto';
  /** Extra className applied to the gallery container. */
  galleryClassName?: string;
  enableReloadButton?: boolean;
  enableServerExportMenu?: boolean;
  serverExportLimit?: number;
  serverExportExcludedFieldTypes?: ReadonlyArray<string>;
  serverExportExcludedSlugs?: ReadonlyArray<string>;
  onReload?: () => void;
  searchPlaceholder?: string;
  searchDebounceMs?: number;
  toolbarClassName?: string;
  toolbarStartContent?: ReactNode;
  toolbarEndContent?: ReactNode;
  extraBulkActions?: Array<DataGridAction<TData>>;
  bulkActions?: false | ReadonlyArray<DocyrusDataGridBulkAction>;
  exportColumns?: 'visible' | 'all' | ReadonlyArray<string>;
  exportFileName?: string;
  users?: ReadonlyArray<CellUserOption>;
  formatDate?: (value: unknown) => string;
  formatDateTime?: (value: unknown) => string;
  formatNumber?: (
    value: unknown,
    opts?: { variant?: 'number' | 'currency' | 'percent'; currency?: string }
  ) => string;
  initialState?: Partial<{
    sorting: SortingState;
    columnFilters: ColumnFiltersState;
    columnVisibility: VisibilityState;
    rowSelection: RowSelectionState;
    expanded: ExpandedState;
    grouping: GroupingState;
    pagination: PaginationState;
  }>;
  tableClassName?: DataTableProps<TData>['className'];
  tableContainerClassName?: DataTableProps<TData>['containerClassName'];
  emptyText?: string;
  /**
   * Activate the side-panel filter rail rendered alongside the table.
   * When `true`, the hook's `sideFilters` return value renders a
   * `<DataTableSideFilters>` panel and feeds its emitted `RuleGroupType`
   * into the items request (ANDed with the saved view filter and any
   * toolbar filter menu rules). The toolbar filter menu remains available
   * — both can be used together. Default `false`.
   *
   * Requires `sideFiltersConfig` to be supplied with a `columnsConfig`.
   */
  enableSideFilters?: boolean;
  /**
   * Required side-panel configuration when `enableSideFilters` is `true`.
   * Exposes the filter `columnsConfig`, optional section grouping, and
   * presentation overrides.
   */
  sideFiltersConfig?: DocyrusDataTableSideFiltersConfig<TData>;
  /**
   * Initial expanded state for the side panel. When `false`, the panel
   * mounts collapsed and renders a vertical rail with a 90°-rotated
   * "Filters" label that re-expands the panel on click. Default `true`.
   */
  sideFiltersDefaultExpanded?: boolean;
  /**
   * Controlled expanded state. Pair with `onSideFiltersExpandedChange`. When
   * omitted, the hook manages the state internally.
   */
  sideFiltersExpanded?: boolean;
  /** Called when the user toggles the side-panel collapse/expand control. */
  onSideFiltersExpandedChange?: (expanded: boolean) => void;
  /**
   * Width of the side panel when expanded. Number → px. Default `280`.
   */
  sideFiltersWidth?: number | string;
}

export interface UseDocyrusDataTableResult<TData> extends Omit<
  UseDocyrusDataViewSelectResult,
  'gridViewSelectProps'
> {
  table: ReturnType<typeof useReactTable<TData>>;
  tableProps: Omit<DataTableProps<TData>, 'table'> & {
    isReloading?: boolean;
  };
  toolbar: ReactNode;
  sidePanel: ReactNode;
  /**
   * Pre-wired view element that switches between `<DataTable>` (table mode)
   * and `<DataGridGallery>` (gallery mode) based on the current display
   * mode. Render this directly instead of `<DataTable>` when you want the
   * built-in display-menu toggle to drive the layout.
   */
  view: ReactNode;
  /** Current display mode (`'table'` or `'gallery'`). */
  displayMode: DataGridDisplayMode;
  /** Programmatically change the display mode. */
  setDisplayMode: (mode: DataGridDisplayMode) => void;
  /**
   * Pre-wired side-panel filter element. `null` when `enableSideFilters`
   * is `false`. Renders the full panel when expanded and a thin vertical
   * rail (with a 90°-rotated "Filters" label) when collapsed. Render to
   * the left of `<DataTable>` (typically inside the same flex row as
   * `sidePanel`).
   */
  sideFilters: ReactNode;
  /** Current expanded state of the side filter panel. */
  sideFiltersExpanded: boolean;
  /** Programmatically toggle the side filter panel expanded state. */
  setSideFiltersExpanded: (expanded: boolean) => void;
  /**
   * Current `RuleGroupType` emitted by the side filter panel, or
   * `undefined` when no rules are active.
   */
  sideFiltersQuery: RuleGroupType | undefined;
  items: Array<TData>;
  resolvedListParams: DocyrusDataGridListParams;
  pagingMode: 'standard' | 'virtual-scroll' | undefined;
  reload: () => void;
}

export function useDocyrusDataTable<TData>(
  options: UseDocyrusDataTableOptions<TData>
): UseDocyrusDataTableResult<TData> {
  const {
    data: providedData,
    collection,
    listParams,
    defaultLimit = 100,
    enableItemsQuery = providedData === undefined,
    showSelectColumn = true,
    enableRowNumbers = true,
    selectColumn,
    actionsColumn,
    extraColumns,
    mapColumn,
    enableViewSelect = true,
    viewSelectVariant = 'horizontal-tabs',
    viewSelectMaxVisible,
    enableSearchInput = true,
    enableFilterMenu = true,
    enableGroupMenu = true,
    enableSortMenu = true,
    enableDisplayMenu = false,
    defaultDisplayMode = 'table',
    displayMode: displayModeProp,
    onDisplayModeChange,
    cardConfig,
    galleryHeight = 'auto',
    galleryClassName,
    enableReloadButton = true,
    enableServerExportMenu = true,
    serverExportLimit = 10000,
    serverExportExcludedFieldTypes,
    serverExportExcludedSlugs,
    onReload,
    searchPlaceholder = 'Search...',
    searchDebounceMs = 300,
    toolbarClassName,
    toolbarStartContent,
    toolbarEndContent,
    extraBulkActions,
    bulkActions = ['update', 'delete', 'export'],
    exportColumns = 'visible',
    exportFileName,
    users,
    formatDate,
    formatDateTime,
    formatNumber,
    initialState,
    tableClassName,
    tableContainerClassName,
    emptyText,
    enableSideFilters = false,
    sideFiltersConfig,
    sideFiltersDefaultExpanded = true,
    sideFiltersExpanded: sideFiltersExpandedProp,
    onSideFiltersExpandedChange,
    sideFiltersWidth = 280,
    ...viewSelectOptions
  } = options

  const bulkActionSet = useMemo(() => {
    if (bulkActions === false) return new Set<DocyrusDataGridBulkAction>()

    return new Set<DocyrusDataGridBulkAction>(bulkActions)
  }, [bulkActions])

  const itemsRefetchRef = useRef<(() => Promise<unknown>) | null>(null)
  const { defaultRowGroupingColumn } = viewSelectOptions

  const viewSelect = useDocyrusDataViewSelect(viewSelectOptions)
  const {
    dataSource,
    gridViewSelectProps,
    refetch: refetchViewSelect,
    views,
    activeViewId
  } = viewSelect

  const activeView = useMemo<SavedDataGridView | undefined>(
    () => views.find(view => view.id === activeViewId),
    [views, activeViewId]
  )

  const isStandardPaging =
    activeView?.pagingEnabled === true &&
    (activeView.pagingMode ?? 'virtual-scroll') === 'standard'
  const initialPageSize = activeView?.pageSize ?? defaultLimit

  const [pagination, setPagination] = useState<PaginationState>(
    () => initialState?.pagination ?? {
        pageIndex: 0,
        pageSize: initialPageSize
      }
  )
  const [sorting, setSorting] = useState<SortingState>(
    () => initialState?.sorting ?? []
  )
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    () => initialState?.columnFilters ?? []
  )
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    () => initialState?.columnVisibility ?? {}
  )
  const [rowSelection, setRowSelection] = useState<RowSelectionState>(
    () => initialState?.rowSelection ?? {}
  )
  const [expanded, setExpanded] = useState<ExpandedState>(
    () => initialState?.expanded ?? {}
  )
  const [grouping, setGrouping] = useState<GroupingState>(
    () => initialState?.grouping ?? []
  )
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const [trackedActiveViewId, setTrackedActiveViewId] = useState(activeViewId)
  const [trackedInitialPageSize, setTrackedInitialPageSize] =
    useState(initialPageSize)
  const [trackedDebouncedSearch, setTrackedDebouncedSearch] =
    useState(debouncedSearch)
  const [trackedColumnFilters, setTrackedColumnFilters] =
    useState(columnFilters)

  if (trackedActiveViewId !== activeViewId) {
    setTrackedActiveViewId(activeViewId)
    setTrackedInitialPageSize(initialPageSize)
    setPagination({ pageIndex: 0, pageSize: initialPageSize })
    if (columnFilters.length > 0) setColumnFilters([])
  } else if (trackedInitialPageSize !== initialPageSize) {
    setTrackedInitialPageSize(initialPageSize)
    setPagination(prev => ({
      ...prev,
      pageSize: initialPageSize,
      pageIndex: 0
    }))
  } else if (
    trackedDebouncedSearch !== debouncedSearch ||
    trackedColumnFilters !== columnFilters
  ) {
    setTrackedDebouncedSearch(debouncedSearch)
    setTrackedColumnFilters(columnFilters)
    if (pagination.pageIndex !== 0) {
      setPagination(prev => ({ ...prev, pageIndex: 0 }))
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(searchInput)
    }, searchDebounceMs)

    return () => window.clearTimeout(timeout)
  }, [searchInput, searchDebounceMs])

  const groupingRequiredSlugs = useMemo<Array<string>>(() => {
    const fromView = activeView?.grouping ?? []

    if (fromView.length > 0) return fromView
    if (defaultRowGroupingColumn) return [defaultRowGroupingColumn]

    return []
  }, [activeView, defaultRowGroupingColumn])

  /*
   * Side-panel filter state. Always called (Rules of Hooks); when
   * disabled, `enableSideFilters` short-circuits the merge so no rules are
   * sent. When enabled, the emitted `RuleGroupType` is folded into the
   * items request alongside the view filter and toolbar filter rules.
   */
  const sideFiltersColumnsConfig = useMemo(
    () => sideFiltersConfig?.columnsConfig ??
      ([] as ReadonlyArray<ColumnConfig<TData, any, any, any>>),
    [sideFiltersConfig?.columnsConfig]
  )
  const sideFiltersStrategy: FilterStrategy =
    sideFiltersConfig?.strategy ?? 'server'
  const [sideFiltersQuery, setSideFiltersQuery] = useState<
    RuleGroupType | undefined
  >(undefined)
  const sideFilterDtf = useDataTableSideFilters<
    TData,
    ReadonlyArray<ColumnConfig<TData, any, any, any>>,
    FilterStrategy
  >({
    columnsConfig: sideFiltersColumnsConfig,
    strategy: sideFiltersStrategy,
    data: [],
    defaults: sideFiltersConfig?.defaults,
    sections: sideFiltersConfig?.sections,
    onQueryChange: setSideFiltersQuery
  })
  const sideFiltersActiveQuery = enableSideFilters
    ? sideFiltersQuery
    : undefined

  const [internalSideFiltersExpanded, setInternalSideFiltersExpanded] =
    useState<boolean>(sideFiltersDefaultExpanded)
  const isSideFiltersControlled = sideFiltersExpandedProp !== undefined
  const sideFiltersExpanded = isSideFiltersControlled
    ? sideFiltersExpandedProp
    : internalSideFiltersExpanded

  const setSideFiltersExpanded = useCallback(
    (next: boolean) => {
      if (!isSideFiltersControlled) setInternalSideFiltersExpanded(next)
      onSideFiltersExpandedChange?.(next)
    },
    [isSideFiltersControlled, onSideFiltersExpandedChange]
  )

  /*
   * Display mode (table vs gallery). When uncontrolled, the hook owns the
   * state; otherwise the prop wins. The chosen mode is also forwarded into
   * `table.options.meta` so the existing `<DataGridDisplayMenu>` (which
   * reads from there) drives the toggle.
   */
  const [internalDisplayMode, setInternalDisplayMode] =
    useState<DataGridDisplayMode>(defaultDisplayMode)
  const isDisplayModeControlled = displayModeProp !== undefined
  const displayMode: DataGridDisplayMode = isDisplayModeControlled
    ? displayModeProp
    : internalDisplayMode

  const setDisplayMode = useCallback(
    (next: DataGridDisplayMode) => {
      if (!isDisplayModeControlled) setInternalDisplayMode(next)
      onDisplayModeChange?.(next)
    },
    [isDisplayModeControlled, onDisplayModeChange]
  )

  const resolvedListParams = useMemo<DocyrusDataGridListParams>(
    () => buildListParams({
        fields: dataSource?.fields,
        view: activeView,
        filterKeyword: debouncedSearch.trim() || undefined,
        defaultLimit,
        override: listParams,
        requiredSlugs: groupingRequiredSlugs,
        pagination: isStandardPaging ? pagination : undefined,
        toolbarFilters: columnFilters,
        sideFilters: sideFiltersActiveQuery
      }),
    [
      dataSource?.fields,
      activeView,
      debouncedSearch,
      defaultLimit,
      listParams,
      groupingRequiredSlugs,
      isStandardPaging,
      pagination,
      columnFilters,
      sideFiltersActiveQuery
    ]
  )

  const itemsKey = useMemo(
    () => [
        'docyrus',
        'docyrusDataTableItems',
        viewSelectOptions.appSlug,
        viewSelectOptions.dataSourceSlug,
        collection ? 'collection' : 'direct',
        resolvedListParams
      ] as const,
    [
      viewSelectOptions.appSlug,
      viewSelectOptions.dataSourceSlug,
      collection,
      resolvedListParams
    ]
  )

  const viewMetadataReady =
    !viewSelect.isLoading && (views.length === 0 || Boolean(activeViewId))

  const itemsQuery = useQuery<{
    items: Array<TData>;
    total: number | undefined;
  }>({
    queryKey: itemsKey,
    queryFn: async () => {
      const response = collection
        ? await collection.list(resolvedListParams)
        : await viewSelectOptions.client.get<
            Array<TData> | { data: Array<TData>; meta?: { total?: number } }
          >(
            `/v1/apps/${viewSelectOptions.appSlug}/data-sources/${viewSelectOptions.dataSourceSlug}/items`,
            resolvedListParams as Parameters<
              typeof viewSelectOptions.client.get
            >[1]
          )

      return {
        items: unwrapItems<TData>(response),
        total: unwrapTotal(response)
      }
    },
    enabled:
      providedData === undefined &&
      enableItemsQuery &&
      Boolean(viewSelectOptions.appSlug) &&
      Boolean(viewSelectOptions.dataSourceSlug) &&
      viewMetadataReady,
    staleTime: viewSelectOptions.staleTime ?? 30_000,
    placeholderData: keepPreviousData
  })

  itemsRefetchRef.current = itemsQuery.refetch

  const items = useMemo<Array<TData>>(() => {
    if (providedData) {
      if (isStandardPaging) {
        const start = pagination.pageIndex * pagination.pageSize

        return providedData.slice(start, start + pagination.pageSize)
      }

      return providedData
    }

    return itemsQuery.data?.items ?? []
  }, [
    providedData,
    itemsQuery.data,
    isStandardPaging,
    pagination.pageIndex,
    pagination.pageSize
  ])

  const rowCount = useMemo<number | undefined>(() => {
    if (!isStandardPaging) return undefined
    if (providedData) return providedData.length

    return itemsQuery.data?.total
  }, [isStandardPaging, providedData, itemsQuery.data])

  const reload = useCallback(() => {
    refetchViewSelect()
    if (providedData === undefined) {
      void itemsQuery.refetch()
    }
    onReload?.()
  }, [
refetchViewSelect,
itemsQuery,
providedData,
onReload
])

  const reloadItems = useCallback(() => {
    if (providedData === undefined) {
      void itemsQuery.refetch()
    }
    onReload?.()
  }, [itemsQuery, providedData, onReload])

  const columns = useMemo<Array<ColumnDef<TData>>>(() => {
    const fieldColumns = (dataSource?.fields ?? [])
      .map((field) => {
        const defaultColumn = buildDataTableColumnDef<TData>({
          field,
          appSlug: viewSelectOptions.appSlug,
          dataSourceSlug: viewSelectOptions.dataSourceSlug,
          users
        })
        const mapped = mapColumn
          ? mapColumn(field, defaultColumn)
          : defaultColumn

        return mapped
      })
      .filter((column): column is ColumnDef<TData> => column !== null)

    const resolvedSelectColumn = showSelectColumn
      ? (selectColumn ??
        getDataTableSelectColumn<TData>({
          size: 44,
          minSize: 44,
          enableRowNumbers
        }))
      : null

    return [
      ...(resolvedSelectColumn ? [resolvedSelectColumn] : []),
      ...(actionsColumn ? [actionsColumn] : []),
      ...(extraColumns ?? []),
      ...fieldColumns
    ]
  }, [
    dataSource?.fields,
    viewSelectOptions.appSlug,
    viewSelectOptions.dataSourceSlug,
    users,
    mapColumn,
    showSelectColumn,
    selectColumn,
    enableRowNumbers,
    actionsColumn,
    extraColumns
  ])

  const table = useReactTable<TData>({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: isStandardPaging,
    rowCount,
    manualFiltering: providedData === undefined,
    state: {
      pagination,
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      expanded,
      grouping
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onExpandedChange: setExpanded,
    onGroupingChange: setGrouping,
    enableRowSelection: showSelectColumn,
    meta: {
      ...(formatDate ? { formatDate } : {}),
      ...(formatDateTime ? { formatDateTime } : {}),
      ...(formatNumber ? { formatNumber } : {}),
      displayMode,
      onDisplayModeChange: setDisplayMode,
      loadCellOptions: async (column, params) => {
        const config = getAsyncOptions(column)

        if (!config) return { items: [], hasMore: false }

        return config.load(params)
      }
    }
  })

  useEffect(() => {
    if (providedData === undefined) return
    table.setGlobalFilter(debouncedSearch || undefined)
  }, [debouncedSearch, providedData, table])

  useEffect(() => {
    if (!activeView) return
    if (!dataSource?.fields || dataSource.fields.length === 0) return

    applyViewToTable(table, activeView)

    const groupingForVisibility: Array<string> =
      (activeView.grouping ?? []).length > 0
        ? (activeView.grouping ?? [])
        : defaultRowGroupingColumn
          ? [defaultRowGroupingColumn]
          : []

    table.setColumnVisibility(
      buildEnhancedVisibility(
        dataSource.fields,
        activeView,
        groupingForVisibility
      )
    )

    const reservedIds: Array<string> = []

    if (showSelectColumn) reservedIds.push('select')
    if (actionsColumn) reservedIds.push('actions')

    if (reservedIds.length > 0) {
      const orderFromView = activeView.columnOrder ?? []

      table.setColumnOrder([...reservedIds, ...orderFromView.filter(id => !reservedIds.includes(id))])
    }

    const hasViewGrouping = (activeView.grouping ?? []).length > 0
    const fieldSlugs = new Set(dataSource.fields.map(field => field.slug))

    if (
      !hasViewGrouping &&
      defaultRowGroupingColumn &&
      fieldSlugs.has(defaultRowGroupingColumn)
    ) {
      table.setGrouping([defaultRowGroupingColumn])
      table.setExpanded(true)
    }
  }, [
    activeView,
    dataSource?.fields,
    table,
    showSelectColumn,
    actionsColumn,
    defaultRowGroupingColumn
  ])

  const dataSourcesLookupQuery = useQuery<
    Map<string, { appSlug: string; slug: string }>
  >({
    queryKey: ['docyrus', 'docyrusDataTableDataSources'],
    queryFn: async () => {
      const response = await viewSelectOptions.client.get<
        | { data?: Array<Record<string, unknown>> }
        | Array<Record<string, unknown>>
      >('/v1/apps/data-sources')
      const list = Array.isArray(response) ? response : (response?.data ?? [])
      const map = new Map<string, { appSlug: string; slug: string }>()

      for (const entry of list) {
        const id = typeof entry.id === 'string' ? entry.id : null
        const slug = typeof entry.slug === 'string' ? entry.slug : null
        const appSlugFromSnake =
          typeof entry.app_slug === 'string' ? entry.app_slug : null
        const appSlugFromCamel =
          typeof entry.appSlug === 'string' ? entry.appSlug : null
        const targetAppSlug = appSlugFromCamel ?? appSlugFromSnake

        if (id && slug && targetAppSlug) {
          map.set(id, { appSlug: targetAppSlug, slug })
        }
      }

      return map
    },
    enabled: false,
    staleTime: 5 * 60_000
  })

  const ensureDataSourcesLookup = useCallback(async () => {
    if (dataSourcesLookupQuery.data) return dataSourcesLookupQuery.data
    const result = await dataSourcesLookupQuery.refetch()

    return result.data ?? new Map()
  }, [dataSourcesLookupQuery])

  const getAsyncOptions = useCallback(
    (column: {
      columnDef: { meta?: { cell?: unknown } };
    }): AsyncOptionsConfig | undefined => {
      const cellMeta = column.columnDef.meta?.cell as
        | {
            variant?: string;
            dataSourceId?: string;
            relationAppSlug?: string;
            relationDataSourceSlug?: string;
          }
          | undefined
      const variant = cellMeta?.variant

      if (variant === 'user' || variant === 'user-multi-select') {
        return {
          load: async ({ search, page, pageSize, signal }) => {
            const response = await viewSelectOptions.client.get<
              | {
                  data?: Array<Record<string, unknown>>;
                  meta?: { total?: number };
                }
                | Array<Record<string, unknown>>
            >(
              '/v1/users',
              {
                filterKeyword: search || undefined,
                limit: pageSize,
                offset: page * pageSize,
                fullCount: true
              },
              { signal }
            )
            const items = Array.isArray(response)
              ? response
              : (response?.data ?? [])
            const total = !Array.isArray(response)
              ? response?.meta?.total
              : undefined
            const mapped = items
              .map((record) => {
                const id =
                  typeof record.id === 'string'
                    ? record.id
                    : typeof record.userId === 'string'
                      ? record.userId
                      : typeof record.user_id === 'string'
                        ? record.user_id
                        : null

                if (!id) return null

                const firstName =
                  typeof record.firstname === 'string'
                    ? record.firstname
                    : typeof record.firstName === 'string'
                      ? record.firstName
                      : typeof record.first_name === 'string'
                        ? record.first_name
                        : null
                const lastName =
                  typeof record.lastname === 'string'
                    ? record.lastname
                    : typeof record.lastName === 'string'
                      ? record.lastName
                      : typeof record.last_name === 'string'
                        ? record.last_name
                        : null
                const fullName = firstName
                  ? lastName
                    ? `${firstName} ${lastName}`
                    : firstName
                  : lastName
                const email =
                  typeof record.email === 'string' ? record.email : null
                const label = fullName ?? email ?? id
                const secondaryLabel =
                  email && email !== label ? email : undefined
                const imageUrl =
                  typeof record.photo === 'string'
                    ? record.photo
                    : typeof record.avatar_url === 'string'
                      ? record.avatar_url
                      : typeof record.avatarUrl === 'string'
                        ? record.avatarUrl
                        : typeof record.profile_image_url === 'string'
                          ? record.profile_image_url
                          : typeof record.profileImageUrl === 'string'
                            ? record.profileImageUrl
                            : undefined
                const icon = imageUrl ? undefined : (
                  <DocyrusIcon
                    icon="huge user-circle-02"
                    className="size-6 text-muted-foreground" />
                )

                return {
                  value: id,
                  label,
                  ...(secondaryLabel ? { secondaryLabel } : {}),
                  ...(imageUrl ? { imageUrl } : {}),
                  ...(icon ? { icon } : {})
                }
              })
              .filter(
                (
                  option
                ): option is {
                  value: string;
                  label: string;
                  secondaryLabel?: string;
                  imageUrl?: string;
                  icon?: ReactElement;
                } => option !== null
              )
            const hasMore =
              typeof total === 'number'
                ? (page + 1) * pageSize < total
                : items.length === pageSize

            return { items: mapped, hasMore }
          }
        }
      }

      if (variant === 'relation') {
        const dataSourceId = cellMeta?.dataSourceId
        const directAppSlug = cellMeta?.relationAppSlug
        const directSlug = cellMeta?.relationDataSourceSlug

        if (!dataSourceId && !(directAppSlug && directSlug)) return undefined

        return {
          load: async ({ search, page, pageSize, signal }) => {
            let target: { appSlug: string; slug: string } | undefined =
              directAppSlug && directSlug
                ? { appSlug: directAppSlug, slug: directSlug }
                : undefined

            if (!target) {
              const lookup = await ensureDataSourcesLookup()

              if (signal?.aborted)
                throw new DOMException('Aborted', 'AbortError')

              target = dataSourceId ? lookup.get(dataSourceId) : undefined
            }

            if (!target) return { items: [], hasMore: false }

            const response = await viewSelectOptions.client.get<
              | {
                  data?: Array<Record<string, unknown>>;
                  meta?: { total?: number };
                }
                | Array<Record<string, unknown>>
            >(
              `/v1/apps/${target.appSlug}/data-sources/${target.slug}/items`,
              {
                columns: 'id, name, autonumber_id',
                filterKeyword: search || undefined,
                limit: pageSize,
                offset: page * pageSize,
                fullCount: true
              },
              { signal }
            )
            const items = Array.isArray(response)
              ? response
              : (response?.data ?? [])
            const total = !Array.isArray(response)
              ? response?.meta?.total
              : undefined
            const mapped = items
              .map((record) => {
                const id = typeof record.id === 'string' ? record.id : null
                const label =
                  typeof record.name === 'string'
                    ? record.name
                    : typeof record.autonumber_id === 'string' ||
                      typeof record.autonumber_id === 'number'
                      ? String(record.autonumber_id)
                      : id

                if (!id || !label) return null

                return { value: id, label }
              })
              .filter(
                (option): option is { value: string; label: string } => option !== null
              )
            const hasMore =
              typeof total === 'number'
                ? (page + 1) * pageSize < total
                : items.length === pageSize

            return { items: mapped, hasMore }
          }
        }
      }

      return undefined
    },
    [viewSelectOptions, ensureDataSourcesLookup]
  )

  const { exportData: exportServerData, isExporting: isServerExporting } =
    useDocyrusDataExport({
      client: viewSelectOptions.client,
      defaultLimit: serverExportLimit
    })

  const serverExportableFields = useMemo<Array<DataSourceField>>(() => {
    const fields = dataSource?.fields ?? []

    if (fields.length === 0) return []

    const excludedSlugs = new Set<string>(
      serverExportExcludedSlugs ?? DEFAULT_SERVER_EXPORT_EXCLUDED_SLUGS
    )
    const excludedTypes = new Set<string>(
      serverExportExcludedFieldTypes ?? DEFAULT_SERVER_EXPORT_EXCLUDED_TYPES
    )

    return fields.filter((field) => {
      if (excludedSlugs.has(field.slug)) return false
      if (typeof field.type === 'string' && excludedTypes.has(field.type))
        return false

      const fieldRecord = field as Record<string, unknown>

      if (fieldRecord.export === false) return false

      return true
    })
  }, [dataSource?.fields, serverExportExcludedSlugs, serverExportExcludedFieldTypes])

  const serverExportColumnSlugs = useCallback(
    (scope: 'visible' | 'all'): Array<string> => {
      if (serverExportableFields.length === 0) return []

      if (scope === 'all') {
        return serverExportableFields.map(field => field.slug)
      }

      const visibleSet = new Set(
        deriveVisibleSlugs(
          dataSource?.fields ?? [],
          activeView,
          groupingRequiredSlugs
        )
      )

      return serverExportableFields
        .filter(field => visibleSet.has(field.slug))
        .map(field => field.slug)
    },
    [
      serverExportableFields,
      dataSource?.fields,
      activeView,
      groupingRequiredSlugs
    ]
  )

  const serverExportFieldOptions = useMemo<Array<DocyrusDataExportFieldOption>>(
    () => serverExportableFields.map(field => ({
        slug: field.slug,
        name:
          typeof field.name === 'string' && field.name.length > 0
            ? field.name
            : field.slug,
        type: typeof field.type === 'string' ? field.type : ''
      })),
    [serverExportableFields]
  )

  const serverExportVisibleSlugs = useMemo(
    () => serverExportColumnSlugs('visible'),
    [serverExportColumnSlugs]
  )

  const handleServerExport = useCallback(
    async (selection: DocyrusDataExportSelection) => {
      const dataSourceId =
        typeof dataSource?.id === 'string' ? dataSource.id : null

      if (!dataSourceId) return

      const columns =
        selection.scope === 'custom'
          ? selection.columns.map(encodeDocyrusDataExportColumn)
          : serverExportColumnSlugs(selection.scope)
      const payload: DocyrusDataExportPayload = {
        dataSourceId,
        columns: columns.length > 0 ? columns : '*',
        filters:
          resolvedListParams.filters as DocyrusDataExportPayload['filters'],
        filterKeyword:
          typeof resolvedListParams.filterKeyword === 'string'
            ? resolvedListParams.filterKeyword
            : undefined,
        limit: serverExportLimit
      }

      await exportServerData(payload)
    },
    [
      dataSource?.id,
      serverExportColumnSlugs,
      resolvedListParams.filters,
      resolvedListParams.filterKeyword,
      serverExportLimit,
      exportServerData
    ]
  )

  const canServerExport = enableServerExportMenu && Boolean(dataSource?.id)
  const isReloading =
    providedData === undefined && itemsQuery.isFetching && !itemsQuery.isLoading

  const selectedRows = table
    .getFilteredSelectedRowModel()
    .rows.map(row => row.original)

  const exportColumnDefs = useMemo<Array<DataExportColumn<TData>>>(() => {
    const fields = dataSource?.fields ?? []
    const visibility = table.getState().columnVisibility
    const slugs = (() => {
      if (Array.isArray(exportColumns)) return exportColumns
      if (exportColumns === 'all') return fields.map(field => field.slug)

      return fields
        .map(field => field.slug)
        .filter(slug => visibility[slug] !== false)
    })()

    return slugs
      .map(slug => fields.find(field => field.slug === slug))
      .filter((field): field is DataSourceField => field !== undefined)
      .map<DataExportColumn<TData>>(field => ({
        id: field.slug,
        header:
          typeof field.name === 'string' && field.name.length > 0
            ? field.name
            : field.slug
      }))
  }, [dataSource?.fields, exportColumns, table])

  const { exportData } = useDataExport<TData>({
    columns: exportColumnDefs,
    fileName: exportFileName ?? viewSelectOptions.dataSourceSlug ?? 'export'
  })

  const clearSelection = useCallback(() => {
    table.toggleAllRowsSelected(false)
  }, [table])

  const bulkDeleteMutation = useMutation({
    mutationFn: async (recordIds: ReadonlyArray<string>) => {
      const body = { recordIds: [...recordIds] }

      if (collection?.deleteMany) {
        await collection.deleteMany(body)

        return
      }

      await viewSelectOptions.client.delete(
        `/v1/apps/${viewSelectOptions.appSlug}/data-sources/${viewSelectOptions.dataSourceSlug}/items`,
        body
      )
    }
  })

  const [bulkUpdateOpen, setBulkUpdateOpen] = useState(false)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [bulkUpdateRecords, setBulkUpdateRecords] = useState<
    ReadonlyArray<TData>
  >([])
  const [bulkDeleteIds, setBulkDeleteIds] = useState<ReadonlyArray<string>>([])
  const [bulkDeleteCount, setBulkDeleteCount] = useState(0)

  const onConfirmBulkDelete = useCallback(async () => {
    if (bulkDeleteIds.length === 0) return

    setIsBulkDeleting(true)

    try {
      await bulkDeleteMutation.mutateAsync(bulkDeleteIds)
      setBulkDeleteOpen(false)
      clearSelection()

      if (providedData === undefined) {
        void itemsRefetchRef.current?.()
      }
    } finally {
      setIsBulkDeleting(false)
    }
  }, [
bulkDeleteIds,
bulkDeleteMutation,
clearSelection,
providedData
])

  const onBulkUpdateSuccess = useCallback(() => {
    clearSelection()

    if (providedData === undefined) {
      void itemsRefetchRef.current?.()
    }
  }, [clearSelection, providedData])

  const bulkActionDescriptors = useMemo<Array<DataGridAction<TData>>>(() => {
    if (
      bulkActionSet.size === 0 &&
      (!extraBulkActions || extraBulkActions.length === 0)
    )
      return []

    const list: Array<DataGridAction<TData>> = []

    if (bulkActionSet.has('update')) {
      list.push({
        key: 'bulk-update',
        label: 'Update',
        icon: <Pencil className="size-4" />,
        onAction: (rows) => {
          if (rows.length === 0) return
          setBulkUpdateRecords(rows)
          setBulkUpdateOpen(true)
        }
      })
    }

    if (bulkActionSet.has('delete')) {
      list.push({
        key: 'bulk-delete',
        label: 'Delete',
        icon: <Trash2 className="size-4" />,
        variant: 'destructive',
        onAction: (rows) => {
          const ids = rows
            .map(row => (row as { id?: unknown }).id)
            .filter(
              (id): id is string => typeof id === 'string' && id.length > 0
            )

          if (ids.length === 0) return

          setBulkDeleteIds(ids)
          setBulkDeleteCount(rows.length)
          setBulkDeleteOpen(true)
        }
      })
    }

    if (bulkActionSet.has('export')) {
      list.push({
        key: 'bulk-export',
        label: 'Export',
        render: rows => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm">
                <Download className="size-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => void exportData(rows, 'csv')}>
                CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void exportData(rows, 'xlsx')}>
                Excel (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void exportData(rows, 'json')}>
                JSON
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => void exportData(rows, 'markdown')}>
                Markdown
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      })
    }

    if (extraBulkActions && extraBulkActions.length > 0) {
      list.push(...extraBulkActions)
    }

    return list
  }, [bulkActionSet, exportData, extraBulkActions])

  const selectionToolbar =
    selectedRows.length > 0 && bulkActionDescriptors.length > 0 ? (
      <div className="flex items-center justify-between gap-3 border-t px-3 py-2 text-sm">
        <span className="text-muted-foreground tabular-nums">
          {selectedRows.length} selected
        </span>
        <div className="flex items-center gap-2">
          {bulkActionDescriptors.map(action => action.render ? (
              <span key={action.key}>{action.render(selectedRows)}</span>
            ) : (
              <Button
                key={action.key}
                variant={action.variant === 'destructive' ? 'destructive' : 'secondary'}
                size="sm"
                onClick={() => action.onAction?.(selectedRows)}>
                {action.icon}
                {action.label}
              </Button>
            ))}
        </div>
      </div>
    ) : null

  const bulkDialogs =
    bulkActionSet.size > 0 ? (
      <>
        {bulkActionSet.has('update') && (
          <BulkUpdateDialog
            open={bulkUpdateOpen}
            onOpenChange={(next) => {
              setBulkUpdateOpen(next)
              if (!next) setBulkUpdateRecords([])
            }}
            client={viewSelectOptions.client}
            appSlug={viewSelectOptions.appSlug}
            dataSourceSlug={viewSelectOptions.dataSourceSlug}
            records={bulkUpdateRecords as ReadonlyArray<{ id: string }>}
            onSuccess={onBulkUpdateSuccess} />
        )}
        {bulkActionSet.has('delete') && (
          <RecordDeleteConfirmDialog
            open={bulkDeleteOpen}
            onOpenChange={(next) => {
              if (!next && !isBulkDeleting) {
                setBulkDeleteOpen(false)
                setBulkDeleteIds([])
                setBulkDeleteCount(0)
              }
            }}
            recordCount={bulkDeleteCount}
            isPending={isBulkDeleting}
            onConfirm={onConfirmBulkDelete} />
        )}
      </>
    ) : null

  const renderViewSelectInToolbar =
    enableViewSelect && viewSelectVariant !== 'vertical-tabs'
  const renderViewSelectInSidePanel =
    enableViewSelect && viewSelectVariant === 'vertical-tabs'

  const controlsToolbar = (
    <div
      data-slot="docyrus-data-table-toolbar"
      className={cn('flex items-start gap-2 px-3 py-2', toolbarClassName)}>
      <div className="flex min-w-0 flex-1 items-center gap-2 flex-wrap">
        {toolbarStartContent}
        {renderViewSelectInToolbar && (
          <DataGridViewSelect
            table={table}
            variant={viewSelectVariant}
            maxVisibleViews={viewSelectMaxVisible}
            editable
            {...gridViewSelectProps} />
        )}
        {enableSearchInput && (
          <div className="relative shrink-0">
            <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={searchInput}
              onChange={event => setSearchInput(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-8 w-56 pl-7" />
          </div>
        )}
        {enableFilterMenu && (
          <DataGridFilterMenu
            table={table}
            getAsyncOptions={getAsyncOptions}
            className="min-w-fit flex-1" />
        )}
      </div>
      <div className="flex flex-none shrink-0 items-center gap-2">
        {enableGroupMenu && (
          <DataGridGroupMenu
            table={table}
            defaultRowGroupingColumn={defaultRowGroupingColumn} />
        )}
        {enableSortMenu && <DataGridSortMenu table={table} />}
        {enableDisplayMenu && <DataGridDisplayMenu table={table} />}
        {canServerExport && (
          <DocyrusDataExportMenu
            onExport={handleServerExport}
            fields={serverExportFieldOptions}
            visibleSlugs={serverExportVisibleSlugs}
            isExporting={isServerExporting} />
        )}
        {enableReloadButton && (
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Reload"
            disabled={isReloading}
            onClick={reloadItems}>
            {isReloading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RotateCw className="size-4" />
            )}
          </Button>
        )}
        {toolbarEndContent}
      </div>
    </div>
  )

  const toolbar = (
    <>
      {controlsToolbar}
      {selectionToolbar}
      {bulkDialogs}
    </>
  )

  const sidePanel: ReactNode = renderViewSelectInSidePanel ? (
    <DataGridSidePanel>
      <DataGridViewSelect
        table={table}
        variant="vertical-tabs"
        editable
        {...gridViewSelectProps} />
    </DataGridSidePanel>
  ) : null

  const expandedSideFilterWidth =
    typeof sideFiltersWidth === 'number'
      ? `${sideFiltersWidth}px`
      : sideFiltersWidth
  const sideFiltersNode: ReactNode =
    enableSideFilters && sideFiltersConfig ? (
      <DataTableSideFilters
        columns={sideFilterDtf.columns}
        filters={sideFilterDtf.filters}
        actions={sideFilterDtf.actions}
        strategy={sideFilterDtf.strategy}
        defaults={sideFilterDtf.defaults}
        sections={sideFilterDtf.sections}
        locale={sideFiltersConfig.locale}
        variant={sideFiltersConfig.variant}
        title={sideFiltersConfig.title}
        showActiveChips={sideFiltersConfig.showActiveChips}
        showClearAll={sideFiltersConfig.showClearAll}
        searchable={sideFiltersConfig.searchable}
        clearAllLabel={sideFiltersConfig.clearAllLabel}
        clearLabel={sideFiltersConfig.clearLabel}
        className={cn(
          'h-full shrink-0 overflow-y-auto border-r p-3',
          sideFiltersConfig.className
        )}
        style={sideFiltersExpanded ? { width: expandedSideFilterWidth } : undefined}
        collapsible
        expanded={sideFiltersExpanded}
        onExpandedChange={setSideFiltersExpanded}
        collapsedWidth={sideFiltersConfig.collapsedWidth}
        collapseAriaLabel={sideFiltersConfig.collapseAriaLabel}
        expandAriaLabel={sideFiltersConfig.expandAriaLabel} />
    ) : null

  const isLoading =
    viewSelect.isLoading ||
    (providedData === undefined && (itemsQuery.isLoading || !viewMetadataReady))
  const error = viewSelect.error ?? itemsQuery.error ?? null
  const pagingMode: 'standard' | 'virtual-scroll' | undefined =
    activeView?.pagingEnabled
      ? (activeView.pagingMode ?? 'virtual-scroll')
      : undefined

  const tableProps: UseDocyrusDataTableResult<TData>['tableProps'] = {
    className: tableClassName,
    containerClassName: tableContainerClassName,
    emptyText,
    pagination: pagingMode === 'standard',
    isLoading,
    isReloading
  }

  const view: ReactNode =
    displayMode === 'gallery' ? (
      <DataGridGallery
        table={table}
        tableMeta={table.options.meta!}
        cardConfig={cardConfig}
        height={galleryHeight}
        className={galleryClassName} />
    ) : (
      <DataTable table={table} {...tableProps} />
    )

  return {
    table,
    tableProps,
    toolbar,
    sidePanel,
    view,
    displayMode,
    setDisplayMode,
    sideFilters: sideFiltersNode,
    sideFiltersExpanded,
    setSideFiltersExpanded,
    sideFiltersQuery: sideFiltersActiveQuery,
    items,
    resolvedListParams,
    pagingMode,
    reload,
    views: viewSelect.views,
    fields: viewSelect.fields,
    dataSource: viewSelect.dataSource,
    activeViewId: viewSelect.activeViewId,
    setActiveViewId: viewSelect.setActiveViewId,
    isLoading,
    error,
    refetch: reload
  }
}

interface BuildDataTableColumnDefOptions {
  field: DocyrusFieldLike;
  appSlug?: string;
  dataSourceSlug?: string;
  users?: ReadonlyArray<CellUserOption>;
}

function buildDataTableColumnDef<TData = unknown>({
  field,
  appSlug,
  dataSourceSlug,
  users
}: BuildDataTableColumnDefOptions): ColumnDef<TData> {
  const fieldType = field.type as IFieldType
  const FieldValue = VALUE_RENDERER_MAP[fieldType] ?? TextValue
  const ifield = toIField(field)
  const enumOptions = extractEnumOptions(field)
  const cell = getCellOpts(field, { appSlug, dataSourceSlug, users })

  return {
    id: field.slug,
    accessorFn: (row: unknown) => getFieldValue(row, field.slug),
    header: field.name,
    cell: ({ getValue, row }) => (
      <FieldValue
        field={ifield}
        value={getValue()}
        record={row.original as Record<string, unknown>}
        enumOptions={enumOptions}
        uuid={fieldType === 'field-identity'}
        className="max-w-full" />
    ),
    meta: {
      label: field.name,
      cell,
      groupable: GROUPABLE_FIELD_TYPES.has(fieldType),
      renderGroupValue: ({ value, record }) => (
        <FieldValue
          field={ifield}
          value={value}
          record={record as Record<string, unknown> | undefined}
          enumOptions={enumOptions}
          uuid={fieldType === 'field-identity'}
          className="max-w-full" />
      )
    }
  }
}

function unwrapItems<TData>(
  value: Array<TData> | { data: Array<TData> } | unknown
): Array<TData> {
  if (Array.isArray(value)) return value
  if (
    value &&
    typeof value === 'object' &&
    Array.isArray((value as { data?: unknown }).data)
  ) {
    return (value as { data: Array<TData> }).data
  }

  return []
}

function unwrapTotal(value: unknown): number | undefined {
  if (!value || typeof value !== 'object') return undefined

  const { meta } = value as { meta?: unknown }

  if (!meta || typeof meta !== 'object') return undefined

  const { total } = meta as { total?: unknown }

  return typeof total === 'number' ? total : undefined
}

interface BuildListParamsArgs {
  fields: Array<DataSourceField> | undefined;
  view: SavedDataGridView | undefined;
  filterKeyword?: string;
  defaultLimit: number;
  override: DocyrusDataGridListParams | undefined;
  requiredSlugs?: Array<string>;
  pagination?: { pageIndex: number; pageSize: number };
  toolbarFilters?: ColumnFiltersState;
  sideFilters?: RuleGroupType | undefined;
}

function buildListParams(args: BuildListParamsArgs): DocyrusDataGridListParams {
  const {
    fields,
    view,
    filterKeyword,
    defaultLimit,
    override,
    requiredSlugs,
    pagination,
    toolbarFilters,
    sideFilters
  } = args
  const params: DocyrusDataGridListParams = {}
  const visibleSlugs = fields
    ? deriveVisibleSlugs(fields, view, requiredSlugs)
    : []
  const columns = buildColumnsParam(fields, view, requiredSlugs)

  if (columns) params.columns = columns

  const orderBy = buildOrderByParam(view?.sorting)

  if (orderBy) params.orderBy = orderBy

  const filters = buildFiltersParam(
    view?.filterQuery,
    toolbarFilters,
    sideFilters
  )

  if (filters) params.filters = filters
  if (filterKeyword) params.filterKeyword = filterKeyword

  const expand = buildExpandParam(fields, visibleSlugs)

  if (expand && expand.length > 0) params.expand = expand

  params.limit = defaultLimit
  params.offset = 0

  if (override) Object.assign(params, override)

  if (pagination) {
    params.limit = pagination.pageSize
    params.offset = pagination.pageIndex * pagination.pageSize
    params.fullCount = true
  }

  return params
}

function buildColumnsParam(
  fields: Array<DataSourceField> | undefined,
  view: SavedDataGridView | undefined,
  requiredSlugs: Array<string> | undefined
): string | undefined {
  if (!fields || fields.length === 0) return undefined

  const visibleSlugs = deriveVisibleSlugs(fields, view, requiredSlugs)

  if (visibleSlugs.length === 0) return undefined

  return ['id', ...visibleSlugs.filter(slug => slug !== 'id')].join(', ')
}

const EXPANDABLE_FIELD_TYPES = new Set<string>([
  'field-userSelect',
  'field-userMultiSelect',
  'field-relation',
  'field-relatedField',
  'field-select',
  'field-radioGroup',
  'field-enum',
  'field-systemEnum',
  'field-multiSelect',
  'field-tagSelect',
  'field-status',
  'field-approvalStatus'
])

function buildExpandParam(
  fields: Array<DataSourceField> | undefined,
  visibleSlugs: Array<string>
): Array<string> | undefined {
  if (!fields || fields.length === 0 || visibleSlugs.length === 0)
    return undefined

  const visible = new Set(visibleSlugs)

  return fields
    .filter(
      field => visible.has(field.slug) && EXPANDABLE_FIELD_TYPES.has(field.type)
    )
    .map(field => field.slug)
}

function deriveVisibleSlugs(
  fields: Array<DataSourceField>,
  view: SavedDataGridView | undefined,
  requiredSlugs?: Array<string>
): Array<string> {
  const allSlugs = fields.map(field => field.slug)
  const fieldSlugSet = new Set(allSlugs)
  const required = (requiredSlugs ?? []).filter(slug => fieldSlugSet.has(slug))
  let visible: Array<string>

  if (!view) {
    visible = allSlugs
  } else {
    const visibility = view.columnVisibility ?? {}
    const order = view.columnOrder ?? []

    if (order.length > 0) {
      visible = order.filter(
        slug => fieldSlugSet.has(slug) && visibility[slug] !== false
      )
    } else if (Object.keys(visibility).length > 0) {
      visible = allSlugs.filter(slug => visibility[slug] === true)
    } else {
      visible = allSlugs
    }
  }

  if (required.length === 0) return visible

  const seen = new Set(visible)
  const result = [...visible]

  for (const slug of required) {
    if (!seen.has(slug)) {
      seen.add(slug)
      result.push(slug)
    }
  }

  return result
}

function buildEnhancedVisibility(
  fields: Array<DataSourceField>,
  view: SavedDataGridView,
  requiredSlugs?: Array<string>
): Record<string, boolean> {
  const visibleSet = new Set(deriveVisibleSlugs(fields, view, requiredSlugs))
  const map: Record<string, boolean> = {}

  for (const field of fields) {
    map[field.slug] = visibleSet.has(field.slug)
  }

  return map
}

function buildOrderByParam(
  sorting: Array<ColumnSort> | undefined
): Array<{ field: string; direction: 'asc' | 'desc' }> | undefined {
  if (!sorting || sorting.length === 0) return undefined

  return sorting.map(sort => ({
    field: sort.id,
    direction: sort.desc ? 'desc' : 'asc'
  }))
}

function buildFiltersParam(
  filterQuery: SavedDataGridView['filterQuery'],
  toolbarFilters?: ColumnFiltersState,
  sideFilters?: RuleGroupType | undefined
): RuleGroupType | undefined {
  const viewFilter = normalizeSavedViewFilterQuery(filterQuery)
  const toolbarRules = (toolbarFilters ?? [])
    .map(filter => toServerRule(filter))
    .filter(
      (rule): rule is { field: string; operator: string; value?: unknown } => Boolean(rule)
    )
  const sideRule =
    sideFilters &&
    Array.isArray(sideFilters.rules) &&
    sideFilters.rules.length > 0
      ? sideFilters
      : undefined

  const groupCount = (viewFilter ? 1 : 0) + (sideRule ? 1 : 0)

  if (groupCount === 0 && toolbarRules.length === 0) return undefined
  if (groupCount === 1 && toolbarRules.length === 0) {
    return (viewFilter ?? sideRule) as RuleGroupType
  }
  if (groupCount === 0) {
    return { combinator: 'and', rules: toolbarRules } as RuleGroupType
  }

  const rules: Array<
    RuleGroupType | { field: string; operator: string; value?: unknown }
  > = []

  if (viewFilter) rules.push(viewFilter)
  if (sideRule) rules.push(sideRule)
  for (const r of toolbarRules) rules.push(r)

  return { combinator: 'and', rules } as RuleGroupType
}
