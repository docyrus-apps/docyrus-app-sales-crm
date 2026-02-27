// Generated collection for base/time_entry
import { useDocyrusClient } from '@docyrus/signin'
import type { QueryParamValue } from '@docyrus/api-client'
import type { ICollectionListParams } from './types'

export interface BaseTimeEntryEntity {
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

  /** Billable Duration */
  duration_billable?: number

  /** Billing Status */
  billing_status?: { id: string; name: string } | any

  /** Contact Billed */
  contact_billed?: string

  /** Duration */
  duration: number

  /** Time &amp; Material Report */
  time_and_material_report?: { id: string; name: string } | string

  /** Record Owner Billed */
  record_owner_billed?: { id: string; name: string } | string

  /** Description Billed */
  description_billed?: string

  /** Billable */
  billable?: boolean

  /** Duration Billed */
  duration_billed?: number

  /** Date Billed */
  date_billed?: string

  /** Description */
  description: string

  /** Contact */
  contact?: string

  /** Date */
  date: string

  /** Task */
  task?: { id: string; name: string } | string

  /** Project */
  project?: { id: string; name: string } | string

  /** Operation */
  operation?: { id: string; name: string } | string

  /** Organization */
  organization?: { id: string; name: string } | string
}

export function useBaseTimeEntryCollection() {
  const client = useDocyrusClient()

  return {
    /** List records with optional filtering, sorting, and pagination. */
    list: (
      params?: ICollectionListParams,
    ): Promise<Array<BaseTimeEntryEntity>> =>
      client!.get(
        '/v1/apps/base/data-sources/time_entry/items',
        params as Record<string, QueryParamValue> | undefined,
      ),

    /** Get record */
    get: (
      recordId: string,
      params?: { columns?: Array<string> },
    ): Promise<BaseTimeEntryEntity> =>
      client!.get(
        '/v1/apps/base/data-sources/time_entry/items/{recordId}'.replace(
          '{recordId}',
          recordId,
        ),
        params,
      ),

    /** Create record */
    create: (data: Record<string, any>): Promise<BaseTimeEntryEntity> =>
      client!.post('/v1/apps/base/data-sources/time_entry/items', data),

    /** Update record */
    update: (
      recordId: string,
      data: Record<string, any>,
    ): Promise<BaseTimeEntryEntity> =>
      client!.patch(
        '/v1/apps/base/data-sources/time_entry/items/{recordId}'.replace(
          '{recordId}',
          recordId,
        ),
        data,
      ),

    /** Delete record */
    delete: (recordId: string): Promise<void> =>
      client!.delete(
        '/v1/apps/base/data-sources/time_entry/items/{recordId}'.replace(
          '{recordId}',
          recordId,
        ),
      ),

    /** Delete many records */
    deleteMany: (data: { recordIds: Array<string> }): Promise<void> =>
      client!.delete('/v1/apps/base/data-sources/time_entry/items', data),
  }
}
