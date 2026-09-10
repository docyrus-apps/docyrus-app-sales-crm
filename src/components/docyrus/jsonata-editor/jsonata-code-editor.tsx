'use client'

// @ts-nocheck
/* eslint-disable */
import { useMemo } from 'react'

import { EditorView } from '@codemirror/view'
import CodeMirror, { type BasicSetupOptions } from '@uiw/react-codemirror'

import { useDocyTheme } from '@/lib/docyrus/theme'
import { cn } from '@/lib/utils'

import { type JsonataCodeEditorProps } from './jsonata-editor-types'
import { jsonataExtensions } from './lib/jsonata-language'

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
 * Standalone CodeMirror editor for a single JSONata expression — syntax
 * highlighting, autocomplete, hover docs and inline parse-error linting.
 *
 * For a full input / expression / result workbench use `JsonataEditor`.
 */
export function JsonataCodeEditor({
  value,
  onChange,
  readOnly = false,
  placeholder,
  autoFocus = false,
  minHeight = '2.5rem',
  maxHeight = '12rem',
  height,
  className,
  lineNumbers = false,
  lint = true,
  contextPaths,
  basicSetup,
  extensions,
  ref,
}: JsonataCodeEditorProps) {
  const { isDark } = useDocyTheme()

  const mergedExtensions = useMemo(() => {
    const base = [
      EditorView.lineWrapping,
      ...jsonataExtensions({ lint, contextPaths }),
    ]

    return extensions ? [...base, ...extensions] : base
  }, [lint, contextPaths, extensions])

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
