'use client'

// @ts-nocheck
/* eslint-disable */
import { useId } from 'react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import {
  type AdaptiveCardInputText,
  type AdaptiveCardSelectAction,
} from '../adaptive-card-types'

import {
  useAdaptiveCardContext,
  useAdaptiveCardInput,
} from '../adaptive-card-context'
import { InputShell } from './input-shell'
import { useInputRegister } from './use-input-register'

function inlineActionType(
  action: AdaptiveCardInputText['inlineAction'],
): action is AdaptiveCardSelectAction {
  if (!action) return false

  return (
    action.type === 'Action.OpenUrl' ||
    action.type === 'Action.Submit' ||
    action.type === 'Action.Execute' ||
    action.type === 'Action.ToggleVisibility'
  )
}

export function InputTextElement({
  element,
}: {
  element: AdaptiveCardInputText
}) {
  const ctx = useAdaptiveCardContext()
  const { value, setValue, validation, showError } = useAdaptiveCardInput(
    element.id,
  )
  const inputId = useId()

  useInputRegister(element.id, element.value ?? '')

  const invalid = showError && validation?.isValid === false
  const currentValue = typeof value === 'string' ? value : (element.value ?? '')

  const { inlineAction } = element

  const fieldNode = element.isMultiline ? (
    <Textarea
      id={inputId}
      value={currentValue}
      placeholder={element.placeholder}
      maxLength={element.maxLength}
      aria-required={element.isRequired ? true : undefined}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? `${inputId}-error` : undefined}
      onChange={(event) => setValue(event.target.value)}
      className={cn(invalid ? 'border-destructive' : '')}
    />
  ) : (
    <div className="flex items-stretch gap-2">
      <Input
        id={inputId}
        type={
          element.style && element.style !== 'text' ? element.style : 'text'
        }
        value={currentValue}
        placeholder={element.placeholder}
        maxLength={element.maxLength}
        aria-required={element.isRequired ? true : undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? `${inputId}-error` : undefined}
        onChange={(event) => setValue(event.target.value)}
        className={cn('flex-1', invalid ? 'border-destructive' : '')}
      />
      {inlineActionType(inlineAction) ? (
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={() => {
            const action = inlineAction

            if (!action) return

            if (action.type === 'Action.OpenUrl') ctx.openUrl(action)
            else if (action.type === 'Action.Submit') ctx.submit(action)
            else if (action.type === 'Action.Execute') ctx.execute(action)
            else if (action.type === 'Action.ToggleVisibility')
              ctx.toggleVisibility(action)
            else if (action.type === 'Action.ResetInputs')
              ctx.resetInputs(action)
          }}
        >
          {inlineAction?.title ?? 'Go'}
        </Button>
      ) : null}
    </div>
  )

  return (
    <InputShell input={element} inputId={inputId}>
      {fieldNode}
    </InputShell>
  )
}
