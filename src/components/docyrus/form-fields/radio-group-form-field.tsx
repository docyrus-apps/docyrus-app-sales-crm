'use client'

// @ts-nocheck
/* eslint-disable */
import { useMemo } from 'react'

import { Field, FieldError } from '@/components/ui/field'

import {
  RadioGroup,
  type RadioGroupOption,
} from '@/components/docyrus/radio-group'

import { FormFieldLabel } from './form-field-label'
import { type DocyrusFormFieldProps } from './types'

const EMPTY_ENUM_OPTIONS: never[] = []

export function RadioGroupFormField({
  field: fieldConfig,
  form,
  disabled,
  required,
  className,
  enumOptions = EMPTY_ENUM_OPTIONS,
  variant,
  columnCount = 1,
}: DocyrusFormFieldProps) {
  /*
   * The shared `DocyrusFormFieldProps.variant` uses `'dropdown' | 'card'` to
   * stay aligned with select-style fields; coerce `'dropdown'` (and any other
   * value) to RadioGroup's `'default'`.
   */
  const layout: 'default' | 'card' = variant === 'card' ? 'card' : 'default'

  const options: RadioGroupOption[] = useMemo(
    () =>
      enumOptions.map((o) => ({
        value: o.id,
        label: o.name,
        description: o.description,
        icon: o.icon,
        color: o.color,
      })),
    [enumOptions],
  )

  return (
    <form.Field name={fieldConfig.slug}>
      {(field: any) => {
        const isInvalid =
          field.state.meta.isTouched && !field.state.meta.isValid

        return (
          <Field data-invalid={isInvalid} className={className}>
            <FormFieldLabel required={required}>
              {fieldConfig.name}
            </FormFieldLabel>
            <RadioGroup
              value={field.state.value ?? ''}
              onValueChange={field.handleChange}
              disabled={disabled || fieldConfig.readOnly === true}
              aria-invalid={isInvalid}
              variant={layout}
              columnCount={columnCount}
              options={options}
            />
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        )
      }}
    </form.Field>
  )
}
