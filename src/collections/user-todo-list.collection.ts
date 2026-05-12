// Generated collection for user/todo-list
import { useMemo } from 'react'
import { useDocyrusClient } from '@docyrus/signin'
import type { QueryParamValue } from '@docyrus/api-client'
import type { ICollectionListParams } from './types'

export interface UserTodoListEntity {
  /** List ID */
  id: string

  /** Created by user ID */
  created_by: string

  /** Creation timestamp */
  created_on: string

  /** Last modified by user ID */
  last_modified_by: string

  /** Last modified timestamp */
  last_modified_on: string

  /** Name of the list */
  name: string

  /** Is archived? */
  archived: boolean

  /** Parent list ID */
  parent?: string
}

export function useUserTodoListCollection() {
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
      list: (
        params?: ICollectionListParams,
      ): Promise<Array<UserTodoListEntity>> =>
        client!.get(
          '/v1/apps/user/data-sources/todo-list/items',
          params as Record<string, QueryParamValue> | undefined,
        ),

      /** Create todo list */
      create: (data: Record<string, any>): Promise<UserTodoListEntity> =>
        client!.post('/v1/apps/user/data-sources/todo-list/items', data),
    }),
    [client],
  )
}
