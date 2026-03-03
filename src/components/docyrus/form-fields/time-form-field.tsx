'use client'

import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import {
  TimePicker,
  TimePickerContent,
  TimePickerHour,
  TimePickerInput,
  TimePickerInputGroup,
  TimePickerMinute,
  TimePickerSeparator,
  TimePickerTrigger,
} from '@/components/ui/time-picker'

import { type DocyrusFormFieldProps } from './types'

export function TimeFormField({
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
            <TimePicker
              value={field.state.value ?? ''}
              onValueChange={(value) => {
                field.handleChange(value || null)
              }}
              disabled={isDisabled}
              invalid={isInvalid}
            >
              <TimePickerInputGroup
                className="has-focus-visible:border-ring has-focus-visible:ring-ring/50 flex h-9 w-full items-center rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs has-focus-visible:ring-[3px]"
                onBlur={field.handleBlur}
              >
                <TimePickerInput segment="hour" />
                <TimePickerSeparator />
                <TimePickerInput segment="minute" />
                <TimePickerTrigger />
              </TimePickerInputGroup>
              <TimePickerContent>
                <TimePickerHour />
                <TimePickerMinute />
              </TimePickerContent>
            </TimePicker>
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        )
      }}
    />
  )
}
