'use client'

// @ts-nocheck
/* eslint-disable */
import { useId } from 'react'

import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

import { type AdaptiveCardInputToggle } from '../adaptive-card-types'

import { useAdaptiveCardInput } from '../adaptive-card-context'
import { useInputRegister } from './use-input-register'

export function InputToggleElement({
  element,
}: {
  element: AdaptiveCardInputToggle
}) {
  const valueOn = element.valueOn ?? 'true'
  const valueOff = element.valueOff ?? 'false'
  const initial = element.value ?? valueOff

  const { value, setValue, validation, showError } = useAdaptiveCardInput(
    element.id,
  )
  const inputId = useId()

  useInputRegister(element.id, initial)

  const invalid = showError && validation?.isValid === false
  const currentValue = typeof value === 'string' ? value : initial
  const checked = currentValue === valueOn

  return (
    <div className="flex w-full flex-col gap-1">
      <div className="flex items-center gap-2">
        <Switch
          id={inputId}
          checked={checked}
          aria-required={element.isRequired ? true : undefined}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? `${inputId}-error` : undefined}
          onCheckedChange={(next) => setValue(next ? valueOn : valueOff)}
        />
        {element.title || element.label ? (
          <Label
            htmlFor={inputId}
            className={cn(
              'text-sm font-medium leading-snug',
              element.wrap !== false
                ? 'whitespace-normal break-words'
                : 'whitespace-nowrap',
              invalid ? 'text-destructive' : '',
            )}
          >
            {element.title ?? element.label}
            {element.isRequired ? (
              <span aria-hidden="true" className="ml-0.5 text-destructive">
                *
              </span>
            ) : null}
          </Label>
        ) : null}
      </div>
      {invalid ? (
        <p
          id={`${inputId}-error`}
          role="alert"
          className="text-xs text-destructive"
        >
          {validation?.errorMessage}
        </p>
      ) : null}
    </div>
  )
}
