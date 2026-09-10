'use client'

// @ts-nocheck
/* eslint-disable */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import CodeMirror from '@uiw/react-codemirror'
import { loadLanguage } from '@uiw/codemirror-extensions-langs'
import { AlertCircle, Database } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useDocyTheme } from '@/lib/docyrus/theme'

import { useDesignerContext } from '../adaptive-card-designer-context'
import { PanelShell } from '../layout/panel-shell'

const jsonLang = loadLanguage('json')
const jsonExtensions = jsonLang ? [jsonLang] : []

/**
 * Bottom-right panel: a CodeMirror JSON editor for the templating data
 * context. Empty input clears the data (templates expand to literal `${...}`).
 *
 * Live-syncs both ways: every keystroke that parses as valid JSON dispatches
 * `SET_SAMPLE_DATA` immediately, and external changes (other panels editing
 * the sample data) flow back into the editor.
 */
export function SampleDataPanel() {
  const { state, dispatch } = useDesignerContext()
  const { isDark } = useDocyTheme()
  const { readOnly } = state

  const formatted = useMemo(
    () =>
      state.sampleData === undefined
        ? ''
        : JSON.stringify(state.sampleData, null, 2),
    [state.sampleData],
  )
  const [draft, setDraft] = useState(formatted)
  const [error, setError] = useState<string | null>(null)
  const dispatchedFromHereRef = useRef(false)

  useEffect(() => {
    if (dispatchedFromHereRef.current) {
      dispatchedFromHereRef.current = false

      return
    }

    /*
     * Intentional: re-sync the editor draft from an external sample-data
     * change. Guarded above against our own dispatch echo, so this can't loop.
     */
    /* eslint-disable @eslint-react/set-state-in-effect */
    setDraft(formatted)
    setError(null)
    /* eslint-enable @eslint-react/set-state-in-effect */
  }, [formatted])

  const handleEditorChange = useCallback(
    (next: string) => {
      setDraft(next)

      if (next.trim() === '') {
        setError(null)
        dispatchedFromHereRef.current = true
        dispatch({ type: 'SET_SAMPLE_DATA', data: undefined })

        return
      }

      try {
        const parsed = JSON.parse(next)

        setError(null)
        dispatchedFromHereRef.current = true
        dispatch({ type: 'SET_SAMPLE_DATA', data: parsed })
      } catch (err) {
        setError((err as Error).message)
      }
    },
    [dispatch],
  )

  return (
    <PanelShell
      title={
        <>
          <Database className="size-3 shrink-0" />
          Sample Data (JSON)
        </>
      }
      bodyClassName="flex flex-col"
    >
      <div
        className="min-h-0 flex-1 overflow-auto"
        onFocus={() => dispatch({ type: 'SET_FOCUSED', focused: 'data' })}
      >
        <CodeMirror
          value={draft}
          onChange={handleEditorChange}
          editable={!readOnly}
          extensions={jsonExtensions}
          theme={isDark ? 'dark' : 'light'}
          placeholder="// Sample data for ${path} templating.&#10;// Leave blank to render the card as-is."
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            highlightActiveLine: true,
            autocompletion: false,
          }}
          style={{ fontSize: 12 }}
        />
      </div>
      {error ? (
        <div
          className={cn(
            'flex items-start gap-1.5 border-t border-destructive/30 bg-destructive/10 px-3 py-1.5 text-[11px] text-destructive',
          )}
        >
          <AlertCircle className="mt-px size-3.5 shrink-0" />
          <span className="break-words">{error}</span>
        </div>
      ) : null}
    </PanelShell>
  )
}
