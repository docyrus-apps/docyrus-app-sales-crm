// Generated collection for recruiter_copilot/job_description
import { apiClient } from '../lib/api';
import type { QueryParamValue } from '@docyrus/api-client';
import type { ICollectionListParams } from './types';

export interface RecruiterCopilotJobDescriptionEntity {

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

  /** Job Description */
  job_description?: string;
}


export const recruiter_copilotJobDescriptionCollection = {
  /** List records with optional filtering, sorting, and pagination. */
  list: (params?: ICollectionListParams): Promise<Array<RecruiterCopilotJobDescriptionEntity>> =>
    apiClient.get('/v1/apps/recruiter_copilot/data-sources/job_description/items', params as Record<string, QueryParamValue> | undefined),

  /** Get record */
  get: (recordId: string, params?: { columns?: Array<string> }): Promise<RecruiterCopilotJobDescriptionEntity> => 
    apiClient.get('/v1/apps/recruiter_copilot/data-sources/job_description/items/{recordId}'.replace('{recordId}', recordId), params),

  /** Create record */
  create: (data: { data: any }): Promise<RecruiterCopilotJobDescriptionEntity> => 
    apiClient.post('/v1/apps/recruiter_copilot/data-sources/job_description/items', data),

  /** Update record */
  update: (recordId: string, data: { data: any }): Promise<RecruiterCopilotJobDescriptionEntity> => 
    apiClient.patch('/v1/apps/recruiter_copilot/data-sources/job_description/items/{recordId}'.replace('{recordId}', recordId), data),

  /** Delete record */
  delete: (recordId: string): Promise<void> => 
    apiClient.delete('/v1/apps/recruiter_copilot/data-sources/job_description/items/{recordId}'.replace('{recordId}', recordId)),

  /** Delete many records */
  deleteMany: (data: { recordIds: Array<string> }): Promise<void> => 
    apiClient.delete('/v1/apps/recruiter_copilot/data-sources/job_description/items', data)
};
