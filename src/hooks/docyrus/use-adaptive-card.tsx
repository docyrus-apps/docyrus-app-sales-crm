'use client'

// @ts-nocheck
/* eslint-disable */
import { useCallback, useMemo, useRef, useState } from 'react'

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
  type AdaptiveCardHostConfigOverride,
  type AdaptiveCardInputValue,
  type AdaptiveCardPayload,
  type AdaptiveCardToggleVisibilityTarget,
  type ElementRenderer,
} from '@/components/docyrus/adaptive-card/adaptive-card-types'

import {
  defaultHostConfig,
  mergeHostConfig,
} from '@/components/docyrus/adaptive-card/lib/default-host-config'
import {
  buildSubmitData,
  collectInputs,
} from '@/components/docyrus/adaptive-card/lib/collect-inputs'
import {
  validateInputs,
  type ValidationResult,
} from '@/components/docyrus/adaptive-card/lib/validate-inputs'

import { type AdaptiveCardContextValue } from '@/components/docyrus/adaptive-card/adaptive-card-context'

export interface AdaptiveCardChoiceQueryRequest {
  dataset: string
  search: string
  inputId: string
}

export interface UseAdaptiveCardOptions {
  onAction?: (event: AdaptiveCardActionEvent) => void | Promise<void>
  hostConfig?: AdaptiveCardHostConfigOverride
  customElements?: Record<string, ElementRenderer>
  /*
   * Async resolver for `Input.ChoiceSet.choices.data` (`Data.Query`). When a
   * filtered ChoiceSet declares a dataset, the renderer debounces user input
   * and invokes this callback. Returned choices are merged with the static
   * `choices` array.
   */
  onChoiceQuery?: (
    request: AdaptiveCardChoiceQueryRequest,
  ) => Promise<Array<AdaptiveCardChoice>>
}

export interface UseAdaptiveCardReturn {
  card: AdaptiveCardPayload
  hostConfig: AdaptiveCardHostConfig
  state: {
    inputs: Record<string, AdaptiveCardInputValue>
    validations: Record<string, ValidationResult>
    visibilityOverrides: Record<string, boolean>
    showCardOpen: Record<string, boolean>
    hasSubmittedOnce: boolean
  }
  controls: {
    setInput: (id: string, value: AdaptiveCardInputValue) => void
    submit: (action: AdaptiveCardActionSubmit) => void
    execute: (action: AdaptiveCardActionExecute) => void
    openUrl: (action: AdaptiveCardActionOpenUrl) => void
    toggleVisibility: (action: AdaptiveCardActionToggleVisibility) => void
    toggleShowCard: (action: AdaptiveCardActionShowCard) => void
    resetInputs: (action: AdaptiveCardActionResetInputs) => void
    validateAll: () => {
      ok: boolean
      firstInvalidId?: string
      errors: Record<string, ValidationResult>
    }
    reset: () => void
  }
  cardProps: AdaptiveCardContextValue
}

export type { AdaptiveCardInputValue }

function normalizeTargets(
  targets: Array<string | AdaptiveCardToggleVisibilityTarget>,
): Array<AdaptiveCardToggleVisibilityTarget> {
  return targets.map((t) => (typeof t === 'string' ? { elementId: t } : t))
}

