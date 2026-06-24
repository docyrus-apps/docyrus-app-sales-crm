'use client'

// @ts-nocheck
/* eslint-disable */
import { useEffect, useState } from 'react'

import {
  type HandlebarsEvaluationState,
  type UseHandlebarsOptions,
} from './handlebars-editor-types'
import { renderHandlebars } from './lib/render'

/**
 * Headless hook that debounces and renders a Handlebars `template` against an
 * already-parsed `context` value. Returns the current {@link HandlebarsEvaluationState}.
 *
 * `options.helpers` and `options.partials` should be referentially stable
 * (memoize inline objects) — the hook only re-runs when `template`, `context`
 * or a primitive option changes.
 */
export function useHandlebars(
  template: string,
  context: unknown,
  options: UseHandlebarsOptions = {},
): HandlebarsEvaluationState {
  const {
    debounceMs = 300,
    enabled = true,
    helpers,
    partials,
    noEscape,
    strict,
  } = options

  const [state, setState] = useState<HandlebarsEvaluationState>({
    status: 'idle',
  })

  useEffect(() => {
    if (!enabled) return

    let cancelled = false

    const handle = setTimeout(() => {
      const next = renderHandlebars(template, context, {
        helpers,
        partials,
        noEscape,
        strict,
      })

      if (!cancelled) setState(next)
    }, debounceMs)

    return () => {
      cancelled = true
      clearTimeout(handle)
    }
  }, [
    template,
    context,
    enabled,
    helpers,
    partials,
    noEscape,
    strict,
    debounceMs,
  ])

  return state
}
