// Generated collection for base_inbox/sla_tracking
import { useMemo } from 'react'
import { useDocyrusClient } from '@docyrus/signin'
import type { QueryParamValue } from '@docyrus/api-client'
import type { ICollectionListParams } from './types'

export interface BaseInboxSlaTrackingEntity {
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

  /** Thread/Ticket */
  thread: { id: string; name: string } | string

  /** SLA Metric */
  sla_metric: { id: string; name: string } | string

  /** Start Time */
  start_time: string

  /** Target Completion Time */
  target_completion_time: string

  /** Actual Completion Time */
  actual_completion_time?: string

  /** Status */
  status: { id: string; name: string } | any

  /** Remaining Minutes */
  remaining_minutes?: number

  /** Is Breached */
  is_breached?: boolean
}

export function useBaseInboxSlaTrackingCollection() {
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
      ): Promise<Array<BaseInboxSlaTrackingEntity>> =>
        client!.get(
          '/v1/apps/base_inbox/data-sources/sla_tracking/items',
          params as Record<string, QueryParamValue> | undefined,
        ),

      /** Get record */
      get: (
        recordId: string,
        params?: { columns?: Array<string> },
      ): Promise<BaseInboxSlaTrackingEntity> =>
        client!.get(
          '/v1/apps/base_inbox/data-sources/sla_tracking/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          params,
        ),

      /** Create record */
      create: (
        data: Record<string, any>,
      ): Promise<BaseInboxSlaTrackingEntity> =>
        client!.post(
          '/v1/apps/base_inbox/data-sources/sla_tracking/items',
          data,
        ),

      /** Update record */
      update: (
        recordId: string,
        data: Record<string, any>,
      ): Promise<BaseInboxSlaTrackingEntity> =>
        client!.patch(
          '/v1/apps/base_inbox/data-sources/sla_tracking/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          data,
        ),

      /** Delete record */
      delete: (recordId: string): Promise<void> =>
        client!.delete(
          '/v1/apps/base_inbox/data-sources/sla_tracking/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
        ),

      /** Delete many records */
      deleteMany: (data: { recordIds: Array<string> }): Promise<void> =>
        client!.delete(
          '/v1/apps/base_inbox/data-sources/sla_tracking/items',
          data,
        ),
    }),
    [client],
  )
}
