// Generated collection for base_crm/deal_product
import { useDocyrusClient } from '@docyrus/signin'
import type { QueryParamValue } from '@docyrus/api-client'
import type { ICollectionListParams } from './types'

export interface BaseCrmDealProductEntity {
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

  /** Category */
  category: { id: string; name: string } | string

  /** QTY */
  qty: number

  /** Discount */
  discount?: number

  /** Tax Rate */
  tax_rate?: number

  /** Unit Price */
  unit_price: number

  /** Total */
  total?: number

  /** Gross Total */
  gross_total?: number

  /** Net Total */
  net_total?: number

  /** Related Deal */
  related_deal: { id: string; name: string } | string

  /** Product */
  product: { id: string; name: string } | string
}

export function useBaseCrmDealProductCollection() {
  const client = useDocyrusClient()

  return {
    /** List records with optional filtering, sorting, and pagination. */
    list: (
      params?: ICollectionListParams,
    ): Promise<Array<BaseCrmDealProductEntity>> =>
      client!.get(
        '/v1/apps/base_crm/data-sources/deal_product/items',
        params as Record<string, QueryParamValue> | undefined,
      ),

    /** Get record */
    get: (
      recordId: string,
      params?: { columns?: Array<string> },
    ): Promise<BaseCrmDealProductEntity> =>
      client!.get(
        '/v1/apps/base_crm/data-sources/deal_product/items/{recordId}'.replace(
          '{recordId}',
          recordId,
        ),
        params,
      ),

    /** Create record */
    create: (data: Record<string, any>): Promise<BaseCrmDealProductEntity> =>
      client!.post('/v1/apps/base_crm/data-sources/deal_product/items', data),

    /** Update record */
    update: (
      recordId: string,
      data: Record<string, any>,
    ): Promise<BaseCrmDealProductEntity> =>
      client!.patch(
        '/v1/apps/base_crm/data-sources/deal_product/items/{recordId}'.replace(
          '{recordId}',
          recordId,
        ),
        data,
      ),

    /** Delete record */
    delete: (recordId: string): Promise<void> =>
      client!.delete(
        '/v1/apps/base_crm/data-sources/deal_product/items/{recordId}'.replace(
          '{recordId}',
          recordId,
        ),
      ),

    /** Delete many records */
    deleteMany: (data: { recordIds: Array<string> }): Promise<void> =>
      client!.delete('/v1/apps/base_crm/data-sources/deal_product/items', data),
  }
}
