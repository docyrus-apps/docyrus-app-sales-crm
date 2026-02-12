// Generated collection for base/city
import { apiClient } from '../lib/api';
import type { QueryParamValue } from '@docyrus/api-client';
import type { ICollectionListParams } from './types';

export interface BaseCityEntity {

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

  /** Latitude */
  latitude?: string;

  /** Longitude */
  longitude?: string;

  /** Flag */
  flag?: number;

  /** WikiDataId */
  wikidataid?: string;

  /** Country */
  country: { id: string; name: string } | string;
}


export const baseCityCollection = {
  /** List records with optional filtering, sorting, and pagination. */
  list: (params?: ICollectionListParams): Promise<Array<BaseCityEntity>> =>
    apiClient.get('/v1/apps/base/data-sources/city/items', params as Record<string, QueryParamValue> | undefined),

  /** Get record */
  get: (recordId: string, params?: { columns?: Array<string> }): Promise<BaseCityEntity> => 
    apiClient.get('/v1/apps/base/data-sources/city/items/{recordId}'.replace('{recordId}', recordId), params),

  /** Create record */
  create: (data: { data: any }): Promise<BaseCityEntity> => 
    apiClient.post('/v1/apps/base/data-sources/city/items', data),

  /** Update record */
  update: (recordId: string, data: { data: any }): Promise<BaseCityEntity> => 
    apiClient.patch('/v1/apps/base/data-sources/city/items/{recordId}'.replace('{recordId}', recordId), data),

  /** Delete record */
  delete: (recordId: string): Promise<void> => 
    apiClient.delete('/v1/apps/base/data-sources/city/items/{recordId}'.replace('{recordId}', recordId)),

  /** Delete many records */
  deleteMany: (data: { recordIds: Array<string> }): Promise<void> => 
    apiClient.delete('/v1/apps/base/data-sources/city/items', data)
};
