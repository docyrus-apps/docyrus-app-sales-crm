// @ts-nocheck
/* eslint-disable */
import { type RestApiClient } from '@docyrus/api-client'

export interface BulkUpdateRecord {
  /** Record id — required by the bulk-update endpoint. */
  id: string
  [key: string]: unknown
}

export interface BulkUpdateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: RestApiClient
  appSlug: string
  dataSourceSlug: string
  /** Rows the user has selected in the grid. Only `id` is read. */
  records: ReadonlyArray<BulkUpdateRecord>
  /** When `true`, downstream automations run on each updated row. Default `true`. */
  enableAutomation?: boolean
  /** When `true`, change-log entries are written. Default `true`. */
  enableChangeLogging?: boolean
  /**
   * Called after the bulk PATCH resolves. The `data` argument is whatever the
   * server returns (`response.data` is unwrapped first).
   */
  onSuccess?: (data: Array<BulkUpdateRecord>) => void
  /** Hide / restrict the field picker to a subset of slugs. */
  allowedFieldSlugs?: ReadonlyArray<string>
  /** Optional pre-resolved data source id (avoids a round-trip). */
  dataSourceId?: string
  className?: string
}
