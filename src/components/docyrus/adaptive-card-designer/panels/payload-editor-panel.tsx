'use client'

// @ts-nocheck
/* eslint-disable */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import Editor, { type Monaco, type OnMount } from '@monaco-editor/react'
import { AlertCircle, Braces } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useDocyTheme } from '@/lib/docyrus/theme'

import { type AdaptiveCardPayload } from '@/components/docyrus/adaptive-card'

import { useDesignerContext } from '../adaptive-card-designer-context'
import { buildAugmentedSchema } from '../lib/augmented-schema'
import { cardToTree } from '../lib/node-tree'
import { TYPE_COMPLETIONS, sortTextFor } from '../lib/type-completions'
import { PanelShell } from '../layout/panel-shell'

/*
 * The Adaptive Cards JSON Schema is bundled locally (adaptivecards.io serves
 * the schema without CORS headers so a remote fetch would silently fail).
 * `buildAugmentedSchema` then patches it to add the AC 1.6 elements / actions
 * the official 1.5 schema is still missing.
 *
 * `MODEL_PATH` is plain filename (no scheme) — `@monaco-editor/react` mounts
 * the model at `inmemory://model/<path>` and the JSON service matches
 * `fileMatch` globs against that. A scheme prefix here would break the match
 * silently.
 */
const SCHEMA_URI = 'http://adaptivecards.io/schemas/adaptive-card.json'
const MODEL_PATH = 'adaptive-card-payload.json'
const AUGMENTED_SCHEMA = buildAugmentedSchema()

/**
 * Bottom-left panel: a Monaco JSON editor for the AdaptiveCard payload with
 * IntelliSense (autocomplete, hover docs, schema validation) wired to the
 * canonical Adaptive Cards 1.6 schema.
 *
 * The editor is bidirectionally live: every keystroke that parses as a valid
 * AdaptiveCard payload immediately dispatches `SET_ROOT`, so other panels
 * (canvas, structure tree, properties) react in real time. Conversely,
 * mutations from those panels stream back into the editor through the
 * `payload`-derived `formatted` string.
 */
