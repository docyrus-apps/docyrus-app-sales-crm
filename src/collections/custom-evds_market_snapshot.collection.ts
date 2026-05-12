// Generated collection for custom/evds_market_snapshot
import { useMemo } from 'react'
import { useDocyrusClient } from '@docyrus/signin'
import type { QueryParamValue } from '@docyrus/api-client'
import type { ICollectionListParams } from './types'

export interface CustomEvdsMarketSnapshotEntity {
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

  /** Snapshot Date */
  snapshot_date: string

  /** USD/TRY (Buying) */
  usd_buying?: number

  /** USD/TRY (Selling) */
  usd_selling?: number

  /** EUR/TRY (Buying) */
  eur_buying?: number

  /** GBP/TRY (Buying) */
  gbp_buying?: number

  /** USD Change % */
  usd_change_pct?: number

  /** Gold Price (TRY/gram) */
  gold_try?: number

  /** Gold Price (USD/oz) */
  gold_usd?: number

  /** CBRT Policy Rate % */
  policy_rate?: number

  /** CPI Inflation (YoY %) */
  cpi_yoy?: number

  /** BIST 100 */
  bist_100?: number

  /** BIST Change % */
  bist_change_pct?: number

  /** Consumer Confidence */
  consumer_confidence?: number

  /** Real Interest Rate % */
  real_interest_rate?: string

  /** Data Quality */
  data_quality?: { id: string; name: string } | any
}

export function useCustomEvdsMarketSnapshotCollection() {
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
      ): Promise<Array<CustomEvdsMarketSnapshotEntity>> =>
        client!.get(
          '/v1/apps/custom/data-sources/evds_market_snapshot/items',
          params as Record<string, QueryParamValue> | undefined,
        ),

      /** Get record */
      get: (
        recordId: string,
        params?: { columns?: Array<string> },
      ): Promise<CustomEvdsMarketSnapshotEntity> =>
        client!.get(
          '/v1/apps/custom/data-sources/evds_market_snapshot/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          params,
        ),

      /** Create record */
      create: (
        data: Record<string, any>,
      ): Promise<CustomEvdsMarketSnapshotEntity> =>
        client!.post(
          '/v1/apps/custom/data-sources/evds_market_snapshot/items',
          data,
        ),

      /** Update record */
      update: (
        recordId: string,
        data: Record<string, any>,
      ): Promise<CustomEvdsMarketSnapshotEntity> =>
        client!.patch(
          '/v1/apps/custom/data-sources/evds_market_snapshot/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          data,
        ),

      /** Delete record */
      delete: (recordId: string): Promise<void> =>
        client!.delete(
          '/v1/apps/custom/data-sources/evds_market_snapshot/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
        ),

      /** Delete many records */
      deleteMany: (data: { recordIds: Array<string> }): Promise<void> =>
        client!.delete(
          '/v1/apps/custom/data-sources/evds_market_snapshot/items',
          data,
        ),
    }),
    [client],
  )
}
