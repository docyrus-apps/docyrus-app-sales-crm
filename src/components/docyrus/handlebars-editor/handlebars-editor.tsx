'use client'

// @ts-nocheck
/* eslint-disable */
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { EditorView } from '@codemirror/view'
import { loadLanguage } from '@uiw/codemirror-extensions-langs'
import CodeMirror, {
  type BasicSetupOptions,
  type ReactCodeMirrorRef,
} from '@uiw/react-codemirror'
import {
  AlertCircle,
  Braces,
  Check,
  ChevronDown,
  Code2,
  Copy,
  Eye,
  FileJson,
  FlaskConical,
  Maximize2,
  Minimize2,
  Sparkles,
  Variable,
} from 'lucide-react'

import { CodyAgentToggle } from '@/components/docyrus/editor-agent'
import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation'
import {
  type ContextPath,
  normalizeContextPaths,
} from '@/lib/docyrus/context-paths'
import { useDocyTheme } from '@/lib/docyrus/theme'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

import { HandlebarsAIAssistant } from './handlebars-ai-assistant'
import { HandlebarsCodeEditor } from './handlebars-code-editor'
import {
  type HandlebarsAIAssistantConfig,
  type HandlebarsEditorProps,
  type HandlebarsEvaluationError,
  type HandlebarsEvaluationState,
  type HandlebarsSample,
} from './handlebars-editor-types'
import { HANDLEBARS_HELPER_NAMES } from './handlebars-helpers'
import { parseJsonInput, renderHandlebars } from './lib/render'

const jsonLang = loadLanguage('json')
const jsonExtensions = jsonLang
  ? [jsonLang, EditorView.lineWrapping]
  : [EditorView.lineWrapping]

const htmlLang = loadLanguage('html')
const htmlExtensions = htmlLang
  ? [htmlLang, EditorView.lineWrapping]
  : [EditorView.lineWrapping]
const textExtensions = [EditorView.lineWrapping]

const INPUT_SETUP: BasicSetupOptions = {
  lineNumbers: true,
  foldGutter: true,
  autocompletion: false,
  highlightActiveLineGutter: false,
}

const RESULT_SETUP: BasicSetupOptions = {
  lineNumbers: false,
  foldGutter: true,
  autocompletion: false,
  highlightActiveLine: false,
  highlightActiveLineGutter: false,
}

/** Converts the `input` / `defaultInput` prop into editor text. */
function toInputText(value: string | unknown): string {
  if (value === undefined || value === null) return ''
  if (typeof value === 'string') return value

  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

/**
 * Walks an object/array and returns dotted paths up to `maxDepth` for use as
 * autocomplete suggestions in the template pane.
 */
function extractContextPaths(
  value: unknown,
  prefix = '',
  depth = 0,
  out: string[] = [],
): string[] {
  if (depth > 3 || value === null || typeof value !== 'object') return out

  if (Array.isArray(value)) {
    if (value.length > 0)
      extractContextPaths(
        value[0],
        prefix ? `${prefix}.[0]` : '[0]',
        depth + 1,
        out,
      )

    return out
  }

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue
    const path = prefix ? `${prefix}.${key}` : key

    out.push(path)
    extractContextPaths(child, path, depth + 1, out)
  }

  return out
}

interface StatusBadgeProps {
  tone: 'idle' | 'valid' | 'error'
  label: string
}

function StatusBadge({ tone, label }: StatusBadgeProps) {
  return (
    <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
      <span
        className={cn(
          'size-1.5 rounded-full',
          tone === 'valid' && 'bg-emerald-500',
          tone === 'error' && 'bg-destructive',
          tone === 'idle' && 'bg-muted-foreground/40',
        )}
      />
      {label}
    </span>
  )
}

function CenteredNotice({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center p-4 text-center text-xs text-muted-foreground">
      {children}
    </div>
  )
}

function ErrorNotice({ error }: { error: HandlebarsEvaluationError }) {
  return (
    <div className="flex h-full flex-col gap-1.5 overflow-auto p-3 text-xs">
      <div className="flex items-center gap-1.5 font-medium text-destructive">
        <AlertCircle className="size-3.5 shrink-0" />
        <span>
          {error.phase === 'input'
            ? 'Invalid input JSON'
            : error.phase === 'parse'
              ? 'Invalid template'
              : 'Render error'}
          {error.line
            ? ` (line ${error.line}${error.column ? `, col ${error.column}` : ''})`
            : ''}
        </span>
      </div>
      <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-destructive/90">
        {error.message}
      </pre>
    </div>
  )
}

