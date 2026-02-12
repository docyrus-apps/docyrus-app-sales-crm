// Generated collection for base_crm/leads
import { apiClient } from '../lib/api';
import type { QueryParamValue } from '@docyrus/api-client';
import type { ICollectionListParams } from './types';

export interface BaseCrmLeadsEntity {

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

  /** How did you hear about us? Other */
  how_did_you_hear_about_us_other?: string;

  /** How many people work at your company ? */
  how_many_people_work_at_your_company_?: { id: string; name: string } | any;

  /** Title */
  title?: string;

  /** Phone */
  phone?: string;

  /** Address */
  address?: string;

  /** Lead Source */
  lead_source?: { id: string; name: string } | any;

  /** Lead Status */
  lead_status?: { id: string; name: string } | any;

  /** Contact Message */
  contact_message?: string;

  /** City */
  city?: string;

  /** State */
  state?: string;

  /** Website */
  website?: string;

  /** Lead Type */
  lead_type?: { id: string; name: string } | any;

  /** Email */
  email?: string;

  /** Countries */
  countries?: { id: string; name: string } | string;

  /** Select what you’d like to manage first */
  select_what_youd_like_to_manage_first?: { id: string; name: string } | any;

  /** Lost Reason */
  lost_reason?: { id: string; name: string } | any;

  /** Telefon 2 */
  telefon_2?: string;

  /** Town */
  town?: string;

  /** Select what you’d like to manage first? Other */
  select_what_youd_like_to_manage_first_other?: string;

  /** How did you hear about us? */
  how_did_you_hear_about_us?: { id: string; name: string } | any;

  /** Lead Form */
  lead_form?: { id: string; name: string } | any;

  /** Company Name */
  company_name?: { id: string; name: string } | string;
}


export const base_crmLeadsCollection = {
  /** List records with optional filtering, sorting, and pagination. */
  list: (params?: ICollectionListParams): Promise<Array<BaseCrmLeadsEntity>> =>
    apiClient.get('/v1/apps/base_crm/data-sources/leads/items', params as Record<string, QueryParamValue> | undefined),

  /** Get record */
  get: (recordId: string, params?: { columns?: Array<string> }): Promise<BaseCrmLeadsEntity> => 
    apiClient.get('/v1/apps/base_crm/data-sources/leads/items/{recordId}'.replace('{recordId}', recordId), params),

  /** Create record */
  create: (data: { data: any }): Promise<BaseCrmLeadsEntity> => 
    apiClient.post('/v1/apps/base_crm/data-sources/leads/items', data),

  /** Update record */
  update: (recordId: string, data: { data: any }): Promise<BaseCrmLeadsEntity> => 
    apiClient.patch('/v1/apps/base_crm/data-sources/leads/items/{recordId}'.replace('{recordId}', recordId), data),

  /** Delete record */
  delete: (recordId: string): Promise<void> => 
    apiClient.delete('/v1/apps/base_crm/data-sources/leads/items/{recordId}'.replace('{recordId}', recordId)),

  /** Delete many records */
  deleteMany: (data: { recordIds: Array<string> }): Promise<void> => 
    apiClient.delete('/v1/apps/base_crm/data-sources/leads/items', data)
};
