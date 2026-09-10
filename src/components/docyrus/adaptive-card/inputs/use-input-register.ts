'use client'

// @ts-nocheck
/* eslint-disable */
import { useEffect, useRef } from 'react'

import { type AdaptiveCardInputValue } from '../adaptive-card-types'

import { useAdaptiveCardContext } from '../adaptive-card-context'

/*
 * Registers an input id with the host hook at mount and clears it on unmount.
 *
 * `initial` is captured in a ref so renderers can pass a freshly-built value
 * each render (e.g. `[]` for multi ChoiceSet) without re-triggering the
 * effect — `registerInput` only honors the initial when the id is first seen.
 *
 * We destructure `registerInput` / `unregisterInput` off the context value so
 * the dep array references the stable `useCallback`-wrapped functions rather
 * than the whole context object (which changes on every input-state update,
 * which would loop the effect indefinitely).
 */
export function useInputRegister(
  id: string,
  initial: AdaptiveCardInputValue,
): void {
  const { registerInput, unregisterInput } = useAdaptiveCardContext()
  const initialRef = useRef(initial)

  initialRef.current = initial

  useEffect(() => {
    registerInput(id, initialRef.current)

    return () => {
      unregisterInput(id)
    }
  }, [id, registerInput, unregisterInput])
}
