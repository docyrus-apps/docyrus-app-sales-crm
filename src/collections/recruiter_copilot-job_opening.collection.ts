// Generated collection for recruiter_copilot/job_opening
import { apiClient } from '../lib/api';
import type { QueryParamValue } from '@docyrus/api-client';
import type { ICollectionListParams } from './types';

export interface RecruiterCopilotJobOpeningEntity {

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

  /** Department */
  department?: string;

  /** Status */
  status?: { id: string; name: string } | any;

  /** Work Model */
  work_model?: { id: string; name: string } | any;

  /** Job Code */
  job_code?: string;

  /** Job Description */
  job_description?: { id: string; name: string } | string;
}


export const recruiter_copilotJobOpeningCollection = {
  /** List records with optional filtering, sorting, and pagination. */
  list: (params?: ICollectionListParams): Promise<Array<RecruiterCopilotJobOpeningEntity>> =>
    apiClient.get('/v1/apps/recruiter_copilot/data-sources/job_opening/items', params as Record<string, QueryParamValue> | undefined),

  /** Get record */
  get: (recordId: string, params?: { columns?: Array<string> }): Promise<RecruiterCopilotJobOpeningEntity> => 
    apiClient.get('/v1/apps/recruiter_copilot/data-sources/job_opening/items/{recordId}'.replace('{recordId}', recordId), params),

  /** Create record */
  create: (data: { data: any }): Promise<RecruiterCopilotJobOpeningEntity> => 
    apiClient.post('/v1/apps/recruiter_copilot/data-sources/job_opening/items', data),

  /** Update record */
  update: (recordId: string, data: { data: any }): Promise<RecruiterCopilotJobOpeningEntity> => 
    apiClient.patch('/v1/apps/recruiter_copilot/data-sources/job_opening/items/{recordId}'.replace('{recordId}', recordId), data),

  /** Delete record */
  delete: (recordId: string): Promise<void> => 
    apiClient.delete('/v1/apps/recruiter_copilot/data-sources/job_opening/items/{recordId}'.replace('{recordId}', recordId)),

  /** Delete many records */
  deleteMany: (data: { recordIds: Array<string> }): Promise<void> => 
    apiClient.delete('/v1/apps/recruiter_copilot/data-sources/job_opening/items', data)
};
