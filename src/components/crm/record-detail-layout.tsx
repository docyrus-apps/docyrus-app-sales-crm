// @docyrus: [[architecture#Shared Record Detail Layout]]
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  type ComponentType,
  type MouseEvent as ReactMouseEvent,
  type ReactNode
} from 'react'

import type {
  FieldChange,
  RecordDetailField
} from '@/components/docyrus/editable-record-detail'

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
  MapPin,
  MoreHorizontal,
  Pencil,
  Phone,
  Rows3,
  Search,
  Tag,
  Type
} from 'lucide-react'

import { AnimatePresence, motion } from 'motion/react'

import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

import {
  EditableRecordDetail,
  EditableRecordDetailField
} from '@/components/docyrus/editable-record-detail'
import { DialerPanel, useDialer } from '@/components/dialer/dialer-widget'
import { RecordEditForm } from '@/components/crm/record-edit-form'

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
  'field-locationSelect': MapPin
}

/**
 * Context handed to a custom field renderer (see `fieldRenderers`): the current
 * record plus a `save` that persists a partial patch through the page's
 * `onInlineSave` (building the `FieldChange[]` for the changed slugs).
 */
export interface FieldRenderContext {
  record: Record<string, unknown>;
  save: (patch: Record<string, unknown>) => void | Promise<void>;
  /** True when the attribute panel is display-only */
  readOnly: boolean;
}

type FieldRendererMap = Record<string, (ctx: FieldRenderContext) => ReactNode>

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
    version: 0
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
    () => typeof window !== 'undefined' &&
      window.matchMedia('(min-width: 1024px)').matches
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
  value: string;
  /** Tab label */
  label: ReactNode;
  /** Optional count badge shown next to the label */
  count?: number | null;
  /** Optional leading icon */
  icon?: ReactNode;
  /** Tab body */
  content: ReactNode;
  /** Removes default padding/scroll wrapper (e.g. for grids that manage it) */
  bare?: boolean;
}

// ─── KPI card (Overview highlights) ─────────────────────────────────────────────
export interface RecordKpiCardProps {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
}

