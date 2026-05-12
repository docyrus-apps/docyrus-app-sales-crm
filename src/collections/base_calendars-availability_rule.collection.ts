// Generated collection for base_calendars/availability_rule
import { useMemo } from 'react'
import { useDocyrusClient } from '@docyrus/signin'
import type { QueryParamValue } from '@docyrus/api-client'
import type { ICollectionListParams } from './types'

export interface BaseCalendarsAvailabilityRuleEntity {
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

  /** Display Order */
  display_order?: number

  /** Availability Schedule */
  availability_schedule?: { id: string; name: string } | string

  /** Day Of Week */
  day_of_week?: { id: string; name: string } | any

  /** Start Time */
  start_time?: string

  /** End Time */
  end_time?: string
}

export function useBaseCalendarsAvailabilityRuleCollection() {
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
      ): Promise<Array<BaseCalendarsAvailabilityRuleEntity>> =>
        client!.get(
          '/v1/apps/base_calendars/data-sources/availability_rule/items',
          params as Record<string, QueryParamValue> | undefined,
        ),

      /** Get record */
      get: (
        recordId: string,
        params?: { columns?: Array<string> },
      ): Promise<BaseCalendarsAvailabilityRuleEntity> =>
        client!.get(
          '/v1/apps/base_calendars/data-sources/availability_rule/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          params,
        ),

      /** Create record */
      create: (
        data: Record<string, any>,
      ): Promise<BaseCalendarsAvailabilityRuleEntity> =>
        client!.post(
          '/v1/apps/base_calendars/data-sources/availability_rule/items',
          data,
        ),

      /** Update record */
      update: (
        recordId: string,
        data: Record<string, any>,
      ): Promise<BaseCalendarsAvailabilityRuleEntity> =>
        client!.patch(
          '/v1/apps/base_calendars/data-sources/availability_rule/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          data,
        ),

      /** Delete record */
      delete: (recordId: string): Promise<void> =>
        client!.delete(
          '/v1/apps/base_calendars/data-sources/availability_rule/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
        ),

      /** Delete many records */
      deleteMany: (data: { recordIds: Array<string> }): Promise<void> =>
        client!.delete(
          '/v1/apps/base_calendars/data-sources/availability_rule/items',
          data,
        ),
    }),
    [client],
  )
}
