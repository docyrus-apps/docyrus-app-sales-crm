'use client'

// @ts-nocheck
/* eslint-disable */
import { useMemo, useRef } from 'react'

import { EditorView } from '@codemirror/view'
import CodeMirror, { type BasicSetupOptions } from '@uiw/react-codemirror'

import { useDocyTheme } from '@/lib/docyrus/theme'
import { cn } from '@/lib/utils'

import {
  type DsqlCodeEditorProps,
  type SQLNamespace,
} from './dsql-editor-types'
import { parseCteColumns } from './lib/parse-cte'
import { sqlExtensions } from './lib/sql-language'

const BASE_SETUP: BasicSetupOptions = {
  foldGutter: false,
  highlightActiveLine: false,
  highlightActiveLineGutter: false,
  bracketMatching: true,
  closeBrackets: true,
  autocompletion: true,
  tabSize: 2,
}

/**
 * Standalone CodeMirror editor for a single DSQL (SQL) query — syntax
 * highlighting and soft wrapping. For the full query / result workbench use
 * `DsqlEditor`. Embed this directly in form fields or automation-node configs.
 */
export function DsqlCodeEditor({
  value,
  onChange,
  readOnly = false,
  placeholder,
  autoFocus = false,
  minHeight = '2.5rem',
  maxHeight = '12rem',
  height,
  className,
  lineNumbers = true,
  schema,
  basicSetup,
  extensions,
  ref,
}: DsqlCodeEditorProps) {
  const { isDark } = useDocyTheme()

  /*
   * Augment the static schema with the query's CTEs so `WITH x AS (…)` output
   * columns complete on `x.` aliases (lang-sql only knows the static schema).
   * Gated on a content signature so we only reconfigure when the CTE column set
   * actually changes — not on every keystroke.
   */
  const cteColumnsRef = useRef<Record<string, string[]>>({})
  const cteSignature = useMemo(() => {
    const columns = parseCteColumns(value)

    cteColumnsRef.current = columns

    return Object.keys(columns)
      .sort()
      .map((name) => `${name}:${(columns[name] ?? []).join(',')}`)
      .join('|')
  }, [value])

  const mergedSchema = useMemo<SQLNamespace | undefined>(() => {
    if (!cteSignature) return schema

    return {
      ...(schema as Record<string, unknown> | undefined),
      ...cteColumnsRef.current,
    } as SQLNamespace
  }, [schema, cteSignature])

  const mergedExtensions = useMemo(() => {
    const base = [
      EditorView.lineWrapping,
      ...sqlExtensions({ schema: mergedSchema }),
    ]

    return extensions ? [...base, ...extensions] : base
  }, [mergedSchema, extensions])

  const setup = useMemo<BasicSetupOptions>(
    () => ({ ...BASE_SETUP, lineNumbers, ...basicSetup }),
    [lineNumbers, basicSetup],
  )

  return (
    <CodeMirror
      ref={ref}
      value={value}
      onChange={onChange}
      extensions={mergedExtensions}
      editable={!readOnly}
      readOnly={readOnly}
      autoFocus={autoFocus}
      placeholder={placeholder}
      basicSetup={setup}
      theme={isDark ? 'dark' : 'light'}
      height={height}
      minHeight={height ? undefined : minHeight}
      maxHeight={height ? undefined : maxHeight}
      className={cn('text-[13px]', className)}
    />
  )
}
