// Generated collection for base_pm/goal
import { apiClient } from '../lib/api';
import type { QueryParamValue } from '@docyrus/api-client';
import type { ICollectionListParams } from './types';

export interface BasePmGoalEntity {

  /** ID */
  id?: string;

  /** Record owner */
  record_owner?: string;

  /** Created On */
  created_on?: string;

  /** Created By */
  created_by?: string;

  /** Last Modified On */
  last_modified_on?: string;

  /** Last Modified By */
  last_modified_by?: string;

  /** Status */
  status: { id: string; name: string } | any;

  /** Due Date */
  due_date?: string;

  /** Progress */
  progress?: number;

  /** Type */
  type: { id: string; name: string } | any;

  /** Team */
  team?: string;

  /** Owner */
  owner?: { id: string; name: string } | string;

  /** Fiscal Period */
  fiscal_period?: string;
}


export const base_pmGoalCollection = {
  /** List records with optional filtering, sorting, and pagination. */
  list: (params?: ICollectionListParams): Promise<Array<BasePmGoalEntity>> =>
    apiClient.get('/v1/apps/base_pm/data-sources/goal/items', params as Record<string, QueryParamValue> | undefined),

  /** Get record */
  get: (recordId: string, params?: { columns?: Array<string> }): Promise<BasePmGoalEntity> => 
    apiClient.get('/v1/apps/base_pm/data-sources/goal/items/{recordId}'.replace('{recordId}', recordId), params),

  /** Create record */
  create: (data: { data: any }): Promise<BasePmGoalEntity> => 
    apiClient.post('/v1/apps/base_pm/data-sources/goal/items', data),

  /** Update record */
  update: (recordId: string, data: { data: any }): Promise<BasePmGoalEntity> => 
    apiClient.patch('/v1/apps/base_pm/data-sources/goal/items/{recordId}'.replace('{recordId}', recordId), data),

  /** Delete record */
  delete: (recordId: string): Promise<void> => 
    apiClient.delete('/v1/apps/base_pm/data-sources/goal/items/{recordId}'.replace('{recordId}', recordId)),

  /** Delete many records */
  deleteMany: (data: { recordIds: Array<string> }): Promise<void> => 
    apiClient.delete('/v1/apps/base_pm/data-sources/goal/items', data)
};
