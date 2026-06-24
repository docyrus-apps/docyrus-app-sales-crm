'use client'

// @ts-nocheck
/* eslint-disable */
import { useId } from 'react'

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

import { type AdaptiveCardInputTime } from '../adaptive-card-types'

import { useAdaptiveCardInput } from '../adaptive-card-context'
import { InputShell } from './input-shell'
import { useInputRegister } from './use-input-register'

export function InputTimeElement({
  element,
}: {
  element: AdaptiveCardInputTime
}) {
  const { value, setValue, validation, showError } = useAdaptiveCardInput(
    element.id,
  )
  const inputId = useId()

  useInputRegister(element.id, element.value ?? '')

  const invalid = showError && validation?.isValid === false
  const currentValue = typeof value === 'string' ? value : (element.value ?? '')

  return (
    <InputShell input={element} inputId={inputId}>
      <Input
        id={inputId}
        type="time"
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