interface PaneTabProps {
  icon: ReactNode
  label: string
  value: string
}

/** Compact tab trigger styled to match the existing pane headers. */
function PaneTab({ icon, label, value }: PaneTabProps) {
  return (
    <TabsTrigger
      value={value}
      className="h-7 px-2 text-[11px] font-semibold uppercase tracking-wide"
    >
      {icon}
      <span>{label}</span>
    </TabsTrigger>
  )
}

/*
 * ────────────────────────────────────────────────────────────
 * HandlebarsEditor
 * ────────────────────────────────────────────────────────────
 */

/**
 * A two-pane workbench for writing and rendering Handlebars templates. Each
 * pane is a `variant="line"` tab panel:
 *
 * - **Right pane** — TEMPLATE (editor) / DATA (JSON input)
 * - **Left pane** — OUTPUT (rendered string, html- or text-highlighted) / PREVIEW (sandboxed iframe)
 *
 * Works controlled or uncontrolled.
 */
export function HandlebarsEditor({
  template,
  defaultTemplate,
  onTemplateChange,
  input,
  defaultInput,
  onInputChange,
  helpers,
  partials,
  noEscape,
  onResult,
  onError,
  onEvaluate,
  samples,
  aiAssistant,
  aiAssistantOpen,
  onAiAssistantOpenChange,
  renderAiAssistant,
  showInput = true,
  showResult = true,
  showToolbar = true,
  title = 'Handlebars',
  orientation = 'horizontal',
  outputMode = 'html',
  debounceMs = 300,
  readOnly = false,
  height = '28rem',
  placeholder,
  contextPaths,
  compactMode = false,
  compactMinHeight = '8rem',
  compactMaxHeight = '20rem',
  className,
}: HandlebarsEditorProps) {
  const { t } = useUiTranslation()
  const { isDark } = useDocyTheme()

  const isTemplateControlled = template !== undefined
  const [templateState, setTemplateState] = useState(defaultTemplate ?? '')
  const templateValue = isTemplateControlled ? template : templateState

  const isInputControlled = input !== undefined
  const [inputState, setInputState] = useState(() => toInputText(defaultInput))
  const inputValue = isInputControlled ? toInputText(input) : inputState

  const [evalState, setEvalState] = useState<HandlebarsEvaluationState>({
    status: 'idle',
  })
  const [copied, setCopied] = useState(false)
  const [editorTab, setEditorTab] = useState<'template' | 'data'>('template')
  const [outputTab, setOutputTab] = useState<'output' | 'preview'>('output')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [variablePickerOpen, setVariablePickerOpen] = useState(false)
  const compactEditorRef = useRef<ReactCodeMirrorRef>(null)

  const aiAssistantConfig = useMemo<HandlebarsAIAssistantConfig | null>(() => {
    if (!aiAssistant) return null

    return aiAssistant === true ? {} : aiAssistant
  }, [aiAssistant])

  const isAiAssistantEnabled =
    aiAssistantConfig !== null || typeof renderAiAssistant === 'function'
  const aiAssistantWidth = aiAssistantConfig?.width ?? 320

  const [aiOpenInternal, setAiOpenInternal] = useState(() =>
    aiAssistant !== true &&
    typeof aiAssistant === 'object' &&
    aiAssistant !== null
      ? aiAssistant.defaultOpen === true
      : false,
  )
  const isAiOpenControlled = aiAssistantOpen !== undefined
  const aiOpen = isAiOpenControlled ? aiAssistantOpen : aiOpenInternal
  const setAiOpen = useCallback(
    (next: boolean) => {
      if (!isAiOpenControlled) setAiOpenInternal(next)
      onAiAssistantOpenChange?.(next)
    },
    [isAiOpenControlled, onAiAssistantOpenChange],
  )
  const closeAiAssistant = useCallback(() => setAiOpen(false), [setAiOpen])

  const setTemplate = useCallback(
    (next: string) => {
      if (!isTemplateControlled) setTemplateState(next)
      onTemplateChange?.(next)
    },
    [isTemplateControlled, onTemplateChange],
  )

  const setInput = useCallback(
    (next: string) => {
      if (!isInputControlled) setInputState(next)
      onInputChange?.(next)
    },
    [isInputControlled, onInputChange],
  )

  /*
   * Keep callbacks / helpers / partials off the render effect's dependency
   * list so inline props can't trigger a render loop.
   */
  const helpersRef = useRef(helpers)

  helpersRef.current = helpers
  const partialsRef = useRef(partials)

  partialsRef.current = partials
  const callbacksRef = useRef({ onResult, onError, onEvaluate })

  callbacksRef.current = { onResult, onError, onEvaluate }

  useEffect(() => {
    let cancelled = false

    const handle = setTimeout(() => {
      const parsed = parseJsonInput(inputValue)

      if (!parsed.ok) {
        if (cancelled) return

        const next: HandlebarsEvaluationState = {
          status: 'input-error',
          error: parsed.error,
        }

        setEvalState(next)
        callbacksRef.current.onError?.(parsed.error)
        callbacksRef.current.onEvaluate?.(next)

        return
      }

      const next = renderHandlebars(templateValue, parsed.data, {
        helpers: helpersRef.current,
        partials: partialsRef.current,
        noEscape,
      })

      if (cancelled) return

      setEvalState(next)

      if (next.status === 'success') {
        callbacksRef.current.onResult?.(next.result)
      } else if (
        next.status === 'parse-error' ||
        next.status === 'render-error'
      ) {
        callbacksRef.current.onError?.(next.error)
      }

      callbacksRef.current.onEvaluate?.(next)
    }, debounceMs)

    return () => {
      cancelled = true
      clearTimeout(handle)
    }
  }, [templateValue, inputValue, noEscape, debounceMs])

  const resultText = evalState.status === 'success' ? evalState.result : ''
  const inputError = evalState.status === 'input-error' ? evalState.error : null

  const status = useMemo<StatusBadgeProps>(() => {
    switch (evalState.status) {
      case 'success':
        return { tone: 'valid', label: t('ui.handlebarsEditor.valid', 'Valid') }

      case 'input-error':

      case 'parse-error':

      case 'render-error':
        return { tone: 'error', label: t('ui.handlebarsEditor.error', 'Error') }

      default:
        return { tone: 'idle', label: t('ui.handlebarsEditor.ready', 'Ready') }
    }
  }, [evalState.status, t])

  const formatInput = useCallback(() => {
    const parsed = parseJsonInput(inputValue)

    if (parsed.ok && parsed.data !== undefined) {
      setInput(JSON.stringify(parsed.data, null, 2))
    }
  }, [inputValue, setInput])

  const copyResult = useCallback(() => {
    if (!resultText) return

    void navigator.clipboard?.writeText(resultText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [resultText])

  const loadSample = useCallback(
    (sample: HandlebarsSample) => {
      setTemplate(sample.template)
      setInput(toInputText(sample.input))
    },
    [setTemplate, setInput],
  )

  const autoContextPaths = useMemo<string[]>(() => {
    const parsed = parseJsonInput(inputValue)

    if (!parsed.ok || parsed.data === undefined) return []

    return Array.from(new Set(extractContextPaths(parsed.data)))
  }, [inputValue])

  const effectiveContextPaths = useMemo<ContextPath[]>(
    () => normalizeContextPaths([...(contextPaths ?? []), ...autoContextPaths]),
    [contextPaths, autoContextPaths],
  )

  const helperNames = useMemo<string[]>(() => {
    const names = new Set<string>(HANDLEBARS_HELPER_NAMES)

    if (helpers) for (const name of Object.keys(helpers)) names.add(name)

    return Array.from(names)
  }, [helpers])

  const rootHeight = typeof height === 'number' ? `${height}px` : height

  /* ── Output / preview bodies ────────────────────────────── */

  const isErrorState =
    evalState.status === 'input-error' ||
    evalState.status === 'parse-error' ||
    evalState.status === 'render-error'

  let outputBody: ReactNode

  if (isErrorState) {
    outputBody = (
      <ErrorNotice
        error={
          (
            evalState as Extract<
              HandlebarsEvaluationState,
              { error: HandlebarsEvaluationError }
            >
          ).error
        }
      />
    )
  } else if (evalState.status === 'success') {
    if (!resultText) {
      outputBody = (
        <CenteredNotice>
          {t(
            'ui.handlebarsEditor.emptyResult',
            'Template rendered to an empty string',
          )}
        </CenteredNotice>
      )
    } else {
      const ext = outputMode === 'html' ? htmlExtensions : textExtensions

      outputBody = (
        <CodeMirror
          value={resultText}
          extensions={ext}
          editable={false}
          readOnly
          basicSetup={RESULT_SETUP}
          theme={isDark ? 'dark' : 'light'}
          height="100%"
          className="h-full text-[13px]"
        />
      )
    }
  } else {
    outputBody = (
      <CenteredNotice>
        {t(
          'ui.handlebarsEditor.enterTemplate',
          'Enter a Handlebars template to see the output',
        )}
      </CenteredNotice>
    )
  }

  let previewBody: ReactNode

  if (isErrorState) {
    previewBody = (
      <ErrorNotice
        error={
          (
            evalState as Extract<
              HandlebarsEvaluationState,
              { error: HandlebarsEvaluationError }
            >
          ).error
        }
      />
    )
  } else if (evalState.status === 'success' && resultText) {
    previewBody = (
      <iframe
        title={t('ui.handlebarsEditor.preview', 'Preview')}
        srcDoc={resultText}
        sandbox="allow-same-origin"
        className="h-full w-full bg-white"
      />
    )
  } else {
    previewBody = (
      <CenteredNotice>
        {t(
          'ui.handlebarsEditor.enterTemplate',
          'Enter a Handlebars template to see the output',
        )}
      </CenteredNotice>
    )
  }

  /* ── Render ─────────────────────────────────────────────── */

  const paneClass = cn(
    'flex min-h-0 min-w-0 flex-col',
    orientation === 'horizontal' ? 'flex-1' : 'flex-1',
  )

  const outputPane = showResult && (
    <Tabs
      value={outputTab}
      onValueChange={(value) => setOutputTab(value as 'output' | 'preview')}
      className={cn(
        paneClass,
        '!gap-0',
        orientation === 'horizontal' && 'border-l border-border',
        orientation === 'vertical' && 'border-t border-border',
      )}
    >
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-border bg-muted/40 px-2.5">
        <TabsList variant="line" className="h-7 gap-2 px-0">
          <PaneTab
            value="output"
            icon={<Code2 className="size-3.5" />}
            label={t('ui.handlebarsEditor.output', 'Output')}
          />
          <PaneTab
            value="preview"
            icon={<Eye className="size-3.5" />}
            label={t('ui.handlebarsEditor.preview', 'Preview')}
          />
        </TabsList>
      </div>
      <TabsContent
        value="output"
        forceMount
        className={cn(
          'm-0 min-h-0 flex-1 overflow-hidden',
          outputTab !== 'output' && 'hidden',
        )}
      >
        {outputBody}
      </TabsContent>
      <TabsContent
        value="preview"
        forceMount
        className={cn(
          'm-0 min-h-0 flex-1 overflow-hidden',
          outputTab !== 'preview' && 'hidden',
        )}
      >
        {previewBody}
      </TabsContent>
    </Tabs>
  )

  const editorPane = (
    <Tabs
      value={editorTab}
      onValueChange={(value) => setEditorTab(value as 'template' | 'data')}
      className={cn(paneClass, '!gap-0')}
    >
      <div className="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-border bg-muted/40 px-2.5">
        <TabsList variant="line" className="h-7 gap-2 px-0">
          <PaneTab
            value="template"
            icon={<Braces className="size-3.5" />}
            label={t('ui.handlebarsEditor.template', 'Template')}
          />
          {showInput && (
            <PaneTab
              value="data"
              icon={<FileJson className="size-3.5" />}
              label={t('ui.handlebarsEditor.data', 'Data')}
            />
          )}
        </TabsList>
        {editorTab === 'data' && inputError && (
          <StatusBadge
            tone="error"
            label={t('ui.handlebarsEditor.invalidJson', 'Invalid JSON')}
          />
        )}
      </div>
      <TabsContent
        value="template"
        forceMount
        className={cn(
          'm-0 min-h-0 flex-1 overflow-hidden',
          editorTab !== 'template' && 'hidden',
        )}
      >
        <HandlebarsCodeEditor
          value={templateValue}
          onChange={setTemplate}
          readOnly={readOnly}
          placeholder={
            placeholder ??
            t('ui.handlebarsEditor.placeholder', 'e.g. Hello, {{name}}!')
          }
          height="100%"
          className="h-full"
          helperNames={helperNames}
          contextPaths={effectiveContextPaths}
          basicSetup={{ lineNumbers: true, foldGutter: true }}
        />
      </TabsContent>
      {showInput && (
        <TabsContent
          value="data"
          forceMount
          className={cn(
            'm-0 min-h-0 flex-1 overflow-hidden',
            editorTab !== 'data' && 'hidden',
          )}
        >
          <CodeMirror
            value={inputValue}
            onChange={setInput}
            extensions={jsonExtensions}
            editable={!readOnly}
            readOnly={readOnly}
            basicSetup={INPUT_SETUP}
            theme={isDark ? 'dark' : 'light'}
            height="100%"
            className="h-full text-[13px]"
          />
        </TabsContent>
      )}
    </Tabs>
  )

  const renderFullEditor = (inDialog: boolean): ReactNode => (
    <div
      className={cn(
        'flex flex-col overflow-hidden bg-background',
        inDialog ? 'h-full' : cn('rounded-lg border border-border', className),
      )}
      style={inDialog ? undefined : { height: rootHeight }}
    >
      {(inDialog || showToolbar) && (
        <div className="flex h-10 shrink-0 items-center justify-between gap-2 border-b border-border bg-muted/30 px-2.5">
          <div className="flex items-center gap-2">
            {isAiAssistantEnabled && (
              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <CodyAgentToggle
                      active={aiOpen}
                      aria-label={t(
                        'ui.handlebarsEditor.aiAssistant',
                        'AI Assistant',
                      )}
                      onClick={() => setAiOpen(!aiOpen)}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={6}>
                    {t('ui.handlebarsEditor.aiAssistant', 'AI Assistant')}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <span className="text-xs font-semibold text-foreground">
              {title}
            </span>
            <StatusBadge tone={status.tone} label={status.label} />
          </div>

          <div className="flex items-center gap-1">
            {samples && samples.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 px-2 text-xs"
                  >
                    <FlaskConical className="size-3.5" />
                    {t('ui.handlebarsEditor.samples', 'Samples')}
                    <ChevronDown className="size-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="max-w-72">
                  {samples.map((sample) => (
                    <DropdownMenuItem
                      key={sample.name}
                      className="flex flex-col items-start gap-0.5"
                      onSelect={() => {
                        loadSample(sample)
                      }}
                    >
                      <span className="text-xs font-medium">{sample.name}</span>
                      {sample.description && (
                        <span className="text-[11px] text-muted-foreground">
                          {sample.description}
                        </span>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {showInput && !readOnly && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                onClick={() => {
                  setEditorTab('data')
                  formatInput()
                }}
              >
                <Sparkles className="size-3.5" />
                {t('ui.handlebarsEditor.format', 'Format')}
              </Button>
            )}

            {showResult && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                disabled={!resultText}
                onClick={copyResult}
              >
                {copied ? (
                  <Check className="size-3.5" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                {copied
                  ? t('ui.handlebarsEditor.copied', 'Copied')
                  : t('ui.handlebarsEditor.copy', 'Copy')}
              </Button>
            )}

            {inDialog && (
              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="size-7 p-0"
                      aria-label={t('ui.handlebarsEditor.collapse', 'Collapse')}
                      onClick={() => setDialogOpen(false)}
                    >
                      <Minimize2 className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={6}>
                    {t('ui.handlebarsEditor.collapse', 'Collapse')}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      )}

      <div className="relative flex min-h-0 flex-1">
        <div
          className={cn(
            'flex min-w-0 min-h-0 flex-1',
            orientation === 'vertical' ? 'flex-col' : 'flex-row',
          )}
        >
          {editorPane}
          {outputPane}
        </div>

        {renderAiAssistant
          ? renderAiAssistant({
              open: aiOpen,
              width: aiAssistantWidth,
              onClose: closeAiAssistant,
              template: templateValue,
              input: inputValue,
            })
          : aiAssistantConfig && (
              <HandlebarsAIAssistant
                config={aiAssistantConfig}
                open={aiOpen}
                onClose={closeAiAssistant}
                template={templateValue}
                input={inputValue}
              />
            )}
      </div>
    </div>
  )

  if (compactMode) {
    const insertTemplatePath = (path: string) => {
      const view = compactEditorRef.current?.view

      if (!view) {
        setTemplate(`${templateValue}{{${path}}}`)

        return
      }

      const { from, to } = view.state.selection.main
      const before = view.state.sliceDoc(0, from)
      const lastOpen = Math.max(
        before.lastIndexOf('{{'),
        before.lastIndexOf('{{{'),
      )
      const lastClose = before.lastIndexOf('}}')
      const insideMustache = lastOpen > lastClose
      const insert = insideMustache ? path : `{{${path}}}`

      view.dispatch({
        changes: { from, to, insert },
        selection: { anchor: from + insert.length },
      })
      view.focus()
    }

    return (
      <>
        <div
          className={cn(
            'relative overflow-hidden rounded-md border border-border bg-background',
            className,
          )}
        >
          <HandlebarsCodeEditor
            ref={compactEditorRef}
            value={templateValue}
            onChange={setTemplate}
            readOnly={readOnly}
            placeholder={
              placeholder ??
              t('ui.handlebarsEditor.placeholder', 'e.g. Hello, {{name}}!')
            }
            minHeight={compactMinHeight}
            maxHeight={compactMaxHeight}
            helperNames={helperNames}
            contextPaths={effectiveContextPaths}
            className="pr-9"
          />
          <div className="absolute right-1 top-1 z-10 flex flex-col gap-1">
            {isAiAssistantEnabled && (
              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <CodyAgentToggle
                      iconOnly
                      aria-label={t(
                        'ui.handlebarsEditor.aiAssistant',
                        'AI Assistant',
                      )}
                      onClick={() => {
                        setAiOpen(true)
                        setDialogOpen(true)
                      }}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="left" sideOffset={6}>
                    {t('ui.handlebarsEditor.aiAssistant', 'AI Assistant')}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="size-7 p-0 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label={t(
                      'ui.handlebarsEditor.expand',
                      'Open full editor',
                    )}
                    onClick={() => setDialogOpen(true)}
                  >
                    <Maximize2 className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" sideOffset={6}>
                  {t('ui.handlebarsEditor.expand', 'Open full editor')}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {!readOnly && effectiveContextPaths.length > 0 && (
              <Popover
                open={variablePickerOpen}
                onOpenChange={setVariablePickerOpen}
              >
                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="size-7 p-0 text-muted-foreground hover:bg-muted hover:text-foreground"
                          aria-label={t(
                            'ui.handlebarsEditor.insertVariable',
                            'Insert variable',
                          )}
                        >
                          <Variable className="size-3.5" />
                        </Button>
                      </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="left" sideOffset={6}>
                      {t(
                        'ui.handlebarsEditor.insertVariable',
                        'Insert variable',
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <PopoverContent
                  align="end"
                  side="bottom"
                  sideOffset={6}
                  className="w-64 p-0"
                >
                  <Command>
                    <CommandInput
                      placeholder={t(
                        'ui.handlebarsEditor.searchPaths',
                        'Search paths…',
                      )}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {t('ui.handlebarsEditor.noPaths', 'No paths.')}
                      </CommandEmpty>
                      <CommandGroup>
                        {effectiveContextPaths.map((cp) => (
                          <CommandItem
                            key={cp.path}
                            value={cp.path}
                            onSelect={() => {
                              insertTemplatePath(cp.path)
                              setVariablePickerOpen(false)
                            }}
                          >
                            <div className="flex min-w-0 flex-col">
                              <span className="truncate font-mono text-xs">
                                {cp.path}
                              </span>
                              {(cp.description ?? cp.label) && (
                                <span className="truncate text-[11px] text-muted-foreground">
                                  {cp.description ?? cp.label}
                                </span>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent
            showCloseButton={false}
            className="grid w-[min(95vw,1200px)] gap-0 overflow-hidden p-0 !max-w-[min(95vw,1200px)] sm:!max-w-[min(95vw,1200px)]"
          >
            <DialogHeader className="sr-only">
              <DialogTitle>{title}</DialogTitle>
            </DialogHeader>
            <div className="h-[min(85vh,42rem)]">{renderFullEditor(true)}</div>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return renderFullEditor(false)
}
