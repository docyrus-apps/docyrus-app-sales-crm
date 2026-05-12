// Generated collection for base_calendars/booking
import { useMemo } from 'react'
import { useDocyrusClient } from '@docyrus/signin'
import type { QueryParamValue } from '@docyrus/api-client'
import type { ICollectionListParams } from './types'

export interface BaseCalendarsBookingEntity {
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

  /** Invitee Name */
  invitee_name?: string

  /** Event Type */
  event_type?: { id: string; name: string } | string

  /** Host Profile */
  host_profile?: { id: string; name: string } | string

  /** Status */
  status?: { id: string; name: string } | any

  /** Source */
  source?: { id: string; name: string } | any

  /** Workspace */
  workspace?: { id: string; name: string } | string

  /** Invitee Email */
  invitee_email?: string

  /** Start At */
  start_at?: string

  /** Invitee Phone */
  invitee_phone?: string

  /** Invitee Timezone */
  invitee_timezone?: string

  /** End At */
  end_at?: string

  /** Subject */
  subject?: string

  /** Notes */
  notes?: string

  /** Intake Answers JSON */
  intake_answers_json?: Record<string, any>

  /** Public Reference */
  public_reference?: string

  /** Cancellation Reason */
  cancellation_reason?: string

  /** Organization */
  organization?: { id: string; name: string } | string

  /** Contact */
  contact?: { id: string; name: string } | string
}

export function useBaseCalendarsBookingCollection() {
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
      ): Promise<Array<BaseCalendarsBookingEntity>> =>
        client!.get(
          '/v1/apps/base_calendars/data-sources/booking/items',
          params as Record<string, QueryParamValue> | undefined,
        ),

      /** Get record */
      get: (
        recordId: string,
        params?: { columns?: Array<string> },
      ): Promise<BaseCalendarsBookingEntity> =>
        client!.get(
          '/v1/apps/base_calendars/data-sources/booking/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          params,
        ),

      /** Create record */
      create: (
        data: Record<string, any>,
      ): Promise<BaseCalendarsBookingEntity> =>
        client!.post(
          '/v1/apps/base_calendars/data-sources/booking/items',
          data,
        ),

      /** Update record */
      update: (
        recordId: string,
        data: Record<string, any>,
      ): Promise<BaseCalendarsBookingEntity> =>
        client!.patch(
          '/v1/apps/base_calendars/data-sources/booking/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          data,
        ),

      /** Delete record */
      delete: (recordId: string): Promise<void> =>
        client!.delete(
          '/v1/apps/base_calendars/data-sources/booking/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
        ),

      /** Delete many records */
      deleteMany: (data: { recordIds: Array<string> }): Promise<void> =>
        client!.delete(
          '/v1/apps/base_calendars/data-sources/booking/items',
          data,
        ),
    }),
    [client],
  )
}
