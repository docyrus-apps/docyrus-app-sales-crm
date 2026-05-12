// Generated collection for base_callcenter/call
import { useMemo } from 'react'
import { useDocyrusClient } from '@docyrus/signin'
import type { QueryParamValue } from '@docyrus/api-client'
import type { ICollectionListParams } from './types'

export interface BaseCallcenterCallEntity {
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

  /** Provider Type */
  provider_type?: string

  /** Direction */
  direction?: { id: string; name: string } | any

  /** Call Type */
  call_type?: { id: string; name: string } | any

  /** Agent Profile */
  agent_profile?: { id: string; name: string } | string

  /** Contact */
  contact?: { id: string; name: string } | string

  /** Lead */
  lead?: { id: string; name: string } | string

  /** Customer Phone (E.164) */
  customer_phone_e164?: string

  /** State */
  state?: { id: string; name: string } | any

  /** Outcome */
  outcome?: { id: string; name: string } | any

  /** Started At */
  started_at?: string

  /** Ringing At */
  ringing_at?: string

  /** Answered At */
  answered_at?: string

  /** Ended At */
  ended_at?: string

  /** Duration (seconds) */
  duration_seconds?: number

  /** Talk Duration (seconds) */
  talk_duration_seconds?: number

  /** Hold Duration (seconds) */
  hold_duration_seconds?: number

  /** Campaign */
  campaign?: { id: string; name: string } | string

  /** Campaign Item */
  campaign_item?: { id: string; name: string } | string

  /** Queue ID */
  queue_id?: string

  /** Queue Name */
  queue_name?: string

  /** Recording Status */
  recording_status?: { id: string; name: string } | any

  /** Recording URL */
  recording_url?: string

  /** Recording Ready At */
  recording_ready_at?: string

  /** Device Type */
  device_type?: { id: string; name: string } | any

  /** Originate Leg 1 Status */
  originate_leg1_status?: { id: string; name: string } | any

  /** Originate Leg 2 Status */
  originate_leg2_status?: { id: string; name: string } | any

  /** Is Missed */
  is_missed?: boolean

  /** Is Callback */
  is_callback?: boolean

  /** Created Callback */
  created_callback?: { id: string; name: string } | string

  /** Queue */
  queue?: { id: string; name: string } | string

  /** SLA Segment Key */
  sla_segment_key?: string
}

export function useBaseCallcenterCallCollection() {
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
      ): Promise<Array<BaseCallcenterCallEntity>> =>
        client!.get(
          '/v1/apps/base_callcenter/data-sources/call/items',
          params as Record<string, QueryParamValue> | undefined,
        ),

      /** Get record */
      get: (
        recordId: string,
        params?: { columns?: Array<string> },
      ): Promise<BaseCallcenterCallEntity> =>
        client!.get(
          '/v1/apps/base_callcenter/data-sources/call/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          params,
        ),

      /** Create record */
      create: (data: Record<string, any>): Promise<BaseCallcenterCallEntity> =>
        client!.post('/v1/apps/base_callcenter/data-sources/call/items', data),

      /** Update record */
      update: (
        recordId: string,
        data: Record<string, any>,
      ): Promise<BaseCallcenterCallEntity> =>
        client!.patch(
          '/v1/apps/base_callcenter/data-sources/call/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          data,
        ),

      /** Delete record */
      delete: (recordId: string): Promise<void> =>
        client!.delete(
          '/v1/apps/base_callcenter/data-sources/call/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
        ),

      /** Delete many records */
      deleteMany: (data: { recordIds: Array<string> }): Promise<void> =>
        client!.delete(
          '/v1/apps/base_callcenter/data-sources/call/items',
          data,
        ),
    }),
    [client],
  )
}
