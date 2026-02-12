// Generated collection for base/task
import { apiClient } from '../lib/api'
import type { QueryParamValue } from '@docyrus/api-client'
import type { ICollectionListParams } from './types'

export interface BaseTaskEntity {
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

  /** Subject */
  subject: string

  /** Start Date */
  start_date?: string

  /** Description */
  description?: string

  /** End Date */
  end_date?: string

  /** Task Notes */
  task_notes?: Record<string, any>

  /** Section */
  section?: { id: string; name: string } | string

  /** Sort Order */
  sort_order?: number

  /** Project */
  project?: { id: string; name: string } | string

  /** Followers */
  followers?: { id: string; name: string } | Array<string>

  /** Organization */
  organization?: { id: string; name: string } | string

  /** Parent Task */
  parent?: { id: string; name: string } | string

  /** Status */
  status?: { id: string; name: string } | any
}

export const baseTaskCollection = {
  /** List records with optional filtering, sorting, and pagination. */
  list: (params?: ICollectionListParams): Promise<Array<BaseTaskEntity>> =>
    apiClient.get(
      '/v1/apps/base/data-sources/task/items',
      params as Record<string, QueryParamValue> | undefined,
    ),

  /** Get record */
  get: (
    recordId: string,
    params?: { columns?: Array<string> },
  ): Promise<BaseTaskEntity> =>
    apiClient.get(
      '/v1/apps/base/data-sources/task/items/{recordId}'.replace(
        '{recordId}',
        recordId,
      ),
      params,
    ),

  /** Create record */
  create: (data: { data: any }): Promise<BaseTaskEntity> =>
    apiClient.post('/v1/apps/base/data-sources/task/items', data),

  /** Update record */
  update: (recordId: string, data: { data: any }): Promise<BaseTaskEntity> =>
    apiClient.patch(
      '/v1/apps/base/data-sources/task/items/{recordId}'.replace(
        '{recordId}',
        recordId,
      ),
      data,
    ),

  /** Delete record */
  delete: (recordId: string): Promise<void> =>
    apiClient.delete(
      '/v1/apps/base/data-sources/task/items/{recordId}'.replace(
        '{recordId}',
        recordId,
      ),
    ),

  /** Delete many records */
  deleteMany: (data: { recordIds: Array<string> }): Promise<void> =>
    apiClient.delete('/v1/apps/base/data-sources/task/items', data),
}
