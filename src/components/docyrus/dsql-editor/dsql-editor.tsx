'use client'

// @ts-nocheck
/* eslint-disable */
import {
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Database,
  Loader2,
  Maximize2,
  Minimize2,
  Play,
  Search,
  Table2,
  WandSparkles,
  X,
} from 'lucide-react'

import { CodyAgentToggle } from '@/components/docyrus/editor-agent'
import {
  type ColumnDef,
  DataGrid,
  useDataGrid,
} from '@/components/docyrus/data-grid'
import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

import { DsqlCodeEditor } from './dsql-code-editor'
import {
  type DsqlColumnMeta,
  type DsqlEditorProps,
  type DsqlRunResult,
  type DsqlRunState,
} from './dsql-editor-types'
import { formatSql } from './lib/format-sql'
import { extractDsqlError, runDsqlQuery } from './lib/run-query'

/** Matches the backend `LOGICAL_SQL_QUERY_MAX_LENGTH`. */
const QUERY_MAX_LENGTH = 100_000
/** Delegated user session row ceiling (`LOGICAL_SQL_MAX_LIMIT`). */
const SERVER_ROW_CAP = 1000
const DEFAULT_RESULT_PAGE_SIZE = 25

type Row = Record<string, unknown>

/** Maps an inferred DSQL column type onto a data-grid cell variant. */
function pickVariant(
  type: DsqlColumnMeta['type'],
): NonNullable<ColumnDef<Row>['meta']>['cell'] {
  switch (type) {
    case 'number':
      return { variant: 'number' }

    case 'boolean':
      return { variant: 'checkbox' }

    case 'date':
      return { variant: 'date' }

    case 'datetime':
      return { variant: 'datetime' }

    case 'uuid':
      return { variant: 'uuid' }

    default:
      return { variant: 'short-text' }
  }
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

function CenteredNotice({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center p-4 text-center text-xs text-muted-foreground">
      {children}
    </div>
  )
}

/*
 * ────────────────────────────────────────────────────────────
 * Result grid
 * ────────────────────────────────────────────────────────────
 */

function DsqlResultGrid({
  result,
  pageSize,
}: {
  result: DsqlRunResult
  pageSize: number
}) {
  const { t } = useUiTranslation()

  const columns = useMemo<ColumnDef<Row>[]>(
    () =>
      result.columns.map((c) => ({
        accessorKey: c.name,
        header: c.label ?? c.name,
        size: 180,
        meta: { label: c.label ?? c.name, cell: pickVariant(c.type) },
      })),
    [result.columns],
  )

  const { table, ...gridProps } = useDataGrid<Row>({
    data: result.rows,
    columns,
    pagingMode: 'standard',
    pageSize,
    enableSearch: true,
    enableGrouping: false,
    readOnly: true,
  })

  const { searchState } = gridProps
  const query = searchState?.searchQuery ?? ''
  const matchCount = searchState?.searchMatches?.length ?? 0
  const matchIndex = searchState?.matchIndex ?? 0

  const handleSearchChange = useCallback(
    (value: string) => {
      searchState?.onSearchQueryChange(value)
      searchState?.onSearch(value)
    },
    [searchState],
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Visible find-in-results bar — highlights + jumps to matches across the returned rows. */}
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-border bg-muted/20 px-2.5">
        <Search className="size-3.5 shrink-0 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={t('ui.dsqlEditor.searchResults', 'Search results…')}
          className="h-7 min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
        />
        {query && (
          <>
            <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
              {matchCount > 0
                ? `${matchIndex + 1}/${matchCount}`
                : t('ui.dsqlEditor.noMatches', 'No matches')}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="size-6 shrink-0 p-0"
              disabled={matchCount === 0}
              aria-label={t('ui.dsqlEditor.prevMatch', 'Previous match')}
              onClick={() => searchState?.onNavigateToPrevMatch()}
            >
              <ChevronUp className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="size-6 shrink-0 p-0"
              disabled={matchCount === 0}
              aria-label={t('ui.dsqlEditor.nextMatch', 'Next match')}
              onClick={() => searchState?.onNavigateToNextMatch()}
            >
              <ChevronDown className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="size-6 shrink-0 p-0"
              aria-label={t('ui.dsqlEditor.clearSearch', 'Clear search')}
              onClick={() => handleSearchChange('')}
            >
              <X className="size-3.5" />
            </Button>
          </>
        )}
      </div>
      <div className="min-h-0 flex-1">
        <DataGrid table={table} {...gridProps} height="auto" />
      </div>
    </div>
  )
}

