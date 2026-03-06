import { useQuery } from '@tanstack/react-query'
import { getApiClient } from '@/lib/api'

export interface AuditActivity {
  id: string
  description: string
  shortDescription: string
  icon: string | null
  color: string
  table_name: string
  operation: string
  tenant_data_source_id: { id: string; name: string | null }
  created_on: string | null
  created_by: string | null
  created_by_user: {
    name: string
    email: string
    mobile: string | null
    firstname: string
    lastname: string
  } | null
  data_source_name: string | null
  title: string | null
}

interface AuditActivityParams {
  limit?: number
  offset?: number
  dataSourceId?: string
  createdAfter?: string
  createdBefore?: string
}

interface TeamAuditActivityParams extends AuditActivityParams {
  userId: string
}

export function useMyAuditActivities(params?: AuditActivityParams) {
  return useQuery({
    queryKey: ['audit-activities', 'me', params],
    queryFn: async () => {
      const apiClient = getApiClient()
      return apiClient.get<Array<AuditActivity>>(
        '/v1/users/me/activities',
        params,
      )
    },
  })
}

export function useTeamAuditActivities(
  params: TeamAuditActivityParams | undefined,
) {
  return useQuery({
    queryKey: ['audit-activities', 'team', params],
    queryFn: async () => {
      const apiClient = getApiClient()
      return apiClient.get<Array<AuditActivity>>('/v1/users/activities', params)
    },
    enabled: !!params?.userId,
  })
}
