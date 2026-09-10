'use client'

// @ts-nocheck
/* eslint-disable */
import { useId } from 'react'

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

import { type AdaptiveCardInputNumber } from '../adaptive-card-types'

import { useAdaptiveCardInput } from '../adaptive-card-context'
import { InputShell } from './input-shell'
import { useInputRegister } from './use-input-register'

export function InputNumberElement({
  element,
}: {
  element: AdaptiveCardInputNumber
}) {
  const { value, setValue, validation, showError } = useAdaptiveCardInput(
    element.id,
  )
  const inputId = useId()

  useInputRegister(
    element.id,
    element.value != null ? String(element.value) : '',
  )

  const invalid = showError && validation?.isValid === false
  const currentValue =
    typeof value === 'string' ? value : value == null ? '' : String(value)

  return (
    <InputShell input={element} inputId={inputId}>
      <Input
        id={inputId}
        type="number"
        inputMode="decimal"
        value={currentValue}
        placeholder={element.placeholder}
        min={element.min}
        max={element.max}
        aria-required={element.isRequired ? true : undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? `${inputId}-error` : undefined}
        onChange={(event) => setValue(event.target.value)}
        className={cn(invalid ? 'border-destructive' : '')}
      />
    </InputShell>
  )
}
