// Generated collection for user/todo
import { apiClient } from '../lib/api';
import type { QueryParamValue } from '@docyrus/api-client';
import type { ICollectionListParams } from './types';

export interface UserTodoEntity {

  /** List ID */
  id: string;

  created_by: string;

  /** Is Todo Completed */
  done: boolean;

  /** Todo Title */
  title: string;

  /** Todo Due Date */
  due_date: string;

  /** Remind X Minutes Before */
  remind_before: number;

  /** Priority of Todo */
  priority: string;

  /** JSON Content */
  connected_items: Record<string, any>;

  /** Parent Todo ID */
  parent: string;

  /** Sorting Order of Todo */
  sort_order: number;

  /** Parent list ID */
  list: string;

  /** JSON Content */
  content: Record<string, any>;

  /** Type: Todo */
  type: string;

  /** Parent section ID */
  section: string;

  /** Is Todo Archived */
  archived: boolean;
}


export const userTodoCollection = {
  /** List records with optional filtering, sorting, and pagination. */
  list: (params?: ICollectionListParams): Promise<Array<UserTodoEntity>> =>
    apiClient.get('/v1/apps/user/data-sources/todo/items', params as Record<string, QueryParamValue> | undefined),

  /** Create todo */
  create: (data: { data: any }): Promise<UserTodoEntity> => 
    apiClient.post('/v1/apps/user/data-sources/todo/items', data)
};
