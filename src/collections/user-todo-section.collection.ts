// Generated collection for user/todo-section
import { apiClient } from '../lib/api'
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

export const userTodoSectionCollection = {
  /** List records with optional filtering, sorting, and pagination. */
  list: (
    params?: ICollectionListParams,
  ): Promise<Array<UserTodoSectionEntity>> =>
    apiClient.get(
      '/v1/apps/user/data-sources/todo-section/items',
      params as Record<string, QueryParamValue> | undefined,
    ),

  /** Create todo section */
  create: (data: { data: any }): Promise<UserTodoSectionEntity> =>
    apiClient.post('/v1/apps/user/data-sources/todo-section/items', data),
}
