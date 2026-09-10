import type { ReactNode } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { useAppModules } from './use-app-config'
import { useWebphoneRuntimeSettings } from './use-webphone-config'

const getConfig = vi.fn()

vi.mock('@docyrus/signin', () => ({
  useDocyrusClient: () => ({})
}))

vi.mock('@docyrus/app-utils', () => ({
  createAppConfigClient: () => ({
    get: getConfig
  })
}))

describe('shared app config hooks', () => {
  beforeEach(() => {
    getConfig.mockReset()
    getConfig.mockResolvedValue({
      data: {
        modules: { fieldSales: true, webphone: false },
        webrtc: { wssUrl: 'wss://example.test' }
      }
    })
  })

  test('shares one request and keeps derived data references stable', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    })
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    const { result, rerender } = renderHook(
      () => ({
        modules: useAppModules(),
        settings: useWebphoneRuntimeSettings()
      }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.modules.data).toBeDefined()
      expect(result.current.settings.data).toBeDefined()
    })

    const modules = result.current.modules.data
    const settings = result.current.settings.data

    rerender()

    expect(getConfig).toHaveBeenCalledTimes(1)
    expect(result.current.modules.data).toBe(modules)
    expect(result.current.settings.data).toBe(settings)
  })
})
