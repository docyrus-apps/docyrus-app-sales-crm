'use client'

// @ts-nocheck
/* eslint-disable */
import {
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
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
  Check,
  ChevronDown,
  Copy,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

import { JsonataAIAssistant } from './jsonata-ai-assistant'
import { JsonataCodeEditor } from './jsonata-code-editor'
import {
  type JsonataAIAssistantConfig,
  type JsonataEditorProps,
  type JsonataEvaluationError,
  type JsonataEvaluationState,
  type JsonataSample,
} from './jsonata-editor-types'
import {
  evaluateJsonata,
  parseJsonInput,
  stringifyResult,
} from './lib/evaluate'

const jsonLang = loadLanguage('json')
const jsonExtensions = jsonLang
  ? [jsonLang, EditorView.lineWrapping]
  : [EditorView.lineWrapping]

const INPUT_SETUP: BasicSetupOptions = {
  lineNumbers: true,
  foldGutter: true,
  autocompletion: false,
  highlightActiveLineGutter: false,
}

const MIN_EXPRESSION_HEIGHT = 80
const MIN_RESULT_HEIGHT = 96
const RESIZE_HANDLE_HEIGHT = 6
const DEFAULT_EXPRESSION_HEIGHT = 168
const KEYBOARD_RESIZE_STEP = 8

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
 * Walks an object/array and returns JSONata-style dotted paths up to
 * `maxDepth` for use as autocomplete suggestions in the expression pane.
 * Arrays are indexed without a separator (`items[0].name`).
 */
function extractContextPaths(
  value: unknown,
  prefix = '',
  depth = 0,
  out: string[] = [],
): string[] {
  if (depth > 6 || value === null || typeof value !== 'object') return out

  if (Array.isArray(value)) {
    if (value.length > 0)
      extractContextPaths(
        value[0],
        prefix ? `${prefix}[0]` : '[0]',
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

/*
 * ────────────────────────────────────────────────────────────
 * Internal building blocks
 * ────────────────────────────────────────────────────────────
 */

interface PaneHeaderProps {
  icon?: ReactNode
  title: string
  right?: ReactNode
}

function PaneHeader({ icon, title, right }: PaneHeaderProps) {
  return (
    <div className="flex h-8 shrink-0 items-center justify-between gap-2 border-b border-border bg-muted/40 px-2.5">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        <span>{title}</span>
      </div>
      {right}
    </div>
  )
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

function ErrorNotice({ error }: { error: JsonataEvaluationError }) {
  return (
    <div className="flex h-full flex-col gap-1.5 overflow-auto p-3 text-xs">
      <div className="flex items-center gap-1.5 font-medium text-destructive">
        <AlertCircle className="size-3.5 shrink-0" />
        <span>
          {error.phase === 'input'
            ? 'Invalid input JSON'
            : error.phase === 'parse'
              ? 'Invalid expression'
              : 'Evaluation error'}
          {error.code ? ` (${error.code})` : ''}
        </span>
      </div>
      <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-destructive/90">
        {error.message}
      </pre>
    </div>
  )
}

interface ResizeHandleProps {
  height: number
  min: number
  getMax: () => number
  onChange: (next: number) => void
  label: string
}

/** Drag handle that resizes the Expression pane against the Result pane. */
function ResizeHandle({
  height,
  min,
  getMax,
  onChange,
  label,
}: ResizeHandleProps) {
  const dragStartRef = useRef<{ y: number; h: number } | null>(null)

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      event.preventDefault()
      dragStartRef.current = { y: event.clientY, h: height }
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    [height],
  )

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const start = dragStartRef.current

      if (!start) return

      const max = Math.max(min, getMax())
      const next = Math.min(
        max,
        Math.max(min, start.h + (event.clientY - start.y)),
      )

      onChange(next)
    },
    [min, getMax, onChange],
  )

  const handlePointerUp = useCallback((event: PointerEvent<HTMLDivElement>) => {
    dragStartRef.current = null

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }, [])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        onChange(Math.max(min, height - KEYBOARD_RESIZE_STEP))

        return
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        const max = Math.max(min, getMax())

        onChange(Math.min(max, height + KEYBOARD_RESIZE_STEP))
      }
    },
    [height, min, getMax, onChange],
  )

  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      aria-label={label}
      aria-valuenow={Math.round(height)}
      aria-valuemin={min}
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
      className="group relative h-1.5 shrink-0 cursor-row-resize border-b border-border transition-colors hover:bg-primary/10 focus-visible:bg-primary/10 focus-visible:outline-none active:bg-primary/20"
    >
      <div className="absolute left-1/2 top-1/2 h-0.5 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  )
}

