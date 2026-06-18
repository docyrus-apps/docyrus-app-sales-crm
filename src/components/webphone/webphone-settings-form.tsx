import { useEffect, useState } from 'react'
import { CheckCircle2, Lock, Pencil, TriangleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useWebphone } from './webphone-context'
import {
  useUpdateWebphoneRuntimeSettings,
  useWebphoneRuntimeSettings,
} from '@/hooks/use-webphone-config'
import { DEFAULT_VERIMOR_RUNTIME } from '@/lib/webphone/runtime'
import type { WebphoneRuntimeSettings } from '@/lib/webphone/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const TEXT_FIELDS: Array<{
  key: keyof WebphoneRuntimeSettings
  labelKey: string
}> = [
  { key: 'wssUrl', labelKey: 'webphone.settings.wssUrl' },
  { key: 'pbxHost', labelKey: 'webphone.settings.pbxHost' },
  { key: 'realm', labelKey: 'webphone.settings.realm' },
  { key: 'registrarServer', labelKey: 'webphone.settings.registrarServer' },
  { key: 'registerExpires', labelKey: 'webphone.settings.registerExpires' },
  { key: 'noAnswerTimeout', labelKey: 'webphone.settings.noAnswerTimeout' },
  { key: 'preferredAudioCodecs', labelKey: 'webphone.settings.audioCodecs' },
]

/** Compact readiness banner: green when ready, amber with the missing items. */
export function WebphoneReadinessSummary() {
  const { t } = useTranslation()
  const { ready, readinessReasons } = useWebphone()

  if (ready) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-sm">
        <CheckCircle2 className="size-4 text-emerald-500" />
        {t('webphone.settings.readinessReady')}
      </div>
    )
  }

  return (
    <div className="space-y-1 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm">
      <div className="flex items-center gap-2 font-medium">
        <TriangleAlert className="size-4 text-amber-500" />
        {t('webphone.settings.readinessMissing')}
      </div>
      <ul className="ml-6 list-disc text-xs text-muted-foreground">
        {readinessReasons.map((reason) => (
          <li key={reason}>
            {t(`webphone.readiness.${reason}`, { defaultValue: reason })}
          </li>
        ))}
      </ul>
    </div>
  )
}

interface WebphoneSettingsFormProps {
  onSaved?: () => void
}

/**
 * Tenant WebRTC runtime settings (App Config `data.webrtc`). Opens read-only
 * with an "authorized only" notice; a confirm step unlocks editing (the confirm
 * is not persisted — it only guards against accidental changes). Credential-free
 * — SIP username/password come from the agent telephony profile, never here.
 */
export function WebphoneSettingsForm({ onSaved }: WebphoneSettingsFormProps) {
  const { t } = useTranslation()
  const { data, isLoading } = useWebphoneRuntimeSettings()
  const update = useUpdateWebphoneRuntimeSettings()
  const [draft, setDraft] = useState<WebphoneRuntimeSettings>(
    DEFAULT_VERIMOR_RUNTIME,
  )
  const [editing, setEditing] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    if (data) setDraft(data)
  }, [data])

  const updateField = (key: keyof WebphoneRuntimeSettings, value: string) =>
    setDraft((current) => ({ ...current, [key]: value }))

  const save = async () => {
    await update.mutateAsync(draft)
    setEditing(false)
    onSaved?.()
  }

  return (
    <div className="space-y-4">
      <WebphoneReadinessSummary />

      {!editing && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-muted-foreground">
          <Lock className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
          <span>{t('webphone.settings.readonlyNotice')}</span>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {TEXT_FIELDS.map((field) => (
          <div key={field.key} className="space-y-1.5">
            <Label htmlFor={`webphone-${field.key}`}>{t(field.labelKey)}</Label>
            <Input
              id={`webphone-${field.key}`}
              value={String(draft[field.key] ?? '')}
              disabled={!editing}
              onChange={(event) => updateField(field.key, event.target.value)}
            />
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="webphone-ice">
          {t('webphone.settings.iceServers')}
        </Label>
        <Textarea
          id="webphone-ice"
          value={draft.iceServersJson}
          disabled={!editing}
          onChange={(event) =>
            updateField('iceServersJson', event.target.value)
          }
          className="min-h-24 font-mono text-xs"
        />
      </div>

      <div className="flex justify-end gap-2">
        {editing ? (
          <>
            <Button
              variant="ghost"
              onClick={() => {
                if (data) setDraft(data)
                setEditing(false)
              }}
              disabled={update.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button onClick={save} disabled={update.isPending || isLoading}>
              {update.isPending ? t('common.saving') : t('common.save')}
            </Button>
          </>
        ) : (
          <Button variant="outline" onClick={() => setConfirmOpen(true)}>
            <Pencil className="size-4" />
            {t('webphone.settings.edit')}
          </Button>
        )}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('webphone.settings.editConfirmTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('webphone.settings.editConfirmBody')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setEditing(true)
                setConfirmOpen(false)
              }}
            >
              {t('webphone.settings.editConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
