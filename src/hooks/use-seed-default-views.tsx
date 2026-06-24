'use client'

import { useEffect, useMemo } from 'react'

import { type RestApiClient } from '@docyrus/api-client'

import type { SavedDataGridView } from '@/components/docyrus/data-grid/types'

import type {
  CreateDataViewBody,
  DataView,
  UpdateDataViewBody
} from '@docyrus/app-utils'

import { createDataViewClient } from '@docyrus/app-utils'
import { useQuery, useQueryClient } from '@tanstack/react-query'

/*
 * Tracks which data sources have already had their seed pass run in this
 * session, so remounts (tab switches, route changes) don't re-trigger the
 * create loop. The name-based existence check below is the real idempotency
 * guard; this just avoids redundant work and create races within one session.
 */
const seededSources = new Set<string>()

/*
 * Bump this to force a fresh one-time prune pass across every data source the
 * next time each grid mounts (e.g. after changing the default template set).
 * The per-data-source localStorage marker stores this value once a prune
 * succeeds, so the destructive cleanup runs exactly once per version.
 */
const PRUNE_RESET_VERSION = '2'

export interface UseSeedDefaultViewsOptions {
  client: RestApiClient;
  appSlug: string;
  dataSourceSlug: string;
  appId?: string;
  /**
   * Default-view templates (see `createSystemViews`). Any whose `name` does not
   * already exist on the backend is created as a real, editable data-view.
   * Matching is case-insensitive so we never produce a duplicate "All".
   */
  templates: Array<SavedDataGridView>;
  enabled?: boolean;
  /**
   * One-time cleanup. When `true`, the first seed pass for each data source
   * deletes every backend view whose name is not one of `templates`, plus any
   * duplicate copies of a template view — leaving exactly the template set
   * (e.g. a single "All"). Guarded by a per-data-source localStorage marker
   * (`PRUNE_RESET_VERSION`), so views a user creates AFTER the reset are never
   * touched on later loads. Default `false`.
   */
  pruneUnlisted?: boolean;
}

/**
 * Ensures the CRM default views exist as real backend data-views.
 *
 * Unlike the old `systemViews` approach (locked, code-only, non-persisted),
 * these are created through the same `/views` endpoint the editor uses — so
 * they get real ids and behave like any user view (Configure, filter
 * persistence, delete). The pass is idempotent: it only creates templates
 * whose name is missing and patches existing views to use the standard paging
 * footer.
 *
 * With `pruneUnlisted`, the first pass additionally removes leftover views so
 * the data source resets to exactly the template set — see the option's docs
 * for the localStorage guard that keeps later user-created views safe.
 */
