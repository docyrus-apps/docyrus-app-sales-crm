'use client'

// @ts-nocheck
/* eslint-disable */
import { useCallback, useEffect, useMemo, useState } from 'react'

import { type RestApiClient } from '@docyrus/api-client'
import {
  createDataFormClient,
  createDataSourceClient,
  createDataViewClient,
  type CreateDataViewBody,
  type DataForm,
  type DataSource,
  type DataSourceField,
  type DataView,
  type UpdateDataViewBody,
} from '@docyrus/app-utils'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type FullField } from 'react-querybuilder'

import { type DataGridViewSelectProps } from '@/components/docyrus/data-grid-view-select'
import { type SavedDataGridView } from '@/components/docyrus/data-grid/types'
import { normalizeRowHeight } from '@/components/docyrus/data-grid/lib/data-grid'
import {
  FILTER_GROUP_INPUT_TYPE,
  FILTER_GROUP_VALUE_EDITOR_TYPE,
  getFilterGroupForFieldType,
  getOperatorsForGroup,
  resolveValueEditorType,
  type FilterGroup,
} from '@/components/docyrus/query-builder/query-operators'

export interface UseDocyrusDataViewSelectOptions {
  client: RestApiClient
  appSlug: string
  dataSourceSlug: string
  appId?: string
  overrideFields?: Array<FullField>
  /**
   * Pre-resolved data-source schema. When provided, the hook skips its
   * internal `getBySlug` schema fetch entirely and reads fields / metadata
   * from this object instead — useful for previews or any surface that already
   * holds the schema in memory and must not hit the DB. Pair with
   * `enabled: false` (stops the relation-option fetch too) and
   * `enableDataViews: false` for a fully fetch-free hook. Unlike
   * `overrideFields` (which only replaces the derived field list), this also
   * supplies the `dataSource` object — id, slug, and metadata — to every
   * downstream consumer (data grid, table, kanban, gallery, map view).
   */
  dataSource?: DataSource | null
  mapField?: (
    field: DataSourceField,
    defaultMapped: FullField,
  ) => FullField | null
  staleTime?: number
  enabled?: boolean
  /**
   * Fetch and manage saved data views (the `/views` endpoint). Default `true`.
   * Set `false` for data sources without a view-configuration backend (e.g.
   * core/tenant system data sources) so the hook never calls `/views`; the
   * tab strip then shows only `systemViews` (if any) and the table renders all
   * fields with default columns.
   */
  enableDataViews?: boolean
  /**
   * `expand` query param sent with the data-source schema fetch. Defaults to
   * `'enums'` (so select/status fields carry their option metadata). Pass
   * `false` (or `''`) to omit `expand` entirely for backends that don't
   * support it. When `enableForms` is on, `forms` is appended automatically.
   */
  dataSourceExpand?: string | false
  /**
   * Fetch the data source's saved forms (appends `forms` to the schema
   * `expand`) and surface them as `forms` on the result + `gridViewSelectProps`
   * so the view editor can bind a form to each view. Default `true`. Has no
   * effect when `dataSourceExpand` is `false` / `''` (no `expand` at all).
   */
  enableForms?: boolean
  persistActiveView?: boolean
  persistKey?: string
  /**
   * Column id used as the default row-grouping column for views that do not
   * already specify a `grouping`. Forwarded to `DataGridViewSelect` and
   * applied to the table by `useDocyrusDataGrid`.
   *
   * Eligible field types: `field-select`, `field-status`, `field-relation`,
   * `field-date`, `field-dateTime`, `field-user`.
   */
  defaultRowGroupingColumn?: string
  /**
   * Developer-defined static views that always appear before the saved
   * server-side views in the tab list. Each entry is automatically marked
   * with `isSystem: true` so `<DataGridViewSelect>` hides Edit/Delete/Add
   * actions for them. Hidden state is still per-user and persisted in
   * `localStorage` (under the same key namespace as the active view), so
   * users can hide a system view from the tab strip and bring it back via
   * the **Manage All Views** menu.
   */
  systemViews?: Array<SavedDataGridView>
}

type ManagedProps =
  | 'views'
  | 'activeViewId'
  | 'fields'
  | 'forms'
  | 'onViewChange'
  | 'onViewCreate'
  | 'onViewSave'
  | 'onViewDelete'
  | 'onViewHide'
  | 'onViewUnhide'
  | 'onViewReorder'
  | 'hiddenViewIds'
  | 'disabled'
  | 'defaultRowGroupingColumn'
  | 'isSaving'
  | 'isLoading'