/*
 * ────────────────────────────────────────────────────────────
 * JsonataEditor
 * ────────────────────────────────────────────────────────────
 */

/**
 * A three-pane workbench for writing and evaluating JSONata expressions:
 * a JSON input pane, an expression editor with IntelliSense, and a live
 * result pane. Works controlled or uncontrolled.
 */
export function JsonataEditor({
  expression,
  defaultExpression,
  onExpressionChange,
  input,
  defaultInput,
  onInputChange,
  bindings,
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
  title = 'JSONata',
  orientation = 'horizontal',
  debounceMs = 300,
  evaluationTimeout = 1000,
  readOnly = false,
  height = '28rem',
  placeholder,
  contextPaths,
  compactMode = false,
  compactMinHeight = '8rem',
  compactMaxHeight = '20rem',
  className,
}: JsonataEditorProps) {
  const { t } = useUiTranslation()
  const { isDark } = useDocyTheme()

  const isExpressionControlled = expression !== undefined
  const [expressionState, setExpressionState] = useState(
    defaultExpression ?? '',
  )
  const expressionValue = isExpressionControlled ? expression : expressionState

  const isInputControlled = input !== undefined
  const [inputState, setInputState] = useState(() => toInputText(defaultInput))
  const inputValue = isInputControlled ? toInputText(input) : inputState

  const [evalState, setEvalState] = useState<JsonataEvaluationState>({
    status: 'idle',
  })
  const [copied, setCopied] = useState(false)
  const [expressionHeight, setExpressionHeight] = useState(
    DEFAULT_EXPRESSION_HEIGHT,
  )
  const [dialogOpen, setDialogOpen] = useState(false)
  const [variablePickerOpen, setVariablePickerOpen] = useState(false)
  const expressionStackRef = useRef<HTMLDivElement>(null)
  const compactEditorRef = useRef<ReactCodeMirrorRef>(null)

  const aiAssistantConfig = useMemo<JsonataAIAssistantConfig | null>(() => {
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

  const getExpressionMax = useCallback(() => {
    const el = expressionStackRef.current

    if (!el) return DEFAULT_EXPRESSION_HEIGHT

    return Math.max(
      MIN_EXPRESSION_HEIGHT,
      el.clientHeight - MIN_RESULT_HEIGHT - RESIZE_HANDLE_HEIGHT,
    )
  }, [])

  const setExpression = useCallback(
    (next: string) => {
      if (!isExpressionControlled) setExpressionState(next)
      onExpressionChange?.(next)
    },
    [isExpressionControlled, onExpressionChange],
  )

  const setInput = useCallback(
    (next: string) => {
      if (!isInputControlled) setInputState(next)
      onInputChange?.(next)
    },
    [isInputControlled, onInputChange],
  )

  /*
   * Autocomplete paths surfaced inside the expression editor. We always
   * extract whatever is in the input JSON, then union the explicit
   * `contextPaths` prop (typically derived from a known schema) on top so
   * deep paths that exceed our extraction depth still appear.
   */
  const autoContextPaths = useMemo<string[]>(() => {
    const parsed = parseJsonInput(inputValue)

    if (!parsed.ok || parsed.data === undefined) return []

    return extractContextPaths(parsed.data)
  }, [inputValue])

  const effectiveContextPaths = useMemo<ContextPath[]>(
    () => normalizeContextPaths([...(contextPaths ?? []), ...autoContextPaths]),
    [contextPaths, autoContextPaths],
  )

  /*
   * Keep callbacks / bindings off the evaluation effect's dependency list so
   * inline props can't trigger an evaluation loop.
   */
  const bindingsRef = useRef(bindings)

  bindingsRef.current = bindings
  const callbacksRef = useRef({ onResult, onError, onEvaluate })

  callbacksRef.current = { onResult, onError, onEvaluate }

  useEffect(() => {
    let cancelled = false

    const handle = setTimeout(() => {
      const parsed = parseJsonInput(inputValue)

      if (!parsed.ok) {
        if (cancelled) return

        const next: JsonataEvaluationState = {
          status: 'input-error',
          error: parsed.error,
        }

        setEvalState(next)
        callbacksRef.current.onError?.(parsed.error)
        callbacksRef.current.onEvaluate?.(next)

        return
      }

      void evaluateJsonata(expressionValue, parsed.data, {
        bindings: bindingsRef.current,
        timeout: evaluationTimeout,
      }).then((next) => {
        if (cancelled) return

        setEvalState(next)

        if (next.status === 'success') {
          callbacksRef.current.onResult?.(next.result)
        } else if (
          next.status === 'parse-error' ||
          next.status === 'evaluate-error'
        ) {
          callbacksRef.current.onError?.(next.error)
        }

        callbacksRef.current.onEvaluate?.(next)
      })
    }, debounceMs)

    return () => {
      cancelled = true
      clearTimeout(handle)
    }
  }, [expressionValue, inputValue, debounceMs, evaluationTimeout])

  useLayoutEffect(() => {
    const el = expressionStackRef.current

    if (!el || !showResult) return

    const clampToBounds = () => {
      const max = Math.max(
        MIN_EXPRESSION_HEIGHT,
        el.clientHeight - MIN_RESULT_HEIGHT - RESIZE_HANDLE_HEIGHT,
      )

      setExpressionHeight((prev) => Math.min(prev, max))
    }

    /*
     * The observer delivers an initial notification on observe() (before paint),
     * which performs the first clamp — no separate synchronous call needed.
     */
    const observer = new ResizeObserver(clampToBounds)

    observer.observe(el)

    return () => {
      observer.disconnect()
    }
  }, [showResult])

  const resultText =
    evalState.status === 'success' ? stringifyResult(evalState.result) : ''
  const inputError = evalState.status === 'input-error' ? evalState.error : null

  const status = useMemo<StatusBadgeProps>(() => {
    switch (evalState.status) {
      case 'success':
        return { tone: 'valid', label: t('ui.jsonataEditor.valid', 'Valid') }

      case 'input-error':

      case 'parse-error':

      case 'evaluate-error':
        return { tone: 'error', label: t('ui.jsonataEditor.error', 'Error') }

      default:
        return { tone: 'idle', label: t('ui.jsonataEditor.ready', 'Ready') }
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
    (sample: JsonataSample) => {
      setExpression(sample.expression)
      setInput(toInputText(sample.input))
    },
    [setExpression, setInput],
  )

  const rootHeight = typeof height === 'number' ? `${height}px` : height
  const expressionFills = !showResult

  /* ── Result pane content ────────────────────────────────── */

  let resultBody: ReactNode

  if (evalState.status === 'success') {
    resultBody =
      evalState.result === undefined ? (
        <CenteredNotice>
          {t('ui.jsonataEditor.noMatch', 'No match')}
        </CenteredNotice>
      ) : (
        <CodeMirror
          value={resultText}
          extensions={jsonExtensions}
          editable={false}
          readOnly
          basicSetup={RESULT_SETUP}
          theme={isDark ? 'dark' : 'light'}
          height="100%"
          className="h-full text-[13px]"
        />
      )
  } else if (
    evalState.status === 'input-error' ||
    evalState.status === 'parse-error' ||
    evalState.status === 'evaluate-error'
  ) {
    resultBody = <ErrorNotice error={evalState.error} />
  } else {
    resultBody = (
      <CenteredNotice>
        {t(
          'ui.jsonataEditor.enterExpression',
          'Enter a JSONata expression to see the result',
        )}
      </CenteredNotice>
    )
  }

  /* ── Render ─────────────────────────────────────────────── */

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
                        'ui.jsonataEditor.aiAssistant',
                        'AI Assistant',
                      )}
                      onClick={() => setAiOpen(!aiOpen)}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={6}>
                    {t('ui.jsonataEditor.aiAssistant', 'AI Assistant')}
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
                    {t('ui.jsonataEditor.samples', 'Samples')}
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
                onClick={formatInput}
              >
                <Sparkles className="size-3.5" />
                {t('ui.jsonataEditor.format', 'Format')}
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
                  ? t('ui.jsonataEditor.copied', 'Copied')
                  : t('ui.jsonataEditor.copy', 'Copy')}
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
                      aria-label={t('ui.jsonataEditor.collapse', 'Collapse')}
                      onClick={() => setDialogOpen(false)}
                    >
                      <Minimize2 className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={6}>
                    {t('ui.jsonataEditor.collapse', 'Collapse')}
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
          {showInput && (
            <div
              className={cn(
                'flex min-h-0 min-w-0 flex-col',
                orientation === 'horizontal' ? 'w-1/2' : 'flex-1',
              )}
            >
              <PaneHeader
                icon={<FileJson className="size-3.5" />}
                title={t('ui.jsonataEditor.input', 'Input JSON')}
                right={
                  inputError ? (
                    <StatusBadge
                      tone="error"
                      label={t('ui.jsonataEditor.invalidJson', 'Invalid JSON')}
                    />
                  ) : undefined
                }
              />
              <div className="min-h-0 flex-1 overflow-hidden">
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
              </div>
            </div>
          )}

          <div
            ref={expressionStackRef}
            className={cn(
              'flex min-h-0 min-w-0 flex-1 flex-col',
              showInput &&
                orientation === 'horizontal' &&
                'border-l border-border',
              showInput &&
                orientation === 'vertical' &&
                'border-t border-border',
            )}
          >
            <div
              className={cn(
                'flex flex-col',
                expressionFills ? 'min-h-0 flex-1' : 'shrink-0',
              )}
              style={expressionFills ? undefined : { height: expressionHeight }}
            >
              <PaneHeader
                icon={<FunctionGlyph />}
                title={t('ui.jsonataEditor.expression', 'Expression')}
              />
              <div className="min-h-0 flex-1 overflow-hidden">
                <JsonataCodeEditor
                  value={expressionValue}
                  onChange={setExpression}
                  readOnly={readOnly}
                  placeholder={
                    placeholder ??
                    t(
                      'ui.jsonataEditor.placeholder',
                      'e.g. Account.Order.Product.Price',
                    )
                  }
                  contextPaths={effectiveContextPaths}
                  height="100%"
                  className="h-full"
                />
              </div>
            </div>

            {showResult && (
              <>
                <ResizeHandle
                  height={expressionHeight}
                  min={MIN_EXPRESSION_HEIGHT}
                  getMax={getExpressionMax}
                  onChange={setExpressionHeight}
                  label={t(
                    'ui.jsonataEditor.resize',
                    'Resize expression and result panes',
                  )}
                />

                <div className="flex min-h-0 flex-1 flex-col">
                  <PaneHeader
                    icon={<Sparkles className="size-3.5" />}
                    title={t('ui.jsonataEditor.result', 'Result')}
                  />
                  <div className="min-h-0 flex-1 overflow-hidden">
                    {resultBody}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {renderAiAssistant
          ? renderAiAssistant({
              open: aiOpen,
              width: aiAssistantWidth,
              onClose: closeAiAssistant,
              expression: expressionValue,
              input: inputValue,
            })
          : aiAssistantConfig && (
              <JsonataAIAssistant
                config={aiAssistantConfig}
                open={aiOpen}
                onClose={closeAiAssistant}
                expression={expressionValue}
                input={inputValue}
              />
            )}
      </div>
    </div>
  )

  if (compactMode) {
    const insertExpressionPath = (path: string) => {
      const view = compactEditorRef.current?.view

      if (view) {
        const { from, to } = view.state.selection.main

        view.dispatch({
          changes: { from, to, insert: path },
          selection: { anchor: from + path.length },
        })
        view.focus()
      } else {
        setExpression(expressionValue + path)
      }
    }

    return (
      <>
        <div
          className={cn(
            'relative overflow-hidden rounded-md border border-border bg-background',
            className,
          )}
        >
          <JsonataCodeEditor
            ref={compactEditorRef}
            value={expressionValue}
            onChange={setExpression}
            readOnly={readOnly}
            placeholder={
              placeholder ??
              t(
                'ui.jsonataEditor.placeholder',
                'e.g. Account.Order.Product.Price',
              )
            }
            contextPaths={effectiveContextPaths}
            minHeight={compactMinHeight}
            maxHeight={compactMaxHeight}
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
                        'ui.jsonataEditor.aiAssistant',
                        'AI Assistant',
                      )}
                      onClick={() => {
                        setAiOpen(true)
                        setDialogOpen(true)
                      }}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="left" sideOffset={6}>
                    {t('ui.jsonataEditor.aiAssistant', 'AI Assistant')}
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
                      'ui.jsonataEditor.expand',
                      'Open full editor',
                    )}
                    onClick={() => setDialogOpen(true)}
                  >
                    <Maximize2 className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" sideOffset={6}>
                  {t('ui.jsonataEditor.expand', 'Open full editor')}
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
                            'ui.jsonataEditor.insertVariable',
                            'Insert variable',
                          )}
                        >
                          <Variable className="size-3.5" />
                        </Button>
                      </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="left" sideOffset={6}>
                      {t('ui.jsonataEditor.insertVariable', 'Insert variable')}
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
                        'ui.jsonataEditor.searchPaths',
                        'Search paths…',
                      )}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {t('ui.jsonataEditor.noPaths', 'No paths.')}
                      </CommandEmpty>
                      <CommandGroup>
                        {effectiveContextPaths.map((cp) => (
                          <CommandItem
                            key={cp.path}
                            value={cp.path}
                            onSelect={() => {
                              insertExpressionPath(cp.path)
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

/** Small monospace `ƒ` glyph used as the Expression pane icon. */
function FunctionGlyph() {
  return (
    <span className="font-mono text-[13px] font-bold italic leading-none text-muted-foreground">
      ƒ
    </span>
  )
}
