// Generated collection for user/todo-section
import { useMemo } from 'react'
import { useDocyrusClient } from '@docyrus/signin'
import type { QueryParamValue } from '@docyrus/api-client'
import type { ICollectionListParams } from './types'

export interface UserTodoSectionEntity {
  /** Section ID */
  id: string

  /** User ID who created the section */
  created_by: string

  /** Last modified by user ID */
  last_modified_by: string

  /** Title of the section */
  title: string

  /** Connected items as JSON */
  connected_items: Record<string, any>

  /** Parent Section ID */
  parent: string

  /** Sort order number */
  sort_order: number

  /** Associated list ID */
  list: string

  /** JSON Content */
  content: Record<string, any>

  /** Section type */
  type: string

  /** Is section archived? */
  archived: boolean

  /** Section name */
  name: string
}

export function useUserTodoSectionCollection() {
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
      ): Promise<Array<UserTodoSectionEntity>> =>
        client!.get(
          '/v1/apps/user/data-sources/todo-section/items',
          params as Record<string, QueryParamValue> | undefined,
        ),

      /** Create todo section */
      create: (data: Record<string, any>): Promise<UserTodoSectionEntity> =>
        client!.post('/v1/apps/user/data-sources/todo-section/items', data),
    }),
    [client],
  )
}
