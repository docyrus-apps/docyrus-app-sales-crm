import { useCallback, useEffect, useRef, useState } from 'react'

import { type ExternalFilePayload } from '../types'

declare global {
  interface Window {
    OneDrive?: {
      open: (options: Record<string, unknown>) => void
    }
  }
}

export interface OneDrivePickerConfig {
  /** Microsoft OAuth2 Client ID */
  clientId: string
  /** OAuth2 redirect URI (defaults to window.location.origin) */
  redirectUri?: string
}

const SCRIPT_URL = 'https://js.live.net/v7.2/OneDrive.js'

export function useOneDrivePicker(config?: OneDrivePickerConfig) {
  const [isLoaded, setIsLoaded] = useState(false)
  const resolveRef = useRef<
    ((files: Array<ExternalFilePayload>) => void) | null
  >(null)
  const rejectRef = useRef<((err: Error) => void) | null>(null)

  const clientId = config?.clientId
  const redirectUri = config?.redirectUri
  const isAvailable = !!clientId

  useEffect(() => {
    if (!isAvailable) return
    if (window.OneDrive) {
      setIsLoaded(true)

      return
    }

    const existing = document.querySelector(`script[src="${SCRIPT_URL}"]`)

    if (existing) {
      existing.addEventListener('load', () => setIsLoaded(true))

      return
    }

    const script = document.createElement('script')

    script.src = SCRIPT_URL
    script.async = true
    script.onload = () => setIsLoaded(true)
    document.head.appendChild(script)
  }, [isAvailable])

  const openPicker = useCallback(
    ({ multiSelect = true }: { multiSelect?: boolean } = {}) => {
      return new Promise<Array<ExternalFilePayload>>((resolve, reject) => {
        if (!window.OneDrive || !clientId) {
          reject(new Error('OneDrive picker not available'))

          return
        }

        resolveRef.current = resolve
        rejectRef.current = reject

        window.OneDrive.open({
          clientId,
          action: 'share',
          multiSelect,
          advanced: {
            redirectUri: redirectUri ?? window.location.origin,
          },
          success: (response: { value: Array<Record<string, unknown>> }) => {
            const files: Array<ExternalFilePayload> = (
              response.value || []
            ).map((item) => ({
              source: 'microsoft_onedrive' as const,
              file_name: (item.name as string) || 'Untitled',
              file_type: (item['@content.downloadUrl'] as string)
                ? 'application/octet-stream'
                : ((item.file as Record<string, unknown>)
                    ?.mimeType as string) || 'application/octet-stream',
              signed_url:
                (item.webUrl as string) ||
                (item['@content.downloadUrl'] as string) ||
                '',
              file_data: item,
            }))

            resolveRef.current?.(files)
          },
          cancel: () => {
            resolveRef.current?.([])
          },
          error: (err: { message?: string }) => {
            rejectRef.current?.(
              new Error(err?.message || 'OneDrive picker error'),
            )
          },
        })
      })
    },
    [clientId, redirectUri],
  )

  return { openPicker, isAvailable, isReady: isAvailable && isLoaded }
}