export function RecordKpiCard({
  label,
  value,
  hint,
  icon
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
  avatar?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  onBack?: () => void;
  detailFields: Array<RecordDetailField>;
  fieldSlugs: Array<string>;
  record: Record<string, unknown>;
  recordVersion: number;
  onSave: (
    changes: Array<FieldChange>,
    values: Record<string, unknown>
  ) => void | Promise<void>;
  editTitle?: ReactNode;
  /** Quick-action buttons rendered above the search bar (note, email, …) */
  actions?: ReactNode;
  /** Soft banner shown above the attribute fields (e.g. read-only notice) */
  notice?: ReactNode;
  /** Render fields display-only (no inline edit / no edit-all modal) */
  readOnly?: boolean;
  /** Hide only the title-row edit-all pencil while keeping inline field editing */
  showEditAllButton?: boolean;
  /** Per-slug custom renderers that replace the default inline editor */
  fieldRenderers?: FieldRendererMap;
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
  showEditAllButton = true,
  actions,
  notice,
  fieldRenderers
}: RecordAttributePanelProps) {
  const { t } = useTranslation()
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
    values: Record<string, unknown>
  ) => {
    await onSave(changes, values)
    setEditOpen(false)
  }

  // Persist a partial patch coming from a custom field renderer.
  const handleFieldSave = useCallback(
    (patch: Record<string, unknown>) => onSave(
        Object.entries(patch).map(([fieldSlug, newValue]) => ({
          fieldSlug,
          fieldName: fieldBySlug.get(fieldSlug)?.field.name ?? fieldSlug,
          originalValue: record[fieldSlug],
          newValue
        })),
        { ...record, ...patch }
      ),
    [fieldBySlug, onSave, record]
  )

  return (
    <div className="crm-attribute-panel flex h-full min-h-0 flex-col overflow-hidden">
      {/* Keep the inline editor at the same compact height as the display row
          so clicking a field to edit it doesn't visibly grow / overlap. */}
      <style>
        {`
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

        /* Normalize every value renderer to a single font size (13px) so the
           key–value list reads uniformly regardless of each renderer's own
           text-sm / text-xs. Scoped to the attribute panel only — renderers
           keep their native sizes everywhere else. */
        .crm-attribute-panel [data-slot="editable-value"] {
          font-size: 13px;
        }
        .crm-attribute-panel [data-slot="editable-value"] :is(span, p, a, div, button) {
          font-size: inherit;
        }
      `}
      </style>

      {/* Record header — logo + title, aligned with the tabs card. */}
      <div className="flex items-start gap-2.5 border-b px-3 py-2.5">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label={t('common.back')}
            className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <ArrowLeft className="size-4" />
          </button>
        )}
        {avatar}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <div className="min-w-0 flex-1 truncate text-[15px] font-semibold leading-tight">
              {title}
            </div>
            {!readOnly && showEditAllButton && (
              <Button
                id="edit-record-button"
                variant="ghost"
                size="icon"
                className="-my-1 size-7 shrink-0 text-muted-foreground"
                onClick={() => setEditOpen(true)}
                aria-label={t('recordDetail.editAllAttributes')}>
                <Pencil className="size-3.5" />
              </Button>
            )}
          </div>
          {subtitle && (
            <div className="truncate text-xs text-muted-foreground">
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {actions && (
        <div className="border-b px-2.5 py-2">
          {/* Quick actions: the primary (Note) sits left; secondary icon
              actions (email/sms/call) are right-aligned via an `ml-auto`
              group provided by the caller. */}
          <div className="flex items-center gap-1">{actions}</div>
        </div>
      )}

      <div className="flex items-center gap-1.5 border-b px-2.5 py-1.5">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder={t('recordDetail.searchAttributes')}
            className="h-7 border-none bg-transparent pl-8 text-[13px] shadow-none focus-visible:ring-0" />
        </div>
      </div>

      {notice && <div className="border-b px-2.5 py-2">{notice}</div>}

      <div className="min-h-0 flex-1 overflow-auto px-1.5 py-2">
        <div className="mb-1.5 flex items-center gap-1.5 px-1.5 text-[13px] font-medium text-muted-foreground">
          <Rows3 className="size-3.5" />
          {t('recordDetail.attributes')}
        </div>
        <EditableRecordDetail
          key={recordVersion}
          fields={detailFields}
          record={record}
          readOnly={readOnly ?? false}
          trackChanges
          onSave={onSave}>
          <div className="space-y-px">
            {displayedSlugs.map((slug) => {
              const entry = fieldBySlug.get(slug)

              if (!entry) return null

              const Icon = getFieldIcon(entry.field.type)

              return (
                <div
                  key={slug}
                  className="group flex items-center gap-2 rounded-md py-0.5 pl-1.5 pr-0.5 transition-colors hover:bg-muted/40">
                  <Icon className="size-3.5 shrink-0 text-muted-foreground/60" />
                  <span className="w-24 shrink-0 break-words text-[13px] leading-tight text-muted-foreground">
                    {entry.field.name}
                  </span>
                  <div className="min-w-0 flex-1">
                    {fieldRenderers?.[slug] ? (
                      fieldRenderers[slug]({
                        record,
                        save: handleFieldSave,
                        readOnly: readOnly ?? false
                      })
                    ) : (
                      <EditableRecordDetailField
                        slug={slug}
                        showLabel={false}
                        editHint="progressive"
                        size="sm" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </EditableRecordDetail>

        {isSearching && matchedSlugs.length === 0 && (
          <p className="px-2 py-6 text-center text-[13px] text-muted-foreground">
            {t('recordDetail.noAttributesMatch')}
          </p>
        )}

        {!isSearching && hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setExpanded(value => !value)}
            className="mt-1 flex w-full items-center justify-center gap-1 rounded-md py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground">
            <ChevronDown
              className={cn(
                'size-3.5 transition-transform',
                expanded && 'rotate-180'
              )} />
            {expanded
              ? t('recordDetail.showLess')
              : t('recordDetail.showMore', { count: hiddenCount })}
          </button>
        )}
      </div>

      {!readOnly && (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="flex max-h-[85vh] max-w-lg flex-col">
            <DialogHeader>
              <DialogTitle>
                {editTitle ?? t('recordDetail.editDetails')}
              </DialogTitle>
            </DialogHeader>
            {/* A plain always-editable form — not the inline click-to-edit
                cells, whose floating portal editor detaches on scroll inside a
                dialog. Remounted per open (key) so it seeds fresh values. */}
            {editOpen && (
              <RecordEditForm
                key={recordVersion}
                fields={detailFields}
                fieldSlugs={fieldSlugs}
                record={record}
                fieldRenderers={fieldRenderers}
                onSave={handleModalSave}
                onFieldSave={handleFieldSave}
                onCancel={() => setEditOpen(false)} />
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// ─── Tab bar with overflow "+N more" menu ───────────────────────────────────────
/**
 * Renders tabs that fit the available width inline; the rest collapse into a
 * "+N more" dropdown instead of horizontally scrolling. Widths are measured
 * from a hidden mirror row, and the visible count is recomputed on resize.
 */
function RecordDetailTabBar({
  tabs,
  current,
  onSelect
}: {
  tabs: Array<RecordDetailTab>;
  current: string;
  onSelect: (value: string) => void;
}) {
  const { t } = useTranslation()
  const rowRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)
  const widthsRef = useRef<Array<number>>([])
  const [visibleCount, setVisibleCount] = useState(tabs.length)

  const signal = tabs.map(tab => `${tab.value}:${tab.count ?? ''}`).join('|')

  const recompute = useCallback(() => {
    const row = rowRef.current
    const widths = widthsRef.current

    if (!row || widths.length !== tabs.length) return

    const available = row.clientWidth
    const GAP = 2
    const MORE = 76 // reserved width for the "+N more" trigger

    const totalAll = widths.reduce((sum, width) => sum + width + GAP, 0)

    if (totalAll <= available) {
      setVisibleCount(tabs.length)

      return
    }

    let used = 0
    let count = 0

    for (const width of widths) {
      const next = width + GAP

      if (used + next + MORE > available) break
      used += next
      count++
    }

    setVisibleCount(Math.max(1, count))
  }, [tabs.length])

  // Measure intrinsic tab widths whenever the tab set changes.
  useEffect(() => {
    const node = measureRef.current

    if (!node) return

    widthsRef.current = Array.from(node.children).map(
      child => (child as HTMLElement).offsetWidth
    )
    recompute()
  }, [signal, recompute])

  // Recompute on container resize.
  useEffect(() => {
    const row = rowRef.current

    if (!row) return

    const observer = new ResizeObserver(recompute)

    observer.observe(row)

    return () => observer.disconnect()
  }, [recompute])

  const visible = tabs.slice(0, visibleCount)
  const overflow = tabs.slice(visibleCount)
  const activeHidden = overflow.some(tab => tab.value === current)

  return (
    <div ref={rowRef} className="relative min-w-0 flex-1 overflow-hidden">
      {/* Hidden mirror row — sized like the triggers to measure their widths. */}
      <div
        ref={measureRef}
        aria-hidden
        className="pointer-events-none invisible absolute left-0 top-0 flex gap-0.5 whitespace-nowrap">
        {tabs.map(tab => (
          <span
            key={tab.value}
            className="inline-flex items-center gap-1.5 px-2.5 text-[13px]">
            {tab.icon}
            {tab.label}
            {tab.count != null && (
              <span className="rounded px-1 text-[11px] tabular-nums leading-tight">
                {tab.count}
              </span>
            )}
          </span>
        ))}
      </div>

      <TabsList className="w-max gap-0.5">
        {visible.map(tab => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="gap-1.5 px-2.5 text-[13px]">
            {tab.icon}
            {tab.label}
            {tab.count != null && (
              <span className="rounded bg-muted-foreground/15 px-1 text-[11px] tabular-nums leading-tight text-muted-foreground">
                {tab.count}
              </span>
            )}
          </TabsTrigger>
        ))}

        {overflow.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  'inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                  activeHidden && 'bg-muted text-foreground'
                )}>
                <MoreHorizontal className="size-3.5" />
                {t('recordDetail.more', { count: overflow.length })}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              {overflow.map(tab => (
                <DropdownMenuItem
                  key={tab.value}
                  onSelect={() => onSelect(tab.value)}
                  className={cn(
                    'gap-2 text-[13px]',
                    tab.value === current && 'bg-accent'
                  )}>
                  {tab.icon}
                  <span className="flex-1">{tab.label}</span>
                  {tab.count != null && (
                    <span className="rounded bg-muted-foreground/15 px-1 text-[11px] tabular-nums leading-tight text-muted-foreground">
                      {tab.count}
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </TabsList>
    </div>
  )
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export interface RecordDetailLayoutProps {
  isLoading?: boolean;
  /** Leading avatar/logo element */
  avatar?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Back navigation handler — renders a back button when provided */
  onBack?: () => void;
  /** Field metadata for the attribute panel */
  detailFields: Array<RecordDetailField>;
  /** Ordered slugs to render in the attribute panel */
  fieldSlugs: Array<string>;
  /** Current record values keyed by slug */
  record: Record<string, unknown>;
  /** Persist inline / modal edits */
  onInlineSave: (
    changes: Array<FieldChange>,
    values: Record<string, unknown>
  ) => void | Promise<void>;
  /** Title for the "edit all" modal */
  editTitle?: ReactNode;
  /** Quick-action buttons above the attribute panel (note, email, sms, call) */
  attributeActions?: ReactNode;
  /** Soft banner above the attribute fields (e.g. converted/read-only notice) */
  attributeNotice?: ReactNode;
  /** Render the attribute panel display-only (e.g. converted/locked records) */
  readOnly?: boolean;
  /** Hide only the title-row edit-all pencil while keeping inline field editing */
  showAttributeEditAllButton?: boolean;
  /** Per-slug custom renderers that replace the default inline editor */
  fieldRenderers?: FieldRendererMap;
  /** Custom dialer launcher in the tab bar (overrides the default phone button) */
  dialerTrigger?: ReactNode;
  /** Right-side tab definitions */
  tabs: Array<RecordDetailTab>;
  defaultTab?: string;
  /** Controlled active tab (pair with onTabChange) */
  activeTab?: string;
  onTabChange?: (value: string) => void;
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
  attributeNotice,
  readOnly,
  showAttributeEditAllButton,
  fieldRenderers,
  dialerTrigger,
  tabs,
  defaultTab,
  activeTab,
  onTabChange
}: RecordDetailLayoutProps) {
  const recordVersion = useRecordVersion(record)
  const isWide = useIsWideViewport()
  const dialer = useDialer()

  /*
   * Unify controlled (activeTab) and uncontrolled (defaultTab) modes so the
   * overflow "+N more" menu can switch tabs in both cases.
   */
  const [internalTab, setInternalTab] = useState(
    defaultTab ?? tabs[0]?.value ?? ''
  )
  const currentTab = activeTab ?? internalTab
  const changeTab = useCallback(
    (value: string) => {
      onTabChange?.(value)
      if (activeTab == null) setInternalTab(value)
    },
    [activeTab, onTabChange]
  )

  const containerRef = useRef<HTMLDivElement>(null)
  const [panelWidth, setPanelWidth] = useState(PANEL_DEFAULT_WIDTH)

  const handleResizeStart = useCallback((event: ReactMouseEvent) => {
    event.preventDefault()
    const startX = event.clientX
    const startWidth = containerRef.current
      ? (containerRef.current.querySelector('[data-slot="record-attr-pane"]')
          ?.offsetWidth ?? PANEL_DEFAULT_WIDTH)
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
      notice={attributeNotice}
      readOnly={readOnly}
      showEditAllButton={showAttributeEditAllButton}
      fieldRenderers={fieldRenderers} />
  )

  const tabsPane = (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <Tabs
        value={currentTab}
        onValueChange={changeTab}
        className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Tab bar — tabs left (overflow into "+N more"), dialer toggle right */}
        <div className="flex items-center gap-2 border-b px-4 py-2.5">
          <RecordDetailTabBar
            tabs={tabs}
            current={currentTab}
            onSelect={changeTab} />
          {/* Dialer launcher — supplied by the page (webphone-gated). Pages omit
              it when the webphone module is off, so no call affordance shows. */}
          {!dialer.isOpen && dialerTrigger}
        </div>

        {/* Body — tab content + dialer column (content narrows when open) */}
        <div className="flex min-h-0 min-w-0 flex-1">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            {tabs.map(tab => (
              <TabsContent
                key={tab.value}
                value={tab.value}
                className={cn(
                  'min-h-0 flex-1',
                  tab.bare
                    ? 'flex-col data-[state=active]:flex'
                    : 'overflow-auto p-4'
                )}>
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
                className="h-full shrink-0 overflow-hidden border-s">
                <div className="h-full w-[360px] overflow-auto p-3">
                  <DialerPanel />
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
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border bg-card/80 shadow-sm lg:flex-row">
      {/* Left: attribute pane (fixed-but-resizable width on wide screens) */}
      <div
        data-slot="record-attr-pane"
        className="flex min-h-0 flex-col max-lg:border-b lg:h-full lg:shrink-0"
        style={isWide ? { width: panelWidth } : undefined}>
        {attributePane}
      </div>

      {/* Shared divider — the single line between both panes, draggable */}
      <div
        role="separator"
        aria-orientation="vertical"
        onMouseDown={handleResizeStart}
        className="group relative z-10 hidden w-px shrink-0 cursor-col-resize bg-border transition-colors hover:bg-primary/50 lg:block">
        {/* Wider invisible hit area so the 1px line is easy to grab */}
        <span className="absolute inset-y-0 -left-1.5 -right-1.5" />
      </div>

      {/* Right: tabs pane (fills remaining width). min-w-0 lets it shrink
          below its content's natural width so the divider can narrow it. */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">{tabsPane}</div>
    </div>
  )
}

// ─── Empty / unavailable tab placeholder ───────────────────────────────────────
export interface RecordTabPlaceholderProps {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}

export function RecordTabPlaceholder({
  icon,
  title,
  description,
  action
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
