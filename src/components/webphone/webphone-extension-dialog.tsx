import { useEffect, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useWebphone } from './webphone-context'
import {
  useCreateMyAgentTelephonyProfile,
  useMyAgentTelephonyProfile,
  useUpdateMyAgentTelephonyProfile,
} from '@/hooks/use-webphone-profile'
import { useMyInfo } from '@/hooks/use-users'
import type { WebphoneAgentProfile } from '@/lib/webphone/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface WebphoneExtensionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Per-user SIP credentials panel opened from the header status menu. Writes the
 * extension / SIP username / password onto the current user's own agent
 * telephony profile, then registers (Save & connect). When the user has no
 * profile yet it creates one (this dialog is the only provisioning UI). The
 * password is prefilled from the user's own stored profile (masked, with a
 * reveal toggle) so the same user can see and re-confirm what they saved; on an
 * existing profile, left blank it keeps the stored one.
 */
export function WebphoneExtensionDialog({
  open,
  onOpenChange,
}: WebphoneExtensionDialogProps) {
  const { t } = useTranslation()
  const { data: profile, isLoading } = useMyAgentTelephonyProfile()
  const { data: me } = useMyInfo()
  const update = useUpdateMyAgentTelephonyProfile()
  const create = useCreateMyAgentTelephonyProfile()
  const { requestConnect } = useWebphone()

  const [extension, setExtension] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const isNew = !profile?.id
  const hasSavedPassword = !!profile?.sip_password
  const isSaving = update.isPending || create.isPending

  // Prefill all fields from the user's own profile when the dialog opens,
  // including the stored SIP password (masked behind the reveal toggle).
  // Re-mask on every open so the secret is never shown until the user asks.
  useEffect(() => {
    if (!open) return
    setExtension(profile?.extension ?? '')
    setUsername(profile?.pbx_user_id ?? '')
    setDisplayName(profile?.display_name ?? '')
    setPassword(profile?.sip_password ?? '')
    setShowPassword(false)
  }, [open, profile])

  const canSave = isNew
    ? // Create needs the backend-required extension plus a password to register.
      !!me?.id && extension.trim().length > 0 && password.trim().length > 0
    : (extension.trim().length > 0 || username.trim().length > 0) &&
      (password.trim().length > 0 || hasSavedPassword)

  const onSave = async () => {
    if (!canSave || isSaving) return

    if (isNew) {
      const created = await create.mutateAsync({
        extension: extension.trim(),
        pbx_user_id: username.trim() || undefined,
        sip_password: password.trim() || undefined,
        display_name: displayName.trim() || undefined,
      })
      requestConnect({
        id: created.id ?? '',
        enabled: true,
        webrtc_enabled: true,
        extension: extension.trim(),
        pbx_user_id: username.trim(),
        sip_password: password.trim(),
        display_name: displayName.trim(),
      } satisfies WebphoneAgentProfile)
      onOpenChange(false)
      return
    }

    const nextProfile = {
      ...profile!,
      extension: extension.trim(),
      pbx_user_id: username.trim(),
      display_name: displayName.trim(),
      sip_password: password.trim() || profile!.sip_password,
    }
    await update.mutateAsync({
      profileId: profile!.id,
      extension: nextProfile.extension,
      pbx_user_id: nextProfile.pbx_user_id,
      display_name: nextProfile.display_name,
      sip_password: password.trim() || undefined,
    })
    requestConnect(nextProfile)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('webphone.extension.title')}</DialogTitle>
          <DialogDescription>
            {t('webphone.extension.subtitle')}
          </DialogDescription>
        </DialogHeader>

        {isLoading && !profile ? (
          <p className="px-1 py-2 text-sm text-muted-foreground">
            {t('common.loading')}
          </p>
        ) : (
          <div className="space-y-4">
            {isNew && (
              <p className="rounded-lg border border-sky-500/30 bg-sky-500/5 px-3 py-2 text-xs text-muted-foreground">
                {t('webphone.extension.createHint')}
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ext-extension">
                  {t('webphone.extension.extension')}
                </Label>
                <Input
                  id="ext-extension"
                  value={extension}
                  inputMode="tel"
                  onChange={(event) => setExtension(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ext-username">
                  {t('webphone.extension.username')}
                </Label>
                <Input
                  id="ext-username"
                  value={username}
                  placeholder={extension || undefined}
                  onChange={(event) => setUsername(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {t('webphone.extension.usernameHint')}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ext-password">
                {t('webphone.extension.password')}
              </Label>
              <div className="relative">
                <Input
                  id="ext-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="off"
                  className="pr-9"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute inset-y-0 right-0 flex items-center px-2.5 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={t(
                    showPassword
                      ? 'webphone.extension.hidePassword'
                      : 'webphone.extension.showPassword',
                  )}
                  aria-pressed={showPassword}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                {hasSavedPassword
                  ? t('webphone.extension.passwordHintSaved')
                  : t('webphone.extension.passwordHint')}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ext-display">
                {t('webphone.extension.displayName')}
              </Label>
              <Input
                id="ext-display"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                {t('common.cancel')}
              </Button>
              <Button onClick={onSave} disabled={!canSave || isSaving}>
                {isSaving
                  ? t('common.saving')
                  : t('webphone.extension.saveConnect')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
