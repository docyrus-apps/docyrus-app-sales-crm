// @ts-nocheck
/* eslint-disable */
import jsonata from 'jsonata'

import {
  type JsonataErrorPhase,
  type JsonataEvaluateOptions,
  type JsonataEvaluationError,
  type JsonataEvaluationState,
} from '../jsonata-editor-types'

type JsonataExpression = ReturnType<typeof jsonata>

const DEFAULT_TIMEOUT = 1000
const DEFAULT_MAX_DEPTH = 500
const RESULT_PRECISION = 13

interface RawJsonataError {
  code?: string
  message?: string
  position?: number
  token?: unknown
}

/** Normalizes any thrown value into a {@link JsonataEvaluationError}. */
function toEvaluationError(
  err: unknown,
  phase: JsonataErrorPhase,
): JsonataEvaluationError {
  const raw = (err ?? {}) as RawJsonataError
  const message =
    raw.message ?? (err instanceof Error ? err.message : String(err))

  return {
    phase,
    message,
    code: raw.code,
    position: typeof raw.position === 'number' ? raw.position : undefined,
    token: raw.token != null ? String(raw.token) : undefined,
  }
}

/** Builds an `Error` carrying a JSONata-style error code. */
function makeTimeboxError(code: string, message: string): Error {
  const err = new Error(message) as Error & { code: string }

  err.code = code

  return err
}

/**
 * Guards an expression against runaway evaluation — caps both wall-clock time
 * and recursion depth. Ported from the official JSONata Exerciser.
 */
function applyTimebox(
  expr: JsonataExpression,
  timeout: number,
  maxDepth: number,
): void {
  let depth = 0
  const start = Date.now()

  const check = (): void => {
    if (depth > maxDepth) {
      throw makeTimeboxError(
        'U1001',
        'Stack overflow: check for non-terminating recursion.',
      )
    }

    if (Date.now() - start > timeout) {
      throw makeTimeboxError(
        'U1002',
        'Evaluation timeout: check for an infinite loop.',
      )
    }
  }

  expr.assign('__evaluate_entry', () => {
    depth++
    check()
  })
  expr.assign('__evaluate_exit', () => {
    depth--
    check()
  })
}

/** JSON replacer that tames floating-point noise and renders function values. */
function resultReplacer(key: string, value: unknown): unknown {
  void key

  if (typeof value === 'number' && Number.isFinite(value)) {
    return Number(value.toPrecision(RESULT_PRECISION))
  }

  if (value !== null && typeof value === 'object') {
    const fn = value as {
      _jsonata_lambda?: boolean
      _jsonata_function?: boolean
      signature?: { definition?: string }
    }

    if (fn._jsonata_lambda === true || fn._jsonata_function === true) {
      return `{function:${fn.signature?.definition ?? ''}}`
    }
  }

  if (typeof value === 'function') {
    return `<native function>#${(value as { length: number }).length}`
  }

  return value
}

/** Pretty-prints a JSONata result for display. Returns `''` for `undefined`. */
export function stringifyResult(value: unknown): string {
  if (value === undefined) return ''

  return JSON.stringify(value, resultReplacer, 2)
}

/** Result of {@link parseJsonInput}. */
export type ParsedJsonInput =
  | { ok: true; data: unknown }
  | { ok: false; error: JsonataEvaluationError }

/** Parses the JSON input pane. Empty text resolves to `undefined` (valid). */
export function parseJsonInput(text: string): ParsedJsonInput {
  if (!text.trim()) return { ok: true, data: undefined }

  try {
    return { ok: true, data: JSON.parse(text) as unknown }
  } catch (err) {
    return { ok: false, error: toEvaluationError(err, 'input') }
  }
}

/**
 * Compiles and runs a JSONata expression against a parsed input value.
 * Never throws — failures are returned as `parse-error` / `evaluate-error`
 * states so callers can render them uniformly.
 */
export async function evaluateJsonata(
  expression: string,
  input: unknown,
  options: JsonataEvaluateOptions = {},
): Promise<JsonataEvaluationState> {
  if (!expression.trim()) return { status: 'empty' }

  const {
    bindings = {},
    timeout = DEFAULT_TIMEOUT,
    maxDepth = DEFAULT_MAX_DEPTH,
  } = options

  let compiled: JsonataExpression

  try {
    compiled = jsonata(expression)
  } catch (err) {
    return { status: 'parse-error', error: toEvaluationError(err, 'parse') }
  }

  if (timeout > 0) applyTimebox(compiled, timeout, maxDepth)

  try {
    const result = await compiled.evaluate(input, bindings)

    return { status: 'success', result }
  } catch (err) {
    return {
      status: 'evaluate-error',
      error: toEvaluationError(err, 'evaluate'),
    }
  }
}
