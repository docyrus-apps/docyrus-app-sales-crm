// Generated collection for custom/evds_fx_rate_snapshot
import { useMemo } from 'react'
import { useDocyrusClient } from '@docyrus/signin'
import type { QueryParamValue } from '@docyrus/api-client'
import type { ICollectionListParams } from './types'

export interface CustomEvdsFxRateSnapshotEntity {
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

  /** Currency */
  currency: { id: string; name: string } | string

  /** Rate Date */
  rate_date: string

  /** Buying Rate (TRY) */
  buying_rate?: number

  /** Selling Rate (TRY) */
  selling_rate?: number

  /** Spread */
  spread?: string

  /** Mid Rate */
  mid_rate?: string

  /** EVDS Series */
  evds_series?: string

  /** Fetch Status */
  fetch_status?: { id: string; name: string } | any
}

export function useCustomEvdsFxRateSnapshotCollection() {
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
      ): Promise<Array<CustomEvdsFxRateSnapshotEntity>> =>
        client!.get(
          '/v1/apps/custom/data-sources/evds_fx_rate_snapshot/items',
          params as Record<string, QueryParamValue> | undefined,
        ),

      /** Get record */
      get: (
        recordId: string,
        params?: { columns?: Array<string> },
      ): Promise<CustomEvdsFxRateSnapshotEntity> =>
        client!.get(
          '/v1/apps/custom/data-sources/evds_fx_rate_snapshot/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          params,
        ),

      /** Create record */
      create: (
        data: Record<string, any>,
      ): Promise<CustomEvdsFxRateSnapshotEntity> =>
        client!.post(
          '/v1/apps/custom/data-sources/evds_fx_rate_snapshot/items',
          data,
        ),

      /** Update record */
      update: (
        recordId: string,
        data: Record<string, any>,
      ): Promise<CustomEvdsFxRateSnapshotEntity> =>
        client!.patch(
          '/v1/apps/custom/data-sources/evds_fx_rate_snapshot/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          data,
        ),

      /** Delete record */
      delete: (recordId: string): Promise<void> =>
        client!.delete(
          '/v1/apps/custom/data-sources/evds_fx_rate_snapshot/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
        ),

      /** Delete many records */
      deleteMany: (data: { recordIds: Array<string> }): Promise<void> =>
        client!.delete(
          '/v1/apps/custom/data-sources/evds_fx_rate_snapshot/items',
          data,
        ),
    }),
    [client],
  )
}
