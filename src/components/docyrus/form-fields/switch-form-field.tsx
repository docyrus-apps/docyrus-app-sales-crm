'use client'

import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { Switch } from '@/components/ui/switch'

import { type DocyrusFormFieldProps } from './types'

export function SwitchFormField({
  field: fieldConfig,
  form,
  disabled,
  className,
}: DocyrusFormFieldProps) {
  return (
    <form.Field
      name={fieldConfig.slug}
      children={(field: any) => {
        const isInvalid =
          field.state.meta.isTouched && !field.state.meta.isValid

        return (
          <Field
            data-invalid={isInvalid}
            orientation="horizontal"
            className={className}
          >
            <FieldContent>
              <FieldLabel htmlFor={field.name}>{fieldConfig.name}</FieldLabel>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </FieldContent>
            <Switch
              id={field.name}
              checked={!!field.state.value}
              onCheckedChange={field.handleChange}
              onBlur={field.handleBlur}
              aria-invalid={isInvalid}
              disabled={disabled || fieldConfig.readOnly === true}
            />
          </Field>
        )
      }}
    />
  )
}
