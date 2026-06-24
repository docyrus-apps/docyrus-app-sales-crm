'use client'

// @ts-nocheck
/* eslint-disable */
import { Field, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { FormFieldLabel } from './form-field-label'
import { COMMON_CURRENCIES, getCompanionFieldSlug } from './lib/utils'
import { type DocyrusFormFieldProps } from './types'

export function MoneyFormField({
  field: fieldConfig,
  form,
  disabled,
  required,
  className,
}: DocyrusFormFieldProps) {
  const currencySlug = getCompanionFieldSlug(fieldConfig.slug, 'currency')

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
            <div className="flex gap-2">
              <Input
                id={field.name}
                name={field.name}
                type="number"
                step="0.01"
                value={field.state.value ?? ''}
                onBlur={field.handleBlur}
                onChange={(e) => {
                  const val = e.target.value

                  field.handleChange(val === '' ? null : Number(val))
                }}
                aria-invalid={isInvalid}
                disabled={disabled || fieldConfig.readOnly === true}
                className="flex-1"
              />
              <form.Field name={currencySlug}>
                {(currencyField: any) => (
                  <Select
                    value={currencyField.state.value ?? 'USD'}
                    onValueChange={currencyField.handleChange}
                    disabled={disabled || fieldConfig.readOnly === true}
                  >
                    <SelectTrigger
                      onBlur={currencyField.handleBlur}
                      className="w-24 shrink-0"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_CURRENCIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </form.Field>
            </div>
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        )
      }}
    </form.Field>
  )
}
