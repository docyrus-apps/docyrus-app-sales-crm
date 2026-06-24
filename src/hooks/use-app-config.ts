import { type AppModulesConfig } from '@/lib/app-config'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useDocyrusClient } from '@docyrus/signin'
import { createAppConfigClient } from '@docyrus/app-utils'
import { toast } from 'sonner'

import { APP_CONFIG_APP_ID, getAppModulesConfig } from '@/lib/app-config'

/**
 * Tenant-level module switches stored under `data.modules` in the shared app
 * config record. Read by the sidebar, header actions, and route guards to show
 * or hide whole modules (field sales, webphone) across the app.
 *
 * @docyrus: [[architecture#App Module Configuration]]
 */
export function useAppModules() {
  const client = useDocyrusClient()

  return useQuery({
    queryKey: ['app-config', 'modules'],
    enabled: !!client,
    queryFn: async () => {
      const configClient = createAppConfigClient(client!, APP_CONFIG_APP_ID)
      const config = await configClient.get().catch(() => null)

      return getAppModulesConfig(
        (config?.data?.modules as Record<string, unknown> | undefined) ??
        undefined
      )
    }
  })
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
      queryClient.invalidateQueries({ queryKey: ['app-config', 'modules'] })
      toast.success('Uygulama ayarları kaydedildi')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Uygulama ayarları kaydedilemedi')
    }
  })
}
