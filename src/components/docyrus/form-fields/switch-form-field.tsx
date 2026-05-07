'use client'

import { Field, FieldContent, FieldError } from '@/components/ui/field'
import { Switch } from '@/components/ui/switch'

import { FormFieldLabel } from './form-field-label'
import { type DocyrusFormFieldProps } from './types'

export function SwitchFormField({
  field: fieldConfig,
  form,
  disabled,
  required,
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
              <FormFieldLabel htmlFor={field.name} required={required}>
                {fieldConfig.name}
              </FormFieldLabel>
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
