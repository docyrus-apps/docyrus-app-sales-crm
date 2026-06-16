// @docyrus: [[architecture#Shared Record Detail Layout]]
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react'

import {
  AlignLeft,
  ArrowLeft,
  AtSign,
  Building2,
  CalendarClock,
  ChevronDown,
  CircleDot,
  Globe,
  Hash,
  Image as ImageIcon,
  Link2,
  Pencil,
  Phone,
  Search,
  Tag,
  Type,
} from 'lucide-react'

import { AnimatePresence, motion } from 'motion/react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import {
  type FieldChange,
  type RecordDetailField,
  EditableRecordDetail,
  EditableRecordDetailField,
} from '@/components/docyrus/editable-record-detail'
import { DialerPanel, useDialer } from '@/components/dialer/dialer-widget'

const INITIAL_VISIBLE_FIELDS = 4

// Resizable attribute panel bounds (px) — default narrow, draggable.
const PANEL_DEFAULT_WIDTH = 340
const PANEL_MIN_WIDTH = 280
const PANEL_MAX_WIDTH = 560

const FIELD_TYPE_ICONS: Record<
  string,
  ComponentType<{ className?: string }>
> = {
  'field-text': Type,
  'field-email': AtSign,
  'field-phone': Phone,
  'field-url': Globe,
  'field-textarea': AlignLeft,
  'field-select': Tag,
  'field-status': CircleDot,
  'field-relation': Link2,
  'field-image': ImageIcon,
  'field-number': Hash,
  'field-currency': Hash,
  'field-money': Hash,
  'field-percent': Hash,
  'field-date': CalendarClock,
  'field-datetime': CalendarClock,
}

function getFieldIcon(type?: string): ComponentType<{ className?: string }> {
  return (type && FIELD_TYPE_ICONS[type]) || Building2
}

/**
 * Bumps a version counter whenever the `record` reference changes (e.g. after a
 * save → query invalidation → refetch). Keying the inline/modal editors by this
 * version forces them to remount with a fresh value snapshot, keeping the two
 * editing surfaces in sync without disrupting an active in-progress edit (the
 * reference only changes on refetch, not while the user types).
 */
function useRecordVersion(record: unknown): number {
  const stateRef = useRef<{ last: unknown; version: number }>({
    last: record,
    version: 0,
  })

  if (stateRef.current.last !== record) {
    stateRef.current.last = record
    stateRef.current.version += 1
  }

  return stateRef.current.version
}

/** True when the viewport is wide enough for the side-by-side resizable layout. */
function useIsWideViewport(): boolean {
  const [wide, setWide] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(min-width: 1024px)').matches,
  )

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const onChange = (event: MediaQueryListEvent) => setWide(event.matches)

    mq.addEventListener('change', onChange)

    return () => mq.removeEventListener('change', onChange)
  }, [])

  return wide
}

// ─── Tab definition ───────────────────────────────────────────────────────────
export interface RecordDetailTab {
  /** Unique tab key */
  value: string
  /** Tab label */
  label: ReactNode
  /** Optional count badge shown next to the label */
  count?: number | null
  /** Optional leading icon */
  icon?: ReactNode
  /** Tab body */
  content: ReactNode
  /** Removes default padding/scroll wrapper (e.g. for grids that manage it) */
  bare?: boolean
}

// ─── KPI card (Overview highlights) ─────────────────────────────────────────────
export interface RecordKpiCardProps {
  label: ReactNode
  value: ReactNode
  hint?: ReactNode
  icon?: ReactNode
}

export function RecordKpiCard({
  label,
  value,
  hint,
  icon,
}: RecordKpiCardProps) {
  return (
    <div className="rounded-xl border bg-card/60 px-3.5 py-3">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-medium text-muted-foreground">
          {label}
        </span>
        {icon && <span className="text-muted-foreground/70">{icon}</span>}
      </div>
      <div className="mt-1.5 truncate text-base font-semibold leading-tight">
        {value}
      </div>
      {hint && (
        <div className="mt-0.5 truncate text-xs text-muted-foreground">
          {hint}
        </div>
      )}
    </div>
  )
}

