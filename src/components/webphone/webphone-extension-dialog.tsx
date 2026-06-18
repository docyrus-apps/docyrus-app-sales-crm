import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useWebphone } from './webphone-context'
import {
  useMyAgentTelephonyProfile,
  useUpdateMyAgentTelephonyProfile,
} from '@/hooks/use-webphone-profile'
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
 * telephony profile, then registers (Save & connect). The password is never
 * prefilled — left blank it keeps the stored one.
 */
export function WebphoneExtensionDialog({
  open,
  onOpenChange,
}: WebphoneExtensionDialogProps) {
  const { t } = useTranslation()
  const { data: profile, isLoading } = useMyAgentTelephonyProfile()
  const update = useUpdateMyAgentTelephonyProfile()
  const { requestConnect } = useWebphone()

  const [extension, setExtension] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')

  const hasSavedPassword = !!profile?.sip_password

  // Prefill non-secret fields when the dialog opens; never prefill the password.
  useEffect(() => {
    if (!open) return
    setExtension(profile?.extension ?? '')
    setUsername(profile?.pbx_user_id ?? '')
    setDisplayName(profile?.display_name ?? '')
    setPassword('')
  }, [open, profile])

  const canSave =
    !!profile?.id &&
    (extension.trim().length > 0 || username.trim().length > 0) &&
    (password.trim().length > 0 || hasSavedPassword)

  const onSave = async () => {
    if (!profile?.id || update.isPending) return
    const nextProfile = {
      ...profile,
      extension: extension.trim(),
      pbx_user_id: username.trim(),
      display_name: displayName.trim(),
      sip_password: password.trim() || profile.sip_password,
    }
    await update.mutateAsync({
      profileId: profile.id,
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

        {!isLoading && !profile ? (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm text-muted-foreground">
            {t('webphone.extension.noProfile')}
          </p>
        ) : (
          <div className="space-y-4">
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
              <Input
                id="ext-password"
                type="password"
                autoComplete="off"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
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
                disabled={update.isPending}
              >
                {t('common.cancel')}
              </Button>
              <Button onClick={onSave} disabled={!canSave || update.isPending}>
                {update.isPending
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
