// Generated collection for base_crm/sales_order
import { apiClient } from '../lib/api'
import type { QueryParamValue } from '@docyrus/api-client'
import type { ICollectionListParams } from './types'

export interface BaseCrmSalesOrderEntity {
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

  /** Sub Total */
  sub_total?: number

  /** Organization */
  organization?: { id: string; name: string } | string

  /** Grand Total */
  grand_total?: number

  /** Status */
  status?: { id: string; name: string } | any

  /** Tax Total */
  tax_total?: number
}

export const base_crmSalesOrderCollection = {
  /** List records with optional filtering, sorting, and pagination. */
  list: (
    params?: ICollectionListParams,
  ): Promise<Array<BaseCrmSalesOrderEntity>> =>
    apiClient.get(
      '/v1/apps/base_crm/data-sources/sales_order/items',
      params as Record<string, QueryParamValue> | undefined,
    ),

  /** Get record */
  get: (
    recordId: string,
    params?: { columns?: Array<string> },
  ): Promise<BaseCrmSalesOrderEntity> =>
    apiClient.get(
      '/v1/apps/base_crm/data-sources/sales_order/items/{recordId}'.replace(
        '{recordId}',
        recordId,
      ),
      params,
    ),

  /** Create record */
  create: (data: { data: any }): Promise<BaseCrmSalesOrderEntity> =>
    apiClient.post('/v1/apps/base_crm/data-sources/sales_order/items', data),

  /** Update record */
  update: (
    recordId: string,
    data: { data: any },
  ): Promise<BaseCrmSalesOrderEntity> =>
    apiClient.patch(
      '/v1/apps/base_crm/data-sources/sales_order/items/{recordId}'.replace(
        '{recordId}',
        recordId,
      ),
      data,
    ),

  /** Delete record */
  delete: (recordId: string): Promise<void> =>
    apiClient.delete(
      '/v1/apps/base_crm/data-sources/sales_order/items/{recordId}'.replace(
        '{recordId}',
        recordId,
      ),
    ),

  /** Delete many records */
  deleteMany: (data: { recordIds: Array<string> }): Promise<void> =>
    apiClient.delete('/v1/apps/base_crm/data-sources/sales_order/items', data),
}
