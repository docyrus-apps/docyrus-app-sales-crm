'use client'

// @ts-nocheck
/* eslint-disable */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { type DataSourceField } from '@docyrus/app-utils'
import { type UniqueIdentifier } from '@dnd-kit/core'
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { Loader2, RotateCw, Search } from 'lucide-react'
import { type RuleGroupType } from 'react-querybuilder'

import {
  KanbanBoard,
  KanbanColumn,
  KanbanFinalColumn,
  KanbanFinalZone,
  KanbanItem,
  KanbanOverlay,
} from '@/components/docyrus/kanban'
import { RecordDeleteConfirmDialog } from '@/components/docyrus/record-delete-confirm-dialog'
import { Button } from '@/components/ui/button'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { TooltipProvider } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

import {
  KanbanCard,
  KanbanColumnAccent,
  KanbanColumnHeader,
  KanbanEmpty,
  KanbanRootGeneric,
} from '@/hooks/docyrus/_internal/use-docyrus-kanban-cards'

import {
  useDocyrusDataViewSelect,
  type UseDocyrusDataViewSelectOptions,
  type UseDocyrusDataViewSelectResult,
} from './use-docyrus-data-view-select'
/*
 * Renderer components live in `_internal/` so they're not picked up by
 * the registry's `library/hooks/` scanner as standalone hooks. Aliased
 * path is required so the `detectInternalFiles` BFS bundles them when a
 * user installs this hook — relative imports inside `library/hooks/` are
 * not followed by the resolver.
 */

/* ------------------------------------------------------------------------- */
/* Types                                                                     */
/* ------------------------------------------------------------------------- */

const ENUM_GROUP_FIELD_TYPES = new Set<string>([
  'field-select',
  'field-radioGroup',
  'field-status',
])

const DATE_GROUP_FIELD_TYPES = new Set<string>(['field-date', 'field-dateTime'])

/** Shape of a TanStack DB collection compatible with the kanban hook. */
export interface DocyrusKanbanCollection<TData> {
  list: (
    params?: Record<string, unknown>,
  ) => Promise<Array<TData> | { data: Array<TData> }>
  /** PATCH `/items/:id` — used when a card is dropped into a different column. */
  update?: (id: string, body: Record<string, unknown>) => Promise<unknown>
  /** DELETE `/items/:id` — used by the default "Delete" action menu item. */
  remove?: (id: string) => Promise<unknown>
}

export interface DocyrusKanbanListParams {
  columns?: string
  filters?: RuleGroupType | Record<string, unknown>
  filterKeyword?: string
  orderBy?:
    | string
    | { field: string; direction?: 'asc' | 'desc' }
    | Array<{ field: string; direction?: 'asc' | 'desc' }>
  limit?: number
  offset?: number
  fullCount?: boolean
  expand?: Array<string>
  expandTypes?: Array<'user' | 'enum' | 'relation'>
  [key: string]: unknown
}

/** Resolved metadata for a single kanban column. */
export interface DocyrusKanbanColumnMeta {
  /** Stable column id (enum option id/slug, user/team id, or bucketed date key). */
  id: string
  /** Display label rendered in the column header. */
  label: string
  /** Color forwarded from enum options or computed; rendered as the column accent. */
  color?: string | null
  /** Icon identifier forwarded from enum options. */
  icon?: string | null
  /** Avatar image (e.g. user photo) — used for user/team grouping. */
  imageUrl?: string | null
  /** Marks enum options where `is_final_option` / `isFinalOption` is `true`. */
  isFinal?: boolean
  /** Pre-computed count of items in the column. */
  count: number
}

/** Built-in card menu actions surfaced by the default `cardMenuItems`. */
export type DocyrusKanbanCardAction = 'open' | 'edit' | 'delete'

export interface DocyrusKanbanCardMenuItem<TData> {
  key: string
  label: ReactNode
  icon?: ReactNode
  destructive?: boolean
  /** Disable the item; called with the row before `onAction` runs. */
  disabled?: boolean | ((row: TData) => boolean)
  onAction?: (row: TData) => void
}

export interface DocyrusKanbanCardContext<TData> {
  row: TData
  column: DocyrusKanbanColumnMeta
}

export interface UseDocyrusKanbanOptions<
  TData,
