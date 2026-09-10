'use client'

// @ts-nocheck
/* eslint-disable */
import { useCallback, useMemo, useRef, useState } from 'react'

import { type IEditorAgentClientTool } from '@/components/docyrus/editor-agent'
import { buildResultPreview } from '@/components/docyrus/editor-agent/preview-utils'

import { collectStrictViolations, isPlainObject } from './lib/strict-mode'
import { type JsonSchema } from './json-schema-designer-types'

const TOOL_NAME = 'applyJsonSchema'

const STRICT_EDITOR_HINT =
  '  Produce schemas that comply with OpenAI Structured Outputs strict rules. Every object must have `additionalProperties: false` and list every property in `required`. Use a union with null for optionality. Do not emit `default`, `format`, `pattern`, `min*`/`max*`, `multipleOf`, `oneOf`, `allOf`, `not`, `if/then/else`, or other restricted keywords.'
const LOOSE_EDITOR_HINT = '  Full JSON Schema vocabulary is allowed.'

interface IApplyJsonSchemaInput {
  schema?: unknown
  explanation?: unknown
}

interface IApplyJsonSchemaOutput {
  applied: boolean
  ok: boolean
  strictMode: boolean
  schemaPreview?: string
  truncated?: boolean
  violations?: Array<string>
  error?: { message: string }
}

export interface IUseApplyJsonSchemaResult {
  schema: JsonSchema | null
  setSchema: (next: JsonSchema) => void
  strictMode: boolean
  setStrictMode: (next: boolean) => void
  buildEditorContext: () => string
  tools: ReadonlyArray<IEditorAgentClientTool>
}

/**
 * Owns the controlled state for `<JsonSchemaDesigner>` and the
 * `applyJsonSchema` client-side tool. Adds strict-mode validation so the agent
 * can iterate to compliance, and exposes `buildEditorContext` so the page can
 * inject the current strict-mode flag into the agent's system prompt before
 * the first tool call.
 */
export function useApplyJsonSchema(): IUseApplyJsonSchemaResult {
  const [schema, setSchema] = useState<JsonSchema | null>(null)
  const [strictMode, setStrictMode] = useState(false)
  const strictModeRef = useRef(strictMode)

  strictModeRef.current = strictMode

  const execute = useCallback<IEditorAgentClientTool['execute']>(
    async (toolInput) => {
      const { schema: providedSchema } = (toolInput ??
        {}) as IApplyJsonSchemaInput
      const strict = strictModeRef.current

      if (!isPlainObject(providedSchema)) {
        return {
          applied: false,
          ok: false,
          strictMode: strict,
          error: {
            message:
              'schema is required and must be a JSON Schema object (got a primitive, array, or null)',
          },
        } satisfies IApplyJsonSchemaOutput
      }

      setSchema(providedSchema as JsonSchema)

      const { preview, truncated } = buildResultPreview(providedSchema)
      const violations = strict
        ? collectStrictViolations(providedSchema as JsonSchema)
        : []

      if (violations.length > 0) {
        return {
          applied: true,
          ok: false,
          strictMode: strict,
          schemaPreview: preview,
          truncated,
          violations,
          error: {
            message: `Schema violates ${violations.length} strict-mode rule(s). Fix every violation and call applyJsonSchema again.`,
          },
        } satisfies IApplyJsonSchemaOutput
      }

      return {
        applied: true,
        ok: true,
        strictMode: strict,
        schemaPreview: preview,
        truncated,
      } satisfies IApplyJsonSchemaOutput
    },
    [],
  )

  const buildEditorContext = useCallback(() => {
    const strict = strictModeRef.current
    const intro = 'The user is designing a JSON Schema in the editor.'
    const flagLine = `- Strict Mode: ${strict ? 'ON' : 'OFF'}`
    const hint = strict ? STRICT_EDITOR_HINT : LOOSE_EDITOR_HINT

    return [intro, flagLine, hint].join('\n')
  }, [])

  const tools = useMemo<ReadonlyArray<IEditorAgentClientTool>>(
    () => [{ name: TOOL_NAME, execute }],
    [execute],
  )

  return {
    schema,
    setSchema,
    strictMode,
    setStrictMode,
    buildEditorContext,
    tools,
  }
}