export interface UseDocyrusDataViewSelectResult {
  gridViewSelectProps: Pick<DataGridViewSelectProps<unknown>, ManagedProps>
  views: Array<SavedDataGridView>
  fields: Array<FullField>
  /** Active (non-archived) saved forms on the data source, default-form first. */
  forms: Array<DataForm>
  dataSource: DataSource | undefined
  activeViewId: string
  setActiveViewId: (viewId: string) => void
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

export function useDocyrusDataViewSelect(
  options: UseDocyrusDataViewSelectOptions,
): UseDocyrusDataViewSelectResult {
  const {
    client,
    appSlug,
    dataSourceSlug,
    appId,
    overrideFields,
    dataSource: providedDataSource,
    mapField,
    staleTime = 30_000,
    enabled = true,
    enableDataViews = true,
    dataSourceExpand = 'enums',
    enableForms = true,
    persistActiveView = true,
    persistKey,
    defaultRowGroupingColumn,
    systemViews,
  } = options

  const queryClient = useQueryClient()

  const dataSourcesClient = useMemo(
    () => createDataSourceClient(client),
    [client],
  )

  const dataViewsClient = useMemo(
    () => createDataViewClient(client, appSlug, dataSourceSlug),
    [client, appSlug, dataSourceSlug],
  )

  const storageKey = useMemo(() => {
    if (!persistActiveView) return null

    if (persistKey) return persistKey

    const suffix = appId
      ? `${appSlug}:${dataSourceSlug}:${appId}`
      : `${appSlug}:${dataSourceSlug}`

    return `docyrus:data-grid-view:${suffix}`
  }, [persistActiveView, persistKey, appSlug, dataSourceSlug, appId])

  /*
   * Independent storage key for the per-user hidden-views list. Uses the
   * same `appSlug[:dataSourceSlug[:appId]]` namespace as the active view so
   * one consumer's hide list doesn't bleed into another's.
   */
  const hiddenStorageKey = useMemo(() => {
    const suffix = appId
      ? `${appSlug}:${dataSourceSlug}:${appId}`
      : `${appSlug}:${dataSourceSlug}`

    return `docyrus:data-grid-view-hidden:${suffix}`
  }, [appSlug, dataSourceSlug, appId])

  const readStoredHiddenIds = useCallback((): Array<string> => {
    if (typeof window === 'undefined') return []

    try {
      const raw = window.localStorage.getItem(hiddenStorageKey)

      if (!raw) return []

      const parsed = JSON.parse(raw) as unknown

      if (!Array.isArray(parsed)) return []

      return parsed.filter((id): id is string => typeof id === 'string')
    } catch {
      return []
    }
  }, [hiddenStorageKey])

  const writeStoredHiddenIds = useCallback(
    (ids: Array<string>): void => {
      if (typeof window === 'undefined') return

      try {
        window.localStorage.setItem(hiddenStorageKey, JSON.stringify(ids))
      } catch {
        /* storage unavailable */
      }
    },
    [hiddenStorageKey],
  )

  const [hiddenViewIds, setHiddenViewIds] = useState<Array<string>>(() =>
    readStoredHiddenIds(),
  )

  /*
   * Re-read the stored hidden IDs whenever the storage key changes (e.g. on
   * navigating to a different data source). Store-and-compare pattern so
   * we don't trigger the `set-state-in-effect` warning.
   */
  const [trackedReadStoredHiddenIds, setTrackedReadStoredHiddenIds] = useState(
    () => readStoredHiddenIds,
  )

  if (trackedReadStoredHiddenIds !== readStoredHiddenIds) {
    setTrackedReadStoredHiddenIds(() => readStoredHiddenIds)
    setHiddenViewIds(readStoredHiddenIds())
  }

  const onViewHide = useCallback(
    (viewId: string) => {
      setHiddenViewIds((prev) => {
        if (prev.includes(viewId)) return prev

        const next = [...prev, viewId]

        writeStoredHiddenIds(next)

        return next
      })
    },
    [writeStoredHiddenIds],
  )

  const onViewUnhide = useCallback(
    (viewId: string) => {
      setHiddenViewIds((prev) => {
        if (!prev.includes(viewId)) return prev

        const next = prev.filter((id) => id !== viewId)

        writeStoredHiddenIds(next)

        return next
      })
    },
    [writeStoredHiddenIds],
  )

  const readStoredViewId = useCallback((): string | null => {
    if (!storageKey || typeof window === 'undefined') return null

    try {
      return window.localStorage.getItem(storageKey)
    } catch {
      return null
    }
  }, [storageKey])

  const writeStoredViewId = useCallback(
    (viewId: string): void => {
      if (!storageKey || typeof window === 'undefined') return

      try {
        window.localStorage.setItem(storageKey, viewId)
      } catch {
        /* storage unavailable (Safari private mode, quota, etc.) */
      }
    },
    [storageKey],
  )

  const dataSourceKey = useMemo(
    () =>
      [
        'docyrus',
        'dataSource',
        appSlug,
        dataSourceSlug,
        dataSourceExpand || 'none',
      ] as const,
    [appSlug, dataSourceSlug, dataSourceExpand],
  )

  const viewsKey = useMemo(
    () =>
      ['docyrus', 'dataViews', appSlug, dataSourceSlug, appId ?? null] as const,
    [appSlug, dataSourceSlug, appId],
  )

  const queryEnabled = enabled && Boolean(appSlug) && Boolean(dataSourceSlug)

  const dataSourceQuery = useQuery({
    queryKey: dataSourceKey,
    queryFn: () =>
      dataSourcesClient.getBySlug(
        appSlug,
        dataSourceSlug,
        dataSourceExpand ? { expand: dataSourceExpand } : undefined,
      ),
    enabled: queryEnabled && !providedDataSource,
    staleTime,
  })

  /*
   * Caller-supplied schema wins over the fetched one. When `providedDataSource`
   * is set the query above is disabled, so this is the only source of fields /
   * metadata for every downstream derivation (and for the `dataSource` result).
   */
  const resolvedDataSource = providedDataSource ?? dataSourceQuery.data

  /*
   * Saved forms come from the dedicated `/forms` endpoint. The single
   * data-source `getBySlug` does NOT embed `forms` (it ignores `expand=forms`
   * / `expand=views` — only the inventory LIST endpoint embeds them, and that
   * shape omits `layout`). This endpoint returns full `DataForm`s including
   * `layout`, which the view↔form binding needs. The query is isolated — a
   * failure (e.g. system data sources without a forms endpoint) leaves
   * `forms` empty without breaking the hook.
   */
  const dataFormsClient = useMemo(
    () => createDataFormClient(client, appSlug, dataSourceSlug),
    [client, appSlug, dataSourceSlug],
  )

  const formsKey = useMemo(
    () => ['docyrus', 'dataSourceForms', appSlug, dataSourceSlug] as const,
    [appSlug, dataSourceSlug],
  )

  const formsQuery = useQuery({
    queryKey: formsKey,
    queryFn: () => dataFormsClient.list(),
    enabled: queryEnabled && enableForms,
    staleTime,
  })

  /* Drop archived forms and sort the default form first for the picker. */
  const forms = useMemo<Array<DataForm>>(() => {
    const list = formsQuery.data ?? providedDataSource?.forms ?? []

    return list
      .filter((form) => form.archived !== true)
      .slice()
      .sort((a, b) => {
        if (a.is_default !== b.is_default) return a.is_default ? -1 : 1

        return (a.name || '').localeCompare(b.name || '')
      })
  }, [formsQuery.data, providedDataSource?.forms])

  const viewsQuery = useQuery({
    queryKey: viewsKey,
    queryFn: () => dataViewsClient.list({ appId }),
    enabled: queryEnabled && enableDataViews,
    staleTime,
  })

  const invalidateViews = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: viewsKey })
  }, [queryClient, viewsKey])

  const createMutation = useMutation({
    mutationFn: (view: SavedDataGridView) =>
      dataViewsClient.create(savedViewToCreateBody(view)),
    onSuccess: invalidateViews,
  })

  const updateMutation = useMutation({
    mutationFn: (view: SavedDataGridView) =>
      dataViewsClient.update(view.id, savedViewToUpdateBody(view)),
    onSuccess: invalidateViews,
  })

  const deleteMutation = useMutation({
    mutationFn: (viewId: string) => dataViewsClient.remove(viewId),
    onSuccess: invalidateViews,
  })

  /*
   * The backend has no bulk-reorder endpoint, so we issue one PATCH per view
   * whose `sort_order` actually changed. Optimistic cache update keeps the
   * Manage All Views dialog in sync immediately; on failure we invalidate to
   * snap back to server truth.
   */
  const reorderMutation = useMutation({
    mutationFn: async (orderedViewIds: Array<string>) => {
      const current = queryClient.getQueryData<Array<DataView>>(viewsKey) ?? []
      const byId = new Map(current.map((v) => [v.id, v]))
      const updates: Array<Promise<DataView>> = []

      orderedViewIds.forEach((viewId, index) => {
        const view = byId.get(viewId)

        if (!view || view.sort_order === index) return

        updates.push(dataViewsClient.update(viewId, { sort_order: index }))
      })

      await Promise.all(updates)
    },
    onMutate: async (orderedViewIds) => {
      await queryClient.cancelQueries({ queryKey: viewsKey })

      const previous = queryClient.getQueryData<Array<DataView>>(viewsKey)

      if (previous) {
        const byId = new Map(previous.map((v) => [v.id, v]))
        const reordered: Array<DataView> = []

        orderedViewIds.forEach((id, index) => {
          const view = byId.get(id)

          if (view) reordered.push({ ...view, sort_order: index })
        })

        queryClient.setQueryData<Array<DataView>>(viewsKey, reordered)
      }

      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(viewsKey, ctx.previous)
      }
    },
    onSettled: invalidateViews,
  })

  const userViews = useMemo<Array<SavedDataGridView>>(() => {
    const list = (viewsQuery.data ?? []).slice()

    /*
     * Sort by persisted `sort_order` (nulls last), falling back to name so
     * legacy views without an order still render deterministically. This
     * is what makes drag-reordering visible in the manage-views dialog
     * survive a refetch.
     */
    list.sort((a, b) => {
      const aOrder = a.sort_order ?? Number.POSITIVE_INFINITY
      const bOrder = b.sort_order ?? Number.POSITIVE_INFINITY

      if (aOrder !== bOrder) return aOrder - bOrder

      return a.name.localeCompare(b.name)
    })

    return list.map(dataViewToSavedView)
  }, [viewsQuery.data])

  const normalizedSystemViews = useMemo<Array<SavedDataGridView>>(
    () => (systemViews ?? []).map((view) => ({ ...view, isSystem: true })),
    [systemViews],
  )

  const views = useMemo<Array<SavedDataGridView>>(
    () => [...normalizedSystemViews, ...userViews],
    [normalizedSystemViews, userViews],
  )

  /*
   * Initialize from localStorage on first render so the resolved
   * `activeViewId` can lock onto the user's last selection on the very
   * first paint (e.g. when React Query hands back cached views
   * synchronously after a route navigation). Falling back to ''
   * lets the memo below pick a default once views arrive.
   */
  const [activeViewIdState, setActiveViewIdState] = useState<string>(
    () => readStoredViewId() ?? '',
  )

  /*
   * Derive the active view id from the current views every render. The
   * priority chain is:
   *   1. The currently selected view (if it still exists)
   *   2. The persisted localStorage value (if it still exists)
   *   3. The view marked `isDefault` on the backend
   *   4. The first available view
   *
   * Computing during render — instead of correcting state in an effect —
   * means the resolved id is available on the first render that has
   * cached views, so downstream hooks (`useDocyrusDataGrid`) don't have
   * to wait for a follow-up state transition that may never arrive.
   */
  const activeViewId = useMemo(() => {
    if (views.length === 0) return ''

    if (activeViewIdState && views.some((v) => v.id === activeViewIdState)) {
      return activeViewIdState
    }

    const stored = readStoredViewId()

    if (stored && views.some((v) => v.id === stored)) {
      return stored
    }

    return views.find((v) => v.isDefault)?.id ?? views[0]?.id ?? ''
  }, [views, activeViewIdState, readStoredViewId])

  const setActiveViewId = useCallback((viewId: string) => {
    setActiveViewIdState(viewId)
  }, [])

  /*
   * Persist the resolved active view id (not just user-clicked ones) so
   * defaults picked by the memo above also survive reloads.
   */
  useEffect(() => {
    if (activeViewId) writeStoredViewId(activeViewId)
  }, [activeViewId, writeStoredViewId])

  const onViewChange = useCallback(
    (view: SavedDataGridView) => {
      setActiveViewId(view.id)
    },
    [setActiveViewId],
  )

  /*
   * Relation fields whose target data source slug + app slug are exposed
   * directly on the field metadata (`relation_data_source_app_slug` /
   * `relation_data_source_slug`). We use these to eagerly load the first
   * batch of related records for the query builder's "is one of" /
   * "is none of" multi-select picker.
   */
  const relationTargets = useMemo<Array<RelationTarget>>(() => {
    const rawFields = resolvedDataSource?.fields ?? []

    return rawFields
      .map((field) => extractRelationTarget(field))
      .filter((target): target is RelationTarget => target !== null)
  }, [resolvedDataSource?.fields])

  const relationOptionsQuery = useQuery<
    Record<string, Array<DocyrusEnumOption>>
  >({
    queryKey: [
      'docyrus',
      'queryBuilderRelationOptions',
      appSlug,
      dataSourceSlug,
      relationTargets.map(
        (t) => `${t.fieldSlug}:${t.appSlug}/${t.dataSourceSlug}`,
      ),
    ],
    queryFn: async () => {
      const result: Record<string, Array<DocyrusEnumOption>> = {}

      await Promise.all(
        relationTargets.map(async (target) => {
          /*
           * Eagerly fetch the first 200 records of the related data source.
           * The multi-select chip popover uses Command's built-in fuzzy search
           * for filtering. For data sources with > 200 records, additional
           * loading would need a search-aware async value editor.
           */
          const response = await client.get<
            | { data?: Array<Record<string, unknown>> }
            | Array<Record<string, unknown>>
          >(
            `/v1/apps/${target.appSlug}/data-sources/${target.dataSourceSlug}/items`,
            { columns: 'id, name, autonumber_id', limit: 200 } as Parameters<
              typeof client.get
            >[1],
          )

          const items = Array.isArray(response)
            ? response
            : (response?.data ?? [])

          result[target.fieldSlug] = items
            .map((item) => {
              const id = typeof item.id === 'string' ? item.id : null

              if (!id) return null

              const label =
                typeof item.name === 'string'
                  ? item.name
                  : typeof item.autonumber_id === 'string' ||
                      typeof item.autonumber_id === 'number'
                    ? String(item.autonumber_id)
                    : id

              return {
                name: id,
                value: id,
                label,
              } as DocyrusEnumOption
            })
            .filter((option): option is DocyrusEnumOption => option !== null)
        }),
      )

      return result
    },
    enabled: queryEnabled && relationTargets.length > 0,
    staleTime,
  })

  const fields = useMemo<Array<FullField>>(() => {
    if (overrideFields) return overrideFields

    const rawFields = resolvedDataSource?.fields ?? []
    const relationOptions = relationOptionsQuery.data ?? {}

    return rawFields
      .map((field) => {
        const base = dsFieldToFullField(field)

        const loadedRelationOptions = relationOptions[field.slug]

        if (loadedRelationOptions && loadedRelationOptions.length > 0) {
          base.values = loadedRelationOptions
        }

        return mapField ? mapField(field, base) : base
      })
      .filter((field): field is FullField => field !== null)
  }, [
    resolvedDataSource?.fields,
    relationOptionsQuery.data,
    overrideFields,
    mapField,
  ])

  const onViewCreate = useCallback(
    (view: SavedDataGridView) => {
      createMutation.mutate(view)
    },
    [createMutation],
  )

  const onViewSave = useCallback(
    (view: SavedDataGridView) => {
      updateMutation.mutate(view)
    },
    [updateMutation],
  )

  const onViewDelete = useCallback(
    (viewId: string) => {
      deleteMutation.mutate(viewId)
    },
    [deleteMutation],
  )

  const systemViewIds = useMemo(
    () => new Set(normalizedSystemViews.map((v) => v.id)),
    [normalizedSystemViews],
  )

  const onViewReorder = useCallback(
    (orderedViewIds: Array<string>) => {
      /*
       * System views are developer-defined and not persisted on the backend,
       * so we drop them from the payload before issuing PATCH requests. Their
       * relative position is fixed (always before user views) by the
       * `[...systemViews, ...userViews]` composition.
       */
      const userOnly = orderedViewIds.filter((id) => !systemViewIds.has(id))

      reorderMutation.mutate(userOnly)
    },
    [reorderMutation, systemViewIds],
  )

  const isLoading = dataSourceQuery.isLoading || viewsQuery.isLoading
  const error = (dataSourceQuery.error ?? viewsQuery.error) as Error | null

  const isSaving = createMutation.isPending || updateMutation.isPending

  const gridViewSelectProps = useMemo<
    Pick<DataGridViewSelectProps<unknown>, ManagedProps>
  >(
    () => ({
      views,
      activeViewId,
      fields,
      forms,
      onViewChange,
      onViewCreate,
      onViewSave,
      onViewDelete,
      onViewHide,
      onViewUnhide,
      onViewReorder,
      hiddenViewIds,
      disabled: error !== null,
      defaultRowGroupingColumn,
      isSaving,
      isLoading,
    }),
    [
      views,
      activeViewId,
      fields,
      forms,
      onViewChange,
      onViewCreate,
      onViewSave,
      onViewDelete,
      onViewHide,
      onViewUnhide,
      onViewReorder,
      hiddenViewIds,
      error,
      defaultRowGroupingColumn,
      isSaving,
      isLoading,
    ],
  )

  const refetch = useCallback(() => {
    void dataSourceQuery.refetch()
    void viewsQuery.refetch()
  }, [dataSourceQuery, viewsQuery])

  return {
    gridViewSelectProps,
    views,
    fields,
    forms,
    dataSource: resolvedDataSource,
    activeViewId,
    setActiveViewId,
    isLoading,
    error,
    refetch,
  }
}

