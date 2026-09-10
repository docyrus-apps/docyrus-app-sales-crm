'use client'

// @ts-nocheck
/* eslint-disable */
import { type ReactNode } from 'react'

import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'

import { type AdaptiveCardInput } from '../adaptive-card-types'

import { useAdaptiveCardInput } from '../adaptive-card-context'

export function InputShell({
  input,
  children,
  inputId,
}: {
  input: AdaptiveCardInput
  inputId: string
  children: ReactNode
}) {
  const { validation, showError } = useAdaptiveCardInput(input.id)
  const showValidationError = showError && validation?.isValid === false
  const labelPosition = input.labelPosition ?? 'above'
  const labelEl = input.label ? (
    <Label
      htmlFor={inputId}
      className={cn(
        'text-sm font-medium',
        showValidationError ? 'text-destructive' : '',
      )}
    >
      {input.label}
      {input.isRequired ? (
        <span aria-hidden="true" className="ml-0.5 text-destructive">
          *
        </span>
      ) : null}
    </Label>
  ) : null

  return (
    <div
      className={cn(
        'flex w-full gap-2',
        labelPosition === 'inline' ? 'flex-row items-center' : 'flex-col',
      )}
    >
      {labelEl}
      <div className="flex w-full flex-col gap-1">
        {children}
        {showValidationError ? (
          <p
            id={`${inputId}-error`}
            role="alert"
            className="text-xs text-destructive"
          >
            {validation?.errorMessage}
          </p>
        ) : null}
      </div>
    </div>
  )
}
