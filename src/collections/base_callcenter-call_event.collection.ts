// Generated collection for base_callcenter/call_event
import { useMemo } from 'react'
import { useDocyrusClient } from '@docyrus/signin'
import type { QueryParamValue } from '@docyrus/api-client'
import type { ICollectionListParams } from './types'

export interface BaseCallcenterCallEventEntity {
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

  /** Call ID */
  call_id: string

  /** Event ID */
  event_id: string

  /** Provider Type */
  provider_type?: string

  /** Event Type */
  event_type?: { id: string; name: string } | any

  /** Event Data */
  event_data?: string

  /** Direction */
  direction?: { id: string; name: string } | any

  /** Agent Profile */
  agent_profile?: { id: string; name: string } | string

  /** Customer Phone */
  customer_phone?: string

  /** Leg ID */
  leg_id?: string

  /** State */
  state?: string

  /** Event Timestamp */
  event_timestamp?: string

  /** Received At */
  received_at?: string

  /** Processed */
  processed?: boolean

  /** Campaign */
  campaign_id?: { id: string; name: string } | string

  /** Queue */
  queue_id?: { id: string; name: string } | string
}

export function useBaseCallcenterCallEventCollection() {
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
      ): Promise<Array<BaseCallcenterCallEventEntity>> =>
        client!.get(
          '/v1/apps/base_callcenter/data-sources/call_event/items',
          params as Record<string, QueryParamValue> | undefined,
        ),

      /** Get record */
      get: (
        recordId: string,
        params?: { columns?: Array<string> },
      ): Promise<BaseCallcenterCallEventEntity> =>
        client!.get(
          '/v1/apps/base_callcenter/data-sources/call_event/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          params,
        ),

      /** Create record */
      create: (
        data: Record<string, any>,
      ): Promise<BaseCallcenterCallEventEntity> =>
        client!.post(
          '/v1/apps/base_callcenter/data-sources/call_event/items',
          data,
        ),

      /** Update record */
      update: (
        recordId: string,
        data: Record<string, any>,
      ): Promise<BaseCallcenterCallEventEntity> =>
        client!.patch(
          '/v1/apps/base_callcenter/data-sources/call_event/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          data,
        ),

      /** Delete record */
      delete: (recordId: string): Promise<void> =>
        client!.delete(
          '/v1/apps/base_callcenter/data-sources/call_event/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
        ),

      /** Delete many records */
      deleteMany: (data: { recordIds: Array<string> }): Promise<void> =>
        client!.delete(
          '/v1/apps/base_callcenter/data-sources/call_event/items',
          data,
        ),
    }),
    [client],
  )
}
