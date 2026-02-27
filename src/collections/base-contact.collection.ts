// Generated collection for base/contact
import { useDocyrusClient } from '@docyrus/signin'
import type { QueryParamValue } from '@docyrus/api-client'
import type { ICollectionListParams } from './types'

export interface BaseContactEntity {
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

  /** Name */
  name?: string

  /** Job Title */
  job_title?: string

  /** Email */
  email?: string

  /** Mobile */
  mobile?: string

  /** Organization */
  organization?: { id: string; name: string } | string
}

export function useBaseContactCollection() {
  const client = useDocyrusClient()

  return {
    /** List records with optional filtering, sorting, and pagination. */
    list: (params?: ICollectionListParams): Promise<Array<BaseContactEntity>> =>
      client!.get(
        '/v1/apps/base/data-sources/contact/items',
        params as Record<string, QueryParamValue> | undefined,
      ),

    /** Get record */
    get: (
      recordId: string,
      params?: { columns?: Array<string> },
    ): Promise<BaseContactEntity> =>
      client!.get(
        '/v1/apps/base/data-sources/contact/items/{recordId}'.replace(
          '{recordId}',
          recordId,
        ),
        params,
      ),

    /** Create record */
    create: (data: Record<string, any>): Promise<BaseContactEntity> =>
      client!.post('/v1/apps/base/data-sources/contact/items', data),

    /** Update record */
    update: (
      recordId: string,
      data: Record<string, any>,
    ): Promise<BaseContactEntity> =>
      client!.patch(
        '/v1/apps/base/data-sources/contact/items/{recordId}'.replace(
          '{recordId}',
          recordId,
        ),
        data,
      ),

    /** Delete record */
    delete: (recordId: string): Promise<void> =>
      client!.delete(
        '/v1/apps/base/data-sources/contact/items/{recordId}'.replace(
          '{recordId}',
          recordId,
        ),
      ),

    /** Delete many records */
    deleteMany: (data: { recordIds: Array<string> }): Promise<void> =>
      client!.delete('/v1/apps/base/data-sources/contact/items', data),
  }
}
