// Generated collection for base_crm/leads
import { useMemo } from 'react'
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

  /** Company Name */
  company_name?: { id: string; name: string } | string

  /** Company Name */
  company_name_text?: string

  /** Company Email */
  company_email?: string

  /** Company Phone */
  company_phone?: string

  /** Company Industry */
  company_industry?: { id: string; name: string } | any

  /** Company Size */
  company_size?: { id: string; name: string } | any

  /** Contact Job Title */
  contact_job_title?: string

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

  /** Lead Form */
  lead_form?: { id: string; name: string } | any

  /** Converted Organization */
  converted_organization?: { id: string; name: string } | string

  /** Converted Contact */
  converted_contact?: { id: string; name: string } | string

  /** Converted Deal */
  converted_deal?: { id: string; name: string } | string

  /** Converted By */
  converted_by?: { id: string; name: string } | string

  /** Converted On */
  converted_on?: string

  /** Conversion State */
  conversion_state?: { id: string; name: string } | any

  /** Conversion Mode */
  conversion_mode?: { id: string; name: string } | any

  /** Conversion Error Message */
  conversion_error_message?: string

  /** Lost Reason */
  lost_reason?: { id: string; name: string } | any

  /** Countries */
  countries?: { id: string; name: string } | string

  /** Phone */
  phone?: string

  /** Address */
  address?: string

  /** Title */
  title?: string

  /** Lead Status */
  lead_status?: { id: string; name: string } | any

  /** Contact Message */
  contact_message?: string

  /** City */
  city?: string

  /** State */
  state?: string

  /** Lead Type */
  lead_type?: { id: string; name: string } | any

  /** Email */
  email?: string

  /** Town */
  town?: string

  /** Lead Source */
  lead_source?: { id: string; name: string } | any

  /** Company Website */
  website?: string
}

export function useBaseCrmLeadsCollection() {
  const client = useDocyrusClient()

  /*
   * Memoize the returned object so its identity is stable across renders.
   * Consumers commonly put the collection in useCallback/useMemo deps
   * (e.g. on a delete/save handler) — without memoization, every render
   * produces a fresh object, those callbacks rebuild, and any effect that
   * tracks them via deps fires every render. That's what triggers the
   * infinite-loop case in <DataGrid>: an unstable handler reaches the
   * grid's column-applier effect, which calls table.setColumnVisibility
   * → store.set → store.notify → re-render → unstable collection again.
   */
  return useMemo(
    () => ({
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
    }),
    [client],
  )
}
