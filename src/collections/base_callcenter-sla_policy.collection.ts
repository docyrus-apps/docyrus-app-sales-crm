// Generated collection for base_callcenter/sla_policy
import { useMemo } from 'react'
import { useDocyrusClient } from '@docyrus/signin'
import type { QueryParamValue } from '@docyrus/api-client'
import type { ICollectionListParams } from './types'

export interface BaseCallcenterSlaPolicyEntity {
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

  /** Policy Name */
  policy_name?: string

  /** Description */
  policy_description?: string

  /** Active */
  is_active?: boolean

  /** Default */
  is_default?: boolean

  /** Applies To */
  applies_to?: { id: string; name: string } | any

  /** Effective From */
  effective_from?: string

  /** Effective To */
  effective_to?: string

  /** Timezone */
  timezone?: string

  /** Business Hours Mode */
  business_hours_mode?: { id: string; name: string } | any

  /** Business Hours Definition */
  business_hours_definition?: string
}

export function useBaseCallcenterSlaPolicyCollection() {
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
      ): Promise<Array<BaseCallcenterSlaPolicyEntity>> =>
        client!.get(
          '/v1/apps/base_callcenter/data-sources/sla_policy/items',
          params as Record<string, QueryParamValue> | undefined,
        ),

      /** Get record */
      get: (
        recordId: string,
        params?: { columns?: Array<string> },
      ): Promise<BaseCallcenterSlaPolicyEntity> =>
        client!.get(
          '/v1/apps/base_callcenter/data-sources/sla_policy/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          params,
        ),

      /** Create record */
      create: (
        data: Record<string, any>,
      ): Promise<BaseCallcenterSlaPolicyEntity> =>
        client!.post(
          '/v1/apps/base_callcenter/data-sources/sla_policy/items',
          data,
        ),

      /** Update record */
      update: (
        recordId: string,
        data: Record<string, any>,
      ): Promise<BaseCallcenterSlaPolicyEntity> =>
        client!.patch(
          '/v1/apps/base_callcenter/data-sources/sla_policy/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          data,
        ),

      /** Delete record */
      delete: (recordId: string): Promise<void> =>
        client!.delete(
          '/v1/apps/base_callcenter/data-sources/sla_policy/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
        ),

      /** Delete many records */
      deleteMany: (data: { recordIds: Array<string> }): Promise<void> =>
        client!.delete(
          '/v1/apps/base_callcenter/data-sources/sla_policy/items',
          data,
        ),
    }),
    [client],
  )
}
