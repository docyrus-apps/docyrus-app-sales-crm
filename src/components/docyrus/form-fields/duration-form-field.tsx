'use client'

import { Field, FieldError } from '@/components/ui/field'
import { DurationSelect } from '@/components/docyrus/duration-select'

import { FormFieldLabel } from './form-field-label'
import { type DocyrusFormFieldProps } from './types'

export function DurationFormField({
  field: fieldConfig,
  form,
  disabled,
  required,
  className,
}: DocyrusFormFieldProps) {
  const editorOpts = fieldConfig.options?.editorOptions as
    | Record<string, unknown>
    | undefined
  const minuteIncrement = Number(editorOpts?.increment) || 5
  const maxHours = editorOpts?.maxValue
    ? Math.ceil(Number(editorOpts.maxValue) / 3600)
    : 8

  return (
    <form.Field
      name={fieldConfig.slug}
      children={(field: any) => {
        const isInvalid =
          field.state.meta.isTouched && !field.state.meta.isValid
        const isDisabled = disabled || fieldConfig.readOnly === true

        return (
          <Field data-invalid={isInvalid} className={className}>
            <FormFieldLabel htmlFor={field.name} required={required}>
              {fieldConfig.name}
            </FormFieldLabel>
            <DurationSelect
              value={field.state.value}
              onChange={(seconds) => field.handleChange(seconds)}
              disabled={isDisabled}
              invalid={isInvalid}
              format="compact"
              minuteIncrement={minuteIncrement}
              maxHours={maxHours}
            />
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        )
      }}
    />
  )
}
