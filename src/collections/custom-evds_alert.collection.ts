// Generated collection for custom/evds_alert
import { useMemo } from 'react'
import { useDocyrusClient } from '@docyrus/signin'
import type { QueryParamValue } from '@docyrus/api-client'
import type { ICollectionListParams } from './types'

export interface CustomEvdsAlertEntity {
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

  /** Alert Name */
  alert_name: string

  /** Series */
  series: { id: string; name: string } | string

  /** Condition */
  condition: { id: string; name: string } | any

  /** Threshold Value */
  threshold_value?: number

  /** Notify User */
  notify_user?: { id: string; name: string } | string

  /** Is Active */
  is_active?: boolean

  /** Last Triggered */
  last_triggered?: string

  /** Trigger Count */
  trigger_count?: number
}

export function useCustomEvdsAlertCollection() {
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
      ): Promise<Array<CustomEvdsAlertEntity>> =>
        client!.get(
          '/v1/apps/custom/data-sources/evds_alert/items',
          params as Record<string, QueryParamValue> | undefined,
        ),

      /** Get record */
      get: (
        recordId: string,
        params?: { columns?: Array<string> },
      ): Promise<CustomEvdsAlertEntity> =>
        client!.get(
          '/v1/apps/custom/data-sources/evds_alert/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          params,
        ),

      /** Create record */
      create: (data: Record<string, any>): Promise<CustomEvdsAlertEntity> =>
        client!.post('/v1/apps/custom/data-sources/evds_alert/items', data),

      /** Update record */
      update: (
        recordId: string,
        data: Record<string, any>,
      ): Promise<CustomEvdsAlertEntity> =>
        client!.patch(
          '/v1/apps/custom/data-sources/evds_alert/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          data,
        ),

      /** Delete record */
      delete: (recordId: string): Promise<void> =>
        client!.delete(
          '/v1/apps/custom/data-sources/evds_alert/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
        ),

      /** Delete many records */
      deleteMany: (data: { recordIds: Array<string> }): Promise<void> =>
        client!.delete('/v1/apps/custom/data-sources/evds_alert/items', data),
    }),
    [client],
  )
}
