// Generated collection for base_callcenter/sla_target
import { useMemo } from 'react'
import { useDocyrusClient } from '@docyrus/signin'
import type { QueryParamValue } from '@docyrus/api-client'
import type { ICollectionListParams } from './types'

export interface BaseCallcenterSlaTargetEntity {
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

  /** SLA Policy */
  sla_policy?: { id: string; name: string } | string

  /** SLA Metric */
  sla_metric?: { id: string; name: string } | string

  /** Priority */
  priority?: { id: string; name: string } | any

  /** Target Value */
  target_value?: number

  /** Warning Threshold % */
  warning_threshold_percent?: number

  /** Active */
  is_active?: boolean

  /** Queue */
  queue?: { id: string; name: string } | string

  /** Team */
  team?: { id: string; name: string } | string

  /** Contact */
  contact?: { id: string; name: string } | string

  /** Lead */
  lead?: { id: string; name: string } | string

  /** Segment Key */
  segment_key?: string

  /** Effective From */
  effective_from?: string

  /** Effective To */
  effective_to?: string
}

export function useBaseCallcenterSlaTargetCollection() {
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
      ): Promise<Array<BaseCallcenterSlaTargetEntity>> =>
        client!.get(
          '/v1/apps/base_callcenter/data-sources/sla_target/items',
          params as Record<string, QueryParamValue> | undefined,
        ),

      /** Get record */
      get: (
        recordId: string,
        params?: { columns?: Array<string> },
      ): Promise<BaseCallcenterSlaTargetEntity> =>
        client!.get(
          '/v1/apps/base_callcenter/data-sources/sla_target/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          params,
        ),

      /** Create record */
      create: (
        data: Record<string, any>,
      ): Promise<BaseCallcenterSlaTargetEntity> =>
        client!.post(
          '/v1/apps/base_callcenter/data-sources/sla_target/items',
          data,
        ),

      /** Update record */
      update: (
        recordId: string,
        data: Record<string, any>,
      ): Promise<BaseCallcenterSlaTargetEntity> =>
        client!.patch(
          '/v1/apps/base_callcenter/data-sources/sla_target/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          data,
        ),

      /** Delete record */
      delete: (recordId: string): Promise<void> =>
        client!.delete(
          '/v1/apps/base_callcenter/data-sources/sla_target/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
        ),

      /** Delete many records */
      deleteMany: (data: { recordIds: Array<string> }): Promise<void> =>
        client!.delete(
          '/v1/apps/base_callcenter/data-sources/sla_target/items',
          data,
        ),
    }),
    [client],
  )
}
