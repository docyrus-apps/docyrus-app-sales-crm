'use client'

// @ts-nocheck
/* eslint-disable */
import { useMemo } from 'react'

import { Field, FieldError } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation'

import { FormFieldLabel } from './form-field-label'
import { EnumOptionDisplay } from './lib/enum-option-display'
import { flattenNestedOptions } from './lib/utils'
import { type DocyrusFormFieldProps, type EnumOption } from './types'

const EMPTY_ENUM_OPTIONS: never[] = []

export function SelectFormField({
  field: fieldConfig,
  form,
  disabled,
  required,
  className,
  enumOptions = EMPTY_ENUM_OPTIONS,
}: DocyrusFormFieldProps) {
  const { t } = useUiTranslation()
  const isNested = fieldConfig.nested === true
  const nestedByProp = fieldConfig.nestedByProp ?? 'parent'

  const flatOptions = useMemo(
    () => (isNested ? flattenNestedOptions(enumOptions, nestedByProp) : null),
    [enumOptions, isNested, nestedByProp],
  )

  const renderOption = (option: EnumOption, depth = 0) => (
    <SelectItem
      key={option.id}
      value={option.id}
      style={
        depth > 0 ? { paddingLeft: `${0.5 + depth * 1.25}rem` } : undefined
      }
    >
      <EnumOptionDisplay option={option} />
    </SelectItem>
  )

  return (
    <form.Field name={fieldConfig.slug}>
      {(field: any) => {
        const isInvalid =
          field.state.meta.isTouched && !field.state.meta.isValid

        const selectedOption = enumOptions.find(
          (option) => option.id === (field.state.value ?? ''),
        )

        return (
          <Field data-invalid={isInvalid} className={className}>
            <FormFieldLabel htmlFor={field.name} required={required}>
              {fieldConfig.name}
            </FormFieldLabel>
            <Select
              value={field.state.value ?? ''}
              onValueChange={field.handleChange}
              disabled={disabled || fieldConfig.readOnly === true}
            >
              <SelectTrigger
                id={field.name}
                aria-invalid={isInvalid}
                onBlur={field.handleBlur}
                className="w-full"
              >
                <SelectValue
                  placeholder={t('ui.formField.selectPlaceholder', 'Select...')}
                >
                  {selectedOption ? (
                    <EnumOptionDisplay option={selectedOption} />
                  ) : null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {flatOptions
                  ? flatOptions.map(({ option, depth }) =>
                      renderOption(option, depth),
                    )
                  : enumOptions.map((option) => renderOption(option))}
              </SelectContent>
            </Select>
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        )
      }}
    </form.Field>
  )
}
