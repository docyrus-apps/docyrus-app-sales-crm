'use client'

// @ts-nocheck
/* eslint-disable */
import { useState } from 'react'

import { Eye, EyeOff } from 'lucide-react'

import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation'
import { Button } from '@/components/ui/button'
import { Field, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

import { FormFieldLabel } from './form-field-label'
import { type DocyrusFormFieldProps } from './types'

export function PasswordFormField({
  field: fieldConfig,
  form,
  disabled,
  required,
  className,
}: DocyrusFormFieldProps) {
  const { t } = useUiTranslation()
  const [revealed, setRevealed] = useState(false)

  return (
    <form.Field name={fieldConfig.slug}>
      {(field: any) => {
        const isInvalid =
          field.state.meta.isTouched && !field.state.meta.isValid
        const isDisabled = disabled || fieldConfig.readOnly === true

        return (
          <Field data-invalid={isInvalid} className={className}>
            <FormFieldLabel htmlFor={field.name} required={required}>
              {fieldConfig.name}
            </FormFieldLabel>
            <div className="relative">
              <Input
                id={field.name}
                name={field.name}
                type={revealed ? 'text' : 'password'}
                autoComplete="new-password"
                value={field.state.value ?? ''}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                disabled={isDisabled}
                className="pr-9"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                tabIndex={-1}
                disabled={isDisabled}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setRevealed((prev) => !prev)}
                aria-label={
                  revealed
                    ? t('ui.formFields.passwordHide', 'Hide password')
                    : t('ui.formFields.passwordShow', 'Show password')
                }
                className="absolute right-0.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {revealed ? <EyeOff /> : <Eye />}
              </Button>
            </div>
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        )
      }}
    </form.Field>
  )
}
