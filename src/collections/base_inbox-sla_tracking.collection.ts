// Generated collection for base_inbox/sla_tracking
import { apiClient } from '../lib/api';
import type { QueryParamValue } from '@docyrus/api-client';
import type { ICollectionListParams } from './types';

export interface BaseInboxSlaTrackingEntity {

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

  /** Thread/Ticket */
  thread: { id: string; name: string } | string;

  /** SLA Metric */
  sla_metric: { id: string; name: string } | string;

  /** Start Time */
  start_time: string;

  /** Target Completion Time */
  target_completion_time: string;

  /** Actual Completion Time */
  actual_completion_time?: string;

  /** Status */
  status: { id: string; name: string } | any;

  /** Remaining Minutes */
  remaining_minutes?: number;

  /** Is Breached */
  is_breached?: boolean;
}


export const base_inboxSlaTrackingCollection = {
  /** List records with optional filtering, sorting, and pagination. */
  list: (params?: ICollectionListParams): Promise<Array<BaseInboxSlaTrackingEntity>> =>
    apiClient.get('/v1/apps/base_inbox/data-sources/sla_tracking/items', params as Record<string, QueryParamValue> | undefined),

  /** Get record */
  get: (recordId: string, params?: { columns?: Array<string> }): Promise<BaseInboxSlaTrackingEntity> => 
    apiClient.get('/v1/apps/base_inbox/data-sources/sla_tracking/items/{recordId}'.replace('{recordId}', recordId), params),

  /** Create record */
  create: (data: { data: any }): Promise<BaseInboxSlaTrackingEntity> => 
    apiClient.post('/v1/apps/base_inbox/data-sources/sla_tracking/items', data),

  /** Update record */
  update: (recordId: string, data: { data: any }): Promise<BaseInboxSlaTrackingEntity> => 
    apiClient.patch('/v1/apps/base_inbox/data-sources/sla_tracking/items/{recordId}'.replace('{recordId}', recordId), data),

  /** Delete record */
  delete: (recordId: string): Promise<void> => 
    apiClient.delete('/v1/apps/base_inbox/data-sources/sla_tracking/items/{recordId}'.replace('{recordId}', recordId)),

  /** Delete many records */
  deleteMany: (data: { recordIds: Array<string> }): Promise<void> => 
    apiClient.delete('/v1/apps/base_inbox/data-sources/sla_tracking/items', data)
};
