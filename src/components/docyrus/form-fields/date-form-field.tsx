'use client'

import { useState } from 'react'

import { CalendarIcon } from 'lucide-react'

import { Field, FieldError } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

import { useUiTranslation } from '@/lib/use-ui-translation'
import { useDateFormat } from '@/lib/use-date-format'

import { FormFieldLabel } from './form-field-label'
import { toLocalDateString } from './lib/utils'
import { type DocyrusFormFieldProps } from './types'

export function DateFormField({
  field: fieldConfig,
  form,
  disabled,
  required,
  className,
}: DocyrusFormFieldProps) {
  const { t } = useUiTranslation()
  const { formatDate } = useDateFormat()

  const [open, setOpen] = useState(false)

  return (
    <form.Field
      name={fieldConfig.slug}
      children={(field: any) => {
        const isInvalid =
          field.state.meta.isTouched && !field.state.meta.isValid
        const dateValue = field.state.value
          ? new Date(field.state.value)
          : undefined

        return (
          <Field data-invalid={isInvalid} className={className}>
            <FormFieldLabel htmlFor={field.name} required={required}>
              {fieldConfig.name}
            </FormFieldLabel>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  id={field.name}
                  variant="outline"
                  aria-invalid={isInvalid}
                  onBlur={field.handleBlur}
                  disabled={disabled || fieldConfig.readOnly === true}
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !dateValue && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className="mr-2 size-4" />
                  {dateValue
                    ? formatDate(dateValue)
                    : t('ui.formField.datePickPlaceholder', 'Pick a date')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateValue}
                  onSelect={(date) => {
                    field.handleChange(date ? toLocalDateString(date) : null)
                    setOpen(false)
                  }}
                />
              </PopoverContent>
            </Popover>
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        )
      }}
    />
  )
}
