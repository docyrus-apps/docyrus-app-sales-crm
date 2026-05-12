// Generated collection for custom/exp_report
import { useMemo } from 'react'
import { useDocyrusClient } from '@docyrus/signin'
import type { QueryParamValue } from '@docyrus/api-client'
import type { ICollectionListParams } from './types'

export interface CustomExpReportEntity {
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

  /** Employee */
  employee: { id: string; name: string } | string

  /** Department */
  department?: { id: string; name: string } | string

  /** Cost Center */
  cost_center?: { id: string; name: string } | string

  /** Period Month */
  period_month?: number

  /** Period Year */
  period_year?: number

  /** Status */
  status?: { id: string; name: string } | any

  /** Total Amount */
  total_amount?: number

  /** Base Currency Total (TRY) */
  base_currency_total?: number

  /** Submission Date */
  submission_date?: string

  /** Reimbursed Date */
  reimbursed_date?: string

  /** Budget Breach */
  budget_breach?: boolean

  /** Budget Breach Explanation */
  budget_breach_explanation?: string

  /** Budget Breach Document */
  budget_breach_document?: Record<string, any>

  /** Notes */
  notes?: string
}

export function useCustomExpReportCollection() {
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
      ): Promise<Array<CustomExpReportEntity>> =>
        client!.get(
          '/v1/apps/custom/data-sources/exp_report/items',
          params as Record<string, QueryParamValue> | undefined,
        ),

      /** Get record */
      get: (
        recordId: string,
        params?: { columns?: Array<string> },
      ): Promise<CustomExpReportEntity> =>
        client!.get(
          '/v1/apps/custom/data-sources/exp_report/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          params,
        ),

      /** Create record */
      create: (data: Record<string, any>): Promise<CustomExpReportEntity> =>
        client!.post('/v1/apps/custom/data-sources/exp_report/items', data),

      /** Update record */
      update: (
        recordId: string,
        data: Record<string, any>,
      ): Promise<CustomExpReportEntity> =>
        client!.patch(
          '/v1/apps/custom/data-sources/exp_report/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          data,
        ),

      /** Delete record */
      delete: (recordId: string): Promise<void> =>
        client!.delete(
          '/v1/apps/custom/data-sources/exp_report/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
        ),

      /** Delete many records */
      deleteMany: (data: { recordIds: Array<string> }): Promise<void> =>
        client!.delete('/v1/apps/custom/data-sources/exp_report/items', data),
    }),
    [client],
  )
}
