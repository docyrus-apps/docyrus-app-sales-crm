'use client'

// @ts-nocheck
/* eslint-disable */
import { Field, FieldError } from '@/components/ui/field'

import { Combobox } from '@/components/ui/combobox-simple'

import { FormFieldLabel } from './form-field-label'
import { type DocyrusFormFieldProps } from './types'

import { COMMON_CURRENCIES } from './lib/utils'

export function CurrencyCodeFormField({
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
          <Field data-invalid={isInvalid} className={className}>
            <FormFieldLabel htmlFor={field.name} required={required}>
              {fieldConfig.name}
            </FormFieldLabel>
            <Combobox
              options={COMMON_CURRENCIES.map((currency) => ({
                label: `${currency.code} - ${currency.name}`,
                value: currency.code,
              }))}
              value={field.state.value ?? ''}
              onValueChange={field.handleChange}
              disabled={disabled || fieldConfig.readOnly === true}
              className="w-full"
              placeholder="Select currency..."
            />
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        )
      }}
    </form.Field>
  )
}