/*
 * ---------------------------------------------------------------------------
 * Mappers (module-local — kept in this file because the registry generator
 * does not bundle transitive files for hooks).
 * ---------------------------------------------------------------------------
 */

function savedViewToColumnsPayload(
  view: SavedDataGridView,
): Record<string, unknown> {
  return {
    visibility: view.columnVisibility,
    order: view.columnOrder,
    pinning: view.columnPinning,
    grouping: view.grouping ?? [],
    rowHeight: view.rowHeight,
    displayMode: view.displayMode,
    /*
     * Paging configuration travels under `columns` so the backend's opaque
     * JSON column survives every round-trip without schema changes. The
     * view editor populates these from its draft state; `applyViewToTable`
     * later reads them back to drive the table's pagination state.
     */
    pagingEnabled: view.pagingEnabled,
    pagingMode: view.pagingMode,
    pageSize: view.pageSize,
    /*
     * Inline-editing configuration also lives under `columns` for the same
     * reason. `inlineEditingEnabled` is the master toggle and
     * `readOnlyColumns` is the per-column override list — both are
     * recomputed by `useDocyrusDataGrid` against identity / metadata-locked
     * fields before being applied to the table.
     */
    inlineEditingEnabled: view.inlineEditingEnabled,
    readOnlyColumns: view.readOnlyColumns,
    /*
     * Per-column runtime overrides toggled from the column header dropdown
     * (e.g. relation `showAutonumber`). Travels under the opaque `columns`
     * payload so the backend doesn't need a dedicated schema for it.
     */
    columnOptions: view.columnOptions,
    /*
     * Id of the saved form bound to this view. Travels under the opaque
     * `columns` blob (same rationale as paging / columnOptions) so the
     * view↔form binding round-trips without a backend schema change.
     * `useDocyrusDataGrid` reads it back to drive `useDocyrusFormView`.
     */
    formId: view.formId,
  }
}

