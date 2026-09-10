// @ts-nocheck
/* eslint-disable */
import Handlebars from 'handlebars'

import {
  type HandlebarsErrorPhase,
  type HandlebarsEvaluationError,
  type HandlebarsEvaluationState,
  type HandlebarsRenderOptions,
} from '../handlebars-editor-types'

interface RawHandlebarsError {
  message?: string
  name?: string
  lineNumber?: number
  column?: number
  hash?: { line?: number; column?: number }
}

/** Normalizes any thrown value into a {@link HandlebarsEvaluationError}. */
function toEvaluationError(
  err: unknown,
  phase: HandlebarsErrorPhase,
): HandlebarsEvaluationError {
  const raw = (err ?? {}) as RawHandlebarsError
  const message =
    raw.message ?? (err instanceof Error ? err.message : String(err))
  const line = raw.lineNumber ?? raw.hash?.line
  const column = raw.column ?? raw.hash?.column

  return {
    phase,
    message,
    code: raw.name,
    line: typeof line === 'number' ? line : undefined,
    column: typeof column === 'number' ? column : undefined,
  }
}

/** Result of {@link parseJsonInput}. */
export type ParsedJsonInput =
  | { ok: true; data: unknown }
  | { ok: false; error: HandlebarsEvaluationError }

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
 * Builds a private Handlebars environment scoped to a single render so that
 * registering helpers / partials does not leak into the global instance.
 */
function buildEnvironment(options: HandlebarsRenderOptions): typeof Handlebars {
  const env = Handlebars.create()
  const { helpers, partials } = options

  if (helpers) {
    for (const [name, fn] of Object.entries(helpers)) {
      env.registerHelper(name, fn)
    }
  }

  if (partials) {
    for (const [name, source] of Object.entries(partials)) {
      env.registerPartial(name, source)
    }
  }

  return env
}

/**
 * Compiles and renders a Handlebars template against a context value.
 * Never throws — failures are returned as `parse-error` / `render-error`
 * states so callers can render them uniformly.
 */
export function renderHandlebars(
  template: string,
  context: unknown,
  options: HandlebarsRenderOptions = {},
): HandlebarsEvaluationState {
  if (!template.trim()) return { status: 'empty' }

  const env = buildEnvironment(options)

  let compiled: Handlebars.TemplateDelegate

  try {
    compiled = env.compile(template, {
      noEscape: options.noEscape === true,
      strict: options.strict === true,
    })
  } catch (err) {
    return { status: 'parse-error', error: toEvaluationError(err, 'parse') }
  }

  try {
    const result = compiled(context ?? {})

    return { status: 'success', result }
  } catch (err) {
    return { status: 'render-error', error: toEvaluationError(err, 'render') }
  }
}
