'use client'

// @ts-nocheck
/* eslint-disable */
import { useRef, useState } from 'react'

import { CalendarIcon } from 'lucide-react'

import { type DateRange } from 'react-day-picker'

import { Field, FieldError } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation'
import { useDateFormat } from '@/hooks/docyrus/use-date-format'

import { FormFieldLabel } from './form-field-label'
import { parseDateRange, toLocalDateString } from './lib/utils'
import { type DocyrusFormFieldProps } from './types'

export function DateRangeFormField({
  field: fieldConfig,
  form,
  disabled,
  required,
  className,
}: DocyrusFormFieldProps) {
  const { t } = useUiTranslation()
  const { formatDate } = useDateFormat()

  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<DateRange | undefined>(undefined)
  const snapshotRef = useRef<string | null>(null)

  return (
    <form.Field name={fieldConfig.slug}>
      {(field: any) => {
        const isInvalid =
          field.state.meta.isTouched && !field.state.meta.isValid
        const parsed = parseDateRange(field.state.value)
        const dateRange: DateRange | undefined = parsed
          ? { from: parsed.start, to: parsed.end }
          : undefined
        const displayValue = open ? draft : dateRange

        function handleOpenChange(nextOpen: boolean) {
          if (nextOpen) {
            snapshotRef.current = field.state.value ?? null
            setDraft(dateRange ? { ...dateRange } : undefined)
          }

          setOpen(nextOpen)
        }

        function handleOk() {
          if (draft?.from && draft.to) {
            field.handleChange(
              `[${toLocalDateString(draft.from)}, ${toLocalDateString(draft.to)}]`,
            )
          } else if (draft?.from) {
            field.handleChange(
              `[${toLocalDateString(draft.from)}, ${toLocalDateString(draft.from)}]`,
            )
          } else {
            field.handleChange(null)
          }

          setOpen(false)
        }

        function handleCancel() {
          field.handleChange(snapshotRef.current)
          setOpen(false)
        }

        return (
          <Field data-invalid={isInvalid} className={className}>
            <FormFieldLabel htmlFor={field.name} required={required}>
              {fieldConfig.name}
            </FormFieldLabel>
            <Popover open={open} onOpenChange={handleOpenChange}>
              <PopoverTrigger asChild>
                <Button
                  id={field.name}
                  variant="outline"
                  aria-invalid={isInvalid}
                  onBlur={field.handleBlur}
                  disabled={disabled || fieldConfig.readOnly === true}
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !dateRange && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className="mr-2 size-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {formatDate(dateRange.from)} -{' '}
                        {formatDate(dateRange.to)}
                      </>
                    ) : (
                      formatDate(dateRange.from)
                    )
                  ) : (
                    t(
                      'ui.formField.dateRangePickPlaceholder',
                      'Pick a date range',
                    )
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={displayValue}
                  onSelect={setDraft}
                  numberOfMonths={2}
                />
                <div className="flex items-center justify-end gap-2 border-t p-2">
                  <Button variant="ghost" size="sm" onClick={handleCancel}>
                    {t('ui.common.cancel', 'Cancel')}
                  </Button>
                  <Button size="sm" onClick={handleOk}>
                    {t('ui.formField.ok', 'Ok')}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        )
      }}
    </form.Field>
  )
}