function savedViewToFiltersPayload(
  view: SavedDataGridView,
): Record<string, unknown> {
  return {
    columnFilters: view.columnFilters ?? [],
    filterQuery: view.filterQuery,
  }
}

function savedViewToSortPayload(
  view: SavedDataGridView,
): Record<string, unknown> {
  return {
    sorting: view.sorting ?? [],
  }
}

function savedViewToColorRulesPayload(
  view: SavedDataGridView,
): Record<string, unknown> {
  return {
    row: view.rowColorRules ?? [],
    cell: view.cellColorRules ?? [],
  }
}

function savedViewToCreateBody(view: SavedDataGridView): CreateDataViewBody {
  const body: CreateDataViewBody = {
    name: view.name,
    columns: savedViewToColumnsPayload(view),
    filters: savedViewToFiltersPayload(view),
    sort: savedViewToSortPayload(view),
    color_rules: savedViewToColorRulesPayload(view),
  }

  if (view.description && view.description.length > 0) {
    body.description = view.description
  }

  return body
}

function savedViewToUpdateBody(view: SavedDataGridView): UpdateDataViewBody {
  const body: UpdateDataViewBody = {
    name: view.name,
    columns: savedViewToColumnsPayload(view),
    filters: savedViewToFiltersPayload(view),
    sort: savedViewToSortPayload(view),
    color_rules: savedViewToColorRulesPayload(view),
  }

  if (view.description && view.description.length > 0) {
    body.description = view.description
  }

  return body
}