export function PayloadEditorPanel() {
  const { state, payload, dispatch } = useDesignerContext()
  const { isDark } = useDocyTheme()
  const { readOnly } = state

  const formatted = useMemo(() => JSON.stringify(payload, null, 2), [payload])
  const [draft, setDraft] = useState(formatted)
  const [error, setError] = useState<string | null>(null)
  const monacoRef = useRef<Monaco | null>(null)
  /*
   * Set to `true` for one render cycle whenever the user typing in this
   * editor caused the `formatted` change. The sync effect below uses this to
   * skip overwriting the user's in-flight `draft` when the new `formatted`
   * is just our own dispatch echoing back through the reducer.
   */
  const dispatchedFromHereRef = useRef(false)

  useEffect(() => {
    if (dispatchedFromHereRef.current) {
      dispatchedFromHereRef.current = false

      return
    }

    /*
     * Intentional: re-sync the editor draft from an external payload change.
     * Guarded above against our own dispatch echo, so this can't loop.
     */
    /* eslint-disable @eslint-react/set-state-in-effect */
    setDraft(formatted)
    setError(null)
    /* eslint-enable @eslint-react/set-state-in-effect */
  }, [formatted])

  const handleMount: OnMount = useCallback((editor, monaco) => {
    monacoRef.current = monaco

    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      allowComments: false,
      schemaValidation: 'warning',
      schemas: [
        {
          uri: SCHEMA_URI,
          fileMatch: [MODEL_PATH],
          schema: AUGMENTED_SCHEMA,
        },
      ],
    })

    /*
     * Custom completion provider for the `"type"` discriminator. Monaco's
     * built-in JSON completion walks the schema's `anyOf` branches and
     * silently prunes types whose branches don't validate against the
     * partial object — so most types vanish from autocomplete the moment
     * any sibling field is present. Serving the full known catalogue here
     * bypasses that pruning entirely; the schema is still in charge of
     * validation diagnostics for everything else.
     */
    type ProviderArgs = Parameters<
      NonNullable<
        Parameters<
          typeof monaco.languages.registerCompletionItemProvider
        >[1]['provideCompletionItems']
      >
    >

    monaco.languages.registerCompletionItemProvider('json', {
      triggerCharacters: ['"', ' ', ':'],
      provideCompletionItems(
        model: ProviderArgs[0],
        position: ProviderArgs[1],
      ) {
        if (!model.uri.path.endsWith(MODEL_PATH)) return { suggestions: [] }

        const lineBeforeCursor = model.getValueInRange({
          startLineNumber: Math.max(1, position.lineNumber - 1),
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        })

        if (!/"type"\s*:\s*"[^"\n]*$/.test(lineBeforeCursor)) {
          return { suggestions: [] }
        }

        /*
         * Replace the partial word the user has already typed inside the
         * quotes so accepting a suggestion overwrites cleanly.
         */
        const wordInfo = model.getWordUntilPosition(position)
        const range = {
          startLineNumber: position.lineNumber,
          startColumn: wordInfo.startColumn,
          endLineNumber: position.lineNumber,
          endColumn: wordInfo.endColumn,
        }

        return {
          suggestions: TYPE_COMPLETIONS.map((item) => ({
            label: item.type,
            kind: monaco.languages.CompletionItemKind.EnumMember,
            insertText: item.type,
            detail: item.category,
            documentation: { value: item.description },
            sortText: sortTextFor(item),
            range,
          })),
        }
      },
    })

    editor.getAction('editor.action.formatDocument')?.run()
  }, [])

  const handleEditorChange = useCallback(
    (next: string | undefined) => {
      const text = next ?? ''

      setDraft(text)

      if (text.trim() === '') {
        setError(null)

        return
      }

      try {
        const parsed: unknown = JSON.parse(text)

        if (
          !parsed ||
          typeof parsed !== 'object' ||
          (parsed as { type?: string }).type !== 'AdaptiveCard'
        ) {
          setError('Payload must be an object with type "AdaptiveCard".')

          return
        }

        setError(null)
        dispatchedFromHereRef.current = true
        dispatch({
          type: 'SET_ROOT',
          root: cardToTree(parsed as AdaptiveCardPayload),
        })
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
          <Braces className="size-3 shrink-0" />
          Card Payload (JSON)
        </>
      }
      bodyClassName="flex flex-col"
    >
      <div
        className="min-h-0 flex-1 overflow-hidden"
        onFocus={() => dispatch({ type: 'SET_FOCUSED', focused: 'payload' })}
      >
        <Editor
          value={draft}
          path={MODEL_PATH}
          language="json"
          theme={isDark ? 'vs-dark' : 'vs'}
          onChange={handleEditorChange}
          onMount={handleMount}
          options={{
            readOnly,
            minimap: { enabled: false },
            fontSize: 12,
            lineNumbersMinChars: 3,
            folding: true,
            tabSize: 2,
            scrollBeyondLastLine: false,
            quickSuggestions: { other: true, comments: false, strings: true },
            suggestOnTriggerCharacters: true,
            wordBasedSuggestions: 'off',
            renderLineHighlight: 'all',
            automaticLayout: true,
            padding: { top: 8, bottom: 8 },
            /*
             * The editor body is h-64 inside an overflow-hidden flex column —
             * without `fixedOverflowWidgets` the suggest / hover popups clip
             * at the editor edge and only ~5 items are visible. `fixed`
             * positioning lets them break out of the editor bounds and grow
             * to their natural ~12-row height.
             */
            fixedOverflowWidgets: true,
            suggest: {
              showWords: false,
              filterGraceful: true,
              snippetsPreventQuickSuggestions: false,
            },
          }}
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
