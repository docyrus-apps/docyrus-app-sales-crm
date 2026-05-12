// Generated collection for custom/evds_sync_log
import { useMemo } from 'react'
import { useDocyrusClient } from '@docyrus/signin'
import type { QueryParamValue } from '@docyrus/api-client'
import type { ICollectionListParams } from './types'

export interface CustomEvdsSyncLogEntity {
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

  /** Sync Date */
  sync_date: string

  /** Triggered By */
  triggered_by?: { id: string; name: string } | any

  /** Status */
  status?: { id: string; name: string } | any

  /** Series Synced */
  series_synced?: number

  /** Records Created */
  records_created?: number

  /** Records Updated */
  records_updated?: number

  /** Duration (seconds) */
  duration_seconds?: number

  /** Error Details */
  error_details?: string

  /** EVDS Date Range Start */
  date_range_start?: string

  /** EVDS Date Range End */
  date_range_end?: string
}

export function useCustomEvdsSyncLogCollection() {
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
      ): Promise<Array<CustomEvdsSyncLogEntity>> =>
        client!.get(
          '/v1/apps/custom/data-sources/evds_sync_log/items',
          params as Record<string, QueryParamValue> | undefined,
        ),

      /** Get record */
      get: (
        recordId: string,
        params?: { columns?: Array<string> },
      ): Promise<CustomEvdsSyncLogEntity> =>
        client!.get(
          '/v1/apps/custom/data-sources/evds_sync_log/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          params,
        ),

      /** Create record */
      create: (data: Record<string, any>): Promise<CustomEvdsSyncLogEntity> =>
        client!.post('/v1/apps/custom/data-sources/evds_sync_log/items', data),

      /** Update record */
      update: (
        recordId: string,
        data: Record<string, any>,
      ): Promise<CustomEvdsSyncLogEntity> =>
        client!.patch(
          '/v1/apps/custom/data-sources/evds_sync_log/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          data,
        ),

      /** Delete record */
      delete: (recordId: string): Promise<void> =>
        client!.delete(
          '/v1/apps/custom/data-sources/evds_sync_log/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
        ),

      /** Delete many records */
      deleteMany: (data: { recordIds: Array<string> }): Promise<void> =>
        client!.delete(
          '/v1/apps/custom/data-sources/evds_sync_log/items',
          data,
        ),
    }),
    [client],
  )
}
