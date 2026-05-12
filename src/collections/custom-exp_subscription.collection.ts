// Generated collection for custom/exp_subscription
import { useMemo } from 'react'
import { useDocyrusClient } from '@docyrus/signin'
import type { QueryParamValue } from '@docyrus/api-client'
import type { ICollectionListParams } from './types'

export interface CustomExpSubscriptionEntity {
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

  /** Vendor */
  vendor: { id: string; name: string } | string

  /** Product Name */
  product_name?: string

  /** Category */
  category?: string

  /** Billing Cycle */
  billing_cycle?: { id: string; name: string } | any

  /** Amount */
  amount?: number

  /** Currency */
  currency?: { id: string; name: string } | string

  /** Next Billing Date */
  next_billing_date?: string

  /** Contract Start */
  contract_start?: string

  /** Contract End */
  contract_end?: string

  /** Auto Renews */
  auto_renews?: boolean

  /** Status */
  status?: { id: string; name: string } | any

  /** Tool Owner */
  tool_owner?: { id: string; name: string } | string

  /** Department */
  department?: { id: string; name: string } | string

  /** Cost Center */
  cost_center?: { id: string; name: string } | string

  /** User Count */
  user_count?: number

  /** Notes */
  notes?: string
}

export function useCustomExpSubscriptionCollection() {
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
      ): Promise<Array<CustomExpSubscriptionEntity>> =>
        client!.get(
          '/v1/apps/custom/data-sources/exp_subscription/items',
          params as Record<string, QueryParamValue> | undefined,
        ),

      /** Get record */
      get: (
        recordId: string,
        params?: { columns?: Array<string> },
      ): Promise<CustomExpSubscriptionEntity> =>
        client!.get(
          '/v1/apps/custom/data-sources/exp_subscription/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          params,
        ),

      /** Create record */
      create: (
        data: Record<string, any>,
      ): Promise<CustomExpSubscriptionEntity> =>
        client!.post(
          '/v1/apps/custom/data-sources/exp_subscription/items',
          data,
        ),

      /** Update record */
      update: (
        recordId: string,
        data: Record<string, any>,
      ): Promise<CustomExpSubscriptionEntity> =>
        client!.patch(
          '/v1/apps/custom/data-sources/exp_subscription/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          data,
        ),

      /** Delete record */
      delete: (recordId: string): Promise<void> =>
        client!.delete(
          '/v1/apps/custom/data-sources/exp_subscription/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
        ),

      /** Delete many records */
      deleteMany: (data: { recordIds: Array<string> }): Promise<void> =>
        client!.delete(
          '/v1/apps/custom/data-sources/exp_subscription/items',
          data,
        ),
    }),
    [client],
  )
}
