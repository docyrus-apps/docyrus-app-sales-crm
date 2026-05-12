// Generated collection for verimor/call_detail_records_list
import { useMemo } from 'react'
import { useDocyrusClient } from '@docyrus/signin'
import type { QueryParamValue } from '@docyrus/api-client'
import type { ICollectionListParams } from './types'

export interface VerimorCallDetailRecordsListEntity {
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

  /** Direction */
  direction?: string

  /** Caller Number */
  caller_id_number?: string

  /** Destination Number */
  destination_number?: string

  /** Duration */
  duration?: string

  /** Talk Duration */
  talk_duration?: string

  /** Queue Wait Seconds */
  queue_wait_seconds?: string

  /** Result */
  result?: string

  /** Missed */
  missed?: boolean

  /** Recording Present */
  recording_present?: string

  /** Sip Hangup Disposition */
  sip_hangup_disposition?: string

  /** Answer Stamp */
  answer_stamp?: string

  /** Start Stamp */
  start_stamp?: string

  /** End Stamp */
  end_stamp?: string
}

export function useVerimorCallDetailRecordsListCollection() {
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
      ): Promise<Array<VerimorCallDetailRecordsListEntity>> =>
        client!.get(
          '/v1/apps/verimor/data-sources/call_detail_records_list/items',
          params as Record<string, QueryParamValue> | undefined,
        ),

      /** Get record */
      get: (
        recordId: string,
        params?: { columns?: Array<string> },
      ): Promise<VerimorCallDetailRecordsListEntity> =>
        client!.get(
          '/v1/apps/verimor/data-sources/call_detail_records_list/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          params,
        ),

      /** Create record */
      create: (
        data: Record<string, any>,
      ): Promise<VerimorCallDetailRecordsListEntity> =>
        client!.post(
          '/v1/apps/verimor/data-sources/call_detail_records_list/items',
          data,
        ),

      /** Update record */
      update: (
        recordId: string,
        data: Record<string, any>,
      ): Promise<VerimorCallDetailRecordsListEntity> =>
        client!.patch(
          '/v1/apps/verimor/data-sources/call_detail_records_list/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          data,
        ),

      /** Delete record */
      delete: (recordId: string): Promise<void> =>
        client!.delete(
          '/v1/apps/verimor/data-sources/call_detail_records_list/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
        ),

      /** Delete many records */
      deleteMany: (data: { recordIds: Array<string> }): Promise<void> =>
        client!.delete(
          '/v1/apps/verimor/data-sources/call_detail_records_list/items',
          data,
        ),
    }),
    [client],
  )
}
