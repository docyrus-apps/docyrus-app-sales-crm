// Generated collection for base_inbox/sla_policies
import { useMemo } from 'react'
import { useDocyrusClient } from '@docyrus/signin'
import type { QueryParamValue } from '@docyrus/api-client'
import type { ICollectionListParams } from './types'

export interface BaseInboxSlaPoliciesEntity {
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

  /** Description */
  descriptions?: string

  /** Is Active */
  is_active?: boolean

  /** Is Default */
  is_default?: boolean

  /** Operational Hours End Time */
  operational_hours_end_time?: string

  /** First Response Time */
  first_response_time?: number

  /** Operational Hours Start Time */
  operational_hours_start_time?: string

  /** First Response Time Metric */
  first_response_time_metric?: { id: string; name: string } | any

  /** Operational Hours Time Section */
  operational_hours_time_section?: { id: string; name: string } | any

  /** Default Priorty */
  default_priorty?: { id: string; name: string } | any

  /** Resolution Response Time */
  resolution_response_time?: number

  /** Resolution Response Time Metric */
  resolution_response_time_metric?: { id: string; name: string } | any

  /** First Response At */
  first_response_at?: string

  /** Priority */
  priority?: { id: string; name: string } | any

  /** Default Team */
  default_team?: { id: string; name: string } | string
}

export function useBaseInboxSlaPoliciesCollection() {
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
      ): Promise<Array<BaseInboxSlaPoliciesEntity>> =>
        client!.get(
          '/v1/apps/base_inbox/data-sources/sla_policies/items',
          params as Record<string, QueryParamValue> | undefined,
        ),

      /** Get record */
      get: (
        recordId: string,
        params?: { columns?: Array<string> },
      ): Promise<BaseInboxSlaPoliciesEntity> =>
        client!.get(
          '/v1/apps/base_inbox/data-sources/sla_policies/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          params,
        ),

      /** Create record */
      create: (
        data: Record<string, any>,
      ): Promise<BaseInboxSlaPoliciesEntity> =>
        client!.post(
          '/v1/apps/base_inbox/data-sources/sla_policies/items',
          data,
        ),

      /** Update record */
      update: (
        recordId: string,
        data: Record<string, any>,
      ): Promise<BaseInboxSlaPoliciesEntity> =>
        client!.patch(
          '/v1/apps/base_inbox/data-sources/sla_policies/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          data,
        ),

      /** Delete record */
      delete: (recordId: string): Promise<void> =>
        client!.delete(
          '/v1/apps/base_inbox/data-sources/sla_policies/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
        ),

      /** Delete many records */
      deleteMany: (data: { recordIds: Array<string> }): Promise<void> =>
        client!.delete(
          '/v1/apps/base_inbox/data-sources/sla_policies/items',
          data,
        ),
    }),
    [client],
  )
}
