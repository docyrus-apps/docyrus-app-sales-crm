// Generated collection for base_crm/plan
import { useMemo } from 'react'
import { useDocyrusClient } from '@docyrus/signin'
import type { QueryParamValue } from '@docyrus/api-client'
import type { ICollectionListParams } from './types'

export interface BaseCrmPlanEntity {
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

  /** Cancel / Postpone Reason */
  cancel_postpone_reason?: string

  /** Status */
  status?: { id: string; name: string } | any

  /** Require Approval */
  require_approval?: boolean

  /** Subject */
  subject?: string

  /** All Day */
  all_day?: boolean

  /** Check-out Time */
  check_out_time?: string

  /** Actual Start Date */
  actual_start_date?: string

  /** Actual End Date */
  actual_end_date?: string

  /** Organization */
  organization?: { id: string; name: string } | string

  /** Check-in Time */
  check_in_time?: string

  /** Postponed To */
  postponed_to?: string

  /** Event Type */
  event_type?: { id: string; name: string } | any

  /** Location */
  location?: Record<string, any>

  /** Contact */
  contact?: { id: string; name: string } | string

  /** Weekly Plan */
  weekly_plan?: { id: string; name: string } | string
}

export function useBaseCrmPlanCollection() {
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
      ): Promise<Array<BaseCrmPlanEntity>> =>
        client!.get(
          '/v1/apps/base_crm/data-sources/plan/items',
          params as Record<string, QueryParamValue> | undefined,
        ),

      /** Get record */
      get: (
        recordId: string,
        params?: { columns?: Array<string> },
      ): Promise<BaseCrmPlanEntity> =>
        client!.get(
          '/v1/apps/base_crm/data-sources/plan/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          params,
        ),

      /** Create record */
      create: (data: Record<string, any>): Promise<BaseCrmPlanEntity> =>
        client!.post('/v1/apps/base_crm/data-sources/plan/items', data),

      /** Update record */
      update: (
        recordId: string,
        data: Record<string, any>,
      ): Promise<BaseCrmPlanEntity> =>
        client!.patch(
          '/v1/apps/base_crm/data-sources/plan/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          data,
        ),

      /** Delete record */
      delete: (recordId: string): Promise<void> =>
        client!.delete(
          '/v1/apps/base_crm/data-sources/plan/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
        ),

      /** Delete many records */
      deleteMany: (data: { recordIds: Array<string> }): Promise<void> =>
        client!.delete('/v1/apps/base_crm/data-sources/plan/items', data),
    }),
    [client],
  )
}
