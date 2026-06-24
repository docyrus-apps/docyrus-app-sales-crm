'use client'

// @ts-nocheck
/* eslint-disable */
import { useCallback, useMemo, useRef, useState } from 'react'

import { type IEditorAgentClientTool } from '@/components/docyrus/editor-agent'
import {
  INPUT_PREVIEW_MAX_CHARS,
  coerceInputToText,
  truncate,
} from '@/components/docyrus/editor-agent/preview-utils'

import { evaluateJsonata, parseJsonInput } from './lib/evaluate'

const TOOL_NAME = 'applyJsonata'

interface IApplyJsonataInput {
  expression?: unknown
  input?: unknown
  explanation?: unknown
}

interface IApplyJsonataOutput {
  applied: boolean
  ok: boolean
  resultPreview?: string
  resultType?: string
  truncated?: boolean
  inputProvided: boolean
  inputPreview?: string
  inputTruncated?: boolean
  error?: {
    code?: string
    message: string
    position?: number
    token?: string
  }
}

export interface IUseApplyJsonataResult {
  expression: string
  setExpression: (next: string) => void
  input: string
  setInput: (next: string) => void
  tools: ReadonlyArray<IEditorAgentClientTool>
}

function resolveResultType(value: unknown): string {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'

  return typeof value
}

/**
 * Owns the controlled state for `<JsonataEditor>` and the `applyJsonata`
 * client-side tool. The tool writes the agent's expression into the editor
 * AND evaluates it against the current input JSON, returning a result preview
 * (or a categorized error: input-empty / parse / evaluate) so the LLM can
 * iterate to a working expression without further user input.
 */
export function useApplyJsonata(): IUseApplyJsonataResult {
  const [expression, setExpression] = useState('')
  const [input, setInput] = useState('')
  const inputRef = useRef(input)

  inputRef.current = input

  const execute = useCallback<IEditorAgentClientTool['execute']>(
    async (toolInput) => {
      const { expression: nextExpression, input: providedInput } = (toolInput ??
        {}) as IApplyJsonataInput
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

      if (typeof nextExpression !== 'string' || nextExpression.trim() === '') {
        return {
          applied: false,
          ok: false,
          inputProvided,
          inputPreview,
          inputTruncated,
          error: {
            message: 'expression is required and must be a non-empty string',
          },
        } satisfies IApplyJsonataOutput
      }

      setExpression(nextExpression)

      if (!inputProvided) {
        return {
          applied: true,
          ok: false,
          inputProvided: false,
          error: {
            message:
              'The Input JSON pane is empty. Ask the user to paste a sample, then call the tool again.',
          },
        } satisfies IApplyJsonataOutput
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
        } satisfies IApplyJsonataOutput
      }

      const evaluation = await evaluateJsonata(nextExpression, parsed.data)

      if (evaluation.status === 'success') {
        const resultText =
          typeof evaluation.result === 'string'
            ? evaluation.result
            : (JSON.stringify(evaluation.result, null, 2) ??
              String(evaluation.result))
        const { preview, truncated: resultTruncated } = truncate(
          resultText,
          INPUT_PREVIEW_MAX_CHARS,
        )

        return {
          applied: true,
          ok: true,
          resultType: resolveResultType(evaluation.result),
          resultPreview: preview,
          truncated: resultTruncated,
          inputProvided: true,
          inputPreview,
          inputTruncated,
        } satisfies IApplyJsonataOutput
      }

      if (
        evaluation.status === 'parse-error' ||
        evaluation.status === 'evaluate-error'
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
            position: evaluation.error.position,
            token: evaluation.error.token,
          },
        } satisfies IApplyJsonataOutput
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
      } satisfies IApplyJsonataOutput
    },
    [],
  )

  const tools = useMemo<ReadonlyArray<IEditorAgentClientTool>>(
    () => [{ name: TOOL_NAME, execute }],
    [execute],
  )

  return {
    expression,
    setExpression,
    input,
    setInput,
    tools,
  }
}
