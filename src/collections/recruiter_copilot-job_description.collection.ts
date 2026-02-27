// Generated collection for recruiter_copilot/job_description
import { useDocyrusClient } from '@docyrus/signin';
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

export function useRecruiterCopilotJobDescriptionCollection() {
  const client = useDocyrusClient();

  return {
    /** List records with optional filtering, sorting, and pagination. */
    list: (params?: ICollectionListParams): Promise<Array<RecruiterCopilotJobDescriptionEntity>> => client!.get('/v1/apps/recruiter_copilot/data-sources/job_description/items', params as Record<string, QueryParamValue> | undefined),

    /** Get record */
    get: (recordId: string, params?: { columns?: Array<string> }): Promise<RecruiterCopilotJobDescriptionEntity> => client!.get('/v1/apps/recruiter_copilot/data-sources/job_description/items/{recordId}'.replace('{recordId}', recordId), params),

    /** Create record */
    create: (data: Record<string, any>): Promise<RecruiterCopilotJobDescriptionEntity> => client!.post('/v1/apps/recruiter_copilot/data-sources/job_description/items', data),

    /** Update record */
    update: (recordId: string, data: Record<string, any>): Promise<RecruiterCopilotJobDescriptionEntity> => client!.patch('/v1/apps/recruiter_copilot/data-sources/job_description/items/{recordId}'.replace('{recordId}', recordId), data),

    /** Delete record */
    delete: (recordId: string): Promise<void> => client!.delete('/v1/apps/recruiter_copilot/data-sources/job_description/items/{recordId}'.replace('{recordId}', recordId)),

    /** Delete many records */
    deleteMany: (data: { recordIds: Array<string> }): Promise<void> => client!.delete('/v1/apps/recruiter_copilot/data-sources/job_description/items', data)
  };
}
