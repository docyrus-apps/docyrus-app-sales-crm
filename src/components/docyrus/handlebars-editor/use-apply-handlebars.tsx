'use client'

// @ts-nocheck
/* eslint-disable */
import { useCallback, useMemo, useRef, useState } from 'react'

import { type IEditorAgentClientTool } from '@/components/docyrus/editor-agent'
import {
  INPUT_PREVIEW_MAX_CHARS,
  RESULT_PREVIEW_MAX_CHARS,
  coerceInputToText,
  truncate,
} from '@/components/docyrus/editor-agent/preview-utils'

import { parseJsonInput, renderHandlebars } from './lib/render'

const TOOL_NAME = 'applyHandlebars'

interface IApplyHandlebarsInput {
  template?: unknown
  input?: unknown
  explanation?: unknown
}

interface IApplyHandlebarsOutput {
  applied: boolean
  ok: boolean
  resultPreview?: string
  truncated?: boolean
  inputProvided: boolean
  inputPreview?: string
  inputTruncated?: boolean
  error?: {
    code?: string
    message: string
    line?: number
    column?: number
  }
}

export interface IUseApplyHandlebarsResult {
  template: string
  setTemplate: (next: string) => void
  input: string
  setInput: (next: string) => void
  tools: ReadonlyArray<IEditorAgentClientTool>
}

/**
 * Owns the controlled state for `<HandlebarsEditor>` and the `applyHandlebars`
 * client-side tool. The tool writes the agent's template into the editor AND
 * renders it against the current input JSON, returning a rendered-output
 * preview (or a categorized error: input-empty / parse / render) so the LLM
 * can iterate to a working template.
 */
export function useApplyHandlebars(): IUseApplyHandlebarsResult {
  const [template, setTemplate] = useState('')
  const [input, setInput] = useState('')
  const inputRef = useRef(input)

  inputRef.current = input

  const execute = useCallback<IEditorAgentClientTool['execute']>(
    async (toolInput) => {
      const { template: nextTemplate, input: providedInput } = (toolInput ??
        {}) as IApplyHandlebarsInput
      const providedInputText = coerceInputToText(providedInput)

      if (providedInputText !== null) {
        setInput(providedInputText)
        inputRef.current = providedInputText
      }

      const currentInput = inputRef.current
      const inputProvided = currentInput.trim() !== ''
      const inputSnapshot = inputProvided
        ? truncate(currentInput, INPUT_PREVIEW_MAX_CHARS)
        : null
      const inputPreview = inputSnapshot?.preview
      const inputTruncated = inputSnapshot?.truncated ?? false

      if (typeof nextTemplate !== 'string' || nextTemplate.trim() === '') {
        return {
          applied: false,
          ok: false,
          inputProvided,
          inputPreview,
          inputTruncated,
          error: {
            message: 'template is required and must be a non-empty string',
          },
        } satisfies IApplyHandlebarsOutput
      }

      setTemplate(nextTemplate)

      if (!inputProvided) {
        return {
          applied: true,
          ok: false,
          inputProvided: false,
          error: {
            message:
              'The Input JSON pane is empty. Ask the user to paste a sample, then call the tool again.',
          },
        } satisfies IApplyHandlebarsOutput
      }

      const parsed = parseJsonInput(currentInput)

      if (!parsed.ok) {
        return {
          applied: true,
          ok: false,
          inputProvided: true,
          inputPreview,
          inputTruncated,
          error: {
            message: parsed.error?.message ?? 'Current input is not valid JSON',
          },
        } satisfies IApplyHandlebarsOutput
      }

      const evaluation = renderHandlebars(nextTemplate, parsed.data)

      if (evaluation.status === 'success') {
        const { preview, truncated: resultTruncated } = truncate(
          evaluation.result,
          RESULT_PREVIEW_MAX_CHARS,
        )

        return {
          applied: true,
          ok: true,
          resultPreview: preview,
          truncated: resultTruncated,
          inputProvided: true,
          inputPreview,
          inputTruncated,
        } satisfies IApplyHandlebarsOutput
      }

      if (
        evaluation.status === 'parse-error' ||
        evaluation.status === 'render-error'
      ) {
        return {
          applied: true,
          ok: false,
          inputProvided: true,
          inputPreview,
          inputTruncated,
          error: {
            code: evaluation.error.code,
            message: evaluation.error.message,
            line: evaluation.error.line,
            column: evaluation.error.column,
          },
        } satisfies IApplyHandlebarsOutput
      }

      return {
        applied: true,
        ok: false,
        inputProvided: true,
        inputPreview,
        inputTruncated,
        error: {
          message: `Unexpected evaluation status: ${evaluation.status}`,
        },
      } satisfies IApplyHandlebarsOutput
    },
    [],
  )

  const tools = useMemo<ReadonlyArray<IEditorAgentClientTool>>(
    () => [{ name: TOOL_NAME, execute }],
    [execute],
  )

  return {
    template,
    setTemplate,
    input,
    setInput,
    tools,
  }
}