export function useAdaptiveCard(
  card: AdaptiveCardPayload,
  options: UseAdaptiveCardOptions = {},
): UseAdaptiveCardReturn {
  const hostConfig = useMemo(
    () => mergeHostConfig(defaultHostConfig, options.hostConfig),
    [options.hostConfig],
  )

  const customElements = useMemo(
    () => options.customElements ?? {},
    [options.customElements],
  )

  const [inputs, setInputs] = useState<Record<string, AdaptiveCardInputValue>>(
    {},
  )
  const [visibilityOverrides, setVisibilityOverrides] = useState<
    Record<string, boolean>
  >({})
  const [showCardOpen, setShowCardOpen] = useState<Record<string, boolean>>({})
  const [hasSubmittedOnce, setHasSubmittedOnce] = useState(false)

  const inputsRef = useRef(inputs)

  inputsRef.current = inputs
  const overridesRef = useRef(visibilityOverrides)

  overridesRef.current = visibilityOverrides
  const onActionRef = useRef(options.onAction)

  onActionRef.current = options.onAction

  const registerInput = useCallback(
    (id: string, initial: AdaptiveCardInputValue) => {
      setInputs((prev) => {
        if (id in prev) return prev

        return { ...prev, [id]: initial }
      })
    },
    [],
  )

  const unregisterInput = useCallback((id: string) => {
    setInputs((prev) => {
      if (!(id in prev)) return prev
      const next = { ...prev }

      delete next[id]

      return next
    })
  }, [])

  const setInput = useCallback((id: string, value: AdaptiveCardInputValue) => {
    setInputs((prev) => ({ ...prev, [id]: value }))
  }, [])

  const validations = useMemo<Record<string, ValidationResult>>(() => {
    const allInputs = collectInputs(card.body, visibilityOverrides)

    return validateInputs(allInputs, inputs)
  }, [card, inputs, visibilityOverrides])

  const validateAll = useCallback(() => {
    const allInputs = collectInputs(card.body, overridesRef.current)
    const errors = validateInputs(allInputs, inputsRef.current)
    const firstInvalid = allInputs.find(
      (input) => errors[input.id]?.isValid === false,
    )

    return {
      ok: !firstInvalid,
      firstInvalidId: firstInvalid?.id,
      errors,
    }
  }, [card])

  const dispatchEvent = useCallback((event: AdaptiveCardActionEvent) => {
    onActionRef.current?.(event)
  }, [])

  const submit = useCallback(
    (action: AdaptiveCardActionSubmit) => {
      const result = validateAll()

      if (!result.ok) {
        setHasSubmittedOnce(true)

        if (result.firstInvalidId) {
          const node = document.querySelector(
            `[data-ac-id="${result.firstInvalidId}"] [aria-invalid="true"]`,
          )

          if (node instanceof HTMLElement) node.focus()
        }

        return
      }

      const data = buildSubmitData(
        action,
        card,
        inputsRef.current,
        overridesRef.current,
      )

      dispatchEvent({
        type: 'submit',
        data,
        action,
        card,
      })
    },
    [card, dispatchEvent, validateAll],
  )

  const execute = useCallback(
    (action: AdaptiveCardActionExecute) => {
      const result = validateAll()

      if (!result.ok) {
        setHasSubmittedOnce(true)

        if (result.firstInvalidId) {
          const node = document.querySelector(
            `[data-ac-id="${result.firstInvalidId}"] [aria-invalid="true"]`,
          )

          if (node instanceof HTMLElement) node.focus()
        }

        return
      }

      const data = buildSubmitData(
        action,
        card,
        inputsRef.current,
        overridesRef.current,
      )

      dispatchEvent({
        type: 'execute',
        verb: action.verb,
        data,
        action,
        card,
      })
    },
    [card, dispatchEvent, validateAll],
  )

  const openUrl = useCallback(
    (action: AdaptiveCardActionOpenUrl) => {
      dispatchEvent({
        type: 'openUrl',
        url: action.url,
        action,
        card,
      })
    },
    [card, dispatchEvent],
  )

  const toggleVisibility = useCallback(
    (action: AdaptiveCardActionToggleVisibility) => {
      const targets = normalizeTargets(action.targetElements)

      setVisibilityOverrides((prev) => {
        const next = { ...prev }

        for (const target of targets) {
          if (typeof target.isVisible === 'boolean') {
            next[target.elementId] = target.isVisible
          } else if (target.elementId in next) {
            next[target.elementId] = !next[target.elementId]
          } else {
            /*
             * No prior override — assume previous state was the static `isVisible` (default true)
             * so the toggle hides it.
             */
            next[target.elementId] = false
          }
        }

        return next
      })

      dispatchEvent({ type: 'toggleVisibility', action, card })
    },
    [card, dispatchEvent],
  )

  const toggleShowCard = useCallback(
    (action: AdaptiveCardActionShowCard) => {
      const id = action.id ?? action.title ?? 'show-card'

      let nextOpen = false

      setShowCardOpen((prev) => {
        const open = !prev[id]

        nextOpen = open

        return { ...prev, [id]: open }
      })

      queueMicrotask(() => {
        dispatchEvent({
          type: 'showCard',
          isOpen: nextOpen,
          action,
          card,
        })
      })
    },
    [card, dispatchEvent],
  )

  const reset = useCallback(() => {
    setInputs({})
    setVisibilityOverrides({})
    setShowCardOpen({})
    setHasSubmittedOnce(false)
  }, [])

  const resetInputs = useCallback(
    (action: AdaptiveCardActionResetInputs) => {
      const targetIds = action.targetInputIds

      setInputs((prev) => {
        if (!targetIds || targetIds.length === 0) {
          return Object.fromEntries(Object.keys(prev).map((id) => [id, '']))
        }

        const next = { ...prev }

        for (const id of targetIds) {
          if (id in next) next[id] = ''
        }

        return next
      })

      dispatchEvent({ type: 'resetInputs', action, card })
    },
    [card, dispatchEvent],
  )

  const onChoiceQueryRef = useRef(options.onChoiceQuery)

  onChoiceQueryRef.current = options.onChoiceQuery

  const queryChoices = useCallback(
    async (request: AdaptiveCardChoiceQueryRequest) => {
      const resolver = onChoiceQueryRef.current

      if (!resolver) return []

      try {
        return await resolver(request)
      } catch {
        return []
      }
    },
    [],
  )

  const cardProps: AdaptiveCardContextValue = useMemo(
    () => ({
      card,
      hostConfig,
      customElements,
      visibilityOverrides,
      inputs,
      validations,
      showCardOpen,
      hasSubmittedOnce,
      setInput,
      registerInput,
      unregisterInput,
      submit,
      execute,
      openUrl,
      toggleVisibility,
      toggleShowCard,
      resetInputs,
      dispatchEvent,
      queryChoices,
    }),
    [
      card,
      hostConfig,
      customElements,
      visibilityOverrides,
      inputs,
      validations,
      showCardOpen,
      hasSubmittedOnce,
      setInput,
      registerInput,
      unregisterInput,
      submit,
      execute,
      openUrl,
      toggleVisibility,
      toggleShowCard,
      resetInputs,
      dispatchEvent,
      queryChoices,
    ],
  )

  return {
    card,
    hostConfig,
    state: {
      inputs,
      validations,
      visibilityOverrides,
      showCardOpen,
      hasSubmittedOnce,
    },
    controls: {
      setInput,
      submit,
      execute,
      openUrl,
      toggleVisibility,
      toggleShowCard,
      resetInputs,
      validateAll,
      reset,
    },
    cardProps,
  }
}
