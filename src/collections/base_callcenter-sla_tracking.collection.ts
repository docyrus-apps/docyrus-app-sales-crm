// Generated collection for base_callcenter/sla_tracking
import { useMemo } from 'react'
import { useDocyrusClient } from '@docyrus/signin'
import type { QueryParamValue } from '@docyrus/api-client'
import type { ICollectionListParams } from './types'

export interface BaseCallcenterSlaTrackingEntity {
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

  /** Call */
  call?: { id: string; name: string } | string

  /** Callback */
  callback?: { id: string; name: string } | string

  /** SLA Policy */
  sla_policy?: { id: string; name: string } | string

  /** SLA Metric */
  sla_metric?: { id: string; name: string } | string

  /** Priority */
  priority?: { id: string; name: string } | any

  /** Target Value */
  target_value?: number

  /** Actual Value */
  actual_value?: number

  /** Status */
  status?: { id: string; name: string } | any

  /** Start Time */
  start_time?: string

  /** Target Time */
  target_time?: string

  /** Completed Time */
  completed_time?: string

  /** Remaining Seconds */
  remaining_seconds?: number

  /** Breached */
  is_breached?: boolean

  /** Breach Duration (sec) */
  breach_duration_seconds?: number

  /** Agent */
  agent?: { id: string; name: string } | string

  /** Notes */
  notes?: string

  /** SLA Target */
  sla_target?: { id: string; name: string } | string

  /** Breach Reason */
  breach_reason?: string

  /** Rule Scope Summary */
  rule_scope_summary?: string
}

export function useBaseCallcenterSlaTrackingCollection() {
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
      ): Promise<Array<BaseCallcenterSlaTrackingEntity>> =>
        client!.get(
          '/v1/apps/base_callcenter/data-sources/sla_tracking/items',
          params as Record<string, QueryParamValue> | undefined,
        ),

      /** Get record */
      get: (
        recordId: string,
        params?: { columns?: Array<string> },
      ): Promise<BaseCallcenterSlaTrackingEntity> =>
        client!.get(
          '/v1/apps/base_callcenter/data-sources/sla_tracking/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          params,
        ),

      /** Create record */
      create: (
        data: Record<string, any>,
      ): Promise<BaseCallcenterSlaTrackingEntity> =>
        client!.post(
          '/v1/apps/base_callcenter/data-sources/sla_tracking/items',
          data,
        ),

      /** Update record */
      update: (
        recordId: string,
        data: Record<string, any>,
      ): Promise<BaseCallcenterSlaTrackingEntity> =>
        client!.patch(
          '/v1/apps/base_callcenter/data-sources/sla_tracking/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          data,
        ),

      /** Delete record */
      delete: (recordId: string): Promise<void> =>
        client!.delete(
          '/v1/apps/base_callcenter/data-sources/sla_tracking/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
        ),

      /** Delete many records */
      deleteMany: (data: { recordIds: Array<string> }): Promise<void> =>
        client!.delete(
          '/v1/apps/base_callcenter/data-sources/sla_tracking/items',
          data,
        ),
    }),
    [client],
  )
}
