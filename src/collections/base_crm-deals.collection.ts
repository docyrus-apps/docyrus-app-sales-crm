// Generated collection for base_crm/deal
import { useDocyrusClient } from '@docyrus/signin'
import type { QueryParamValue } from '@docyrus/api-client'
import type { ICollectionListParams } from './types'

export interface BaseCrmDealsEntity {
  /** ID */
  id?: string

  /** Name */
  name?: string

  /** Auto Number */
  autonumber_id?: string | number

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

  /** Expected Revenue */
  expected_revenue?: number

  /** Expected Closing Date */
  expected_closing_date?: string

  /** Hot Prospect */
  hot_prospect?: boolean

  /** Follow Up On */
  follow_up_on?: string

  /** Close Probability */
  close_probability?: number

  /** Closed Date */
  closed_date?: string

  /** Followers */
  followers?: { id: string; name: string } | Array<string>

  /** Stage */
  stage?: { id: string; name: string } | any

  /** Customer Type */
  customer_type?: { id: string; name: string } | any

  /** Lead Source */
  lead_source?: { id: string; name: string } | any

  /** Reason for Lost */
  reason_for_lost?: { id: string; name: string } | any

  /** Deal Value */
  deal_value?: number

  /** Country */
  country?: { id: string; name: string } | string

  /** Organization */
  organization?:
    | {
        id?: string
        name?: string
        phone?: string
        email?: string
        website?: string
        company_logo?: { signed_url?: string | null } | null
      }
    | string

  /** Contact Person */
  contact_person?: { id: string; name: string } | string
}

export function useBaseCrmDealsCollection() {
  const client = useDocyrusClient()

  return {
    /** List records with optional filtering, sorting, and pagination. */
    list: (
      params?: ICollectionListParams,
    ): Promise<Array<BaseCrmDealsEntity>> =>
      client!.get(
        '/v1/apps/base_crm/data-sources/deal/items',
        params as Record<string, QueryParamValue> | undefined,
      ),

    /** Get record */
    get: (
      recordId: string,
      params?: { columns?: Array<string> },
    ): Promise<BaseCrmDealsEntity> =>
      client!.get(
        '/v1/apps/base_crm/data-sources/deal/items/{recordId}'.replace(
          '{recordId}',
          recordId,
        ),
        params,
      ),

    /** Create record */
    create: (data: Record<string, any>): Promise<BaseCrmDealsEntity> =>
      client!.post('/v1/apps/base_crm/data-sources/deal/items', data),

    /** Update record */
    update: (
      recordId: string,
      data: Record<string, any>,
    ): Promise<BaseCrmDealsEntity> =>
      client!.patch(
        '/v1/apps/base_crm/data-sources/deal/items/{recordId}'.replace(
          '{recordId}',
          recordId,
        ),
        data,
      ),

    /** Delete record */
    delete: (recordId: string): Promise<void> =>
      client!.delete(
        '/v1/apps/base_crm/data-sources/deal/items/{recordId}'.replace(
          '{recordId}',
          recordId,
        ),
      ),

    /** Delete many records */
    deleteMany: (data: { recordIds: Array<string> }): Promise<void> =>
      client!.delete('/v1/apps/base_crm/data-sources/deal/items', data),
  }
}
