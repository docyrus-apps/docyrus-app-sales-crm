// Generated collection for base_dashboards/widget
import { useMemo } from 'react'
import { useDocyrusClient } from '@docyrus/signin'
import type { QueryParamValue } from '@docyrus/api-client'
import type { ICollectionListParams } from './types'

export interface BaseDashboardsWidgetEntity {
  /** ID */
  id?: string

  /** Record owner */
  record_owner?: string

  /** Created On */
  created_on?: string

  /** Created By */
  created_by?: string

  /** Last Modified On */
  last_modified_on?: string

  /** Last Modified By */
  last_modified_by?: string

  /** Dashboard */
  dashboard?: { id: string; name: string } | string

  /** Kind */
  kind?: { id: string; name: string } | any

  /** Style Variant */
  style_variant?: { id: string; name: string } | any

  /** Hidden */
  hidden?: boolean

  /** Locked */
  locked?: boolean

  /** Grid Layout */
  grid_layout?: Record<string, any>

  /** Flow Layout */
  flow_layout?: Record<string, any>

  /** Query Payload */
  query_payload?: Record<string, any>

  /** Config */
  config?: Record<string, any>

  /** Generation Sessions */
  generation_sessions?: Record<string, any>
}

export function useBaseDashboardsWidgetCollection() {
  const client = useDocyrusClient()

  /*
   * Memoize the returned object so its identity is stable across renders.
   * Consumers commonly put the collection in useCallback/useMemo deps
   * (e.g. on a delete/save handler) — without memoization, every render
   * produces a fresh object, those callbacks rebuild, and any effect that
   * tracks them via deps fires every render. That's what triggers the
   * infinite-loop case in <DataGrid>: an unstable handler reaches the
   * grid's column-applier effect, which calls table.setColumnVisibility
   * → store.set → store.notify → re-render → unstable collection again.
   */
  return useMemo(
    () => ({
      /** List records with optional filtering, sorting, and pagination. */
      list: (
        params?: ICollectionListParams,
      ): Promise<Array<BaseDashboardsWidgetEntity>> =>
        client!.get(
          '/v1/apps/base_dashboards/data-sources/widget/items',
          params as Record<string, QueryParamValue> | undefined,
        ),

      /** Get record */
      get: (
        recordId: string,
        params?: { columns?: Array<string> },
      ): Promise<BaseDashboardsWidgetEntity> =>
        client!.get(
          '/v1/apps/base_dashboards/data-sources/widget/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          params,
        ),

      /** Create record */
      create: (
        data: Record<string, any>,
      ): Promise<BaseDashboardsWidgetEntity> =>
        client!.post(
          '/v1/apps/base_dashboards/data-sources/widget/items',
          data,
        ),

      /** Update record */
      update: (
        recordId: string,
        data: Record<string, any>,
      ): Promise<BaseDashboardsWidgetEntity> =>
        client!.patch(
          '/v1/apps/base_dashboards/data-sources/widget/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          data,
        ),

      /** Delete record */
      delete: (recordId: string): Promise<void> =>
        client!.delete(
          '/v1/apps/base_dashboards/data-sources/widget/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
        ),

      /** Delete many records */
      deleteMany: (data: { recordIds: Array<string> }): Promise<void> =>
        client!.delete(
          '/v1/apps/base_dashboards/data-sources/widget/items',
          data,
        ),
    }),
    [client],
  )
}
