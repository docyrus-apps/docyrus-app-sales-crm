// Generated collection for custom/exp_line_item
import { useMemo } from 'react'
import { useDocyrusClient } from '@docyrus/signin'
import type { QueryParamValue } from '@docyrus/api-client'
import type { ICollectionListParams } from './types'

export interface CustomExpLineItemEntity {
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

  /** Expense Report */
  expense_report: { id: string; name: string } | string

  /** Category */
  category?: { id: string; name: string } | string

  /** Vendor */
  vendor?: { id: string; name: string } | string

  /** Merchant (Free Text) */
  merchant_free_text?: string

  /** Expense Date */
  expense_date: string

  /** Currency */
  currency: { id: string; name: string } | string

  /** Amount */
  amount: number

  /** FX Rate */
  fx_rate?: { id: string; name: string } | string

  /** FX Rate Snapshot */
  fx_rate_snapshot?: number

  /** Amount (Base TRY) */
  amount_base?: number

  /** Receipt */
  receipt_file?: Record<string, any>

  /** Description */
  description?: string

  /** Policy Breach */
  is_policy_breach?: boolean

  /** Breach Reason */
  breach_reason?: string
}

export function useCustomExpLineItemCollection() {
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
      ): Promise<Array<CustomExpLineItemEntity>> =>
        client!.get(
          '/v1/apps/custom/data-sources/exp_line_item/items',
          params as Record<string, QueryParamValue> | undefined,
        ),

      /** Get record */
      get: (
        recordId: string,
        params?: { columns?: Array<string> },
      ): Promise<CustomExpLineItemEntity> =>
        client!.get(
          '/v1/apps/custom/data-sources/exp_line_item/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          params,
        ),

      /** Create record */
      create: (data: Record<string, any>): Promise<CustomExpLineItemEntity> =>
        client!.post('/v1/apps/custom/data-sources/exp_line_item/items', data),

      /** Update record */
      update: (
        recordId: string,
        data: Record<string, any>,
      ): Promise<CustomExpLineItemEntity> =>
        client!.patch(
          '/v1/apps/custom/data-sources/exp_line_item/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          data,
        ),

      /** Delete record */
      delete: (recordId: string): Promise<void> =>
        client!.delete(
          '/v1/apps/custom/data-sources/exp_line_item/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
        ),

      /** Delete many records */
      deleteMany: (data: { recordIds: Array<string> }): Promise<void> =>
        client!.delete(
          '/v1/apps/custom/data-sources/exp_line_item/items',
          data,
        ),
    }),
    [client],
  )
}
