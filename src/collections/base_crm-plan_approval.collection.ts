// Generated collection for base_crm/plan_approval
import { useMemo } from 'react'
import { useDocyrusClient } from '@docyrus/signin'
import type { QueryParamValue } from '@docyrus/api-client'
import type { ICollectionListParams } from './types'

export interface BaseCrmPlanApprovalEntity {
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

  /** Approved By */
  approved_by?: { id: string; name: string } | string

  /** Plan Owner */
  plan_owner?: { id: string; name: string } | string

  /** Label */
  label?: string

  /** Start Date */
  start_date?: string

  /** Approval Status */
  approval_status?: { id: string; name: string } | any

  /** Revision Message */
  revision_message?: string

  /** End Date */
  end_date?: string
}

export function useBaseCrmPlanApprovalCollection() {
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
      ): Promise<Array<BaseCrmPlanApprovalEntity>> =>
        client!.get(
          '/v1/apps/base_crm/data-sources/plan_approval/items',
          params as Record<string, QueryParamValue> | undefined,
        ),

      /** Get record */
      get: (
        recordId: string,
        params?: { columns?: Array<string> },
      ): Promise<BaseCrmPlanApprovalEntity> =>
        client!.get(
          '/v1/apps/base_crm/data-sources/plan_approval/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          params,
        ),

      /** Create record */
      create: (data: Record<string, any>): Promise<BaseCrmPlanApprovalEntity> =>
        client!.post(
          '/v1/apps/base_crm/data-sources/plan_approval/items',
          data,
        ),

      /** Update record */
      update: (
        recordId: string,
        data: Record<string, any>,
      ): Promise<BaseCrmPlanApprovalEntity> =>
        client!.patch(
          '/v1/apps/base_crm/data-sources/plan_approval/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          data,
        ),

      /** Delete record */
      delete: (recordId: string): Promise<void> =>
        client!.delete(
          '/v1/apps/base_crm/data-sources/plan_approval/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
        ),

      /** Delete many records */
      deleteMany: (data: { recordIds: Array<string> }): Promise<void> =>
        client!.delete(
          '/v1/apps/base_crm/data-sources/plan_approval/items',
          data,
        ),
    }),
    [client],
  )
}
