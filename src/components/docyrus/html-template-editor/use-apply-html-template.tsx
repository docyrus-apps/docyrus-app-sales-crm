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

import { createEditorTemplateEngine } from './lib/editor-template-engine'

const TOOL_NAME = 'applyHtmlTemplate'

/*
 * Module-level engine singleton — created once with default config (no
 * consumer-supplied extra helpers). Compiles with the full editor helper set
 * (formatCurrency, lineNet, formula/JSONata, repeat, …) on an isolated
 * Handlebars instance so it doesn't pollute the global singleton.
 */
const ENGINE = createEditorTemplateEngine()

interface IApplyHtmlTemplateInput {
  html?: unknown
  data?: unknown
  explanation?: unknown
}

interface IApplyHtmlTemplateOutput {
  applied: boolean
  ok: boolean
  resultPreview?: string
  truncated?: boolean
  dataProvided: boolean
  dataPreview?: string
  dataTruncated?: boolean
  error?: {
    message: string
  }
}

export interface IUseApplyHtmlTemplateResult {
  html: string
  setHtml: (next: string) => void
  data: string
  setData: (next: string) => void
  tools: ReadonlyArray<IEditorAgentClientTool>
}

/**
 * Owns the controlled state for `<HtmlTemplateEditor>` and the
 * `applyHtmlTemplate` client-side tool. The tool writes the agent's full HTML
 * template body into the editor AND compiles it against the current Data tab
 * JSON, returning a compiled-output preview (or a categorized error: data
 * empty / data invalid / Handlebars compile failure) so the LLM can iterate
 * to a working template.
 *
 * Compilation uses `createEditorTemplateEngine` — the same isolated Handlebars
 * instance as the editor's Preview tab — so all registered helpers (including
 * `formula` / JSONata expressions) are available during AI-driven iteration.
 */
export function useApplyHtmlTemplate(): IUseApplyHtmlTemplateResult {
  const [html, setHtml] = useState('')
  const [data, setData] = useState('')
  const dataRef = useRef(data)

  dataRef.current = data

  const execute = useCallback<IEditorAgentClientTool['execute']>(
    async (toolInput) => {
      const { html: nextHtml, data: providedData } = (toolInput ??
        {}) as IApplyHtmlTemplateInput
      const providedDataText = coerceInputToText(providedData)

      if (providedDataText !== null) {
        setData(providedDataText)
        dataRef.current = providedDataText
      }

      const currentData = dataRef.current
      const dataProvided = currentData.trim() !== ''
      const dataSnapshot = dataProvided
        ? truncate(currentData, INPUT_PREVIEW_MAX_CHARS)
        : null
      const dataPreview = dataSnapshot?.preview
      const dataTruncated = dataSnapshot?.truncated ?? false

      if (typeof nextHtml !== 'string' || nextHtml.trim() === '') {
        return {
          applied: false,
          ok: false,
          dataProvided,
          dataPreview,
          dataTruncated,
          error: { message: 'html is required and must be a non-empty string' },
        } satisfies IApplyHtmlTemplateOutput
      }

      setHtml(nextHtml)

      if (!dataProvided) {
        return {
          applied: true,
          ok: false,
          dataProvided: false,
          error: {
            message:
              'The Data tab is empty. Ask the user to paste sample JSON, then call the tool again.',
          },
        } satisfies IApplyHtmlTemplateOutput
      }

      let parsedData: unknown

      try {
        parsedData = JSON.parse(currentData)
      } catch (err) {
        return {
          applied: true,
          ok: false,
          dataProvided: true,
          dataPreview,
          dataTruncated,
          error: {
            message:
              err instanceof Error
                ? err.message
                : 'Current data is not valid JSON',
          },
        } satisfies IApplyHtmlTemplateOutput
      }

      let rendered: string

      try {
        rendered = await ENGINE.compileTpl(nextHtml)(parsedData)
      } catch (err) {
        return {
          applied: true,
          ok: false,
          dataProvided: true,
          dataPreview,
          dataTruncated,
          error: { message: err instanceof Error ? err.message : String(err) },
        } satisfies IApplyHtmlTemplateOutput
      }

      const { preview, truncated: resultTruncated } = truncate(
        rendered,
        RESULT_PREVIEW_MAX_CHARS,
      )

      return {
        applied: true,
        ok: true,
        resultPreview: preview,
        truncated: resultTruncated,
        dataProvided: true,
        dataPreview,
        dataTruncated,
      } satisfies IApplyHtmlTemplateOutput
    },
    [],
  )

  const tools = useMemo<ReadonlyArray<IEditorAgentClientTool>>(
    () => [{ name: TOOL_NAME, execute }],
    [execute],
  )

  return {
    html,
    setHtml,
    data,
    setData,
    tools,
  }
}
