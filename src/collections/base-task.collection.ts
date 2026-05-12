// Generated collection for base/task
import { useMemo } from 'react'
import { useDocyrusClient } from '@docyrus/signin'
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

  /** End Date */
  end_date?: string

  /** Start Date */
  start_date?: string

  /** Description */
  description?: string

  /** Request */
  request?: { id: string; name: string } | string

  /** Status */
  status?: { id: string; name: string } | any

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

  /** Lead */
  lead?: { id: string; name: string } | string

  /** Parent Task */
  parent?: { id: string; name: string } | string

  /** Contact */
  contact?: { id: string; name: string } | string

  /** Priority */
  priority?: { id: string; name: string } | any

  /** Deal */
  deal?: { id: string; name: string } | string

  /** Task Type */
  task_type?: { id: string; name: string } | any
}

export function useBaseTaskCollection() {
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
      list: (params?: ICollectionListParams): Promise<Array<BaseTaskEntity>> =>
        client!.get(
          '/v1/apps/base/data-sources/task/items',
          params as Record<string, QueryParamValue> | undefined,
        ),

      /** Get record */
      get: (
        recordId: string,
        params?: { columns?: Array<string> },
      ): Promise<BaseTaskEntity> =>
        client!.get(
          '/v1/apps/base/data-sources/task/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          params,
        ),

      /** Create record */
      create: (data: Record<string, any>): Promise<BaseTaskEntity> =>
        client!.post('/v1/apps/base/data-sources/task/items', data),

      /** Update record */
      update: (
        recordId: string,
        data: Record<string, any>,
      ): Promise<BaseTaskEntity> =>
        client!.patch(
          '/v1/apps/base/data-sources/task/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          data,
        ),

      /** Delete record */
      delete: (recordId: string): Promise<void> =>
        client!.delete(
          '/v1/apps/base/data-sources/task/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
        ),

      /** Delete many records */
      deleteMany: (data: { recordIds: Array<string> }): Promise<void> =>
        client!.delete('/v1/apps/base/data-sources/task/items', data),
    }),
    [client],
  )
}
