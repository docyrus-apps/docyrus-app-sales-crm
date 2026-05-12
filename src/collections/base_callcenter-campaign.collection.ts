// Generated collection for base_callcenter/campaign
import { useMemo } from 'react'
import { useDocyrusClient } from '@docyrus/signin'
import type { QueryParamValue } from '@docyrus/api-client'
import type { ICollectionListParams } from './types'

export interface BaseCallcenterCampaignEntity {
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

  /** Status */
  status?: { id: string; name: string } | any

  /** Campaign Type */
  campaign_type?: { id: string; name: string } | any

  /** Dialer Mode */
  dialer_mode: { id: string; name: string } | any

  /** Predictive Pacing Factor */
  predictive_pacing_factor?: number

  /** Predictive Max Abandoned Rate */
  predictive_max_abandoned_rate?: number

  /** Source Type */
  source_type?: { id: string; name: string } | any

  /** Filter Definition */
  filter_definition?: string

  /** Total Records */
  total_records?: number

  /** Retry Max Attempts */
  retry_max_attempts?: number

  /** Retry Interval (minutes) */
  retry_interval_minutes?: number

  /** Retry on No Answer */
  retry_on_no_answer?: boolean

  /** Retry on Busy */
  retry_on_busy?: boolean

  /** Retry on Voicemail */
  retry_on_voicemail?: boolean

  /** Dedupe Phone */
  dedupe_phone?: boolean

  /** Dedupe Scope */
  dedupe_scope?: { id: string; name: string } | any

  /** Dedupe Window (days) */
  dedupe_window_days?: number

  /** Working Hours Start */
  working_hours_start?: string

  /** Working Hours End */
  working_hours_end?: string

  /** Working Days */
  working_days?: { id: string; name: string } | any

  /** Timezone */
  timezone?: string

  /** Assigned Agents */
  assigned_agents?: { id: string; name: string } | Array<string>

  /** Started At */
  started_at?: string

  /** Completed At */
  completed_at?: string

  /** Total Attempts */
  total_attempts?: number

  /** Total Reached */
  total_reached?: number

  /** Total Not Reached */
  total_not_reached?: number

  /** Connect Rate (%) */
  connect_rate?: number

  /** Assigned Teams */
  assigned_teams?: { id: string; name: string } | string
}

export function useBaseCallcenterCampaignCollection() {
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
      ): Promise<Array<BaseCallcenterCampaignEntity>> =>
        client!.get(
          '/v1/apps/base_callcenter/data-sources/campaign/items',
          params as Record<string, QueryParamValue> | undefined,
        ),

      /** Get record */
      get: (
        recordId: string,
        params?: { columns?: Array<string> },
      ): Promise<BaseCallcenterCampaignEntity> =>
        client!.get(
          '/v1/apps/base_callcenter/data-sources/campaign/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          params,
        ),

      /** Create record */
      create: (
        data: Record<string, any>,
      ): Promise<BaseCallcenterCampaignEntity> =>
        client!.post(
          '/v1/apps/base_callcenter/data-sources/campaign/items',
          data,
        ),

      /** Update record */
      update: (
        recordId: string,
        data: Record<string, any>,
      ): Promise<BaseCallcenterCampaignEntity> =>
        client!.patch(
          '/v1/apps/base_callcenter/data-sources/campaign/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          data,
        ),

      /** Delete record */
      delete: (recordId: string): Promise<void> =>
        client!.delete(
          '/v1/apps/base_callcenter/data-sources/campaign/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
        ),

      /** Delete many records */
      deleteMany: (data: { recordIds: Array<string> }): Promise<void> =>
        client!.delete(
          '/v1/apps/base_callcenter/data-sources/campaign/items',
          data,
        ),
    }),
    [client],
  )
}