export function useSeedDefaultViews({
  client,
  appSlug,
  dataSourceSlug,
  appId,
  templates,
  enabled = true,
  pruneUnlisted = false
}: UseSeedDefaultViewsOptions): void {
  const queryClient = useQueryClient()

  const dataViewsClient = useMemo(
    () => createDataViewClient(client, appSlug, dataSourceSlug),
    [client, appSlug, dataSourceSlug]
  )

  /*
   * Same query key as `useDocyrusDataViewSelect` so this shares the grid's
   * cached view list (no extra fetch) and our post-create invalidate refreshes
   * the grid's tab strip too.
   */
  const viewsKey = useMemo(
    () => [
'docyrus',
'dataViews',
appSlug,
dataSourceSlug,
appId ?? null
] as const,
    [appSlug, dataSourceSlug, appId]
  )

  const queryEnabled = enabled && Boolean(appSlug) && Boolean(dataSourceSlug)

  const existingQuery = useQuery({
    queryKey: viewsKey,
    queryFn: () => dataViewsClient.list({ appId }),
    enabled: queryEnabled,
    staleTime: 30_000
  })

  const existing = existingQuery.data

  useEffect(() => {
    if (!queryEnabled) return
    if (existingQuery.isLoading || !existing) return

    const sourceKey = `${appSlug}:${dataSourceSlug}:${appId ?? ''}`

    if (seededSources.has(sourceKey)) return
    seededSources.add(sourceKey)

    const markerKey = pruneMarkerKey(appSlug, dataSourceSlug, appId)
    const shouldPrune = pruneUnlisted && !hasPruned(markerKey)

    const templateNames = new Set(
      templates.map(template => normalizeName(template.name))
    )

    /*
     * Partition the existing backend views. When pruning, keep exactly one
     * view per template name (the canonical "All") and queue everything else —
     * leftover custom views from earlier seeding passes and duplicate copies —
     * for deletion. Otherwise keep them all and just reconcile paging.
     */
    const keptNames = new Set<string>()
    const keep: Array<DataView> = []
    const toDelete: Array<DataView> = []
    const keptByName = new Map<string, DataView>()

    for (const view of existing) {
      const name = normalizeName(view.name)
      const isTemplate = templateNames.has(name)

      if (shouldPrune) {
        if (isTemplate && !keptNames.has(name)) {
          keptNames.add(name)
          keptByName.set(name, view)
          keep.push(view)
        } else {
          toDelete.push(view)
        }
      } else {
        keep.push(view)
        if (isTemplate) {
          keptNames.add(name)
          if (!keptByName.has(name)) keptByName.set(name, view)
        }
      }
    }

    const missing = templates.filter(
      template => !keptNames.has(normalizeName(template.name))
    )
    const templateUpdates = templates.flatMap((template, index) => {
      const view = keptByName.get(normalizeName(template.name))

      if (!view) return []

      return [{ view, template, sortOrder: index }]
    })

    if (
      toDelete.length === 0 &&
      missing.length === 0 &&
      templateUpdates.length === 0
    ) {
      if (shouldPrune) markPruned(markerKey)

      return
    }

    void (async () => {
      try {
        for (const view of toDelete) {
          await dataViewsClient.remove(view.id)
        }

        for (const { view, template, sortOrder } of templateUpdates) {
          await dataViewsClient.update(
            view.id,
            buildUpdateBody(template, sortOrder)
          )
        }

        for (const [index, template] of templates.entries()) {
          if (!missing.includes(template)) continue

          await dataViewsClient.create(buildCreateBody(template, index))
        }

        if (shouldPrune) markPruned(markerKey)

        await queryClient.invalidateQueries({ queryKey: viewsKey })
      } catch {
        /*
         * Allow a retry on the next mount if the pass failed partway (e.g. a
         * transient network error) so we don't leave the data source
         * permanently half-seeded for the session. The localStorage marker is
         * only written on success, so an interrupted prune also retries.
         */
        seededSources.delete(sourceKey)
      }
    })()
  }, [
    queryEnabled,
    existingQuery.isLoading,
    existing,
    templates,
    pruneUnlisted,
    dataViewsClient,
    queryClient,
    viewsKey,
    appSlug,
    dataSourceSlug,
    appId
  ])
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase()
}

/*
 * Per-data-source localStorage key recording that the one-time prune already
 * ran (at `PRUNE_RESET_VERSION`). Mirrors the namespacing used by
 * `useDocyrusDataViewSelect`'s active-view / hidden-views keys.
 */
function pruneMarkerKey(
  appSlug: string,
  dataSourceSlug: string,
  appId?: string
): string {
  return `docyrus:data-grid-views-reset:${appSlug}:${dataSourceSlug}:${appId ?? ''}`
}

function hasPruned(key: string): boolean {
  /*
   * When storage is unavailable, report "already pruned" so we never run the
   * destructive delete loop repeatedly without a way to remember it ran.
   */
  if (typeof window === 'undefined') return true

  try {
    return window.localStorage.getItem(key) === PRUNE_RESET_VERSION
  } catch {
    return true
  }
}

function markPruned(key: string): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(key, PRUNE_RESET_VERSION)
  } catch {
    /* storage unavailable (Safari private mode, quota, etc.) */
  }
}

/*
 * Mirrors `savedViewToCreateBody` in `use-docyrus-data-view-select.tsx`. Kept
 * local so the seeder doesn't depend on that hook's private serializers; the
 * opaque `columns` blob also carries paging + inline-editing config.
 */
function buildCreateBody(
  view: SavedDataGridView,
  sortOrder: number
): CreateDataViewBody {
  const body: CreateDataViewBody = {
    name: view.name,
    is_default: view.isDefault === true,
    sort_order: sortOrder,
    columns: {
      visibility: view.columnVisibility,
      order: view.columnOrder,
      pinning: view.columnPinning,
      grouping: view.grouping ?? [],
      rowHeight: view.rowHeight,
      displayMode: view.displayMode,
      pagingEnabled: view.pagingEnabled,
      pagingMode: view.pagingMode,
      pageSize: view.pageSize,
      inlineEditingEnabled: view.inlineEditingEnabled,
      readOnlyColumns: view.readOnlyColumns
    },
    filters: {
      columnFilters: view.columnFilters ?? [],
      filterQuery: view.filterQuery
    },
    sort: { sorting: view.sorting ?? [] },
    color_rules: {
      row: view.rowColorRules ?? [],
      cell: view.cellColorRules ?? []
    }
  }

  if (view.description && view.description.length > 0) {
    body.description = view.description
  }

  return body
}

function buildUpdateBody(
  view: SavedDataGridView,
  sortOrder: number
): UpdateDataViewBody {
  return buildCreateBody(view, sortOrder)
}
