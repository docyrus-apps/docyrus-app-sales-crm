import { useEffect, useRef, useState } from 'react'

import { Check, Loader2, Phone, SlidersHorizontal } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { useWebphone } from './webphone-context'
import { WebphoneExtensionDialog } from './webphone-extension-dialog'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

/**
 * WebPhone status chip for the app header. The chip shows the live (system)
 * state; clicking opens a small menu where the agent sets themselves Online
 * (register) or Offline (unregister). Other states (connecting/failed/missing
 * settings) are informational only. Renders nothing when the module is off.
 */
export function WebphoneStatusBadge() {
  const { t } = useTranslation()
  const {
    enabled,
    ready,
    registrationStatus,
    microphoneStatus,
    lastError,
    connect,
    disconnect
  } = useWebphone()

  const [extensionOpen, setExtensionOpen] = useState(false)
  const lastToastRef = useRef<string | null>(null)

  const state = (() => {
    if (microphoneStatus === 'denied') {
      return { dot: 'bg-amber-500', labelKey: 'webphone.status.micDenied' }
    }
    if (!ready) {
      return {
        dot: 'bg-muted-foreground/40',
        labelKey: 'webphone.status.missingSettings'
      }
    }
    switch (registrationStatus) {
      case 'registered':
        return { dot: 'bg-emerald-500', labelKey: 'webphone.status.ready' }

      case 'registering':
        return { dot: 'bg-amber-500', labelKey: 'webphone.status.connecting' }

      case 'failed':
        return { dot: 'bg-red-500', labelKey: 'webphone.status.failed' }

      default:
        return {
          dot: 'bg-muted-foreground/40',
          labelKey: 'webphone.status.offline'
        }
    }
  })()

  const label = t(state.labelKey)
  const connecting = registrationStatus === 'registering'
  const isOnline = registrationStatus === 'registered'
  const errorMessage = lastError
    ? t(`webphone.errors.${lastError}`, {
        defaultValue: t('webphone.errors.connection_problem')
      })
    : null

  useEffect(() => {
    if (!enabled || !lastError || lastToastRef.current === lastError) return
    lastToastRef.current = lastError
    toast.error(
      t(`webphone.errors.${lastError}`, {
        defaultValue: t('webphone.errors.connection_problem')
      })
    )
  }, [enabled, lastError, t])

  if (!enabled) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-accent">
          {connecting ? (
            <Loader2 className="size-3 animate-spin text-muted-foreground" />
          ) : (
            <span className={cn('size-2 rounded-full', state.dot)} />
          )}
          <Phone className="size-3 text-muted-foreground" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="space-y-1 text-xs text-muted-foreground">
          <span className="block">{t('webphone.statusMenu.title')}</span>
          {errorMessage && (
            <span className="block font-normal leading-snug text-amber-600 dark:text-amber-400">
              {errorMessage}
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="gap-2"
          disabled={!ready || connecting || isOnline}
          onSelect={() => connect()}>
          <span className="size-2 rounded-full bg-emerald-500" />
          {t('webphone.statusMenu.online')}
          {isOnline && <Check className="ml-auto size-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-2"
          disabled={!isOnline && !connecting}
          onSelect={() => disconnect()}>
          <span className="size-2 rounded-full bg-muted-foreground/40" />
          {t('webphone.statusMenu.offline')}
          {!isOnline && !connecting && <Check className="ml-auto size-4" />}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="gap-2"
          onSelect={() => setExtensionOpen(true)}>
          <SlidersHorizontal className="size-4 text-muted-foreground" />
          {t('webphone.statusMenu.extension')}
        </DropdownMenuItem>
      </DropdownMenuContent>

      <WebphoneExtensionDialog
        open={extensionOpen}
        onOpenChange={setExtensionOpen} />
    </DropdownMenu>
  )
}
