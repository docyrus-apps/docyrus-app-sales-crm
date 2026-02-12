// Generated collection for base/docyment
import { apiClient } from '../lib/api';
import type { QueryParamValue } from '@docyrus/api-client';
import type { ICollectionListParams } from './types';

export interface BaseDocymentEntity {

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
}


export const baseDocymentCollection = {
  /** List records with optional filtering, sorting, and pagination. */
  list: (params?: ICollectionListParams): Promise<Array<BaseDocymentEntity>> =>
    apiClient.get('/v1/apps/base/data-sources/docyment/items', params as Record<string, QueryParamValue> | undefined),

  /** Get record */
  get: (recordId: string, params?: { columns?: Array<string> }): Promise<BaseDocymentEntity> => 
    apiClient.get('/v1/apps/base/data-sources/docyment/items/{recordId}'.replace('{recordId}', recordId), params),

  /** Create record */
  create: (data: { data: any }): Promise<BaseDocymentEntity> => 
    apiClient.post('/v1/apps/base/data-sources/docyment/items', data),

  /** Update record */
  update: (recordId: string, data: { data: any }): Promise<BaseDocymentEntity> => 
    apiClient.patch('/v1/apps/base/data-sources/docyment/items/{recordId}'.replace('{recordId}', recordId), data),

  /** Delete record */
  delete: (recordId: string): Promise<void> => 
    apiClient.delete('/v1/apps/base/data-sources/docyment/items/{recordId}'.replace('{recordId}', recordId)),

  /** Delete many records */
  deleteMany: (data: { recordIds: Array<string> }): Promise<void> => 
    apiClient.delete('/v1/apps/base/data-sources/docyment/items', data)
};