function pickRecord(
  value: Record<string, unknown> | null | undefined,
  key: string,
): unknown {
  if (!value) return undefined

  return value[key]
}

function dataViewToSavedView(dv: DataView): SavedDataGridView {
  const columns = dv.columns ?? {}
  const filters = dv.filters ?? {}
  const sort = dv.sort ?? {}
  const colorRules = dv.color_rules ?? {}

  return {
    id: dv.id,
    name: dv.name,
    description: dv.description ?? undefined,
    columnVisibility:
      (pickRecord(columns, 'visibility') as Record<string, boolean>) ?? {},
    columnOrder: (pickRecord(columns, 'order') as Array<string>) ?? [],
    columnPinning: (pickRecord(
      columns,
      'pinning',
    ) as SavedDataGridView['columnPinning']) ?? { left: [], right: [] },
    grouping: (pickRecord(columns, 'grouping') as Array<string>) ?? [],
    rowHeight: normalizeRowHeight(pickRecord(columns, 'rowHeight')),
    displayMode: pickRecord(
      columns,
      'displayMode',
    ) as SavedDataGridView['displayMode'],
    sorting:
      (pickRecord(sort, 'sorting') as SavedDataGridView['sorting']) ?? [],
    columnFilters:
      (pickRecord(
        filters,
        'columnFilters',
      ) as SavedDataGridView['columnFilters']) ?? [],
    filterQuery: pickRecord(
      filters,
      'filterQuery',
    ) as SavedDataGridView['filterQuery'],
    rowColorRules:
      (pickRecord(colorRules, 'row') as SavedDataGridView['rowColorRules']) ??
      [],
    cellColorRules:
      (pickRecord(colorRules, 'cell') as SavedDataGridView['cellColorRules']) ??
      [],
    /*
     * Mirrors the writer side in `savedViewToColumnsPayload` — paging is
     * stashed inside the opaque `columns` blob so the backend doesn't need
     * a dedicated schema for it.
     */
    pagingEnabled: pickRecord(columns, 'pagingEnabled') as boolean | undefined,
    pagingMode: pickRecord(
      columns,
      'pagingMode',
    ) as SavedDataGridView['pagingMode'],
    pageSize: pickRecord(columns, 'pageSize') as number | undefined,
    inlineEditingEnabled: pickRecord(columns, 'inlineEditingEnabled') as
      | boolean
      | undefined,
    readOnlyColumns:
      (pickRecord(columns, 'readOnlyColumns') as Array<string>) ?? undefined,
    columnOptions:
      (pickRecord(
        columns,
        'columnOptions',
      ) as SavedDataGridView['columnOptions']) ?? undefined,
    formId: (pickRecord(columns, 'formId') as string | undefined) || undefined,
    isDefault: dv.is_default,
  }
}