> extends UseDocyrusDataViewSelectOptions {
  /** Slug of the field whose values become kanban columns. */
  groupByFieldSlug: string
  /** Pre-resolved rows. When provided, the hook skips its internal items query. */
  data?: Array<TData>
  /** TanStack DB collection (e.g., `useBaseOrganizationCollection()`). */
  collection?: DocyrusKanbanCollection<TData>
  /** Extra query params merged on top of the view-derived payload. */
  listParams?: DocyrusKanbanListParams
  /** Default page size when no `limit` is supplied via `listParams`. Default `200`. */
  defaultLimit?: number
  /** Disable the internal items query. Default `true` when no `data` is provided. */
  enableItemsQuery?: boolean
  /**
   * Granularity used when grouping by a `field-date` / `field-dateTime` field.
   * Time portion is always ignored. Default `'day'`.
   */
  dateGroupBy?: DocyrusKanbanDateGroupBy
  /**
   * Grouping mode used when the group-by field is `field-userSelect`.
   * `'user'` groups one column per user; `'team'` groups by `team_id` /
   * `team` on the user payload. Default `'user'`.
   */
  userGroupBy?: DocyrusKanbanUserGroupBy
  /**
   * For enum-backed fields (`field-select`, `field-radioGroup`, `field-status`),
   * controls whether columns are rendered for every enum option or only those
   * with at least one item. Default `true` (show all).
   */
  showAllColumns?: boolean

  /* ----------------------------- Card contract ------------------------- */

  /** Field slug whose `icon`/`color`/`image` value seeds the card avatar. */
  avatarColumn?: string
  /** Field slug used for the card title (top, large, single-line truncated). */
  titleColumn?: string
  /** Field slug used for the card description (under the title). */
  descriptionColumn?: string
  /** Field slug whose user value appears in the card footer (left). */
  userColumn?: string
  /**
   * Free-form card content rendered between the header and the footer.
   * Receives the raw row + active column metadata.
   */
  cardContent?: (ctx: DocyrusKanbanCardContext<TData>) => ReactNode
  /**
   * Override the card action menu (top-right vertical-three-dots). Default
   * surfaces Open, Edit, and Delete entries — wire callbacks via
   * `onCardOpen`, `onCardEdit`, `onCardDelete` to keep the defaults.
   */
  cardMenuItems?:
    | Array<DocyrusKanbanCardMenuItem<TData>>
    | ((
        row: TData,
        defaults: Array<DocyrusKanbanCardMenuItem<TData>>,
      ) => Array<DocyrusKanbanCardMenuItem<TData>>)
  /** Whitelist of default actions to keep. Default `['open', 'edit', 'delete']`. */
  cardActions?: ReadonlyArray<DocyrusKanbanCardAction>
  onCardOpen?: (row: TData) => void
  onCardEdit?: (row: TData) => void
  /**
   * Custom delete handler. If omitted, the hook uses
   * `collection.remove(id)` or `DELETE /v1/apps/.../items/:id` after a
   * confirmation dialog.
   */
  onCardDelete?: (row: TData) => Promise<void> | void
  /** Click handler fired when the user clicks the card body. */
  onCardClick?: (row: TData) => void

  /* --------------------------- Toolbar feature toggles ------------------ */

  enableViewSelect?: boolean
  enableSearchInput?: boolean
  /** Show the date grouping picker when grouping by date/dateTime. Default `true`. */
  enableDateGroupMenu?: boolean
  /** Show the user/team grouping picker when grouping by user. Default `true`. */
  enableUserGroupMenu?: boolean
  /** Show the "Show all columns" switch when grouping by enum. Default `true`. */
  enableShowAllColumnsSwitch?: boolean
  enableReloadButton?: boolean

  /** Fired after the toolbar reload + internal `refetch`. */
  onReload?: () => void
  searchPlaceholder?: string
  searchDebounceMs?: number
  toolbarClassName?: string
  toolbarStartContent?: ReactNode
  toolbarEndContent?: ReactNode

  /**
   * Fired when a card is dropped into a different column. The hook still
   * issues its built-in PATCH; use this callback to mirror the change in
   * local state, fire analytics, etc.
   */
  onItemMove?: (params: {
    row: TData
    fromColumnId: string | null
    toColumnId: string
    column: DocyrusKanbanColumnMeta
  }) => void
  /**
   * Custom item-move handler. When provided the hook skips its built-in
   * PATCH so callers fully own persistence (optimistic updates, validation,
   * undo, etc.). Throw to abort the move — the UI rolls back.
   */
  onItemMoveCommit?: (params: {
    row: TData
    fromColumnId: string | null
    toColumnId: string
    column: DocyrusKanbanColumnMeta
    payload: Record<string, unknown>
  }) => Promise<void> | void
}

export interface UseDocyrusKanbanResult<TData> extends Omit<
  UseDocyrusDataViewSelectResult,
  'gridViewSelectProps'
> {
  /** Pre-wired toolbar element ready to render above the board. */
  toolbar: ReactNode
  /**
   * Pre-wired kanban board element. Render it directly — the underlying
   * `<Kanban>` is fully wired to the hook's items, columns, drag handlers
   * and final-zone integration.
   */
  board: ReactNode
  /** Resolved rows passed to the board. */
  items: Array<TData>
  /** The list params actually sent to the backend. */
  resolvedListParams: DocyrusKanbanListParams
  /** Group-by field metadata. */
  groupByField: DataSourceField | undefined
  /** Ordered metadata for every rendered column. */
  columns: Array<DocyrusKanbanColumnMeta>
  /** Items grouped by `column.id` — same shape passed into `<Kanban value>`. */
  columnsItems: Record<string, Array<TData>>
  /** Active date grouping (only meaningful when grouping by date). */
  dateGroupBy: DocyrusKanbanDateGroupBy
  setDateGroupBy: (value: DocyrusKanbanDateGroupBy) => void
  /** Active user grouping (only meaningful when grouping by user). */
  userGroupBy: DocyrusKanbanUserGroupBy
  setUserGroupBy: (value: DocyrusKanbanUserGroupBy) => void
  /** Active "show all columns" switch state (enum grouping only). */
  showAllColumns: boolean
  setShowAllColumns: (value: boolean) => void
  reload: () => void
}

/* ------------------------------------------------------------------------- */
/* Hook                                                                      */
/* ------------------------------------------------------------------------- */

