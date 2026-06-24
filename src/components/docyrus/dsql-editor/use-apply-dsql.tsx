'use client'

// @ts-nocheck
/* eslint-disable */
import { useCallback, useMemo, useRef, useState } from 'react'

import { type IEditorAgentClientTool } from '@/components/docyrus/editor-agent'

import { formatSql } from './lib/format-sql'

const TOOL_NAME = 'applyDsqlQuery'

interface IApplyDsqlInput {
  query?: unknown
  explanation?: unknown
}

interface IApplyDsqlOutput {
  applied: boolean
  ok: boolean
  query?: string
  error?: { message: string }
}

export interface UseApplyDsqlOptions {
  /**
   * Fired after the agent's `applyDsqlQuery` tool writes a (formatted) query
   * into the editor. Use it to close the agent panel and/or auto-run the query
   * — e.g. `onApply: (q) => { setAiOpen(false); editorRef.current?.run(q); }`.
   */
  onApply?: (query: string) => void
}

export interface IUseApplyDsqlResult {
  /** Current query text — bind to `<DsqlEditor query={...}>`. */
  query: string
  setQuery: (next: string) => void
  /** Client tools to pass to the agent drawer. */
  tools: ReadonlyArray<IEditorAgentClientTool>
}

/**
 * Owns the controlled query state for `<DsqlEditor>` plus the `applyDsqlQuery`
 * client tool. When the agent emits a query, the tool formats it, writes it into
 * the editor, fires `options.onApply(formatted)`, and returns a small ack so the
 * LLM can confirm the write.
 *
 * Note: the agent (`applyDsqlQuery` tool + DSQL system prompt) must be
 * registered server-side; this hook only provides the client-side handler.
 */
export function useApplyDsql(
  initialQuery = '',
  options: UseApplyDsqlOptions = {},
): IUseApplyDsqlResult {
  const [query, setQuery] = useState(initialQuery)

  const optionsRef = useRef(options)

  optionsRef.current = options

  const execute = useCallback<IEditorAgentClientTool['execute']>(
    (toolInput) => {
      const { query: next } = (toolInput ?? {}) as IApplyDsqlInput

      if (typeof next !== 'string' || next.trim() === '') {
        return {
          applied: false,
          ok: false,
          error: {
            message: 'query is required and must be a non-empty string',
          },
        } satisfies IApplyDsqlOutput
      }

      const formatted = formatSql(next)

      setQuery(formatted)
      optionsRef.current.onApply?.(formatted)

      return {
        applied: true,
        ok: true,
        query: formatted,
      } satisfies IApplyDsqlOutput
    },
    [],
  )

  const tools = useMemo<ReadonlyArray<IEditorAgentClientTool>>(
    () => [{ name: TOOL_NAME, execute }],
    [execute],
  )

  return { query, setQuery, tools }
}