const FIELD_TYPE_MAP: Record<
  string,
  {
    inputType?: FullField['inputType']
    valueEditorType?: FullField['valueEditorType']
  }
> = {
  'field-text': { inputType: 'text', valueEditorType: 'text' },
  'field-code': { inputType: 'text', valueEditorType: 'text' },
  'field-email': { inputType: 'text', valueEditorType: 'text' },
  'field-phone': { inputType: 'text', valueEditorType: 'text' },
  'field-url': { inputType: 'text', valueEditorType: 'text' },
  'field-color': { inputType: 'text', valueEditorType: 'text' },
  'field-icon': { inputType: 'text', valueEditorType: 'text' },
  'field-textarea': { inputType: 'text', valueEditorType: 'textarea' },
  'field-htmlEditor': { inputType: 'text', valueEditorType: 'textarea' },
  'field-docEditor': { inputType: 'text', valueEditorType: 'textarea' },
  'field-number': { inputType: 'number', valueEditorType: 'text' },
  'field-money': { inputType: 'number', valueEditorType: 'text' },
  'field-percent': { inputType: 'number', valueEditorType: 'text' },
  'field-currency': { inputType: 'number', valueEditorType: 'text' },
  'field-duration': { inputType: 'number', valueEditorType: 'text' },
  'field-rating': { inputType: 'number', valueEditorType: 'text' },
  'field-autonumber': { inputType: 'number', valueEditorType: 'text' },
  'field-identity': { inputType: 'number', valueEditorType: 'text' },
  'field-date': { inputType: 'date', valueEditorType: 'text' },
  'field-dateRange': { inputType: 'date', valueEditorType: 'text' },
  'field-dateTime': { inputType: 'datetime-local', valueEditorType: 'text' },
  'field-time': { inputType: 'time', valueEditorType: 'text' },
  'field-checkbox': { inputType: 'text', valueEditorType: 'checkbox' },
  'field-switch': { inputType: 'text', valueEditorType: 'checkbox' },
  'field-enum': { inputType: 'text', valueEditorType: 'select' },
  'field-select': { inputType: 'text', valueEditorType: 'select' },
  'field-radioGroup': { inputType: 'text', valueEditorType: 'radio' },
  'field-status': { inputType: 'text', valueEditorType: 'select' },
  'field-systemEnum': { inputType: 'text', valueEditorType: 'select' },
  'field-multiSelect': { inputType: 'text', valueEditorType: 'multiselect' },
  'field-tagSelect': { inputType: 'text', valueEditorType: 'multiselect' },
}

