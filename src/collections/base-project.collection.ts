// Generated collection for base/project
import { apiClient } from '../lib/api';
import type { QueryParamValue } from '@docyrus/api-client';
import type { ICollectionListParams } from './types';

export interface BaseProjectEntity {

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

  /** Name */
  name: string;

  /** Project Description */
  description?: Record<string, any>;

  /** Status */
  status?: { id: string; name: string } | any;

  /** Organization */
  organization?: { id: string; name: string } | string;

  /** Portfolio */
  portfolio?: { id: string; name: string } | string;

  /** Followers */
  followers?: { id: string; name: string } | Array<string>;
}


export const baseProjectCollection = {
  /** List records with optional filtering, sorting, and pagination. */
  list: (params?: ICollectionListParams): Promise<Array<BaseProjectEntity>> =>
    apiClient.get('/v1/apps/base/data-sources/project/items', params as Record<string, QueryParamValue> | undefined),

  /** Get record */
  get: (recordId: string, params?: { columns?: Array<string> }): Promise<BaseProjectEntity> => 
    apiClient.get('/v1/apps/base/data-sources/project/items/{recordId}'.replace('{recordId}', recordId), params),

  /** Create record */
  create: (data: { data: any }): Promise<BaseProjectEntity> => 
    apiClient.post('/v1/apps/base/data-sources/project/items', data),

  /** Update record */
  update: (recordId: string, data: { data: any }): Promise<BaseProjectEntity> => 
    apiClient.patch('/v1/apps/base/data-sources/project/items/{recordId}'.replace('{recordId}', recordId), data),

  /** Delete record */
  delete: (recordId: string): Promise<void> => 
    apiClient.delete('/v1/apps/base/data-sources/project/items/{recordId}'.replace('{recordId}', recordId)),

  /** Delete many records */
  deleteMany: (data: { recordIds: Array<string> }): Promise<void> => 
    apiClient.delete('/v1/apps/base/data-sources/project/items', data)
};
