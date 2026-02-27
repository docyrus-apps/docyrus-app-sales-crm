'use client'

import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { DurationSelect } from '@/components/docyrus/duration-select'

import { type DocyrusFormFieldProps } from './types'

export function DurationFormField({
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
        const isDisabled = disabled || fieldConfig.readOnly === true

        return (
          <Field data-invalid={isInvalid} className={className}>
            <FieldLabel htmlFor={field.name}>{fieldConfig.name}</FieldLabel>
            <DurationSelect
              value={field.state.value}
              onChange={(seconds) => field.handleChange(seconds)}
              disabled={isDisabled}
              invalid={isInvalid}
              format="compact"
              minuteIncrement={5}
              maxHours={8}
            />
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        )
      }}
    />
  )
}
