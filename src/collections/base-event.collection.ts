// Generated collection for base/event
import { apiClient } from '../lib/api'
import type { QueryParamValue } from '@docyrus/api-client'
import type { ICollectionListParams } from './types'

export interface BaseEventEntity {
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

  /** Event Type */
  calendar?: { id: string; name: string } | string

  /** Event Notes */
  event_notes?: Record<string, any>
}

export const baseEventCollection = {
  /** List records with optional filtering, sorting, and pagination. */
  list: (params?: ICollectionListParams): Promise<Array<BaseEventEntity>> =>
    apiClient.get(
      '/v1/apps/base/data-sources/event/items',
      params as Record<string, QueryParamValue> | undefined,
    ),

  /** Get record */
  get: (
    recordId: string,
    params?: { columns?: Array<string> },
  ): Promise<BaseEventEntity> =>
    apiClient.get(
      '/v1/apps/base/data-sources/event/items/{recordId}'.replace(
        '{recordId}',
        recordId,
      ),
      params,
    ),

  /** Create record */
  create: (data: { data: any }): Promise<BaseEventEntity> =>
    apiClient.post('/v1/apps/base/data-sources/event/items', data),

  /** Update record */
  update: (recordId: string, data: { data: any }): Promise<BaseEventEntity> =>
    apiClient.patch(
      '/v1/apps/base/data-sources/event/items/{recordId}'.replace(
        '{recordId}',
        recordId,
      ),
      data,
    ),

  /** Delete record */
  delete: (recordId: string): Promise<void> =>
    apiClient.delete(
      '/v1/apps/base/data-sources/event/items/{recordId}'.replace(
        '{recordId}',
        recordId,
      ),
    ),

  /** Delete many records */
  deleteMany: (data: { recordIds: Array<string> }): Promise<void> =>
    apiClient.delete('/v1/apps/base/data-sources/event/items', data),
}
