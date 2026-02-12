// Generated collection for base_crm/sales_order_item
import { apiClient } from '../lib/api'
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

  /** Category */
  category: { id: string; name: string } | string

  /** Product */
  product?: { id: string; name: string } | string

  /** Tax Rate */
  tax_rate?: number

  /** Related Sales Order */
  related_sales_order: { id: string; name: string } | string
}

export const base_crmSalesOrderItemCollection = {
  /** List records with optional filtering, sorting, and pagination. */
  list: (
    params?: ICollectionListParams,
  ): Promise<Array<BaseCrmSalesOrderItemEntity>> =>
    apiClient.get(
      '/v1/apps/base_crm/data-sources/sales_order_item/items',
      params as Record<string, QueryParamValue> | undefined,
    ),

  /** Get record */
  get: (
    recordId: string,
    params?: { columns?: Array<string> },
  ): Promise<BaseCrmSalesOrderItemEntity> =>
    apiClient.get(
      '/v1/apps/base_crm/data-sources/sales_order_item/items/{recordId}'.replace(
        '{recordId}',
        recordId,
      ),
      params,
    ),

  /** Create record */
  create: (data: { data: any }): Promise<BaseCrmSalesOrderItemEntity> =>
    apiClient.post(
      '/v1/apps/base_crm/data-sources/sales_order_item/items',
      data,
    ),

  /** Update record */
  update: (
    recordId: string,
    data: { data: any },
  ): Promise<BaseCrmSalesOrderItemEntity> =>
    apiClient.patch(
      '/v1/apps/base_crm/data-sources/sales_order_item/items/{recordId}'.replace(
        '{recordId}',
        recordId,
      ),
      data,
    ),

  /** Delete record */
  delete: (recordId: string): Promise<void> =>
    apiClient.delete(
      '/v1/apps/base_crm/data-sources/sales_order_item/items/{recordId}'.replace(
        '{recordId}',
        recordId,
      ),
    ),

  /** Delete many records */
  deleteMany: (data: { recordIds: Array<string> }): Promise<void> =>
    apiClient.delete(
      '/v1/apps/base_crm/data-sources/sales_order_item/items',
      data,
    ),
}
