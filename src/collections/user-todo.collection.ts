// Generated collection for user/todo
import { useMemo } from 'react'
import { useDocyrusClient } from '@docyrus/signin'
import type { QueryParamValue } from '@docyrus/api-client'
import type { ICollectionListParams } from './types'

export interface UserTodoEntity {
  /** List ID */
  id: string

  created_by: string

  /** Is Todo Completed */
  done: boolean

  /** Todo Title */
  title: string

  /** Todo Due Date */
  due_date: string

  /** Remind X Minutes Before */
  remind_before: number

  /** Priority of Todo */
  priority: string

  /** JSON Content */
  connected_items: Record<string, any>

  /** Parent Todo ID */
  parent: string

  /** Sorting Order of Todo */
  sort_order: number

  /** Parent list ID */
  list: string

  /** JSON Content */
  content: Record<string, any>

  /** Type: Todo */
  type: string

  /** Parent section ID */
  section: string

  /** Is Todo Archived */
  archived: boolean
}

export function useUserTodoCollection() {
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
      list: (params?: ICollectionListParams): Promise<Array<UserTodoEntity>> =>
        client!.get(
          '/v1/apps/user/data-sources/todo/items',
          params as Record<string, QueryParamValue> | undefined,
        ),

      /** Create todo */
      create: (data: Record<string, any>): Promise<UserTodoEntity> =>
        client!.post('/v1/apps/user/data-sources/todo/items', data),
    }),
    [client],
  )
}