export function useDocyrusKanban<TData extends Record<string, unknown>>(
  options: UseDocyrusKanbanOptions<TData>,
): UseDocyrusKanbanResult<TData> {
  const {
    groupByFieldSlug,
    data: providedData,
    collection,
    listParams,
    defaultLimit = 200,
    enableItemsQuery = providedData === undefined,
    dateGroupBy: dateGroupByProp = 'day',
    userGroupBy: userGroupByProp = 'user',
    showAllColumns: showAllColumnsProp = true,
    avatarColumn,
    titleColumn,
    descriptionColumn,
    userColumn,
    cardContent,
    cardMenuItems,
    cardActions = ['open', 'edit', 'delete'],
    onCardOpen,
    onCardEdit,
    onCardDelete,
    onCardClick,
    enableViewSelect = true,
    enableSearchInput = true,
    enableDateGroupMenu = true,
    enableUserGroupMenu = true,
    enableShowAllColumnsSwitch = true,
    enableReloadButton = true,
    onReload,
    searchPlaceholder = 'Search…',
    searchDebounceMs = 300,
    toolbarClassName,
    toolbarStartContent,
    toolbarEndContent,
    onItemMove,
    onItemMoveCommit,
    ...viewSelectOptions
  } = options

  const queryClient = useQueryClient()
  const viewSelect = useDocyrusDataViewSelect(viewSelectOptions)
  const {
    dataSource,
    refetch: refetchViewSelect,
    views,
    activeViewId,
    setActiveViewId,
  } = viewSelect

  const groupByField = useMemo(
    () => dataSource?.fields?.find((field) => field.slug === groupByFieldSlug),
    [dataSource?.fields, groupByFieldSlug],
  )

  const groupByKind = useMemo<'enum' | 'user' | 'date' | 'unsupported'>(() => {
    if (!groupByField) return 'unsupported'
    if (ENUM_GROUP_FIELD_TYPES.has(groupByField.type)) return 'enum'
    if (groupByField.type === 'field-userSelect') return 'user'
    if (DATE_GROUP_FIELD_TYPES.has(groupByField.type)) return 'date'

    return 'unsupported'
  }, [groupByField])

  const [dateGroupBy, setDateGroupBy] =
    useState<DocyrusKanbanDateGroupBy>(dateGroupByProp)
  const [userGroupBy, setUserGroupBy] =
    useState<DocyrusKanbanUserGroupBy>(userGroupByProp)
  const [showAllColumns, setShowAllColumns] =
    useState<boolean>(showAllColumnsProp)

  /* --------------------------- search / filters ------------------------- */

  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setDebouncedSearch(searchInput),
      searchDebounceMs,
    )

    return () => window.clearTimeout(timeout)
  }, [searchInput, searchDebounceMs])

  const activeView = useMemo(
    () => views.find((view) => view.id === activeViewId),
    [views, activeViewId],
  )

  const cardSlugs = useMemo(() => {
    const set = new Set<string>([groupByFieldSlug])

    if (avatarColumn) set.add(avatarColumn)
    if (titleColumn) set.add(titleColumn)
    if (descriptionColumn) set.add(descriptionColumn)
    if (userColumn) set.add(userColumn)

    return Array.from(set)
  }, [
    groupByFieldSlug,
    avatarColumn,
    titleColumn,
    descriptionColumn,
    userColumn,
  ])

  const resolvedListParams = useMemo<DocyrusKanbanListParams>(() => {
    const params: DocyrusKanbanListParams = {}

    /*
     * Always request the columns we need to render the card + group rows by
     * the chosen field. The Docyrus query API honors `columns` only when it
     * is non-empty, otherwise everything is returned (which is fine on the
     * card-tested data sources but we'd rather be explicit).
     */
    const fields = dataSource?.fields ?? []
    const fieldSlugs = new Set(fields.map((field) => field.slug))
    const required = cardSlugs.filter((slug) => fieldSlugs.has(slug))

    if (required.length > 0) {
      const set = new Set<string>(['id', ...required])

      ;[
        'created_on',
        'last_modified_on',
        'created_by',
        'last_modified_by',
      ].forEach((slug) => set.add(slug))

      params.columns = Array.from(set).join(', ')
    }

    /*
     * `expand` for select/status/radioGroup fields so we get color + icon on
     * the enum option, and for user fields so we get the photo + name +
     * (optionally) team payload.
     */
    const expand = new Set<string>()

    if (
      groupByField &&
      (ENUM_GROUP_FIELD_TYPES.has(groupByField.type) ||
        groupByField.type === 'field-userSelect')
    ) {
      expand.add(groupByField.slug)
    }

    for (const slug of [avatarColumn, userColumn]) {
      if (!slug) continue

      const field = fields.find((f) => f.slug === slug)

      if (!field) continue

      if (
        field.type === 'field-userSelect' ||
        ENUM_GROUP_FIELD_TYPES.has(field.type)
      ) {
        expand.add(slug)
      }
    }

    if (expand.size > 0) params.expand = Array.from(expand)

    if (
      activeView?.filterQuery &&
      'rules' in activeView.filterQuery &&
      Array.isArray((activeView.filterQuery as RuleGroupType).rules) &&
      (activeView.filterQuery as RuleGroupType).rules.length > 0
    ) {
      params.filters = activeView.filterQuery as RuleGroupType
    }

    if (activeView?.sorting && activeView.sorting.length > 0) {
      params.orderBy = activeView.sorting.map((sort) => ({
        field: sort.id,
        direction: sort.desc ? ('desc' as const) : ('asc' as const),
      }))
    }

    const trimmed = debouncedSearch.trim()

    if (trimmed.length > 0) params.filterKeyword = trimmed

    params.limit = defaultLimit
    params.offset = 0

    if (listParams) Object.assign(params, listParams)

    return params
  }, [
    dataSource?.fields,
    cardSlugs,
    groupByField,
    avatarColumn,
    userColumn,
    activeView,
    debouncedSearch,
    defaultLimit,
    listParams,
  ])

  /* --------------------------- items query ------------------------------ */

  const itemsKey = useMemo(
    () =>
      [
        'docyrus',
        'docyrusKanbanItems',
        viewSelectOptions.appSlug,
        viewSelectOptions.dataSourceSlug,
        collection ? 'collection' : 'direct',
        resolvedListParams,
      ] as const,
    [
      viewSelectOptions.appSlug,
      viewSelectOptions.dataSourceSlug,
      collection,
      resolvedListParams,
    ],
  )

  const viewMetadataReady =
    !viewSelect.isLoading && (views.length === 0 || Boolean(activeViewId))

  const itemsQuery = useQuery<Array<TData>>({
    queryKey: itemsKey,
    queryFn: async () => {
      if (collection)
        return unwrapItems<TData>(await collection.list(resolvedListParams))

      const response = await viewSelectOptions.client.get<
        Array<TData> | { data: Array<TData> }
      >(
        `/v1/apps/${viewSelectOptions.appSlug}/data-sources/${viewSelectOptions.dataSourceSlug}/items`,
        resolvedListParams as Parameters<
          typeof viewSelectOptions.client.get
        >[1],
      )

      return unwrapItems<TData>(response)
    },
    enabled:
      providedData === undefined &&
      enableItemsQuery &&
      Boolean(viewSelectOptions.appSlug) &&
      Boolean(viewSelectOptions.dataSourceSlug) &&
      Boolean(groupByField) &&
      viewMetadataReady,
    staleTime: viewSelectOptions.staleTime ?? 30_000,
    placeholderData: keepPreviousData,
  })

  const itemsRefetchRef = useRef<(() => Promise<unknown>) | null>(null)

  itemsRefetchRef.current = itemsQuery.refetch as () => Promise<unknown>

  const items = useMemo<Array<TData>>(
    () => providedData ?? itemsQuery.data ?? [],
    [providedData, itemsQuery.data],
  )

  /* --------------------------- column derivation ------------------------ */

  const allColumnsMeta = useMemo<Array<DocyrusKanbanColumnMeta>>(() => {
    if (!groupByField) return []

    if (groupByKind === 'enum') {
      return extractEnumColumns(groupByField)
    }

    if (groupByKind === 'user') {
      return collectUserColumns(items, groupByField.slug, userGroupBy)
    }

    if (groupByKind === 'date') {
      return collectDateColumns(items, groupByField.slug, dateGroupBy)
    }

    return []
  }, [groupByField, groupByKind, items, userGroupBy, dateGroupBy])

  const columnsItems = useMemo<Record<string, Array<TData>>>(() => {
    const map: Record<string, Array<TData>> = {}

    if (!groupByField) return map

    for (const col of allColumnsMeta) map[col.id] = []

    for (const item of items) {
      const value = (item as Record<string, unknown>)[groupByField.slug]
      const keys = resolveItemKeys(value, groupByKind, dateGroupBy, userGroupBy)

      for (const key of keys) {
        if (!map[key]) {
          if (groupByKind !== 'enum') continue // only enum has the "show all" notion
          map[key] = []
        }

        map[key]?.push(item)
      }
    }

    return map
  }, [
    items,
    allColumnsMeta,
    groupByField,
    groupByKind,
    dateGroupBy,
    userGroupBy,
  ])

  const visibleColumnsMeta = useMemo<Array<DocyrusKanbanColumnMeta>>(() => {
    const withCounts = allColumnsMeta.map((col) => ({
      ...col,
      count: columnsItems[col.id]?.length ?? 0,
    }))

    if (groupByKind === 'enum' && !showAllColumns) {
      return withCounts.filter((col) => col.count > 0)
    }

    return withCounts
  }, [allColumnsMeta, columnsItems, groupByKind, showAllColumns])

  const finalColumnIds = useMemo<Array<string>>(() => {
    if (groupByKind !== 'enum') return []

    return visibleColumnsMeta.filter((col) => col.isFinal).map((col) => col.id)
  }, [groupByKind, visibleColumnsMeta])

  /*
   * Items map fed into <Kanban>. We intentionally drop the entries that map
   * to "final" columns from `value` (so they show up only inside the final
   * zone) and we strip out columns the user hid via the show-all switch.
   */
  const kanbanValue = useMemo<Record<UniqueIdentifier, Array<TData>>>(() => {
    const visibleIds = new Set(visibleColumnsMeta.map((col) => col.id))
    const finalIdSet = new Set(finalColumnIds)
    const out: Record<UniqueIdentifier, Array<TData>> = {}

    for (const col of visibleColumnsMeta) {
      if (finalIdSet.has(col.id)) continue
      out[col.id] = columnsItems[col.id] ?? []
    }

    /*
     * Items whose group key isn't in the visible set get parked under "uncategorized"
     * so they don't disappear from the board entirely.
     */
    const uncategorized: Array<TData> = []

    for (const [key, list] of Object.entries(columnsItems)) {
      if (visibleIds.has(key)) continue
      uncategorized.push(...list)
    }

    if (uncategorized.length > 0) {
      out['__uncategorized__'] = uncategorized
    }

    return out
  }, [visibleColumnsMeta, columnsItems, finalColumnIds])

  const columnsForRender = useMemo<Array<DocyrusKanbanColumnMeta>>(() => {
    const finalIdSet = new Set(finalColumnIds)
    const list = visibleColumnsMeta.filter((col) => !finalIdSet.has(col.id))

    if (kanbanValue['__uncategorized__']) {
      list.push({
        id: '__uncategorized__',
        label: 'Uncategorized',
        count: kanbanValue['__uncategorized__'].length,
      })
    }

    return list
  }, [visibleColumnsMeta, finalColumnIds, kanbanValue])

  /* --------------------------- mutations / DnD -------------------------- */

  const updateMutation = useMutation({
    mutationFn: async (vars: {
      id: string
      payload: Record<string, unknown>
    }) => {
      if (collection?.update) {
        await collection.update(vars.id, vars.payload)

        return
      }

      await viewSelectOptions.client.patch(
        `/v1/apps/${viewSelectOptions.appSlug}/data-sources/${viewSelectOptions.dataSourceSlug}/items/${vars.id}`,
        vars.payload,
      )
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: itemsKey })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (collection?.remove) {
        await collection.remove(id)

        return
      }

      await viewSelectOptions.client.delete(
        `/v1/apps/${viewSelectOptions.appSlug}/data-sources/${viewSelectOptions.dataSourceSlug}/items/${id}`,
      )
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: itemsKey })
    },
  })

  const buildMovePayload = useCallback(
    (toColumnId: string): Record<string, unknown> | null => {
      if (!groupByField) return null
      if (toColumnId === '__uncategorized__')
        return { [groupByField.slug]: null }

      if (groupByKind === 'enum') {
        return { [groupByField.slug]: toColumnId }
      }

      if (groupByKind === 'user') {
        if (userGroupBy === 'team') return null

        return { [groupByField.slug]: toColumnId }
      }

      return null
    },
    [groupByField, groupByKind, userGroupBy],
  )

  /*
   * Local mirror of the kanban distribution. The Kanban component fires
   * `onValueChange` continuously during a drag (every `onDragOver`), so we
   * keep a state copy that updates immediately for visual feedback and
   * defer the actual PATCH to the drag-end handler. Reseed the mirror any
   * time the source data (`kanbanValue`) changes — typically because a
   * refetch landed.
   */
  const [liveValue, setLiveValue] =
    useState<Record<UniqueIdentifier, Array<TData>>>(kanbanValue)

  useEffect(() => {
    queueMicrotask(() => setLiveValue(kanbanValue))
  }, [kanbanValue])

  const liveValueRef = useRef(liveValue)

  liveValueRef.current = liveValue

  const handleValueChange = useCallback(
    (next: Record<UniqueIdentifier, Array<TData>>) => {
      setLiveValue(next)
    },
    [],
  )

  const dragStateRef = useRef<{ id: string; originalColumnId: string } | null>(
    null,
  )

  const findColumnIdFor = useCallback(
    (
      rowId: string,
      value: Record<UniqueIdentifier, Array<TData>>,
    ): string | null => {
      for (const [columnId, list] of Object.entries(value)) {
        const found = list.some((row) => {
          const { id } = row as Record<string, unknown>

          return typeof id === 'string' && id === rowId
        })

        if (found) return columnId
      }

      return null
    },
    [],
  )

  const handleDragStart = useCallback(
    (event: { active: { id: UniqueIdentifier } }) => {
      const id = String(event.active.id)
      const originalColumnId = findColumnIdFor(id, liveValueRef.current)

      dragStateRef.current = originalColumnId ? { id, originalColumnId } : null
    },
    [findColumnIdFor],
  )

  const handleDragCancel = useCallback(() => {
    dragStateRef.current = null
  }, [])

  const commitMove = useCallback(
    (rowId: string, fromColumnId: string | null, toColumnId: string) => {
      if (!groupByField) return
      if (fromColumnId === toColumnId) return

      const meta = columnsForRender.find((col) => col.id === toColumnId)

      if (!meta) return

      const payload = buildMovePayload(toColumnId)

      if (!payload) return

      const list = liveValueRef.current[toColumnId] ?? []
      const row = list.find((entry) => {
        const { id } = entry as Record<string, unknown>

        return typeof id === 'string' && id === rowId
      })

      if (!row) return

      const ctx = {
        row,
        fromColumnId,
        toColumnId,
        column: meta,
      }

      onItemMove?.(ctx)

      if (onItemMoveCommit) {
        void Promise.resolve(onItemMoveCommit({ ...ctx, payload }))
      } else {
        updateMutation.mutate({ id: rowId, payload })
      }
    },
    [
      groupByField,
      columnsForRender,
      buildMovePayload,
      onItemMove,
      onItemMoveCommit,
      updateMutation,
    ],
  )

  const handleDragEnd = useCallback(() => {
    const drag = dragStateRef.current

    dragStateRef.current = null
    if (!drag) return

    /*
     * Defer until the kanban component flushes its `onValueChange` call
     * for the drop. `onDragEnd` props fire BEFORE the internal state
     * update, so reading `liveValueRef.current` synchronously gives
     * pre-drop data.
     */
    queueMicrotask(() => {
      const newColumnId = findColumnIdFor(drag.id, liveValueRef.current)

      /*
       * Final-zone drops remove the row from `value`, surfacing through
       * `handleFinalDrop` instead — bail out here.
       */
      if (!newColumnId) return

      commitMove(drag.id, drag.originalColumnId, newColumnId)
    })
  }, [findColumnIdFor, commitMove])

  const handleFinalDrop = useCallback(
    (item: TData, finalColumnId: UniqueIdentifier) => {
      if (!groupByField) return
      const { id } = item as Record<string, unknown>

      if (typeof id !== 'string' || id.length === 0) return
      const meta = visibleColumnsMeta.find((col) => col.id === finalColumnId)

      if (!meta) return
      const payload = { [groupByField.slug]: String(finalColumnId) }

      onItemMove?.({
        row: item,
        fromColumnId: null,
        toColumnId: String(finalColumnId),
        column: meta,
      })

      if (onItemMoveCommit) {
        void Promise.resolve(
          onItemMoveCommit({
            row: item,
            fromColumnId: null,
            toColumnId: String(finalColumnId),
            column: meta,
            payload,
          }),
        )
      } else {
        updateMutation.mutate({ id, payload })
      }
    },
    [
      groupByField,
      visibleColumnsMeta,
      onItemMove,
      onItemMoveCommit,
      updateMutation,
    ],
  )

  /* --------------------------- delete dialog ---------------------------- */

  const [deleteRow, setDeleteRow] = useState<TData | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const onConfirmDelete = useCallback(async () => {
    if (!deleteRow) return
    const { id } = deleteRow as Record<string, unknown>

    if (typeof id !== 'string' || id.length === 0) return

    setIsDeleting(true)

    try {
      if (onCardDelete) {
        await Promise.resolve(onCardDelete(deleteRow))
      } else {
        await deleteMutation.mutateAsync(id)
      }

      setDeleteRow(null)
    } finally {
      setIsDeleting(false)
    }
  }, [deleteRow, onCardDelete, deleteMutation])

  /* --------------------------- toolbar ---------------------------------- */

  const reload = useCallback(() => {
    refetchViewSelect()
    if (providedData === undefined) void itemsQuery.refetch()
    onReload?.()
  }, [refetchViewSelect, itemsQuery, providedData, onReload])

  const reloadItems = useCallback(() => {
    if (providedData === undefined) void itemsQuery.refetch()
    onReload?.()
  }, [itemsQuery, providedData, onReload])

  const isReloading =
    providedData === undefined && itemsQuery.isFetching && !itemsQuery.isLoading

  const showViewSelect = enableViewSelect && views.length > 0

  const showDateMenu = enableDateGroupMenu && groupByKind === 'date'
  const showUserMenu = enableUserGroupMenu && groupByKind === 'user'
  const showAllSwitch = enableShowAllColumnsSwitch && groupByKind === 'enum'

  const toolbar = (
    <div
      data-slot="docyrus-kanban-toolbar"
      className={cn('flex items-start gap-2 px-3 py-2', toolbarClassName)}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 flex-wrap">
        {toolbarStartContent}
        {showViewSelect && (
          <Select value={activeViewId} onValueChange={setActiveViewId}>
            <SelectTrigger className="h-8 min-w-[10rem]">
              <SelectValue placeholder="View" />
            </SelectTrigger>
            <SelectContent>
              {views.map((view) => (
                <SelectItem key={view.id} value={view.id}>
                  {view.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {enableSearchInput && (
          <div className="relative shrink-0">
            <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-8 w-56 pl-7"
            />
          </div>
        )}
      </div>
      <div className="flex flex-none shrink-0 items-center gap-2">
        {showDateMenu && (
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Group by</Label>
            <Select
              value={dateGroupBy}
              onValueChange={(value) =>
                setDateGroupBy(value as DocyrusKanbanDateGroupBy)
              }
            >
              <SelectTrigger className="h-8 w-[7.5rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        {showUserMenu && (
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Group by</Label>
            <Select
              value={userGroupBy}
              onValueChange={(value) =>
                setUserGroupBy(value as DocyrusKanbanUserGroupBy)
              }
            >
              <SelectTrigger className="h-8 w-[7rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="team">Team</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        {showAllSwitch && (
          <div className="flex items-center gap-2">
            <Switch
              id="docyrus-kanban-show-all"
              checked={showAllColumns}
              onCheckedChange={setShowAllColumns}
            />
            <Label
              htmlFor="docyrus-kanban-show-all"
              className="text-xs text-muted-foreground"
            >
              Show all
            </Label>
          </div>
        )}
        {enableReloadButton && (
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Reload"
            disabled={isReloading}
            onClick={reloadItems}
          >
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

  /* --------------------------- card rendering --------------------------- */

  const buildDefaultMenu = useCallback((): Array<
    DocyrusKanbanCardMenuItem<TData>
  > => {
    const list: Array<DocyrusKanbanCardMenuItem<TData>> = []

    if (cardActions.includes('open')) {
      list.push({
        key: 'open',
        label: 'Open',
        onAction: (r) => onCardOpen?.(r),
      })
    }

    if (cardActions.includes('edit')) {
      list.push({
        key: 'edit',
        label: 'Edit',
        onAction: (r) => onCardEdit?.(r),
      })
    }

    if (cardActions.includes('delete')) {
      list.push({
        key: 'delete',
        label: 'Delete',
        destructive: true,
        onAction: (r) => setDeleteRow(r),
      })
    }

    return list
  }, [cardActions, onCardOpen, onCardEdit])

  const resolveMenu = useCallback(
    (row: TData): Array<DocyrusKanbanCardMenuItem<TData>> => {
      const defaults = buildDefaultMenu()

      if (!cardMenuItems) return defaults
      if (typeof cardMenuItems === 'function')
        return cardMenuItems(row, defaults)

      return cardMenuItems
    },
    [buildDefaultMenu, cardMenuItems],
  )

  const renderCard = useCallback(
    (row: TData, column: DocyrusKanbanColumnMeta) => (
      <KanbanCard
        row={row}
        column={column}
        avatarColumn={avatarColumn}
        titleColumn={titleColumn}
        descriptionColumn={descriptionColumn}
        userColumn={userColumn}
        cardContent={cardContent}
        menu={resolveMenu(row)}
        onClick={onCardClick ?? onCardOpen}
      />
    ),
    [
      avatarColumn,
      titleColumn,
      descriptionColumn,
      userColumn,
      cardContent,
      resolveMenu,
      onCardClick,
      onCardOpen,
    ],
  )

  /* --------------------------- board ------------------------------------ */

  const finalColumns = visibleColumnsMeta.filter((col) => col.isFinal)

  const board: ReactNode = viewSelect.isLoading ? null : !groupByField ? (
    <KanbanEmpty>
      Configure a group-by field that points to a `field-select`,
      `field-radioGroup`, `field-status`, `field-userSelect`, `field-date`, or
      `field-dateTime` field.
    </KanbanEmpty>
  ) : groupByKind === 'unsupported' ? (
    <KanbanEmpty>
      Field <code>{groupByField.slug}</code> is not supported as a kanban group
      column.
    </KanbanEmpty>
  ) : (
    /*
     * Cast through `unknown` because `KanbanRoot` uses a distributive
     * conditional (`T extends object ? … : Partial<…>`) that TS cannot
     * simplify against an unresolved generic. The props we pass are
     * always sound — TData is constrained to `Record<string, unknown>`.
     */
    <KanbanRootGeneric<TData>
      value={liveValue}
      onValueChange={handleValueChange}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      onFinalDrop={handleFinalDrop}
      finalColumns={finalColumns.map((col) => col.id)}
      getItemValue={(item: TData) => item.id as UniqueIdentifier}
    >
      {/*
       * Kanban root is a `<DndContext>` (no DOM wrapper), and `<KanbanBoard>`
       * defaults to `size-full`. Wrap board + final zone in a flex column so
       * the board flexes to fill available space and the final zone stays
       * pinned at the bottom — without this, the final zone ends up below
       * the viewport whenever the host page uses `flex-1 overflow-hidden`.
       */}
      <div className="flex h-full w-full flex-col gap-3">
        <KanbanBoard className="!h-auto min-h-0 flex-1 gap-3 overflow-x-auto overflow-y-hidden px-3 pb-2">
          {columnsForRender.map((col) => {
            const items = liveValue[col.id] ?? []

            return (
              <KanbanColumn
                key={col.id}
                value={col.id}
                className="flex h-full w-72 min-w-72 shrink-0 flex-col gap-0 overflow-hidden rounded-xl border bg-card p-0"
              >
                <KanbanColumnHeader column={{ ...col, count: items.length }} />
                <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
                  {items.map((row) => {
                    const { id } = row as Record<string, unknown>

                    if (typeof id !== 'string') return null

                    return (
                      <KanbanItem key={id} value={id} asHandle asChild>
                        <div>{renderCard(row, col)}</div>
                      </KanbanItem>
                    )
                  })}
                  {items.length === 0 ? (
                    <p className="py-8 text-center text-xs text-muted-foreground">
                      No items
                    </p>
                  ) : null}
                </div>
              </KanbanColumn>
            )
          })}
        </KanbanBoard>
        {finalColumns.length > 0 && (
          <KanbanFinalZone className="shrink-0 px-3 pb-3">
            {finalColumns.map((col) => {
              return (
                <KanbanFinalColumn
                  key={col.id}
                  value={col.id}
                  className="group rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/40 transition-all duration-300 ease-in-out data-over:border-muted-foreground/60 data-over:bg-muted/60 data-over:scale-[1.02]"
                >
                  <KanbanColumnAccent color={col.color} icon={col.icon} />
                  <span className="text-xs font-semibold transition-all duration-300 ease-in-out group-data-dragging:text-sm">
                    {col.label}
                  </span>
                  <span className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-in-out group-data-dragging:grid-rows-[1fr]">
                    <span className="overflow-hidden text-xs opacity-70">
                      Drop to mark final
                    </span>
                  </span>
                </KanbanFinalColumn>
              )
            })}
          </KanbanFinalZone>
        )}
      </div>
      <KanbanOverlay>
        {({ value: activeId, variant }) => {
          if (variant === 'column') {
            return (
              <div className="h-full w-72 rounded-xl border bg-primary/5" />
            )
          }

          const idStr = String(activeId)

          for (const col of columnsForRender) {
            const row = (liveValue[col.id] ?? []).find((r) => {
              const { id } = r as Record<string, unknown>

              return typeof id === 'string' && id === idStr
            })

            if (row) {
              return (
                <div className="w-72 cursor-grabbing">
                  {renderCard(row, col)}
                </div>
              )
            }
          }

          return <div className="size-full rounded-lg bg-primary/10" />
        }}
      </KanbanOverlay>
    </KanbanRootGeneric>
  )

  /* --------------------------- result ----------------------------------- */

  const isLoading =
    viewSelect.isLoading ||
    (providedData === undefined && (itemsQuery.isLoading || !viewMetadataReady))
  const error = viewSelect.error ?? (itemsQuery.error as Error | null) ?? null

  return {
    toolbar: (
      <>
        {toolbar}
        <RecordDeleteConfirmDialog
          open={deleteRow !== null}
          onOpenChange={(next) => {
            if (!next && !isDeleting) setDeleteRow(null)
          }}
          recordCount={1}
          isPending={isDeleting}
          onConfirm={onConfirmDelete}
        />
      </>
    ),
    board: <TooltipProvider>{board}</TooltipProvider>,
    items,
    resolvedListParams,
    groupByField,
    columns: visibleColumnsMeta,
    columnsItems,
    dateGroupBy,
    setDateGroupBy,
    userGroupBy,
    setUserGroupBy,
    showAllColumns,
    setShowAllColumns,
    reload,
    views: viewSelect.views,
    fields: viewSelect.fields,
    forms: viewSelect.forms,
    dataSource: viewSelect.dataSource,
    activeViewId: viewSelect.activeViewId,
    setActiveViewId: viewSelect.setActiveViewId,
    isLoading,
    error,
    refetch: reload,
  }
}

/* ------------------------------------------------------------------------- */
/* Sub-components — moved to `_internal/use-docyrus-kanban-cards` so this    */
/* file's exports stay non-component-only and Vite Fast Refresh works.       */
/* ------------------------------------------------------------------------- */

/* ------------------------------------------------------------------------- */
/* Helpers                                                                   */
/* ------------------------------------------------------------------------- */

function unwrapItems<TData>(
  value: Array<TData> | { data: Array<TData> } | unknown,
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

function extractEnumColumns(
  field: DataSourceField,
): Array<DocyrusKanbanColumnMeta> {
  const raw = field as Record<string, unknown>
  const enums = Array.isArray(raw.enums)
    ? raw.enums
    : Array.isArray(raw.options)
      ? raw.options
      : []

  const result: Array<DocyrusKanbanColumnMeta> = []

  for (const entry of enums) {
    if (!entry || typeof entry !== 'object') continue

    const option = entry as Record<string, unknown>
    const id =
      typeof option.id === 'string'
        ? option.id
        : typeof option.slug === 'string'
          ? option.slug
          : typeof option.value === 'string'
            ? option.value
            : null

    if (!id) continue

    const label =
      typeof option.name === 'string'
        ? option.name
        : typeof option.label === 'string'
          ? option.label
          : id
    const color = typeof option.color === 'string' ? option.color : null
    const icon = typeof option.icon === 'string' ? option.icon : null
    const isFinal =
      option.is_final_option === true || option.isFinalOption === true

    result.push({
      id,
      label,
      color,
      icon,
      isFinal,
      count: 0,
    })
  }

  result.sort((a, b) => {
    const aRaw = enums.find(
      (e: unknown) =>
        (e as Record<string, unknown>).id === a.id ||
        (e as Record<string, unknown>).slug === a.id,
    )
    const bRaw = enums.find(
      (e: unknown) =>
        (e as Record<string, unknown>).id === b.id ||
        (e as Record<string, unknown>).slug === b.id,
    )
    const aOrder =
      typeof (aRaw as Record<string, unknown>)?.sort_order === 'number'
        ? (aRaw as { sort_order: number }).sort_order
        : Number.POSITIVE_INFINITY
    const bOrder =
      typeof (bRaw as Record<string, unknown>)?.sort_order === 'number'
        ? (bRaw as { sort_order: number }).sort_order
        : Number.POSITIVE_INFINITY

    return aOrder - bOrder
  })

  return result
}

function collectUserColumns<TData>(
  items: Array<TData>,
  slug: string,
  mode: DocyrusKanbanUserGroupBy,
): Array<DocyrusKanbanColumnMeta> {
  const map = new Map<string, DocyrusKanbanColumnMeta>()

  for (const item of items) {
    const value = (item as Record<string, unknown>)[slug]
    const meta = readUserMeta(value, mode)

    if (!meta) continue

    if (!map.has(meta.id)) {
      map.set(meta.id, {
        id: meta.id,
        label: meta.label,
        imageUrl: meta.imageUrl,
        count: 0,
      })
    }
  }

  return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label))
}

function collectDateColumns<TData>(
  items: Array<TData>,
  slug: string,
  mode: DocyrusKanbanDateGroupBy,
): Array<DocyrusKanbanColumnMeta> {
  const map = new Map<string, { id: string; label: string; sortKey: number }>()

  for (const item of items) {
    const value = (item as Record<string, unknown>)[slug]
    const bucket = bucketDate(value, mode)

    if (!bucket) continue
    if (!map.has(bucket.key)) {
      map.set(bucket.key, {
        id: bucket.key,
        label: bucket.label,
        sortKey: bucket.sortKey,
      })
    }
  }

  return Array.from(map.values())
    .sort((a, b) => a.sortKey - b.sortKey)
    .map((entry) => ({ id: entry.id, label: entry.label, count: 0 }))
}

function bucketDate(
  value: unknown,
  mode: DocyrusKanbanDateGroupBy,
): { key: string; label: string; sortKey: number } | null {
  if (!value) return null
  const date =
    value instanceof Date
      ? value
      : typeof value === 'string' || typeof value === 'number'
        ? new Date(value)
        : null

  if (!date || Number.isNaN(date.getTime())) return null

  const utc = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  )

  if (mode === 'month') {
    const key = `${utc.getUTCFullYear()}-${String(utc.getUTCMonth() + 1).padStart(2, '0')}`
    const label = utc.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      timeZone: 'UTC',
    })

    return { key, label, sortKey: utc.getTime() }
  }

  if (mode === 'week') {
    const day = utc.getUTCDay() || 7 // Sunday -> 7
    const monday = new Date(utc)

    monday.setUTCDate(utc.getUTCDate() - (day - 1))
    const key = `${monday.getUTCFullYear()}-W${String(getISOWeek(monday)).padStart(2, '0')}`
    const label = `Week of ${monday.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })}`

    return { key, label, sortKey: monday.getTime() }
  }

  const key = utc.toISOString().slice(0, 10)
  const label = utc.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })

  return { key, label, sortKey: utc.getTime() }
}

function getISOWeek(date: Date): number {
  const target = new Date(date)

  target.setUTCDate(target.getUTCDate() + 4 - (target.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1))

  return Math.ceil(
    ((target.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7,
  )
}

function resolveItemKeys(
  value: unknown,
  kind: 'enum' | 'user' | 'date' | 'unsupported',
  dateMode: DocyrusKanbanDateGroupBy,
  userMode: DocyrusKanbanUserGroupBy,
): Array<string> {
  if (kind === 'enum') {
    if (!value) return []
    if (typeof value === 'string') return [value]

    if (typeof value === 'object') {
      const obj = value as Record<string, unknown>
      const id =
        typeof obj.id === 'string'
          ? obj.id
          : typeof obj.slug === 'string'
            ? obj.slug
            : typeof obj.value === 'string'
              ? obj.value
              : null

      return id ? [id] : []
    }

    return []
  }

  if (kind === 'user') {
    const meta = readUserMeta(value, userMode)

    return meta ? [meta.id] : []
  }

  if (kind === 'date') {
    const bucket = bucketDate(value, dateMode)

    return bucket ? [bucket.key] : []
  }

  return []
}

export const DOCYRUS_KANBAN_SUPPORTED_FIELD_TYPES = new Set<string>([
  'field-select',
  'field-radioGroup',
  'field-status',
  'field-userSelect',
  'field-date',
  'field-dateTime',
])

/*
 * Exported so the renderer components in
 * `_internal/use-docyrus-kanban-cards` can reuse the same user-shape
 * normalization the hook applies when bucketing rows into columns.
 */
export function readUserMeta(
  value: unknown,
  mode: DocyrusKanbanUserGroupBy,
): { id: string; label: string; imageUrl?: string | null } | null {
  if (!value || typeof value !== 'object') return null
  const obj = value as Record<string, unknown>

  if (mode === 'team') {
    const teamId =
      typeof obj.team_id === 'string'
        ? obj.team_id
        : typeof obj.teamId === 'string'
          ? obj.teamId
          : null
    const teamObj =
      obj.team && typeof obj.team === 'object'
        ? (obj.team as Record<string, unknown>)
        : null
    const id =
      teamId ?? (teamObj && typeof teamObj.id === 'string' ? teamObj.id : null)

    if (!id) return null

    const label =
      teamObj && typeof teamObj.name === 'string'
        ? teamObj.name
        : typeof obj.team_name === 'string'
          ? obj.team_name
          : id

    return { id, label }
  }

  const id =
    typeof obj.id === 'string'
      ? obj.id
      : typeof obj.user_id === 'string'
        ? obj.user_id
        : null

  if (!id) return null

  const firstName =
    typeof obj.firstname === 'string'
      ? obj.firstname
      : typeof obj.first_name === 'string'
        ? obj.first_name
        : null
  const lastName =
    typeof obj.lastname === 'string'
      ? obj.lastname
      : typeof obj.last_name === 'string'
        ? obj.last_name
        : null
  const fullName = firstName
    ? lastName
      ? `${firstName} ${lastName}`
      : firstName
    : lastName
  const email = typeof obj.email === 'string' ? obj.email : null
  const label = fullName ?? email ?? id
  const imageUrl =
    typeof obj.photo === 'string'
      ? obj.photo
      : typeof obj.avatar_url === 'string'
        ? obj.avatar_url
        : typeof obj.profile_image_url === 'string'
          ? obj.profile_image_url
          : null

  return { id, label, imageUrl }
}

export type DocyrusKanbanDateGroupBy = 'day' | 'week' | 'month'
export type DocyrusKanbanUserGroupBy = 'user' | 'team'