/*
 * ────────────────────────────────────────────────────────────
 * DsqlEditor
 * ────────────────────────────────────────────────────────────
 */

/**
 * A two-pane workbench for writing and running DSQL (Docyrus Structured Query
 * Language) — a security-scoped SQL surface over the tenant's data sources.
 * A top SQL editor (Format + Run) feeds a bottom result grid with client-side
 * pagination, and an embedded AI agent can author queries via the slot.
 */
export function DsqlEditor({
  client,
  onRun,
  query,
  defaultQuery,
  onQueryChange,
  onResult,
  onError,
  schema,
  resultPageSize = DEFAULT_RESULT_PAGE_SIZE,
  height = '100%',
  className,
  aiAssistantOpen,
  onAiAssistantOpenChange,
  renderAiAssistant,
  compactMode = false,
  compactMinHeight = '2.5rem',
  compactMaxHeight = '12rem',
  ref,
}: DsqlEditorProps) {
  const { t } = useUiTranslation()

  const isQueryControlled = query !== undefined
  const [queryState, setQueryState] = useState(defaultQuery ?? '')
  const queryValue = isQueryControlled ? query : queryState

  const [runState, setRunState] = useState<DsqlRunState>({ status: 'idle' })
  const [dialogOpen, setDialogOpen] = useState(false)
  const compactEditorRef = useRef<HTMLDivElement>(null)

  const isAiOpenControlled = aiAssistantOpen !== undefined
  const [aiOpenInternal, setAiOpenInternal] = useState(false)
  const aiOpen = isAiOpenControlled ? aiAssistantOpen : aiOpenInternal
  const setAiOpen = useCallback(
    (next: boolean) => {
      if (!isAiOpenControlled) setAiOpenInternal(next)
      onAiAssistantOpenChange?.(next)
    },
    [isAiOpenControlled, onAiAssistantOpenChange],
  )
  const closeAiAssistant = useCallback(() => setAiOpen(false), [setAiOpen])

  const isAiAssistantEnabled = typeof renderAiAssistant === 'function'

  const setQuery = useCallback(
    (next: string) => {
      if (!isQueryControlled) setQueryState(next)
      onQueryChange?.(next)
    },
    [isQueryControlled, onQueryChange],
  )

  const isRunning = runState.status === 'running'
  const canRun =
    (Boolean(client) || typeof onRun === 'function') &&
    queryValue.trim().length > 0
  const isOverLength = queryValue.length > QUERY_MAX_LENGTH

  const run = useCallback(
    async (override?: string) => {
      if (isRunning) return

      const sql = (override ?? queryValue).trim()

      if (!sql) return

      if (sql.length > QUERY_MAX_LENGTH) {
        const message = t(
          'ui.dsqlEditor.tooLong',
          'Query exceeds the maximum length (100,000 characters).',
        )

        setRunState({ status: 'error', message })
        onError?.(message)

        return
      }

      const transport =
        onRun ?? (client ? (q: string) => runDsqlQuery(client, q) : null)

      if (!transport) {
        const message = t(
          'ui.dsqlEditor.noClient',
          'Connect a client to run queries.',
        )

        setRunState({ status: 'error', message })
        onError?.(message)

        return
      }

      setRunState({ status: 'running' })
      const startedAt = performance.now()

      try {
        const result = await transport(sql)
        const withDuration: DsqlRunResult = {
          ...result,
          durationMs:
            result.durationMs ?? Math.round(performance.now() - startedAt),
        }

        setRunState({ status: 'success', result: withDuration })
        onResult?.(withDuration)
      } catch (err) {
        const message = extractDsqlError(err)

        setRunState({ status: 'error', message })
        onError?.(message)
      }
    },
    [isRunning, queryValue, onRun, client, onResult, onError, t],
  )

  useImperativeHandle(
    ref,
    () => ({
      run: (overrideQuery?: string) => {
        void run(overrideQuery)
      },
      getQuery: () => queryValue,
    }),
    [run, queryValue],
  )

  const handleFormat = useCallback(() => {
    if (isRunning || !queryValue.trim()) return
    setQuery(formatSql(queryValue))
  }, [isRunning, queryValue, setQuery])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault()
        void run()
      }
    },
    [run],
  )

  const rootHeight = typeof height === 'number' ? `${height}px` : height

  /* ── Result pane body ───────────────────────────────────── */

  let resultBody: ReactNode

  if (runState.status === 'running') {
    resultBody = (
      <CenteredNotice>
        <span className="flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" />
          {t('ui.dsqlEditor.running', 'Running query…')}
        </span>
      </CenteredNotice>
    )
  } else if (runState.status === 'error') {
    resultBody = (
      <div className="flex h-full flex-col gap-1.5 overflow-auto p-3 text-xs">
        <div className="flex items-center gap-1.5 font-medium text-destructive">
          <AlertCircle className="size-3.5 shrink-0" />
          <span>{t('ui.dsqlEditor.queryFailed', 'Query failed')}</span>
        </div>
        <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-destructive/90">
          {runState.message}
        </pre>
      </div>
    )
  } else if (runState.status === 'success') {
    resultBody =
      runState.result.rows.length === 0 ? (
        <CenteredNotice>
          {t('ui.dsqlEditor.noRows', 'Query returned no rows.')}
        </CenteredNotice>
      ) : (
        <div className="min-h-0 flex-1">
          <DsqlResultGrid result={runState.result} pageSize={resultPageSize} />
        </div>
      )
  } else {
    resultBody = (
      <CenteredNotice>
        {t(
          'ui.dsqlEditor.idle',
          'Run a query to see results. Reference data sources as app.dataSource, e.g. base.contact.',
        )}
      </CenteredNotice>
    )
  }

  const rowCountNote =
    runState.status === 'success'
      ? t(
          'ui.dsqlEditor.rowCountNote',
          '{count} rows — server caps results at {cap}; add LIMIT / filters to narrow.',
        )
          .replace('{count}', String(runState.result.rowCount))
          .replace('{cap}', String(SERVER_ROW_CAP))
      : null

  const renderFullEditor = (inDialog: boolean): ReactNode => (
    <TooltipProvider delayDuration={150}>
      <div
        className={cn(
          'flex flex-col overflow-hidden bg-background',
          inDialog
            ? 'h-full'
            : cn('rounded-lg border border-border', className),
        )}
        style={inDialog ? undefined : { height: rootHeight }}
      >
        {/* Toolbar */}
        <div className="flex h-10 shrink-0 items-center justify-between gap-2 border-b border-border bg-muted/30 px-2.5">
          <div className="flex items-center gap-2">
            {isAiAssistantEnabled && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <CodyAgentToggle
                    active={aiOpen}
                    aria-label={t('ui.dsqlEditor.aiAssistant', 'AI Assistant')}
                    onClick={() => setAiOpen(!aiOpen)}
                  />
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={6}>
                  {t('ui.dsqlEditor.aiAssistant', 'AI Assistant')}
                </TooltipContent>
              </Tooltip>
            )}
            <Database className="size-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold text-foreground">
              {t('ui.dsqlEditor.title', 'DSQL Query')}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
              disabled={isRunning || !queryValue.trim()}
              onClick={handleFormat}
            >
              <WandSparkles className="size-3.5" />
              {t('ui.dsqlEditor.format', 'Format')}
            </Button>

            <Tooltip>
              <TooltipTrigger asChild>
                {/* span wrapper keeps the tooltip working while the button is disabled */}
                <span>
                  <Button
                    size="sm"
                    className="h-7 gap-1 px-2.5 text-xs"
                    disabled={!canRun || isRunning}
                    onClick={() => void run()}
                  >
                    {isRunning ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Play className="size-3.5" />
                    )}
                    {t('ui.dsqlEditor.run', 'Run')}
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={6}>
                {!client && !onRun
                  ? t(
                      'ui.dsqlEditor.noClient',
                      'Connect a client to run queries.',
                    )
                  : t('ui.dsqlEditor.runHint', 'Run query (⌘/Ctrl + Enter)')}
              </TooltipContent>
            </Tooltip>

            {inDialog && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="size-7 p-0"
                    aria-label={t('ui.dsqlEditor.collapse', 'Collapse')}
                    onClick={() => setDialogOpen(false)}
                  >
                    <Minimize2 className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={6}>
                  {t('ui.dsqlEditor.collapse', 'Collapse')}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Panes + agent slot */}
        <div className="relative flex min-h-0 flex-1" onKeyDown={handleKeyDown}>
          <div className="flex min-w-0 min-h-0 flex-1 flex-col">
            {/* Query pane */}
            <div className="flex h-[clamp(140px,30%,280px)] shrink-0 flex-col border-b border-border">
              <PaneHeader
                icon={<Database className="size-3.5" />}
                title={t('ui.dsqlEditor.query', 'DSQL Query')}
                right={
                  isOverLength ? (
                    <span className="text-[11px] font-medium text-destructive">
                      {t('ui.dsqlEditor.overLength', 'Too long')}
                    </span>
                  ) : undefined
                }
              />
              <div className="min-h-0 flex-1 overflow-hidden">
                <DsqlCodeEditor
                  value={queryValue}
                  onChange={setQuery}
                  schema={schema}
                  placeholder={t(
                    'ui.dsqlEditor.placeholder',
                    'select id, email from base.contact limit 100',
                  )}
                  height="100%"
                  className="h-full"
                />
              </div>
            </div>

            {/* Result pane */}
            <div className="flex min-h-0 flex-1 flex-col">
              <PaneHeader
                icon={<Table2 className="size-3.5" />}
                title={t('ui.dsqlEditor.result', 'Result')}
                right={
                  rowCountNote ? (
                    <span className="truncate text-[11px] font-normal normal-case text-muted-foreground">
                      {rowCountNote}
                    </span>
                  ) : undefined
                }
              />
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                {resultBody}
              </div>
            </div>
          </div>

          {renderAiAssistant?.({
            open: aiOpen,
            onClose: closeAiAssistant,
            query: queryValue,
          })}
        </div>
      </div>
    </TooltipProvider>
  )

  if (compactMode) {
    return (
      <>
        <div
          ref={compactEditorRef}
          className={cn(
            'relative overflow-hidden rounded-md border border-border bg-background',
            className,
          )}
        >
          <DsqlCodeEditor
            value={queryValue}
            onChange={setQuery}
            schema={schema}
            readOnly={false}
            placeholder={t(
              'ui.dsqlEditor.placeholder',
              'select id, email from base.contact limit 100',
            )}
            minHeight={compactMinHeight}
            maxHeight={compactMaxHeight}
            lineNumbers={false}
            className="pr-9"
          />
          <div className="absolute right-1 top-1 z-10 flex flex-col gap-1">
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="size-7 p-0 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label={t('ui.dsqlEditor.expand', 'Open full editor')}
                    onClick={() => setDialogOpen(true)}
                  >
                    <Maximize2 className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" sideOffset={6}>
                  {t('ui.dsqlEditor.expand', 'Open full editor')}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent
            showCloseButton={false}
            className="grid w-[min(95vw,1200px)] gap-0 overflow-hidden p-0 !max-w-[min(95vw,1200px)] sm:!max-w-[min(95vw,1200px)]"
          >
            <DialogHeader className="sr-only">
              <DialogTitle>
                {t('ui.dsqlEditor.title', 'DSQL Query')}
              </DialogTitle>
            </DialogHeader>
            <div className="h-[min(85vh,42rem)]">{renderFullEditor(true)}</div>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return renderFullEditor(false)
}
