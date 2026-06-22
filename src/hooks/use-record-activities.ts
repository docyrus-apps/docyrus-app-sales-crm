import { useQuery } from '@tanstack/react-query'

import { getApiClient } from '@/lib/api'
import type { RecordActivity } from '@/components/docyrus/record-activity-panel/types'

/**
 * Per-record audit history (the change-log timeline) from the item
 * `activities` sub-resource — distinct from `useRecordEvents` (calendar
 * events) and `useMyAuditActivities` (the personal feed).
 *
 * GET /v1/apps/{app}/data-sources/{dataSource}/items/{id}/activities
 */
export function useRecordActivities(
  appSlug: string,
  dataSourceSlug: string,
  recordId: string | undefined,
) {
  return useQuery({
    queryKey: ['record-activities', appSlug, dataSourceSlug, recordId],
    queryFn: async () => {
      const client = getApiClient()

      return client.get<Array<RecordActivity>>(
        `/v1/apps/${appSlug}/data-sources/${dataSourceSlug}/items/${recordId}/activities`,
      )
    },
    enabled: !!recordId,
  })
}
