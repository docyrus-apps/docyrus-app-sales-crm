'use client'

// @ts-nocheck
/* eslint-disable */
import { useId, useState } from 'react'

import { CalendarIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

import { type AdaptiveCardInputDate } from '../adaptive-card-types'

import { useAdaptiveCardInput } from '../adaptive-card-context'
import { InputShell } from './input-shell'
import { useInputRegister } from './use-input-register'

function parseISO(value: string | undefined): Date | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined
  const parts = value.split('-').map(Number)
  const y = parts[0] ?? 0
  const m = parts[1] ?? 1
  const d = parts[2] ?? 1
  const date = new Date(y, m - 1, d)

  if (Number.isNaN(date.getTime())) return undefined

  return date
}

function formatISO(date: Date | undefined): string {
  if (!date) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')

  return `${y}-${m}-${d}`
}

export function InputDateElement({
  element,
}: {
  element: AdaptiveCardInputDate
}) {
  const { value, setValue, validation, showError } = useAdaptiveCardInput(
    element.id,
  )
  const inputId = useId()
  const [open, setOpen] = useState(false)

  useInputRegister(element.id, element.value ?? '')

  const invalid = showError && validation?.isValid === false
  const currentValue = typeof value === 'string' ? value : (element.value ?? '')
  const dateValue = parseISO(currentValue)
  const minDate = parseISO(element.min)
  const maxDate = parseISO(element.max)

  return (
    <InputShell input={element} inputId={inputId}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={inputId}
            type="button"
            variant="outline"
            aria-required={element.isRequired ? true : undefined}
            aria-invalid={invalid || undefined}
            aria-describedby={invalid ? `${inputId}-error` : undefined}
            className={cn(
              'w-full justify-start text-left font-normal',
              !currentValue ? 'text-muted-foreground' : '',
              invalid ? 'border-destructive' : '',
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {currentValue || element.placeholder || 'Pick a date'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dateValue}
            onSelect={(date) => {
              setValue(formatISO(date))
              setOpen(false)
            }}
            disabled={
              minDate || maxDate
                ? (date) => {
                    if (minDate && date < minDate) return true
                    if (maxDate && date > maxDate) return true

                    return false
                  }
                : undefined
            }
          />
        </PopoverContent>
      </Popover>
    </InputShell>
  )
}
