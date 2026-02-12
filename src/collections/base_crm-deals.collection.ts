// Generated collection for base_crm/deals
import { apiClient } from '../lib/api';
import type { QueryParamValue } from '@docyrus/api-client';
import type { ICollectionListParams } from './types';

export interface BaseCrmDealsEntity {

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

  /** Expected Revenue */
  expected_revenue?: number;

  /** Expected Closing Date */
  expected_closing_date?: string;

  /** Hot Prospect */
  hot_prospect?: boolean;

  /** Follow Up On */
  follow_up_on?: string;

  /** Close Probability */
  close_probability?: number;

  /** Closed Date */
  closed_date?: string;

  /** Followers */
  followers?: { id: string; name: string } | Array<string>;

  /** Stage */
  stage?: { id: string; name: string } | any;

  /** Customer Type */
  customer_type?: { id: string; name: string } | any;

  /** Lead Source */
  lead_source?: { id: string; name: string } | any;

  /** Reason for Lost */
  reason_for_lost?: { id: string; name: string } | any;

  /** Deal Value */
  deal_value?: number;

  /** Country */
  country?: { id: string; name: string } | string;

  /** Organizations */
  organizations?: { id: string; name: string } | string;

  /** Contact Person */
  contact_person?: { id: string; name: string } | string;
}


export const base_crmDealsCollection = {
  /** List records with optional filtering, sorting, and pagination. */
  list: (params?: ICollectionListParams): Promise<Array<BaseCrmDealsEntity>> =>
    apiClient.get('/v1/apps/base_crm/data-sources/deals/items', params as Record<string, QueryParamValue> | undefined),

  /** Get record */
  get: (recordId: string, params?: { columns?: Array<string> }): Promise<BaseCrmDealsEntity> => 
    apiClient.get('/v1/apps/base_crm/data-sources/deals/items/{recordId}'.replace('{recordId}', recordId), params),

  /** Create record */
  create: (data: { data: any }): Promise<BaseCrmDealsEntity> => 
    apiClient.post('/v1/apps/base_crm/data-sources/deals/items', data),

  /** Update record */
  update: (recordId: string, data: { data: any }): Promise<BaseCrmDealsEntity> => 
    apiClient.patch('/v1/apps/base_crm/data-sources/deals/items/{recordId}'.replace('{recordId}', recordId), data),

  /** Delete record */
  delete: (recordId: string): Promise<void> => 
    apiClient.delete('/v1/apps/base_crm/data-sources/deals/items/{recordId}'.replace('{recordId}', recordId)),

  /** Delete many records */
  deleteMany: (data: { recordIds: Array<string> }): Promise<void> => 
    apiClient.delete('/v1/apps/base_crm/data-sources/deals/items', data)
};
