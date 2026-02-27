'use client'

import { DocyrusIcon } from '@/components/docyrus/docyrus-icon'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { type DocyrusFormFieldProps } from './types'

export function EnumFormField({
  field: fieldConfig,
  form,
  disabled,
  className,
  enumOptions = [],
}: DocyrusFormFieldProps) {
  return (
    <form.Field
      name={fieldConfig.slug}
      children={(field: any) => {
        const isInvalid =
          field.state.meta.isTouched && !field.state.meta.isValid

        return (
          <Field data-invalid={isInvalid} className={className}>
            <FieldLabel htmlFor={field.name}>{fieldConfig.name}</FieldLabel>
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
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {enumOptions.map((option) => (
                  <SelectItem
                    key={option.slug ?? option.id}
                    value={option.slug ?? option.name}
                  >
                    <span className="flex items-center gap-2">
                      {option.icon ? (
                        <DocyrusIcon
                          icon={option.icon}
                          className="size-4 shrink-0"
                        />
                      ) : option.color ? (
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: option.color }}
                        />
                      ) : null}
                      {option.name}
                    </span>
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
