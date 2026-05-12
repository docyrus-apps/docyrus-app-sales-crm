// Generated collection for base_crm/sales_order_item
import { useMemo } from 'react'
import { useDocyrusClient } from '@docyrus/signin'
import type { QueryParamValue } from '@docyrus/api-client'
import type { ICollectionListParams } from './types'

export interface BaseCrmSalesOrderItemEntity {
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

  /** Discount */
  discount?: number

  /** Product */
  product?: { id: string; name: string } | string

  /** Tax Rate */
  tax_rate?: number

  /** Related Sales Order */
  related_sales_order: { id: string; name: string } | string

  /** Gross Total */
  gross_total?: number

  /** Unit Price */
  unit_price: number

  /** QTY */
  qty: number

  /** Total */
  total?: number

  /** Net Total */
  net_total?: number
}

export function useBaseCrmSalesOrderItemCollection() {
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
      ): Promise<Array<BaseCrmSalesOrderItemEntity>> =>
        client!.get(
          '/v1/apps/base_crm/data-sources/sales_order_item/items',
          params as Record<string, QueryParamValue> | undefined,
        ),

      /** Get record */
      get: (
        recordId: string,
        params?: { columns?: Array<string> },
      ): Promise<BaseCrmSalesOrderItemEntity> =>
        client!.get(
          '/v1/apps/base_crm/data-sources/sales_order_item/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          params,
        ),

      /** Create record */
      create: (
        data: Record<string, any>,
      ): Promise<BaseCrmSalesOrderItemEntity> =>
        client!.post(
          '/v1/apps/base_crm/data-sources/sales_order_item/items',
          data,
        ),

      /** Update record */
      update: (
        recordId: string,
        data: Record<string, any>,
      ): Promise<BaseCrmSalesOrderItemEntity> =>
        client!.patch(
          '/v1/apps/base_crm/data-sources/sales_order_item/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          data,
        ),

      /** Delete record */
      delete: (recordId: string): Promise<void> =>
        client!.delete(
          '/v1/apps/base_crm/data-sources/sales_order_item/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
        ),

      /** Delete many records */
      deleteMany: (data: { recordIds: Array<string> }): Promise<void> =>
        client!.delete(
          '/v1/apps/base_crm/data-sources/sales_order_item/items',
          data,
        ),
    }),
    [client],
  )
}
