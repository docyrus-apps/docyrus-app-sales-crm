'use client'

// @ts-nocheck
/* eslint-disable */
import { Field, FieldError } from '@/components/ui/field'

import {
  PhoneInput,
  PhoneInputCountrySelect,
  PhoneInputField,
} from '@/components/ui/phone-input'

import { FormFieldLabel } from './form-field-label'
import { type DocyrusFormFieldProps } from './types'

import { getCompanionFieldSlug } from './lib/utils'

export function PhoneFormField({
  field: fieldConfig,
  form,
  disabled,
  required,
  className,
}: DocyrusFormFieldProps) {
  const countrySlug = getCompanionFieldSlug(fieldConfig.slug, 'country')

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
            <form.Field name={countrySlug}>
              {(countryField: any) => (
                <PhoneInput
                  value={field.state.value ?? ''}
                  onValueChange={(val) => field.handleChange(val)}
                  country={countryField.state.value ?? ''}
                  onCountryChange={(code) => countryField.handleChange(code)}
                  disabled={disabled || fieldConfig.readOnly === true}
                  invalid={isInvalid}
                >
                  <PhoneInputCountrySelect />
                  <PhoneInputField
                    onBlur={field.handleBlur}
                    aria-invalid={isInvalid}
                  />
                </PhoneInput>
              )}
            </form.Field>
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        )
      }}
    </form.Field>
  )
}
