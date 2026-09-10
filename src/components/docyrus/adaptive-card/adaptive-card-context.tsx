'use client'

// @ts-nocheck
/* eslint-disable */
import { createContext, use, type ReactNode } from 'react'

import {
  type AdaptiveCardActionEvent,
  type AdaptiveCardActionExecute,
  type AdaptiveCardActionOpenUrl,
  type AdaptiveCardActionResetInputs,
  type AdaptiveCardActionShowCard,
  type AdaptiveCardActionSubmit,
  type AdaptiveCardActionToggleVisibility,
  type AdaptiveCardChoice,
  type AdaptiveCardHostConfig,
  type AdaptiveCardInputValue,
  type AdaptiveCardPayload,
  type ElementRenderer,
} from './adaptive-card-types'

import { type ValidationResult } from './lib/validate-inputs'

export interface AdaptiveCardContextValue {
  card: AdaptiveCardPayload
  hostConfig: AdaptiveCardHostConfig
  customElements: Record<string, ElementRenderer>
  visibilityOverrides: Record<string, boolean>
  inputs: Record<string, AdaptiveCardInputValue>
  validations: Record<string, ValidationResult>
  showCardOpen: Record<string, boolean>
  hasSubmittedOnce: boolean
  setInput: (id: string, value: AdaptiveCardInputValue) => void
  registerInput: (id: string, initial: AdaptiveCardInputValue) => void
  unregisterInput: (id: string) => void
  submit: (action: AdaptiveCardActionSubmit) => void
  execute: (action: AdaptiveCardActionExecute) => void
  openUrl: (action: AdaptiveCardActionOpenUrl) => void
  toggleVisibility: (action: AdaptiveCardActionToggleVisibility) => void
  toggleShowCard: (action: AdaptiveCardActionShowCard) => void
  resetInputs: (action: AdaptiveCardActionResetInputs) => void
  dispatchEvent: (event: AdaptiveCardActionEvent) => void
  queryChoices: (request: {
    dataset: string
    search: string
    inputId: string
  }) => Promise<Array<AdaptiveCardChoice>>
}

const AdaptiveCardContext = createContext<AdaptiveCardContextValue | null>(null)

export function AdaptiveCardProvider({
  value,
  children,
}: {
  value: AdaptiveCardContextValue
  children: ReactNode
}) {
  return <AdaptiveCardContext value={value}>{children}</AdaptiveCardContext>
}

export function useAdaptiveCardContext(): AdaptiveCardContextValue {
  const ctx = use(AdaptiveCardContext)

  if (!ctx) {
    throw new Error(
      'useAdaptiveCardContext must be used inside <AdaptiveCard /> or <AdaptiveCardView />.',
    )
  }

  return ctx
}

export function useAdaptiveCardInput(id: string) {
  const ctx = useAdaptiveCardContext()

  return {
    value: ctx.inputs[id] ?? null,
    setValue: (next: AdaptiveCardInputValue) => ctx.setInput(id, next),
    validation: ctx.validations[id],
    showError: ctx.hasSubmittedOnce,
  }
}

export function isElementVisible(
  element: { id?: string; isVisible?: boolean },
  overrides: Record<string, boolean>,
): boolean {
  if (element.id && element.id in overrides) {
    return overrides[element.id] === true
  }

  return element.isVisible !== false
}
