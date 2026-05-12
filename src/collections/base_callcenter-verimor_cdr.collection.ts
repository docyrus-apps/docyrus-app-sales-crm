// Generated collection for base_callcenter/verimor_cdr
import { useMemo } from 'react'
import { useDocyrusClient } from '@docyrus/signin'
import type { QueryParamValue } from '@docyrus/api-client'
import type { ICollectionListParams } from './types'

export interface BaseCallcenterVerimorCdrEntity {
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

  /** CDR ID */
  cdr_id?: string

  /** Call ID */
  call_id?: string

  /** Direction */
  direction?: string

  /** From Number */
  from_number?: string

  /** To Number */
  to_number?: string

  /** Extension */
  extension?: string

  /** Queue Name */
  queue_name?: string

  /** Started At */
  started_at?: string

  /** Answered At */
  answered_at?: string

  /** Ended At */
  ended_at?: string

  /** Duration Seconds */
  duration_seconds?: number

  /** Billsec Seconds */
  billsec_seconds?: number

  /** Hangup Cause */
  hangup_cause?: string

  /** Recording URL */
  recording_url?: string

  /** Raw Payload */
  raw_payload?: string
}

export function useBaseCallcenterVerimorCdrCollection() {
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
      ): Promise<Array<BaseCallcenterVerimorCdrEntity>> =>
        client!.get(
          '/v1/apps/base_callcenter/data-sources/verimor_cdr/items',
          params as Record<string, QueryParamValue> | undefined,
        ),

      /** Get record */
      get: (
        recordId: string,
        params?: { columns?: Array<string> },
      ): Promise<BaseCallcenterVerimorCdrEntity> =>
        client!.get(
          '/v1/apps/base_callcenter/data-sources/verimor_cdr/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          params,
        ),

      /** Create record */
      create: (
        data: Record<string, any>,
      ): Promise<BaseCallcenterVerimorCdrEntity> =>
        client!.post(
          '/v1/apps/base_callcenter/data-sources/verimor_cdr/items',
          data,
        ),

      /** Update record */
      update: (
        recordId: string,
        data: Record<string, any>,
      ): Promise<BaseCallcenterVerimorCdrEntity> =>
        client!.patch(
          '/v1/apps/base_callcenter/data-sources/verimor_cdr/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          data,
        ),

      /** Delete record */
      delete: (recordId: string): Promise<void> =>
        client!.delete(
          '/v1/apps/base_callcenter/data-sources/verimor_cdr/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
        ),

      /** Delete many records */
      deleteMany: (data: { recordIds: Array<string> }): Promise<void> =>
        client!.delete(
          '/v1/apps/base_callcenter/data-sources/verimor_cdr/items',
          data,
        ),
    }),
    [client],
  )
}
