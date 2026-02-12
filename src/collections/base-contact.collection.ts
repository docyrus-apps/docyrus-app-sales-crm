// Generated collection for base/contact
import { apiClient } from '../lib/api'
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

export const baseContactCollection = {
  /** List records with optional filtering, sorting, and pagination. */
  list: (params?: ICollectionListParams): Promise<Array<BaseContactEntity>> =>
    apiClient.get(
      '/v1/apps/base/data-sources/contact/items',
      params as Record<string, QueryParamValue> | undefined,
    ),

  /** Get record */
  get: (
    recordId: string,
    params?: { columns?: Array<string> },
  ): Promise<BaseContactEntity> =>
    apiClient.get(
      '/v1/apps/base/data-sources/contact/items/{recordId}'.replace(
        '{recordId}',
        recordId,
      ),
      params,
    ),

  /** Create record */
  create: (data: { data: any }): Promise<BaseContactEntity> =>
    apiClient.post('/v1/apps/base/data-sources/contact/items', data),

  /** Update record */
  update: (recordId: string, data: { data: any }): Promise<BaseContactEntity> =>
    apiClient.patch(
      '/v1/apps/base/data-sources/contact/items/{recordId}'.replace(
        '{recordId}',
        recordId,
      ),
      data,
    ),

  /** Delete record */
  delete: (recordId: string): Promise<void> =>
    apiClient.delete(
      '/v1/apps/base/data-sources/contact/items/{recordId}'.replace(
        '{recordId}',
        recordId,
      ),
    ),

  /** Delete many records */
  deleteMany: (data: { recordIds: Array<string> }): Promise<void> =>
    apiClient.delete('/v1/apps/base/data-sources/contact/items', data),
}
