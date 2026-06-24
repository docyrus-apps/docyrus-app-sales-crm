'use client'

// @ts-nocheck
/* eslint-disable */
import { useCallback, useState } from 'react'

import CodeMirror from '@uiw/react-codemirror'
import { loadLanguage } from '@uiw/codemirror-extensions-langs'
import { AlertCircle, Check, Copy, Sparkles } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useDocyTheme } from '@/lib/docyrus/theme'
import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation'

import { useDesignerContext } from '../json-schema-designer-context'
import { parseJsonToTree, treeToJsonString } from '../lib/schema-conversion'

const jsonLang = loadLanguage('json')
const jsonExtensions = jsonLang ? [jsonLang] : []

/** Center pane (JSON tab): a CodeMirror editor for the raw JSON Schema. */
export function SchemaJsonView() {
  const { t } = useUiTranslation()
  const { isDark } = useDocyTheme()
  const { state, dispatch, readOnly } = useDesignerContext()

  const sourceJson = treeToJsonString(state.root, state.strictMode)
  const [draft, setDraft] = useState(sourceJson)
  const [committedSource, setCommittedSource] = useState(sourceJson)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  /*
   * Keep the editor in sync with the tree / strict-mode toggle during render —
   * but never clobber unapplied edits the user has typed.
   */
  if (sourceJson !== committedSource) {
    setCommittedSource(sourceJson)

    if (draft === committedSource) setDraft(sourceJson)
  }

  const isDirty = draft !== sourceJson

  const handleChange = useCallback((next: string) => {
    setDraft(next)
    setError(null)
  }, [])

  const applyDraft = useCallback(() => {
    const result = parseJsonToTree(draft)

    if ('error' in result) {
      setError(result.error)

      return
    }

    setError(null)
    dispatch({ type: 'REPLACE_ROOT', payload: { root: result.root } })
  }, [draft, dispatch])

  const formatDraft = useCallback(() => {
    const result = parseJsonToTree(draft)

    if ('error' in result) {
      setError(result.error)

      return
    }

    setError(null)
    setDraft(treeToJsonString(result.root, state.strictMode))
  }, [draft, state.strictMode])

  const copyDraft = useCallback(() => {
    void navigator.clipboard?.writeText(draft).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [draft])

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center justify-between gap-2 border-b border-border px-2 py-1.5">
        <span className="pl-1 text-[11px] text-muted-foreground">
          {isDirty
            ? t('ui.jsonSchemaDesigner.jsonDirty', 'Unsaved JSON edits')
            : t('ui.jsonSchemaDesigner.jsonSynced', 'In sync with the tree')}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={copyDraft}
          >
            {copied ? (
              <Check className="size-3.5" />
            ) : (
              <Copy className="size-3.5" />
            )}
            {t('ui.jsonSchemaDesigner.copy', 'Copy')}
          </Button>
          {!readOnly && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                onClick={formatDraft}
              >
                <Sparkles className="size-3.5" />
                {t('ui.jsonSchemaDesigner.format', 'Format')}
              </Button>
              <Button
                variant="default"
                size="sm"
                className="h-7 px-2.5 text-xs"
                disabled={!isDirty}
                onClick={applyDraft}
              >
                {t('ui.jsonSchemaDesigner.apply', 'Apply')}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <CodeMirror
          value={draft}
          onChange={handleChange}
          extensions={jsonExtensions}
          theme={isDark ? 'dark' : 'light'}
          editable={!readOnly}
          readOnly={readOnly}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            highlightActiveLine: !readOnly,
            autocompletion: false,
          }}
          style={{ fontSize: 12 }}
        />
      </div>

      {error && (
        <div
          className={cn(
            'flex items-start gap-1.5 border-t border-destructive/30 bg-destructive/10 px-3 py-2',
            'text-[11px] text-destructive',
          )}
        >
          <AlertCircle className="mt-px size-3.5 shrink-0" />
          <span className="break-words">{error}</span>
        </div>
      )}
    </div>
  )
}
