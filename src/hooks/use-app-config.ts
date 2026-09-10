import { type AppModulesConfig } from '@/lib/app-config'

import { useMemo } from 'react'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useDocyrusClient } from '@docyrus/signin'
import { createAppConfigClient } from '@docyrus/app-utils'
import { toast } from 'sonner'

import { APP_CONFIG_APP_ID, getAppModulesConfig } from '@/lib/app-config'

export const APP_CONFIG_QUERY_KEY = ['app-config', 'record', APP_CONFIG_APP_ID] as const

/**
 * The modules and WebRTC settings live in the same tenant app-config record.
 * Keep one shared query so consumers do not request that record in parallel
 * under unrelated cache keys.
 */
export function useAppConfigRecord() {
  const client = useDocyrusClient()

  return useQuery({
    queryKey: APP_CONFIG_QUERY_KEY,
    enabled: !!client,
    queryFn: async () => {
      const configClient = createAppConfigClient(client!, APP_CONFIG_APP_ID)

      return configClient.get().catch(() => null)
    },
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000
  })
}

/**
 * Tenant-level module switches stored under `data.modules` in the shared app
 * config record. Read by the sidebar, header actions, and route guards to show
 * or hide whole modules (field sales, webphone) across the app.
 *
 * @docyrus: [[architecture#App Module Configuration]]
 */
export function useAppModules() {
  const query = useAppConfigRecord()
  const modules = useMemo(
    () => {
      if (query.data === undefined) return undefined

      return getAppModulesConfig(
        (query.data?.data?.modules as Record<string, unknown> | undefined) ??
        undefined
      )
    },
    [query.data]
  )

  return {
    ...query,
    data: modules
  }
}

export function useUpdateAppModules() {
  const client = useDocyrusClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (nextModules: AppModulesConfig) => {
      const configClient = createAppConfigClient(client!, APP_CONFIG_APP_ID)
      const current = await configClient.get().catch(() => null)
      const merged = {
        ...(current?.data ?? {}),
        modules: nextModules
      }

      return configClient.upsert({ data: merged })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APP_CONFIG_QUERY_KEY })
      toast.success('Uygulama ayarları kaydedildi')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Uygulama ayarları kaydedilemedi')
    }
  })
}
