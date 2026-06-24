import { useCallback, useMemo, useState } from 'react'

import { useTranslation } from 'react-i18next'
import { Check, Eye, EyeOff, Loader2, X } from 'lucide-react'

import { toast } from 'sonner'

import { apiClient } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Button } from '@/components/animate-ui/components/buttons/button'
import { Input } from '@/components/ui/input'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel
} from '@/components/ui/field'
import { Progress } from '@/components/ui/progress'
import {
  AwesomeDialog,
  AwesomeDialogBody,
  AwesomeDialogFooter,
  AwesomeDialogHeader
} from '@/components/docyrus/awesome-dialog'

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PasswordFormData {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

function PasswordInput({
  value,
  onChange,
  placeholder,
  ariaInvalid
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  ariaInvalid?: boolean;
}) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <Input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-invalid={ariaInvalid}
        className="pr-10" />
      <button
        type="button"
        tabIndex={-1}
        className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
        onClick={() => setVisible(v => !v)}
        aria-label={
          visible
            ? t('changePassword.hidePassword')
            : t('changePassword.showPassword')
        }>
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}

const EMPTY_FORM: PasswordFormData = {
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
}

export function ChangePasswordDialog({
  open,
  onOpenChange
}: ChangePasswordDialogProps) {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<PasswordFormData>(EMPTY_FORM)
  const [errors, setErrors] = useState<{
    oldPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({})

  const passwordRules = useMemo(
    () => [
      {
        label: t('changePassword.rules.minLength'),
        test: (p: string) => p.length >= 8
      },
      {
        label: t('changePassword.rules.uppercase'),
        test: (p: string) => /[A-Z]/.test(p)
      },
      {
        label: t('changePassword.rules.lowercase'),
        test: (p: string) => /[a-z]/.test(p)
      },
      {
        label: t('changePassword.rules.number'),
        test: (p: string) => /\d/.test(p)
      },
      {
        label: t('changePassword.rules.special'),
        test: (p: string) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p)
      }
    ],
    [t]
  )

  const strengthScore = form.newPassword
    ? passwordRules.filter(rule => rule.test(form.newPassword)).length
    : 0

  const strength = useMemo(() => {
    if (strengthScore <= 1)
      return {
        label: t('changePassword.strengthLabels.veryWeak'),
        color: 'text-red-500'
      }
    if (strengthScore === 2)
      return {
        label: t('changePassword.strengthLabels.weak'),
        color: 'text-orange-500'
      }
    if (strengthScore === 3)
      return {
        label: t('changePassword.strengthLabels.fair'),
        color: 'text-yellow-500'
      }
    if (strengthScore === 4)
      return {
        label: t('changePassword.strengthLabels.strong'),
        color: 'text-blue-500'
      }

    return {
      label: t('changePassword.strengthLabels.veryStrong'),
      color: 'text-green-500'
    }
  }, [strengthScore, t])

  function getProgressColor(score: number): string {
    if (score <= 1) return '[&>div]:bg-red-500'
    if (score === 2) return '[&>div]:bg-orange-500'
    if (score === 3) return '[&>div]:bg-yellow-500'
    if (score === 4) return '[&>div]:bg-blue-500'

    return '[&>div]:bg-green-500'
  }

  const allRulesMet = strengthScore === passwordRules.length

  const handleChange = useCallback(
    (field: keyof PasswordFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(prev => ({ ...prev, [field]: e.target.value }))
        setErrors(prev => ({ ...prev, [field]: undefined }))
      },
    []
  )

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        setForm(EMPTY_FORM)
        setErrors({})
      }
      onOpenChange(nextOpen)
    },
    [onOpenChange]
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const newErrors: typeof errors = {}

      if (!form.oldPassword) {
        newErrors.oldPassword = t('changePassword.currentPasswordRequired')
      }

      if (!form.newPassword) {
        newErrors.newPassword = t('changePassword.newPasswordRequired')
      } else if (!allRulesMet) {
        newErrors.newPassword = t('changePassword.passwordRequirements')
      }

      if (!form.confirmPassword) {
        newErrors.confirmPassword = t('changePassword.confirmPasswordRequired')
      } else if (form.newPassword !== form.confirmPassword) {
        newErrors.confirmPassword = t('changePassword.passwordsDoNotMatch')
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)

        return
      }

      setSaving(true)
      try {
        await apiClient.put('/v1/users/me/password', {
          oldPassword: form.oldPassword,
          newPassword: form.newPassword
        })
        setForm(EMPTY_FORM)
        toast.success(t('changePassword.passwordChanged'))
        handleOpenChange(false)
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : typeof err === 'object' &&
              err !== null &&
              'message' in err &&
              typeof (err as Record<string, unknown>).message === 'string'
              ? (err as Record<string, string>).message
              : t('changePassword.passwordChangeFailed')

        toast.error(message)
      } finally {
        setSaving(false)
      }
    },
    [
form,
allRulesMet,
handleOpenChange,
t
]
  )

  return (
    <AwesomeDialog
      open={open}
      onOpenChange={handleOpenChange}
      container="modal"
      size="default">
      <AwesomeDialogHeader
        title={t('changePassword.title')}
        description={t('changePassword.description')} />
      <AwesomeDialogBody>
        <form id="change-password-form" onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel>{t('changePassword.currentPassword')}</FieldLabel>
              <PasswordInput
                value={form.oldPassword}
                onChange={handleChange('oldPassword')}
                placeholder={t('changePassword.currentPassword')}
                ariaInvalid={!!errors.oldPassword} />
              {errors.oldPassword && (
                <FieldError>{errors.oldPassword}</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel>{t('changePassword.newPassword')}</FieldLabel>
              <PasswordInput
                value={form.newPassword}
                onChange={handleChange('newPassword')}
                placeholder={t('changePassword.newPassword')}
                ariaInvalid={!!errors.newPassword} />
              {errors.newPassword && (
                <FieldError>{errors.newPassword}</FieldError>
              )}
            </Field>

            {/* Strength indicator */}
            {form.newPassword && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t('changePassword.strength')}
                  </span>
                  <span className={cn('font-medium', strength.color)}>
                    {strength.label}
                  </span>
                </div>
                <Progress
                  value={(strengthScore / passwordRules.length) * 100}
                  className={cn('h-2', getProgressColor(strengthScore))} />

                <ul className="space-y-1.5">
                  {passwordRules.map((rule) => {
                    const passed = rule.test(form.newPassword)

                    return (
                      <li
                        key={rule.label}
                        className={cn(
                          'flex items-center gap-2 text-sm',
                          passed
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-muted-foreground'
                        )}>
                        {passed ? (
                          <Check className="size-3.5 shrink-0" />
                        ) : (
                          <X className="size-3.5 shrink-0" />
                        )}
                        {rule.label}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            <Field>
              <FieldLabel>{t('changePassword.confirmPassword')}</FieldLabel>
              <PasswordInput
                value={form.confirmPassword}
                onChange={handleChange('confirmPassword')}
                placeholder={t('changePassword.confirmPassword')}
                ariaInvalid={!!errors.confirmPassword} />
              {errors.confirmPassword && (
                <FieldError>{errors.confirmPassword}</FieldError>
              )}
            </Field>
          </FieldGroup>
        </form>
      </AwesomeDialogBody>
      <AwesomeDialogFooter>
        <Button variant="outline" onClick={() => handleOpenChange(false)}>
          {t('common.cancel')}
        </Button>
        <Button
          type="submit"
          form="change-password-form"
          disabled={saving || !allRulesMet}>
          {saving && <Loader2 className="animate-spin" />}
          {t('changePassword.changeButton')}
        </Button>
      </AwesomeDialogFooter>
    </AwesomeDialog>
  )
}
