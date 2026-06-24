'use client'

// @ts-nocheck
/* eslint-disable */
import { useEffect, useState } from 'react'

import {
  type JsonataEvaluationState,
  type UseJsonataOptions,
} from './jsonata-editor-types'
import { evaluateJsonata } from './lib/evaluate'

/**
 * Headless hook that debounces and evaluates a JSONata `expression` against an
 * already-parsed `input` value. Returns the current {@link JsonataEvaluationState}.
 *
 * `options.bindings` should be referentially stable (memoize inline objects) —
 * the hook only re-runs when `expression`, `input` or a primitive option changes.
 */
export function useJsonata(
  expression: string,
  input: unknown,
  options: UseJsonataOptions = {},
): JsonataEvaluationState {
  const {
    debounceMs = 300,
    enabled = true,
    bindings,
    timeout = 1000,
    maxDepth = 500,
  } = options

  const [state, setState] = useState<JsonataEvaluationState>({ status: 'idle' })

  useEffect(() => {
    if (!enabled) return

    let cancelled = false

    const handle = setTimeout(() => {
      void evaluateJsonata(expression, input, {
        bindings,
        timeout,
        maxDepth,
      }).then((next) => {
        if (!cancelled) setState(next)
      })
    }, debounceMs)

    return () => {
      cancelled = true
      clearTimeout(handle)
    }
  }, [expression, input, enabled, bindings, timeout, maxDepth, debounceMs])

  return state
}