function dsFieldToFullField(field: DataSourceField): FullField {
  const mapping = FIELD_TYPE_MAP[field.type] ?? {
    inputType: 'text',
    valueEditorType: 'text',
  }
  const options = extractFieldOptions(field)
  const filterGroup: FilterGroup = getFilterGroupForFieldType(field.type)

  /*
   * Per-operator value-editor type so operators like "empty"/"between"/
   * "weekdays" render the right editor (or no editor at all). Falls back to
   * the field's natural editor type derived from its Docyrus field type.
   */
  const mappedEditorType =
    typeof mapping.valueEditorType === 'function'
      ? undefined
      : mapping.valueEditorType
  const fallbackValueEditorType =
    mappedEditorType ?? FILTER_GROUP_VALUE_EDITOR_TYPE[filterGroup]
  const fallbackInputType =
    mapping.inputType ?? FILTER_GROUP_INPUT_TYPE[filterGroup]

  const fullField: FullField = {
    name: field.slug,
    value: field.slug,
    label: field.name,
    inputType: fallbackInputType,
    valueEditorType: (operator: string) =>
      resolveValueEditorType(filterGroup, operator, fallbackValueEditorType),
    operators: getOperatorsForGroup(filterGroup),
    /*
     * Keep filterGroup + fieldType on the field so consumers (and the
     * QueryBuilderDocyrus component) can reason about it without re-deriving.
     */
    filterGroup,
    fieldType: field.type,
  } as FullField & { filterGroup: FilterGroup; fieldType: string }

  if (options && options.length > 0) {
    fullField.values = options
  }

  return fullField
}

