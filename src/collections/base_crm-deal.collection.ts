// Generated collection for base_crm/deal
import { useMemo } from 'react'
import { useDocyrusClient } from '@docyrus/signin'
import type { QueryParamValue } from '@docyrus/api-client'
import type { ICollectionListParams } from './types'

export interface BaseCrmDealEntity {
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

  /** Expected Revenue */
  expected_revenue?: number

  /** Expected Closing Date */
  expected_closing_date?: string

  /** Customer Type */
  customer_type?: { id: string; name: string } | any

  /** Deal Value */
  deal_value?: number

  /** Contact Person */
  contact_person?: { id: string; name: string } | string

  /** Hot Prospect */
  hot_prospect?: boolean

  /** Closed Date */
  closed_date?: string

  /** Followers */
  followers?: { id: string; name: string } | Array<string>

  /** Organization */
  organization?: { id: string; name: string } | string

  /** Stage */
  stage?: { id: string; name: string } | any

  /** Lead Source */
  lead_source?: { id: string; name: string } | any

  /** Follow Up On */
  follow_up_on?: string

  /** Source Lead */
  source_lead?: { id: string; name: string } | string

  /** Close Probability */
  close_probability?: number

  /** Reason for Lost */
  reason_for_lost?: { id: string; name: string } | any

  /** Country */
  country?: { id: string; name: string } | string

  /** Qualification Notes */
  qualification_notes?: string
}

export function useBaseCrmDealCollection() {
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
      ): Promise<Array<BaseCrmDealEntity>> =>
        client!.get(
          '/v1/apps/base_crm/data-sources/deal/items',
          params as Record<string, QueryParamValue> | undefined,
        ),

      /** Get record */
      get: (
        recordId: string,
        params?: { columns?: Array<string> },
      ): Promise<BaseCrmDealEntity> =>
        client!.get(
          '/v1/apps/base_crm/data-sources/deal/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          params,
        ),

      /** Create record */
      create: (data: Record<string, any>): Promise<BaseCrmDealEntity> =>
        client!.post('/v1/apps/base_crm/data-sources/deal/items', data),

      /** Update record */
      update: (
        recordId: string,
        data: Record<string, any>,
      ): Promise<BaseCrmDealEntity> =>
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
    }),
    [client],
  )
}
