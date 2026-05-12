// Generated collection for base_callcenter/agent_telephony_profile
import { useMemo } from 'react'
import { useDocyrusClient } from '@docyrus/signin'
import type { QueryParamValue } from '@docyrus/api-client'
import type { ICollectionListParams } from './types'

export interface BaseCallcenterAgentTelephonyProfileEntity {
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

  /** User */
  user: { id: string; name: string } | string

  /** Enabled */
  enabled?: boolean

  /** Extension */
  extension: string

  /** PBX User ID */
  pbx_user_id?: string

  /** Preferred Device */
  preferred_device?: { id: string; name: string } | any

  /** WebRTC Enabled */
  webrtc_enabled?: boolean

  /** Click-to-Call Enabled */
  click_to_call_enabled?: boolean

  /** Extension Verified */
  extension_verified?: boolean

  /** Current State */
  current_state?: { id: string; name: string } | any

  /** State Changed At */
  state_changed_at?: string

  /** State Changed By */
  state_changed_by?: { id: string; name: string } | any

  /** Campaign Ready */
  campaign_ready?: boolean
}

export function useBaseCallcenterAgentTelephonyProfileCollection() {
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
      ): Promise<Array<BaseCallcenterAgentTelephonyProfileEntity>> =>
        client!.get(
          '/v1/apps/base_callcenter/data-sources/agent_telephony_profile/items',
          params as Record<string, QueryParamValue> | undefined,
        ),

      /** Get record */
      get: (
        recordId: string,
        params?: { columns?: Array<string> },
      ): Promise<BaseCallcenterAgentTelephonyProfileEntity> =>
        client!.get(
          '/v1/apps/base_callcenter/data-sources/agent_telephony_profile/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          params,
        ),

      /** Create record */
      create: (
        data: Record<string, any>,
      ): Promise<BaseCallcenterAgentTelephonyProfileEntity> =>
        client!.post(
          '/v1/apps/base_callcenter/data-sources/agent_telephony_profile/items',
          data,
        ),

      /** Update record */
      update: (
        recordId: string,
        data: Record<string, any>,
      ): Promise<BaseCallcenterAgentTelephonyProfileEntity> =>
        client!.patch(
          '/v1/apps/base_callcenter/data-sources/agent_telephony_profile/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          data,
        ),

      /** Delete record */
      delete: (recordId: string): Promise<void> =>
        client!.delete(
          '/v1/apps/base_callcenter/data-sources/agent_telephony_profile/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
        ),

      /** Delete many records */
      deleteMany: (data: { recordIds: Array<string> }): Promise<void> =>
        client!.delete(
          '/v1/apps/base_callcenter/data-sources/agent_telephony_profile/items',
          data,
        ),
    }),
    [client],
  )
}
