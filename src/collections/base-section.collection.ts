// Generated collection for base/section
import { apiClient } from '../lib/api';
import type { QueryParamValue } from '@docyrus/api-client';
import type { ICollectionListParams } from './types';

export interface BaseSectionEntity {

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

  /** Project */
  project?: { id: string; name: string } | string;
}


export const baseSectionCollection = {
  /** List records with optional filtering, sorting, and pagination. */
  list: (params?: ICollectionListParams): Promise<Array<BaseSectionEntity>> =>
    apiClient.get('/v1/apps/base/data-sources/section/items', params as Record<string, QueryParamValue> | undefined),

  /** Get record */
  get: (recordId: string, params?: { columns?: Array<string> }): Promise<BaseSectionEntity> => 
    apiClient.get('/v1/apps/base/data-sources/section/items/{recordId}'.replace('{recordId}', recordId), params),

  /** Create record */
  create: (data: { data: any }): Promise<BaseSectionEntity> => 
    apiClient.post('/v1/apps/base/data-sources/section/items', data),

  /** Update record */
  update: (recordId: string, data: { data: any }): Promise<BaseSectionEntity> => 
    apiClient.patch('/v1/apps/base/data-sources/section/items/{recordId}'.replace('{recordId}', recordId), data),

  /** Delete record */
  delete: (recordId: string): Promise<void> => 
    apiClient.delete('/v1/apps/base/data-sources/section/items/{recordId}'.replace('{recordId}', recordId)),

  /** Delete many records */
  deleteMany: (data: { recordIds: Array<string> }): Promise<void> => 
    apiClient.delete('/v1/apps/base/data-sources/section/items', data)
};
