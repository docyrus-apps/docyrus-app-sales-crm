// Generated collection for recruiter_copilot/job_applicant
import { useDocyrusClient } from '@docyrus/signin';
import type { QueryParamValue } from '@docyrus/api-client';
import type { ICollectionListParams } from './types';

export interface RecruiterCopilotJobApplicantEntity {

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

  /** Work Experience */
  work_experience?: Record<string, any>;

  /** Expected Salary */
  expected_salary?: number;

  /** Phone */
  phone: string;

  /** Related Job Opening */
  related_job_opening?: { id: string; name: string } | string;

  /** Total Work Experience */
  total_work_experience?: number;

  /** Cover Letter */
  cover_letter?: string;

  /** Education */
  education?: Record<string, any>;

  /** Languages */
  languages?: Record<string, any>;

  /** References */
  references?: Record<string, any>;

  /** Adress */
  adress?: Record<string, any>;

  /** Questions and Answers */
  questions_answers?: any;

  /** Nationality */
  nationality?: string;

  /** Email */
  email: string;

  /** Applicant Status */
  applicant_status?: { id: string; name: string } | any;

  /** Skills */
  skills?: Record<string, any>;

  /** Date of Birth */
  date_of_birth?: string;

  /** LinkedIn Profile */
  linkedin_profile?: string;
}

export function useRecruiterCopilotJobApplicantCollection() {
  const client = useDocyrusClient();

  return {
    /** List records with optional filtering, sorting, and pagination. */
    list: (params?: ICollectionListParams): Promise<Array<RecruiterCopilotJobApplicantEntity>> => client!.get('/v1/apps/recruiter_copilot/data-sources/job_applicant/items', params as Record<string, QueryParamValue> | undefined),

    /** Get record */
    get: (recordId: string, params?: { columns?: Array<string> }): Promise<RecruiterCopilotJobApplicantEntity> => client!.get('/v1/apps/recruiter_copilot/data-sources/job_applicant/items/{recordId}'.replace('{recordId}', recordId), params),

    /** Create record */
    create: (data: Record<string, any>): Promise<RecruiterCopilotJobApplicantEntity> => client!.post('/v1/apps/recruiter_copilot/data-sources/job_applicant/items', data),

    /** Update record */
    update: (recordId: string, data: Record<string, any>): Promise<RecruiterCopilotJobApplicantEntity> => client!.patch('/v1/apps/recruiter_copilot/data-sources/job_applicant/items/{recordId}'.replace('{recordId}', recordId), data),

    /** Delete record */
    delete: (recordId: string): Promise<void> => client!.delete('/v1/apps/recruiter_copilot/data-sources/job_applicant/items/{recordId}'.replace('{recordId}', recordId)),

    /** Delete many records */
    deleteMany: (data: { recordIds: Array<string> }): Promise<void> => client!.delete('/v1/apps/recruiter_copilot/data-sources/job_applicant/items', data)
  };
}
