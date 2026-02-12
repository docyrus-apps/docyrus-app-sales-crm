// Generated collection for base/thread
import { apiClient } from '../lib/api'
import type { QueryParamValue } from '@docyrus/api-client'
import type { ICollectionListParams } from './types'

export interface BaseThreadEntity {
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

  /** Subject */
  subject?: string

  /** Closed On */
  closed_on?: string

  /** Parent Record ID */
  parent_record_id?: { id: string; name: string } | string

  /** Follow Up On */
  follow_up_on?: string

  /** Case Type */
  case_type?: { id: string; name: string } | any

  /** Sender CC */
  sender_cc?: string

  /** Followers */
  followers?: { id: string; name: string } | Array<string>

  /** Sender Company */
  sender_company?: string

  /** Body */
  body?: string

  /** Contact */
  contact?: { id: string; name: string } | string

  /** Sender E-Mail */
  sender_email?: string

  /** Data Source ID */
  tenant_data_source_id?: { id: string; name: string } | string

  /** AI Agent */
  tenant_ai_agent_id?: { id: string; name: string } | string

  /** Reminder Message */
  reminder_message?: string

  /** Starred */
  starred?: boolean

  /** Sender BCC */
  sender_bcc?: string

  /** Notify On */
  notify_on?: string

  /** Body Text */
  body_text?: string

  /** Organization */
  organization?: { id: string; name: string } | string

  /** Priority */
  priority?: { id: string; name: string } | any

  /** Case Status */
  case_status?: { id: string; name: string } | any

  /** Category */
  category?: { id: string; name: string } | string

  /** Product */
  product?: { id: string; name: string } | string

  /** Message ID */
  message_id?: string

  /** Send To Email */
  send_to_email?: string

  /** Sender Name */
  sender_name?: string

  /** AI Agent Deployment */
  tenant_ai_agent_deployment_id?: { id: string; name: string } | string

  /** Thread Mode */
  thread_mode?: string

  /** Instructions */
  instructions?: any

  /** View ID */
  tenant_view_id?: { id: string; name: string } | string

  /** AI Project */
  tenant_ai_project_id?: string

  /** Thread Type */
  thread_type?: string

  /** Archived */
  archived?: boolean

  /** Sender Phone */
  sender_phone?: string

  /** Incoming Channel */
  incoming_channel?: { id: string; name: string } | any
}

export const baseThreadCollection = {
  /** List records with optional filtering, sorting, and pagination. */
  list: (params?: ICollectionListParams): Promise<Array<BaseThreadEntity>> =>
    apiClient.get(
      '/v1/apps/base/data-sources/thread/items',
      params as Record<string, QueryParamValue> | undefined,
    ),

  /** Get record */
  get: (
    recordId: string,
    params?: { columns?: Array<string> },
  ): Promise<BaseThreadEntity> =>
    apiClient.get(
      '/v1/apps/base/data-sources/thread/items/{recordId}'.replace(
        '{recordId}',
        recordId,
      ),
      params,
    ),

  /** Create record */
  create: (data: { data: any }): Promise<BaseThreadEntity> =>
    apiClient.post('/v1/apps/base/data-sources/thread/items', data),

  /** Update record */
  update: (recordId: string, data: { data: any }): Promise<BaseThreadEntity> =>
    apiClient.patch(
      '/v1/apps/base/data-sources/thread/items/{recordId}'.replace(
        '{recordId}',
        recordId,
      ),
      data,
    ),

  /** Delete record */
  delete: (recordId: string): Promise<void> =>
    apiClient.delete(
      '/v1/apps/base/data-sources/thread/items/{recordId}'.replace(
        '{recordId}',
        recordId,
      ),
    ),

  /** Delete many records */
  deleteMany: (data: { recordIds: Array<string> }): Promise<void> =>
    apiClient.delete('/v1/apps/base/data-sources/thread/items', data),
}
