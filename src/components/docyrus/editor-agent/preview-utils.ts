// @ts-nocheck
/* eslint-disable */
/**
 * Helpers for shaping `EditorAgent` client-tool results: truncation, JSON
 * stringification, and the small "coerce LLM-supplied input to editor text"
 * step used by every `apply*` tool that feeds an editor's controlled input
 * pane. Lives next to `EditorAgent` so a single source of truth governs the
 * tool-result token budget for every editor — change the limit here and
 * every `applyJsonata` / `applyHandlebars` / `applyHtmlTemplate` / … bundle
 * inherits it.
 */

export const RESULT_PREVIEW_MAX_CHARS = 2000
export const INPUT_PREVIEW_MAX_CHARS = 2000

export interface ITruncatedPreview {
  preview: string
  truncated: boolean
}

export function truncate(value: string, max: number): ITruncatedPreview {
  if (value.length <= max) return { preview: value, truncated: false }

  return { preview: `${value.slice(0, max)}…`, truncated: true }
}

export function buildResultPreview(value: unknown): ITruncatedPreview {
  let serialized: string

  try {
    serialized =
      typeof value === 'string'
        ? value
        : (JSON.stringify(value, null, 2) ?? String(value))
  } catch {
    serialized = String(value)
  }

  return truncate(serialized, RESULT_PREVIEW_MAX_CHARS)
}

export function resolveResultType(value: unknown): string {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'

  return typeof value
}

/**
 * Best-effort conversion of an LLM-provided input value into editor-friendly
 * JSON text. Strings pass through; objects/arrays are pretty-printed.
 */
export function coerceInputToText(value: unknown): string | null {
  if (value == null) return null
  if (typeof value === 'string') return value

  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return null
  }
}
