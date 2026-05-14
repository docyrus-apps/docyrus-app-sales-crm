// Generated collection for base/event
import { useMemo } from 'react'
import { useDocyrusClient } from '@docyrus/signin'
import type { QueryParamValue } from '@docyrus/api-client'
import type { ICollectionListParams } from './types'

export interface BaseEventEntity {
  /** ID */
  id?: string

  /** Record owner */
  record_owner?:
    | string
    | {
        id?: string
        firstname?: string
        lastname?: string
        email?: string
        name?: string
      }

  /** Created On */
  created_on?: string

  /** Created By */
  created_by?: string

  /** Last Modified On */
  last_modified_on?: string

  /** Last Modified By */
  last_modified_by?: string

  /** Subject */
  subject: string

  /** End Date */
  end_date?: string

  /** Start Date */
  start_date?: string

  /** Description */
  description?: string

  /** Event Type */
  calendar?: { id: string; name: string } | string

  /** Event Notes */
  event_notes?: Record<string, any>

  /** Contact */
  contact?: { id: string; name: string } | string

  /** Organization */
  organization?: { id: string; name: string } | string

  /** Lead */
  lead?: { id: string; name: string } | string

  /** Deal */
  deal?: { id: string; name: string } | string

  /** Plan Status */
  plan_status?: { id: string; name: string } | any

  /** Plan Type */
  plan_type?: { id: string; name: string } | any

  /** Plan Approval */
  plan_approval?:
    | {
        id: string
        name?: string
        label?: string
        approval_status?: { id: string; name: string } | any
        revision_message?: string
      }
    | string

  /** Require Approval */
  require_approval?: boolean

  /** Check-in Time */
  check_in_time?: string

  /** Check-out Time */
  check_out_time?: string

  /** Actual Start Date */
  actual_start_date?: string

  /** Actual End Date */
  actual_end_date?: string

  /** Location */
  location?: Record<string, any>

  /** Cancel / Postpone Reason */
  cancel_postpone_reason?: string

  /** Postponed To */
  postponed_to?: string
}

export function useBaseEventCollection() {
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
      list: (params?: ICollectionListParams): Promise<Array<BaseEventEntity>> =>
        client!.get(
          '/v1/apps/base/data-sources/event/items',
          params as Record<string, QueryParamValue> | undefined,
        ),

      /** Get record */
      get: (
        recordId: string,
        params?: { columns?: Array<string> },
      ): Promise<BaseEventEntity> =>
        client!.get(
          '/v1/apps/base/data-sources/event/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          params,
        ),

      /** Create record */
      create: (data: Record<string, any>): Promise<BaseEventEntity> =>
        client!.post('/v1/apps/base/data-sources/event/items', data),

      /** Update record */
      update: (
        recordId: string,
        data: Record<string, any>,
      ): Promise<BaseEventEntity> =>
        client!.patch(
          '/v1/apps/base/data-sources/event/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          data,
        ),

      /** Delete record */
      delete: (recordId: string): Promise<void> =>
        client!.delete(
          '/v1/apps/base/data-sources/event/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
        ),

      /** Delete many records */
      deleteMany: (data: { recordIds: Array<string> }): Promise<void> =>
        client!.delete('/v1/apps/base/data-sources/event/items', data),
    }),
    [client],
  )
}
