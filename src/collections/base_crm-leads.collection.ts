// Generated collection for base_crm/leads
import { useDocyrusClient } from '@docyrus/signin'
import type { QueryParamValue } from '@docyrus/api-client'
import type { ICollectionListParams } from './types'

export interface BaseCrmLeadsEntity {
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

  /** How did you hear about us? Other */
  how_did_you_hear_about_us_other?: string

  /** How many people work at your company ? */
  how_many_people_work_at_your_company_?: { id: string; name: string } | any

  /** Title */
  title?: string

  /** Phone */
  phone?: string

  /** Address */
  address?: string

  /** Lead Source */
  lead_source?: { id: string; name: string } | any

  /** Lead Status */
  lead_status?: { id: string; name: string } | any

  /** Contact Message */
  contact_message?: string

  /** City */
  city?: string

  /** State */
  state?: string

  /** Website */
  website?: string

  /** Lead Type */
  lead_type?: { id: string; name: string } | any

  /** Email */
  email?: string

  /** Countries */
  countries?: { id: string; name: string } | string

  /** Select what you’d like to manage first */
  select_what_youd_like_to_manage_first?: { id: string; name: string } | any

  /** Lost Reason */
  lost_reason?: { id: string; name: string } | any

  /** Telefon 2 */
  telefon_2?: string

  /** Town */
  town?: string

  /** Select what you’d like to manage first? Other */
  select_what_youd_like_to_manage_first_other?: string

  /** How did you hear about us? */
  how_did_you_hear_about_us?: { id: string; name: string } | any

  /** Lead Form */
  lead_form?: { id: string; name: string } | any

  /** Company Name */
  company_name?: { id: string; name: string } | string

  /** Company Name */
  company_name_text?: string

  /** Contact Job Title */
  contact_job_title?: string

  /** Company Email */
  company_email?: string

  /** Company Phone */
  company_phone?: string

  /** Company Industry */
  company_industry?: { id: string; name: string } | string

  /** Company Size */
  company_size?: { id: string; name: string } | string

  /** Deal Name */
  deal_name?: string

  /** Deal Value */
  deal_value?: number

  /** Expected Revenue */
  expected_revenue?: number

  /** Close Probability */
  close_probability?: number

  /** Expected Closing Date */
  expected_closing_date?: string

  /** Converted Organization */
  converted_organization?: { id: string; name: string } | string

  /** Converted Contact */
  converted_contact?: { id: string; name: string } | string

  /** Converted Deal */
  converted_deal?: { id: string; name: string } | string

  /** Converted On */
  converted_on?: string

  /** Converted By */
  converted_by?: { id: string; firstname?: string; lastname?: string } | string

  /** Conversion State */
  conversion_state?: { id: string; name: string } | string

  /** Conversion Mode */
  conversion_mode?: { id: string; name: string } | string

  /** Conversion Error Message */
  conversion_error_message?: string
}

export function useBaseCrmLeadsCollection() {
  const client = useDocyrusClient()

  return {
    /** List records with optional filtering, sorting, and pagination. */
    list: (
      params?: ICollectionListParams,
    ): Promise<Array<BaseCrmLeadsEntity>> =>
      client!.get(
        '/v1/apps/base_crm/data-sources/leads/items',
        params as Record<string, QueryParamValue> | undefined,
      ),

    /** Get record */
    get: (
      recordId: string,
      params?: { columns?: Array<string> },
    ): Promise<BaseCrmLeadsEntity> =>
      client!.get(
        '/v1/apps/base_crm/data-sources/leads/items/{recordId}'.replace(
          '{recordId}',
          recordId,
        ),
        params,
      ),

    /** Create record */
    create: (data: Record<string, any>): Promise<BaseCrmLeadsEntity> =>
      client!.post('/v1/apps/base_crm/data-sources/leads/items', data),

    /** Update record */
    update: (
      recordId: string,
      data: Record<string, any>,
    ): Promise<BaseCrmLeadsEntity> =>
      client!.patch(
        '/v1/apps/base_crm/data-sources/leads/items/{recordId}'.replace(
          '{recordId}',
          recordId,
        ),
        data,
      ),

    /** Delete record */
    delete: (recordId: string): Promise<void> =>
      client!.delete(
        '/v1/apps/base_crm/data-sources/leads/items/{recordId}'.replace(
          '{recordId}',
          recordId,
        ),
      ),

    /** Delete many records */
    deleteMany: (data: { recordIds: Array<string> }): Promise<void> =>
      client!.delete('/v1/apps/base_crm/data-sources/leads/items', data),
  }
}
