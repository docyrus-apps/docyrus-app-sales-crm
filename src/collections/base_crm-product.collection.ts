// Generated collection for base_crm/product
import { apiClient } from '../lib/api';
import type { QueryParamValue } from '@docyrus/api-client';
import type { ICollectionListParams } from './types';

export interface BaseCrmProductEntity {

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

  /** Unit */
  Unit?: { id: string; name: string } | any;

  /** Product Code */
  product_code?: string;

  /** Unit Price */
  unit_price?: number;

  /** Category */
  category?: { id: string; name: string } | string;

  /** Tax */
  tax?: number;
}


export const base_crmProductCollection = {
  /** List records with optional filtering, sorting, and pagination. */
  list: (params?: ICollectionListParams): Promise<Array<BaseCrmProductEntity>> =>
    apiClient.get('/v1/apps/base_crm/data-sources/product/items', params as Record<string, QueryParamValue> | undefined),

  /** Get record */
  get: (recordId: string, params?: { columns?: Array<string> }): Promise<BaseCrmProductEntity> => 
    apiClient.get('/v1/apps/base_crm/data-sources/product/items/{recordId}'.replace('{recordId}', recordId), params),

  /** Create record */
  create: (data: { data: any }): Promise<BaseCrmProductEntity> => 
    apiClient.post('/v1/apps/base_crm/data-sources/product/items', data),

  /** Update record */
  update: (recordId: string, data: { data: any }): Promise<BaseCrmProductEntity> => 
    apiClient.patch('/v1/apps/base_crm/data-sources/product/items/{recordId}'.replace('{recordId}', recordId), data),

  /** Delete record */
  delete: (recordId: string): Promise<void> => 
    apiClient.delete('/v1/apps/base_crm/data-sources/product/items/{recordId}'.replace('{recordId}', recordId)),

  /** Delete many records */
  deleteMany: (data: { recordIds: Array<string> }): Promise<void> => 
    apiClient.delete('/v1/apps/base_crm/data-sources/product/items', data)
};