// ─── Attribute panel (left card: header + actions + search + fields) ────────────
interface RecordAttributePanelProps {
  avatar?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  onBack?: () => void
  detailFields: Array<RecordDetailField>
  fieldSlugs: Array<string>
  record: Record<string, unknown>
  recordVersion: number
  onSave: (
    changes: Array<FieldChange>,
    values: Record<string, unknown>,
  ) => void | Promise<void>
  editTitle?: ReactNode
  /** Quick-action buttons rendered above the search bar (note, email, …) */
  actions?: ReactNode
  /** Render fields display-only (no inline edit / no edit-all modal) */
  readOnly?: boolean
}

function RecordAttributePanel({
  avatar,
  title,
  subtitle,
  onBack,
  detailFields,
  fieldSlugs,
  record,
  recordVersion,
  onSave,
  editTitle,
  readOnly,
  actions,
}: RecordAttributePanelProps) {
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const fieldBySlug = useMemo(() => {
    const map = new Map<string, RecordDetailField>()

    for (const entry of detailFields) {
      map.set(entry.field.slug, entry)
    }

    return map
  }, [detailFields])

  const isSearching = query.trim().length > 0

  const matchedSlugs = useMemo(() => {
    const q = query.trim().toLowerCase()

    if (!q) return fieldSlugs

    return fieldSlugs.filter((slug) => {
      const name = fieldBySlug.get(slug)?.field.name ?? slug

      return name.toLowerCase().includes(q) || slug.toLowerCase().includes(q)
    })
  }, [query, fieldSlugs, fieldBySlug])

  const displayedSlugs = isSearching
    ? matchedSlugs
    : expanded
      ? fieldSlugs
      : fieldSlugs.slice(0, INITIAL_VISIBLE_FIELDS)

  const hiddenCount = fieldSlugs.length - INITIAL_VISIBLE_FIELDS

  const handleModalSave = async (
    changes: Array<FieldChange>,
    values: Record<string, unknown>,
  ) => {
    await onSave(changes, values)
    setEditOpen(false)
  }

  return (
    <div className="crm-attribute-panel flex h-full min-h-0 flex-col overflow-hidden">
      {/* Keep the inline editor at the same compact height as the display row
          so clicking a field to edit it doesn't visibly grow / overlap. */}
      <style>{`
        .crm-attribute-panel [data-editing] :is(
          [data-slot="input"],
          [data-slot="mask-input"],
          [data-slot="phone-input"],
          [data-slot="phone-input-field"],
          [data-slot="select-trigger"]
        ) {
          height: 1.5rem !important;
          min-height: 1.5rem !important;
        }
      `}</style>

      {/* Record header — logo + title, aligned with the tabs card */}
      <div className="flex items-center gap-2.5 border-b px-3 py-2.5">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
          </button>
        )}
        {avatar}
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold leading-tight">
            {title}
          </div>
          {subtitle && (
            <div className="truncate text-xs text-muted-foreground">
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-1 border-b px-2.5 py-2">
          {actions}
        </div>
      )}

      <div className="flex items-center gap-1.5 border-b px-2.5 py-1.5">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search attributes..."
            className="h-7 border-none bg-transparent pl-8 text-[13px] shadow-none focus-visible:ring-0"
          />
        </div>
        {!readOnly && (
          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 text-muted-foreground"
            onClick={() => setEditOpen(true)}
            aria-label="Edit all attributes"
          >
            <Pencil className="size-3.5" />
          </Button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-1.5 py-2">
        <EditableRecordDetail
          key={recordVersion}
          fields={detailFields}
          record={record}
          readOnly={readOnly ?? false}
          trackChanges
          onSave={onSave}
        >
          <div className="space-y-px">
            {displayedSlugs.map((slug) => {
              const entry = fieldBySlug.get(slug)

              if (!entry) return null

              const Icon = getFieldIcon(entry.field.type)

              return (
                <div
                  key={slug}
                  className="group flex items-center gap-2 rounded-md py-0.5 pl-1.5 pr-0.5 transition-colors hover:bg-muted/40"
                >
                  <Icon className="size-3.5 shrink-0 text-muted-foreground/60" />
                  <span className="w-24 shrink-0 truncate text-[13px] text-muted-foreground">
                    {entry.field.name}
                  </span>
                  <div className="min-w-0 flex-1">
                    <EditableRecordDetailField
                      slug={slug}
                      showLabel={false}
                      editHint="progressive"
                      size="sm"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </EditableRecordDetail>

        {isSearching && matchedSlugs.length === 0 && (
          <p className="px-2 py-6 text-center text-[13px] text-muted-foreground">
            No attributes match your search.
          </p>
        )}

        {!isSearching && hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="mt-1 flex w-full items-center justify-center gap-1 rounded-md py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
          >
            <ChevronDown
              className={cn(
                'size-3.5 transition-transform',
                expanded && 'rotate-180',
              )}
            />
            {expanded ? 'Show less' : `Show ${hiddenCount} more`}
          </button>
        )}
      </div>

      {!readOnly && (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editTitle ?? 'Edit details'}</DialogTitle>
            </DialogHeader>
            <div className="max-h-[70vh] overflow-auto pr-1">
              <EditableRecordDetail
                fields={detailFields}
                record={record}
                readOnly={false}
                trackChanges
                actionBarSideOffset={8}
                onSave={handleModalSave}
              >
                <div className="space-y-0.5">
                  {fieldSlugs.map((slug) => (
                    <EditableRecordDetailField key={slug} slug={slug} />
                  ))}
                </div>
              </EditableRecordDetail>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export interface RecordDetailLayoutProps {
  isLoading?: boolean
  /** Leading avatar/logo element */
  avatar?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  /** Back navigation handler — renders a back button when provided */
  onBack?: () => void
  /** Field metadata for the attribute panel */
  detailFields: Array<RecordDetailField>
  /** Ordered slugs to render in the attribute panel */
  fieldSlugs: Array<string>
  /** Current record values keyed by slug */
  record: Record<string, unknown>
  /** Persist inline / modal edits */
  onInlineSave: (
    changes: Array<FieldChange>,
    values: Record<string, unknown>,
  ) => void | Promise<void>
  /** Title for the "edit all" modal */
  editTitle?: ReactNode
  /** Quick-action buttons above the attribute panel (note, email, sms, call) */
  attributeActions?: ReactNode
  /** Render the attribute panel display-only (e.g. converted/locked records) */
  readOnly?: boolean
  /** Custom dialer launcher in the tab bar (overrides the default phone button) */
  dialerTrigger?: ReactNode
  /** Right-side tab definitions */
  tabs: Array<RecordDetailTab>
  defaultTab?: string
  /** Controlled active tab (pair with onTabChange) */
  activeTab?: string
  onTabChange?: (value: string) => void
}

export function RecordDetailLayout({
  isLoading,
  avatar,
  title,
  subtitle,
  onBack,
  detailFields,
  fieldSlugs,
  record,
  onInlineSave,
  editTitle,
  attributeActions,
  readOnly,
  dialerTrigger,
  tabs,
  defaultTab,
  activeTab,
  onTabChange,
}: RecordDetailLayoutProps) {
  const recordVersion = useRecordVersion(record)
  const isWide = useIsWideViewport()
  const dialer = useDialer()

  const containerRef = useRef<HTMLDivElement>(null)
  const [panelWidth, setPanelWidth] = useState(PANEL_DEFAULT_WIDTH)

  const handleResizeStart = useCallback((event: ReactMouseEvent) => {
    event.preventDefault()
    const startX = event.clientX
    const startWidth = containerRef.current
      ? ((
          containerRef.current.querySelector(
            '[data-slot="record-attr-pane"]',
          ) as HTMLElement | null
        )?.offsetWidth ?? PANEL_DEFAULT_WIDTH)
      : PANEL_DEFAULT_WIDTH

    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'

    const onMove = (moveEvent: MouseEvent) => {
      const next = startWidth + (moveEvent.clientX - startX)

      setPanelWidth(Math.min(PANEL_MAX_WIDTH, Math.max(PANEL_MIN_WIDTH, next)))
    }

    const onUp = () => {
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [])

  if (isLoading) {
    return <RecordDetailLayoutSkeleton />
  }

  const attributePane = (
    <RecordAttributePanel
      avatar={avatar}
      title={title}
      subtitle={subtitle}
      onBack={onBack}
      detailFields={detailFields}
      fieldSlugs={fieldSlugs}
      record={record}
      recordVersion={recordVersion}
      onSave={onInlineSave}
      editTitle={editTitle}
      actions={attributeActions}
      readOnly={readOnly}
    />
  )

  const tabsPane = (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <Tabs
        {...(activeTab != null
          ? { value: activeTab, onValueChange: onTabChange }
          : { defaultValue: defaultTab ?? tabs[0]?.value })}
        className="flex min-h-0 flex-1 flex-col"
      >
        {/* Tab bar — tabs left, dialer toggle right-aligned on the same line */}
        <div className="flex items-center gap-2 border-b px-4 py-2.5">
          <div className="min-w-0 flex-1 overflow-x-auto">
            <TabsList className="w-max gap-0.5">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="gap-1.5 px-2.5 text-[13px]"
                >
                  {tab.icon}
                  {tab.label}
                  {tab.count != null && (
                    <span className="rounded bg-muted-foreground/15 px-1 text-[11px] tabular-nums leading-tight text-muted-foreground">
                      {tab.count}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          {!dialer.isOpen &&
            (dialerTrigger ?? (
              <button
                type="button"
                onClick={() => dialer.open()}
                aria-label="Open dialer"
                className="flex size-8 shrink-0 items-center justify-center rounded-md border text-emerald-600 transition-colors hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
              >
                <Phone className="size-4" />
              </button>
            ))}
        </div>

        {/* Body — tab content + dialer column (content narrows when open) */}
        <div className="flex min-h-0 flex-1">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {tabs.map((tab) => (
              <TabsContent
                key={tab.value}
                value={tab.value}
                className={cn(
                  'min-h-0 flex-1',
                  tab.bare
                    ? 'flex-col data-[state=active]:flex'
                    : 'overflow-auto p-4',
                )}
              >
                {tab.content}
              </TabsContent>
            ))}
          </div>

          <AnimatePresence initial={false}>
            {dialer.isOpen && (
              <motion.div
                key="dialer-col"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 360, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 320, damping: 34 }}
                className="h-full shrink-0 overflow-hidden border-s"
              >
                <div className="h-full w-[360px] overflow-auto p-3">
                  <DialerPanel
                    contact={dialer.contact}
                    onClose={dialer.close}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Tabs>
    </div>
  )

  return (
    <div
      ref={containerRef}
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border bg-card/80 shadow-sm lg:flex-row"
    >
      {/* Left: attribute pane (fixed-but-resizable width on wide screens) */}
      <div
        data-slot="record-attr-pane"
        className="flex min-h-0 flex-col max-lg:border-b lg:h-full lg:shrink-0"
        style={isWide ? { width: panelWidth } : undefined}
      >
        {attributePane}
      </div>

      {/* Shared divider — the single line between both panes, draggable */}
      <div
        role="separator"
        aria-orientation="vertical"
        onMouseDown={handleResizeStart}
        className="group relative z-10 hidden w-px shrink-0 cursor-col-resize bg-border transition-colors hover:bg-primary/50 lg:block"
      >
        {/* Wider invisible hit area so the 1px line is easy to grab */}
        <span className="absolute inset-y-0 -left-1.5 -right-1.5" />
      </div>

      {/* Right: tabs pane (fills remaining width) */}
      <div className="flex min-h-0 flex-1 flex-col">{tabsPane}</div>
    </div>
  )
}

// ─── Empty / unavailable tab placeholder ───────────────────────────────────────
export interface RecordTabPlaceholderProps {
  icon?: ReactNode
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
}

export function RecordTabPlaceholder({
  icon,
  title,
  description,
  action,
}: RecordTabPlaceholderProps) {
  return (
    <div className="flex h-full min-h-48 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      {icon && (
        <div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <p className="text-[13px] font-medium">{title}</p>
        {description && (
          <p className="mx-auto max-w-sm text-[13px] text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}

function RecordDetailLayoutSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border bg-card/80 shadow-sm lg:flex-row">
      <div className="space-y-3 p-3 max-lg:border-b lg:w-[340px] lg:shrink-0 lg:border-e">
        <div className="flex items-center gap-2.5">
          <Skeleton className="size-9 rounded-lg" />
          <Skeleton className="h-5 w-32" />
        </div>
        <Skeleton className="h-8 w-full" />
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-6 w-full" />
        ))}
      </div>
      <div className="flex-1 space-y-4 p-3">
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  )
}
