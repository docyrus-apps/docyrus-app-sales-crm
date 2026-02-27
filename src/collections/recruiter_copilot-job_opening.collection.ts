// Generated collection for recruiter_copilot/job_opening
import { useDocyrusClient } from '@docyrus/signin'
import type { QueryParamValue } from '@docyrus/api-client'
import type { ICollectionListParams } from './types'

export interface RecruiterCopilotJobOpeningEntity {
  /** ID */
  id?: string

  /** Record owner */
  record_owner?: string

  /** Created On */
  created_on?: string

  /** Created By */
  created_by?: string

  /** Last Modified On */
  last_modified_on?: string

  /** Last Modified By */
  last_modified_by?: string

  /** Department */
  department?: string

  /** Status */
  status?: { id: string; name: string } | any

  /** Work Model */
  work_model?: { id: string; name: string } | any

  /** Job Code */
  job_code?: string

  /** Job Description */
  job_description?: { id: string; name: string } | string
}

export function useRecruiterCopilotJobOpeningCollection() {
  const client = useDocyrusClient()

  return {
    /** List records with optional filtering, sorting, and pagination. */
    list: (
      params?: ICollectionListParams,
    ): Promise<Array<RecruiterCopilotJobOpeningEntity>> =>
      client!.get(
        '/v1/apps/recruiter_copilot/data-sources/job_opening/items',
        params as Record<string, QueryParamValue> | undefined,
      ),

    /** Get record */
    get: (
      recordId: string,
      params?: { columns?: Array<string> },
    ): Promise<RecruiterCopilotJobOpeningEntity> =>
      client!.get(
        '/v1/apps/recruiter_copilot/data-sources/job_opening/items/{recordId}'.replace(
          '{recordId}',
          recordId,
        ),
        params,
      ),

    /** Create record */
    create: (
      data: Record<string, any>,
    ): Promise<RecruiterCopilotJobOpeningEntity> =>
      client!.post(
        '/v1/apps/recruiter_copilot/data-sources/job_opening/items',
        data,
      ),

    /** Update record */
    update: (
      recordId: string,
      data: Record<string, any>,
    ): Promise<RecruiterCopilotJobOpeningEntity> =>
      client!.patch(
        '/v1/apps/recruiter_copilot/data-sources/job_opening/items/{recordId}'.replace(
          '{recordId}',
          recordId,
        ),
        data,
      ),

    /** Delete record */
    delete: (recordId: string): Promise<void> =>
      client!.delete(
        '/v1/apps/recruiter_copilot/data-sources/job_opening/items/{recordId}'.replace(
          '{recordId}',
          recordId,
        ),
      ),

    /** Delete many records */
    deleteMany: (data: { recordIds: Array<string> }): Promise<void> =>
      client!.delete(
        '/v1/apps/recruiter_copilot/data-sources/job_opening/items',
        data,
      ),
  }
}
