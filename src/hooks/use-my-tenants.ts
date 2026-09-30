import { useQuery } from '@tanstack/react-query'

import { getApiClient } from '@/lib/api'

export interface MyTenant {
  id: string;
  name: string;
  tenant_no: number;
  logo: string | null;
}

/*
 * The Docyrus tenants the signed-in user belongs to.
 *
 * Used by the lead conversion to tag the organization it creates with the
 * tenant that lead became. Listing every tenant in the system would need
 * `/v1/super/tenants`, which is gated on a Supabase session plus
 * `core_super_user`; this endpoint needs neither and is enough while the field
 * is only filled in for tenants we are a member of.
 */
export function useMyTenants(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['my-tenants'],
    queryFn: async () => {
      const apiClient = getApiClient()

      return apiClient.get<Array<MyTenant>>('/v1/users/me/tenants')
    },
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000
  })
}
