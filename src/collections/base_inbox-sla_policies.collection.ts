// Generated collection for base_inbox/sla_policies
import { apiClient } from '../lib/api'
import type { QueryParamValue } from '@docyrus/api-client'
import type { ICollectionListParams } from './types'

export interface BaseInboxSlaPoliciesEntity {
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

  /** Description */
  description?: string

  /** Is Active */
  is_active?: boolean

  /** Is Default */
  is_default?: boolean

  /** First Response At */
  first_response_at?: string

  /** Priority */
  priority?: { id: string; name: string } | any
}

export const base_inboxSlaPoliciesCollection = {
  /** List records with optional filtering, sorting, and pagination. */
  list: (
    params?: ICollectionListParams,
  ): Promise<Array<BaseInboxSlaPoliciesEntity>> =>
    apiClient.get(
      '/v1/apps/base_inbox/data-sources/sla_policies/items',
      params as Record<string, QueryParamValue> | undefined,
    ),

  /** Get record */
  get: (
    recordId: string,
    params?: { columns?: Array<string> },
  ): Promise<BaseInboxSlaPoliciesEntity> =>
    apiClient.get(
      '/v1/apps/base_inbox/data-sources/sla_policies/items/{recordId}'.replace(
        '{recordId}',
        recordId,
      ),
      params,
    ),

  /** Create record */
  create: (data: { data: any }): Promise<BaseInboxSlaPoliciesEntity> =>
    apiClient.post('/v1/apps/base_inbox/data-sources/sla_policies/items', data),

  /** Update record */
  update: (
    recordId: string,
    data: { data: any },
  ): Promise<BaseInboxSlaPoliciesEntity> =>
    apiClient.patch(
      '/v1/apps/base_inbox/data-sources/sla_policies/items/{recordId}'.replace(
        '{recordId}',
        recordId,
      ),
      data,
    ),

  /** Delete record */
  delete: (recordId: string): Promise<void> =>
    apiClient.delete(
      '/v1/apps/base_inbox/data-sources/sla_policies/items/{recordId}'.replace(
        '{recordId}',
        recordId,
      ),
    ),

  /** Delete many records */
  deleteMany: (data: { recordIds: Array<string> }): Promise<void> =>
    apiClient.delete(
      '/v1/apps/base_inbox/data-sources/sla_policies/items',
      data,
    ),
}
