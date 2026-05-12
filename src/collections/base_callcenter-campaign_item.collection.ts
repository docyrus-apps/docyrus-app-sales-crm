// Generated collection for base_callcenter/campaign_item
import { useMemo } from 'react'
import { useDocyrusClient } from '@docyrus/signin'
import type { QueryParamValue } from '@docyrus/api-client'
import type { ICollectionListParams } from './types'

export interface BaseCallcenterCampaignItemEntity {
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

  /** Campaign */
  campaign: { id: string; name: string } | string

  /** Contact */
  contact?: { id: string; name: string } | string

  /** Lead */
  lead?: { id: string; name: string } | string

  /** Phone Number */
  phone_number?: string

  /** Priority */
  priority?: number

  /** State */
  state?: { id: string; name: string } | any

  /** Sub State (Legacy Text) */
  sub_state_text?: string

  /** Attempts Count */
  attempts_count?: number

  /** Last Attempt At */
  last_attempt_at?: string

  /** Last Outcome */
  last_outcome?: { id: string; name: string } | any

  /** Last Call */
  last_call?: { id: string; name: string } | string

  /** Next Action At */
  next_action_at?: string

  /** Next Action Type */
  next_action_type?: { id: string; name: string } | any

  /** Assigned Agent */
  assigned_agent?: { id: string; name: string } | string

  /** Final Disposition */
  final_disposition?: { id: string; name: string } | any

  /** Custom Data */
  custom_data?: string

  /** Sub State */
  sub_state?: { id: string; name: string } | any
}

export function useBaseCallcenterCampaignItemCollection() {
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
      ): Promise<Array<BaseCallcenterCampaignItemEntity>> =>
        client!.get(
          '/v1/apps/base_callcenter/data-sources/campaign_item/items',
          params as Record<string, QueryParamValue> | undefined,
        ),

      /** Get record */
      get: (
        recordId: string,
        params?: { columns?: Array<string> },
      ): Promise<BaseCallcenterCampaignItemEntity> =>
        client!.get(
          '/v1/apps/base_callcenter/data-sources/campaign_item/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          params,
        ),

      /** Create record */
      create: (
        data: Record<string, any>,
      ): Promise<BaseCallcenterCampaignItemEntity> =>
        client!.post(
          '/v1/apps/base_callcenter/data-sources/campaign_item/items',
          data,
        ),

      /** Update record */
      update: (
        recordId: string,
        data: Record<string, any>,
      ): Promise<BaseCallcenterCampaignItemEntity> =>
        client!.patch(
          '/v1/apps/base_callcenter/data-sources/campaign_item/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          data,
        ),

      /** Delete record */
      delete: (recordId: string): Promise<void> =>
        client!.delete(
          '/v1/apps/base_callcenter/data-sources/campaign_item/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
        ),

      /** Delete many records */
      deleteMany: (data: { recordIds: Array<string> }): Promise<void> =>
        client!.delete(
          '/v1/apps/base_callcenter/data-sources/campaign_item/items',
          data,
        ),
    }),
    [client],
  )
}
