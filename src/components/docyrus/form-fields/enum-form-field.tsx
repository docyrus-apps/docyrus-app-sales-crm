'use client'

import { Field, FieldError } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { useUiTranslation } from '@/lib/use-ui-translation'

import { FormFieldLabel } from './form-field-label'
import { EnumOptionDisplay } from './lib/enum-option-display'
import { type DocyrusFormFieldProps } from './types'

export function EnumFormField({
  field: fieldConfig,
  form,
  disabled,
  required,
  className,
  enumOptions = [],
}: DocyrusFormFieldProps) {
  const { t } = useUiTranslation()

  return (
    <form.Field
      name={fieldConfig.slug}
      children={(field: any) => {
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
                {enumOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    <EnumOptionDisplay option={option} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        )
      }}
    />
  )
}
