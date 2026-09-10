'use client'

// @ts-nocheck
/* eslint-disable */
import { Field, FieldContent, FieldError } from '@/components/ui/field'
import { Checkbox } from '@/components/ui/checkbox'

import { FormFieldLabel } from './form-field-label'
import { type DocyrusFormFieldProps } from './types'

export function CheckboxFormField({
  field: fieldConfig,
  form,
  disabled,
  required,
  className,
}: DocyrusFormFieldProps) {
  return (
    <form.Field name={fieldConfig.slug}>
      {(field: any) => {
        const isInvalid =
          field.state.meta.isTouched && !field.state.meta.isValid

        return (
          <Field
            data-invalid={isInvalid}
            orientation="horizontal"
            className={className}
          >
            <Checkbox
              id={field.name}
              checked={!!field.state.value}
              onCheckedChange={field.handleChange}
              onBlur={field.handleBlur}
              aria-invalid={isInvalid}
              disabled={disabled || fieldConfig.readOnly === true}
            />
            <FieldContent>
              <FormFieldLabel htmlFor={field.name} required={required}>
                {fieldConfig.name}
              </FormFieldLabel>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </FieldContent>
          </Field>
        )
      }}
    </form.Field>
  )
}
