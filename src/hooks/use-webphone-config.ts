import type { WebphoneRuntimeSettings } from '@/lib/webphone/types'

import { useMemo } from 'react'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useDocyrusClient } from '@docyrus/signin'
import { createAppConfigClient } from '@docyrus/app-utils'
import { toast } from 'sonner'

import { APP_CONFIG_APP_ID } from '@/lib/app-config'
import {
  APP_CONFIG_QUERY_KEY,
  useAppConfigRecord
} from '@/hooks/use-app-config'
import { getWebphoneRuntimeSettings } from '@/lib/webphone/runtime'

/**
 * Webphone SIP/WebRTC runtime settings (credential-free) stored under
 * `data.webrtc` in the shared tenant app config record — same record as
 * `data.fieldSales` and `data.modules`. Credentials never live here; they come
 * from the agent telephony profile.
 *
 * @docyrus: [[architecture#Webphone (Callcenter WebRTC) Module]]
 */
export function useWebphoneRuntimeSettings() {
  const query = useAppConfigRecord()
  const settings = useMemo(
    () => {
      if (query.data === undefined) return undefined

      return getWebphoneRuntimeSettings(
        (query.data?.data?.webrtc as
          Partial<WebphoneRuntimeSettings> | undefined) ?? undefined
      )
    },
    [query.data]
  )

  return {
    ...query,
    data: settings
  }
}

export function useUpdateWebphoneRuntimeSettings() {
  const client = useDocyrusClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (nextSettings: WebphoneRuntimeSettings) => {
      const configClient = createAppConfigClient(client!, APP_CONFIG_APP_ID)
      const current = await configClient.get().catch(() => null)
      const merged = {
        ...(current?.data ?? {}),
        webrtc: nextSettings
      }

      return configClient.upsert({ data: merged })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: APP_CONFIG_QUERY_KEY
      })
      toast.success('Webphone ayarları kaydedildi')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Webphone ayarları kaydedilemedi')
    }
  })
}
