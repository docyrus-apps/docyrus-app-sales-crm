'use client'

// @ts-nocheck
/* eslint-disable */
import { useMemo } from 'react'

import { EditorView } from '@codemirror/view'
import CodeMirror, { type BasicSetupOptions } from '@uiw/react-codemirror'

import { useDocyTheme } from '@/lib/docyrus/theme'
import { cn } from '@/lib/utils'

import { type HandlebarsCodeEditorProps } from './handlebars-editor-types'
import { handlebarsExtensions } from './lib/handlebars-language'

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
 * Standalone CodeMirror editor for a single Handlebars template — syntax
 * highlighting, autocomplete, hover docs and inline parse-error linting.
 *
 * For a full input / template / output workbench use `HandlebarsEditor`.
 */
export function HandlebarsCodeEditor({
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
  helperNames,
  contextPaths,
  basicSetup,
  extensions,
  ref,
}: HandlebarsCodeEditorProps) {
  const { isDark } = useDocyTheme()

  const mergedExtensions = useMemo(() => {
    const base = [
      EditorView.lineWrapping,
      ...handlebarsExtensions({ lint, helperNames, contextPaths }),
    ]

    return extensions ? [...base, ...extensions] : base
  }, [lint, helperNames, contextPaths, extensions])

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
