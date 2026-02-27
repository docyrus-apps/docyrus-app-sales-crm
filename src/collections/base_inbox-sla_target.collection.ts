// Generated collection for base_inbox/sla_target
import { useDocyrusClient } from '@docyrus/signin'
import type { QueryParamValue } from '@docyrus/api-client'
import type { ICollectionListParams } from './types'

export interface BaseInboxSlaTargetEntity {
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

  /** SLA Policy */
  sla_policy: { id: string; name: string } | string

  /** SLA Metric */
  sla_metric: { id: string; name: string } | string

  /** Priority */
  priority: { id: string; name: string } | any

  /** Target Minutes */
  target_minutes: number

  /** Warning Threshold % */
  warning_threshold_percent?: number
}

export function useBaseInboxSlaTargetCollection() {
  const client = useDocyrusClient()

  return {
    /** List records with optional filtering, sorting, and pagination. */
    list: (
      params?: ICollectionListParams,
    ): Promise<Array<BaseInboxSlaTargetEntity>> =>
      client!.get(
        '/v1/apps/base_inbox/data-sources/sla_target/items',
        params as Record<string, QueryParamValue> | undefined,
      ),

    /** Get record */
    get: (
      recordId: string,
      params?: { columns?: Array<string> },
    ): Promise<BaseInboxSlaTargetEntity> =>
      client!.get(
        '/v1/apps/base_inbox/data-sources/sla_target/items/{recordId}'.replace(
          '{recordId}',
          recordId,
        ),
        params,
      ),

    /** Create record */
    create: (data: Record<string, any>): Promise<BaseInboxSlaTargetEntity> =>
      client!.post('/v1/apps/base_inbox/data-sources/sla_target/items', data),

    /** Update record */
    update: (
      recordId: string,
      data: Record<string, any>,
    ): Promise<BaseInboxSlaTargetEntity> =>
      client!.patch(
        '/v1/apps/base_inbox/data-sources/sla_target/items/{recordId}'.replace(
          '{recordId}',
          recordId,
        ),
        data,
      ),

    /** Delete record */
    delete: (recordId: string): Promise<void> =>
      client!.delete(
        '/v1/apps/base_inbox/data-sources/sla_target/items/{recordId}'.replace(
          '{recordId}',
          recordId,
        ),
      ),

    /** Delete many records */
    deleteMany: (data: { recordIds: Array<string> }): Promise<void> =>
      client!.delete('/v1/apps/base_inbox/data-sources/sla_target/items', data),
  }
}
