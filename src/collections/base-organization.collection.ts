// Generated collection for base/organization
import { useMemo } from 'react'
import { useDocyrusClient } from '@docyrus/signin'
import type { QueryParamValue } from '@docyrus/api-client'
import type { ICollectionListParams } from './types'

export interface BaseOrganizationEntity {
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

  /** City */
  city?: string

  /** Tax Area */
  tax_area?: string

  /** Type */
  type?: { id: string; name: string } | any

  /** Website */
  website?: string

  /** Phone */
  phone?: string

  /** Name */
  name: string

  /** Tax Code */
  tax_number?: string

  /** Industry */
  industry?: { id: string; name: string } | any

  /** Email */
  email?: string

  /** District */
  district?: string

  /** Address */
  address?: string

  /** Map Location */
  map_location?: Record<string, any>

  /** Country */
  country?: { id: string; name: string } | string

  /** Source Lead */
  source_lead?: { id: string; name: string } | string

  /** Status */
  status?: { id: string; name: string } | any

  /** Company Logo */
  company_logo?: Record<string, any>

  /** Company Size */
  company_size?: { id: string; name: string } | any
}

export function useBaseOrganizationCollection() {
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
      ): Promise<Array<BaseOrganizationEntity>> =>
        client!.get(
          '/v1/apps/base/data-sources/organization/items',
          params as Record<string, QueryParamValue> | undefined,
        ),

      /** Get record */
      get: (
        recordId: string,
        params?: { columns?: Array<string> },
      ): Promise<BaseOrganizationEntity> =>
        client!.get(
          '/v1/apps/base/data-sources/organization/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          params,
        ),

      /** Create record */
      create: (data: Record<string, any>): Promise<BaseOrganizationEntity> =>
        client!.post('/v1/apps/base/data-sources/organization/items', data),

      /** Update record */
      update: (
        recordId: string,
        data: Record<string, any>,
      ): Promise<BaseOrganizationEntity> =>
        client!.patch(
          '/v1/apps/base/data-sources/organization/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          data,
        ),

      /** Delete record */
      delete: (recordId: string): Promise<void> =>
        client!.delete(
          '/v1/apps/base/data-sources/organization/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
        ),

      /** Delete many records */
      deleteMany: (data: { recordIds: Array<string> }): Promise<void> =>
        client!.delete('/v1/apps/base/data-sources/organization/items', data),
    }),
    [client],
  )
}
