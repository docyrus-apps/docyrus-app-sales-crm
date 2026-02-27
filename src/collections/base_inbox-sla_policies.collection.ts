// Generated collection for base_inbox/sla_policies
import { useDocyrusClient } from '@docyrus/signin'
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

export function useBaseInboxSlaPoliciesCollection() {
  const client = useDocyrusClient()

  return {
    /** List records with optional filtering, sorting, and pagination. */
    list: (
      params?: ICollectionListParams,
    ): Promise<Array<BaseInboxSlaPoliciesEntity>> =>
      client!.get(
        '/v1/apps/base_inbox/data-sources/sla_policies/items',
        params as Record<string, QueryParamValue> | undefined,
      ),

    /** Get record */
    get: (
      recordId: string,
      params?: { columns?: Array<string> },
    ): Promise<BaseInboxSlaPoliciesEntity> =>
      client!.get(
        '/v1/apps/base_inbox/data-sources/sla_policies/items/{recordId}'.replace(
          '{recordId}',
          recordId,
        ),
        params,
      ),

    /** Create record */
    create: (data: Record<string, any>): Promise<BaseInboxSlaPoliciesEntity> =>
      client!.post('/v1/apps/base_inbox/data-sources/sla_policies/items', data),

    /** Update record */
    update: (
      recordId: string,
      data: Record<string, any>,
    ): Promise<BaseInboxSlaPoliciesEntity> =>
      client!.patch(
        '/v1/apps/base_inbox/data-sources/sla_policies/items/{recordId}'.replace(
          '{recordId}',
          recordId,
        ),
        data,
      ),

    /** Delete record */
    delete: (recordId: string): Promise<void> =>
      client!.delete(
        '/v1/apps/base_inbox/data-sources/sla_policies/items/{recordId}'.replace(
          '{recordId}',
          recordId,
        ),
      ),

    /** Delete many records */
    deleteMany: (data: { recordIds: Array<string> }): Promise<void> =>
      client!.delete(
        '/v1/apps/base_inbox/data-sources/sla_policies/items',
        data,
      ),
  }
}
