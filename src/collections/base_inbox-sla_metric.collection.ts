// Generated collection for base_inbox/sla_metric
import { apiClient } from '../lib/api';
import type { QueryParamValue } from '@docyrus/api-client';
import type { ICollectionListParams } from './types';

export interface BaseInboxSlaMetricEntity {

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

  /** Metric Type */
  metric_type: { id: string; name: string } | any;

  /** Is Active */
  is_active?: boolean;
}


export const base_inboxSlaMetricCollection = {
  /** List records with optional filtering, sorting, and pagination. */
  list: (params?: ICollectionListParams): Promise<Array<BaseInboxSlaMetricEntity>> =>
    apiClient.get('/v1/apps/base_inbox/data-sources/sla_metric/items', params as Record<string, QueryParamValue> | undefined),

  /** Get record */
  get: (recordId: string, params?: { columns?: Array<string> }): Promise<BaseInboxSlaMetricEntity> => 
    apiClient.get('/v1/apps/base_inbox/data-sources/sla_metric/items/{recordId}'.replace('{recordId}', recordId), params),

  /** Create record */
  create: (data: { data: any }): Promise<BaseInboxSlaMetricEntity> => 
    apiClient.post('/v1/apps/base_inbox/data-sources/sla_metric/items', data),

  /** Update record */
  update: (recordId: string, data: { data: any }): Promise<BaseInboxSlaMetricEntity> => 
    apiClient.patch('/v1/apps/base_inbox/data-sources/sla_metric/items/{recordId}'.replace('{recordId}', recordId), data),

  /** Delete record */
  delete: (recordId: string): Promise<void> => 
    apiClient.delete('/v1/apps/base_inbox/data-sources/sla_metric/items/{recordId}'.replace('{recordId}', recordId)),

  /** Delete many records */
  deleteMany: (data: { recordIds: Array<string> }): Promise<void> => 
    apiClient.delete('/v1/apps/base_inbox/data-sources/sla_metric/items', data)
};
