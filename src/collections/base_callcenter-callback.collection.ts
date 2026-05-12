// Generated collection for base_callcenter/callback
import { useMemo } from 'react'
import { useDocyrusClient } from '@docyrus/signin'
import type { QueryParamValue } from '@docyrus/api-client'
import type { ICollectionListParams } from './types'

export interface BaseCallcenterCallbackEntity {
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

  /** Contact */
  contact?: { id: string; name: string } | string

  /** Lead */
  lead?: { id: string; name: string } | string

  /** Phone Number */
  phone_number: string

  /** Status */
  status?: { id: string; name: string } | any

  /** Due Date */
  due_date: string

  /** Due Time */
  due_time: string

  /** Timezone */
  timezone?: string

  /** Reminder (minutes before) */
  reminder_minutes_before?: number

  /** Owner */
  owner?: { id: string; name: string } | string

  /** Owner Type */
  owner_type?: { id: string; name: string } | any

  /** Queue ID */
  queue_id?: string

  /** Source Call */
  source_call?: { id: string; name: string } | string

  /** Source Disposition */
  source_disposition?: string

  /** Campaign */
  campaign?: { id: string; name: string } | string

  /** Campaign Item */
  campaign_item?: { id: string; name: string } | string

  /** Notes */
  notes?: string

  /** Completed At */
  completed_at?: string

  /** Completed By */
  completed_by?: { id: string; name: string } | string

  /** Completion Call */
  completion_call?: { id: string; name: string } | string

  /** Completion Outcome */
  completion_outcome?: { id: string; name: string } | any

  /** Auto Closed */
  auto_closed?: boolean

  /** Auto Closed Reason */
  auto_closed_reason?: string

  /** Priority */
  priority?: { id: string; name: string } | any

  /** SLA (minutes) */
  sla_minutes?: number

  /** Queue */
  queue?: { id: string; name: string } | string

  /** Due Datetime (UTC) */
  due_datetime_utc?: string

  /** Is Overdue */
  is_overdue?: boolean

  /** Overdue Minutes */
  overdue_minutes?: number

  /** SLA Segment Key */
  sla_segment_key?: string
}

export function useBaseCallcenterCallbackCollection() {
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
      ): Promise<Array<BaseCallcenterCallbackEntity>> =>
        client!.get(
          '/v1/apps/base_callcenter/data-sources/callback/items',
          params as Record<string, QueryParamValue> | undefined,
        ),

      /** Get record */
      get: (
        recordId: string,
        params?: { columns?: Array<string> },
      ): Promise<BaseCallcenterCallbackEntity> =>
        client!.get(
          '/v1/apps/base_callcenter/data-sources/callback/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          params,
        ),

      /** Create record */
      create: (
        data: Record<string, any>,
      ): Promise<BaseCallcenterCallbackEntity> =>
        client!.post(
          '/v1/apps/base_callcenter/data-sources/callback/items',
          data,
        ),

      /** Update record */
      update: (
        recordId: string,
        data: Record<string, any>,
      ): Promise<BaseCallcenterCallbackEntity> =>
        client!.patch(
          '/v1/apps/base_callcenter/data-sources/callback/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          data,
        ),

      /** Delete record */
      delete: (recordId: string): Promise<void> =>
        client!.delete(
          '/v1/apps/base_callcenter/data-sources/callback/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
        ),

      /** Delete many records */
      deleteMany: (data: { recordIds: Array<string> }): Promise<void> =>
        client!.delete(
          '/v1/apps/base_callcenter/data-sources/callback/items',
          data,
        ),
    }),
    [client],
  )
}