interface DocyrusEnumOption {
  name: string
  value: string
  label: string
  icon?: string
  color?: string
  [key: string]: unknown
}

interface RelationTarget {
  fieldSlug: string
  appSlug: string
  dataSourceSlug: string
}

function extractRelationTarget(field: DataSourceField): RelationTarget | null {
  if (field.type !== 'field-relation') return null

  const raw = field as Record<string, unknown>
  const targetAppSlug =
    typeof raw.relation_data_source_app_slug === 'string'
      ? raw.relation_data_source_app_slug
      : typeof raw.relationDataSourceAppSlug === 'string'
        ? raw.relationDataSourceAppSlug
        : undefined
  const targetDataSourceSlug =
    typeof raw.relation_data_source_slug === 'string'
      ? raw.relation_data_source_slug
      : typeof raw.relationDataSourceSlug === 'string'
        ? raw.relationDataSourceSlug
        : undefined

  if (!targetAppSlug || !targetDataSourceSlug) return null

  return {
    fieldSlug: field.slug,
    appSlug: targetAppSlug,
    dataSourceSlug: targetDataSourceSlug,
  }
}

function extractFieldOptions(
  field: DataSourceField,
): Array<DocyrusEnumOption> | null {
  const raw = field as Record<string, unknown>
  const source = Array.isArray(raw.enums)
    ? raw.enums
    : Array.isArray(raw.options)
      ? raw.options
      : null

  if (!source) return null

  const result: Array<DocyrusEnumOption> = []

  for (const entry of source) {
    if (!entry || typeof entry !== 'object') continue

    const option = entry as Record<string, unknown>
    /*
     * Prefer the enum option's UUID `id` so multi-value LIST operators
     * ("is one of" / "is none of") send arrays of stable identifiers to the
     * backend. Fall back to slug / value when no id is present (e.g. inline
     * options that haven't been persisted yet).
     */
    const id = typeof option.id === 'string' ? option.id : undefined
    const slug =
      typeof option.slug === 'string'
        ? option.slug
        : typeof option.value === 'string'
          ? option.value
          : undefined
    const identifier = id ?? slug
    const label =
      typeof option.name === 'string'
        ? option.name
        : typeof option.label === 'string'
          ? option.label
          : (slug ?? identifier)
    const icon = typeof option.icon === 'string' ? option.icon : undefined
    const color = typeof option.color === 'string' ? option.color : undefined

    if (identifier && label) {
      result.push({
        name: identifier,
        value: identifier,
        label,
        ...(icon ? { icon } : {}),
        ...(color ? { color } : {}),
      })
    }
  }

  return result
}
