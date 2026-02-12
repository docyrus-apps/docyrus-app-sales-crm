// Generated collection for base_pm/portfolio
import { apiClient } from '../lib/api';
import type { QueryParamValue } from '@docyrus/api-client';
import type { ICollectionListParams } from './types';

export interface BasePmPortfolioEntity {

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

  /** Starred */
  starred?: boolean;
}


export const base_pmPortfolioCollection = {
  /** List records with optional filtering, sorting, and pagination. */
  list: (params?: ICollectionListParams): Promise<Array<BasePmPortfolioEntity>> =>
    apiClient.get('/v1/apps/base_pm/data-sources/portfolio/items', params as Record<string, QueryParamValue> | undefined),

  /** Get record */
  get: (recordId: string, params?: { columns?: Array<string> }): Promise<BasePmPortfolioEntity> => 
    apiClient.get('/v1/apps/base_pm/data-sources/portfolio/items/{recordId}'.replace('{recordId}', recordId), params),

  /** Create record */
  create: (data: { data: any }): Promise<BasePmPortfolioEntity> => 
    apiClient.post('/v1/apps/base_pm/data-sources/portfolio/items', data),

  /** Update record */
  update: (recordId: string, data: { data: any }): Promise<BasePmPortfolioEntity> => 
    apiClient.patch('/v1/apps/base_pm/data-sources/portfolio/items/{recordId}'.replace('{recordId}', recordId), data),

  /** Delete record */
  delete: (recordId: string): Promise<void> => 
    apiClient.delete('/v1/apps/base_pm/data-sources/portfolio/items/{recordId}'.replace('{recordId}', recordId)),

  /** Delete many records */
  deleteMany: (data: { recordIds: Array<string> }): Promise<void> => 
    apiClient.delete('/v1/apps/base_pm/data-sources/portfolio/items', data)
};
