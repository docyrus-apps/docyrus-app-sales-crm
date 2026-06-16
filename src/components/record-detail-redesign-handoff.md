# Record Detail Redesign — Handoff Brief (Docyrus CRM)

> **How to use this file:** Paste this entire document to the Claude Code instance
> working on the _other_ Docyrus-based CRM. It is self-contained: it explains the
> design, includes the full source of every shared component, wires them globally,
> and gives a step-by-step recipe to migrate each detail page. The target project
> uses the **same Docyrus React starter**, so the components below are essentially
> drop-in; only the per-entity data wiring (queries, field slugs, tabs) differs.

---

## 1. What you are building

Every record **detail page** (Company, Contact, Deal, Lead, …) is rebuilt on a
single shared skeleton, `RecordDetailLayout`, that looks and behaves like Attio:

- **One bordered card**, split left/right by a **single shared divider line that is
  draggable** (min 280px / max 560px, default 340px). Not two separate cards.
- **Left pane = attribute panel:** record logo + title at top, a row of quick-action
  buttons (Note · Email · SMS · Call), a **"Search attributes…"** box, then the
  fields. Fields are **inline click-to-edit** (plain text until clicked — _not_ big
  input boxes) and a **pencil icon opens an "edit all" modal**. Only the first 4
  fields show; a **"Show N more"** toggle expands the rest.
- **Right pane = tabs** (segmented "pill" style) driven by config: each tab has a
  label, optional count badge, icon, and content. Common tabs:
  **Overview · Activity · Emails · Calls · Notes · Tasks · Files** plus entity-specific
  ones (e.g. Company's **Team**/**Deals**, Contact's **Company**/**Deals**, Deal's **Contacts**).
- **Overview tab** = a row of 3 **KPI "Highlights" cards** + a framed **"Recent activity"**
  list (only the **last 2** activities; the full history lives in the Activity tab).
- **Integrated dialer widget:** a green phone button sits in the tab bar (right-aligned).
  Clicking it opens a **dialer panel as a column that pushes the tab content narrower**
  (never an overlay). Call-state-driven buttons (Start Call → connecting → End Call +
  Mute/Hold/Keypad). It's a global context (`useDialer`) so any "Call" affordance can
  open it pre-filled with a phone number.
- Tabs that have no backend data yet (Emails, Calls) still render, with a friendly
  **"not available yet"** placeholder.

Behaviours worth preserving:

- Inline edit + the pencil "edit-all" modal both feed the **same** record; they stay
  in sync via a remount key (`useRecordVersion`) when the record refetches.
- `readOnly` prop renders the attribute panel display-only (used e.g. for converted Leads).
- Dialer launch differs per page (see recipe): Contact/Lead open it **directly** with
  that record's number; Company/Deal show a **dropdown to pick a contact** first.

---

## 2. Prerequisites (already present in the same starter)

These are imported by the shared components. Confirm they exist (paths may need
adjusting to the target repo's aliases):

- `@/components/docyrus/editable-record-detail` → `EditableRecordDetail`,
  `EditableRecordDetailField`, types `RecordDetailField`, `FieldChange`.
  (Fields must support `editHint="progressive"` + `size="sm"` — they do in this starter.)
- `@/components/docyrus/record-activity-panel` → `RecordActivityPanel`, type `RecordActivity`.
- `@/components/docyrus/contact-activity-panel` → `ContactActivityPanel`, types `ContactActivity` (Contact only; optional).
- `@/components/docyrus/comments-panel` → `CommentsPanel`, type `DocyrusComment`.
- `@/components/docyrus/file-attachment-panel` → `FileAttachmentPanel`, type `DocyrusFile`.
- UI primitives: `@/components/ui/{button,input,skeleton,tabs,dialog}`.
- `@/components/animate-ui/components/radix/dropdown-menu`.
- `motion` package (`import { motion, AnimatePresence } from 'motion/react'`). If missing: `pnpm add motion`.
- `lucide-react` for icons.
- Generated collections (`useXxxCollection`) and `useDocyrusClient()` from `@docyrus/signin`.
- The activities/files/comments item sub-resources: `GET /v1/apps/{app}/data-sources/{ds}/items/{id}/{activities|files|comments}`.

> The target project's entities/fields differ — that's the only real adaptation work
> (Section 6). The components themselves are generic.

---

## 3. Files to add (drop-in)

Create these four files verbatim. Adjust import aliases only if the target repo
differs from `@/`.

### 3a. `src/components/dialer/dialer-widget.tsx`

```tsx
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import {
  Delete,
  Grid3x3,
  Mic,
  MicOff,
  PanelRightClose,
  Pause,
  Phone,
  PhoneCall,
  PhoneOff,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

// ─── Types ──────────────────────────────────────────────────────────────────
export interface DialerContact {
  name?: string
  number?: string
  /** Optional avatar image url (falls back to initials) */
  avatarUrl?: string
}

type CallState = 'ready' | 'connecting' | 'active' | 'ended'

interface DialerContextValue {
  isOpen: boolean
  contact: DialerContact | null
  open: (contact?: DialerContact) => void
  close: () => void
}

// Placeholder used until a real contact is wired in.
const DEMO_CONTACT: DialerContact = {
  name: 'Finley Bryan',
  number: '+90 542 156 70 85',
}

const DialerContext = createContext<DialerContextValue | null>(null)

export function useDialer(): DialerContextValue {
  const ctx = use(DialerContext)

  if (!ctx) {
    throw new Error('useDialer must be used within <DialerProvider>')
  }

  return ctx
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function DialerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [contact, setContact] = useState<DialerContact | null>(null)

  const open = useCallback((next?: DialerContact) => {
    setContact(next ?? DEMO_CONTACT)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => setIsOpen(false), [])

  const value = useMemo<DialerContextValue>(
    () => ({
      isOpen,
      contact,
      open,
      close,
    }),
    [isOpen, contact, open, close],
  )

  return <DialerContext value={value}>{children}</DialerContext>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0')
  const seconds = (totalSeconds % 60).toString().padStart(2, '0')

  return `${minutes}:${seconds}`
}

function getInitials(name?: string): string {
  if (!name) return '#'

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

const STATUS_LABEL: Record<CallState, string> = {
  ready: 'Ready to call',
  connecting: 'Connecting…',
  active: 'In call',
  ended: 'Call ended',
}

// ─── Panel ────────────────────────────────────────────────────────────────────
export function DialerPanel({
  contact,
  onClose,
}: {
  contact: DialerContact | null
  onClose: () => void
}) {
  const [state, setState] = useState<CallState>('ready')
  const [seconds, setSeconds] = useState(0)
  const [muted, setMuted] = useState(false)
  const [onHold, setOnHold] = useState(false)
  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([])

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }, [])

  // Tick the call duration while the call is active.
  useEffect(() => {
    if (state !== 'active') return

    const interval = setInterval(() => setSeconds((value) => value + 1), 1000)

    return () => clearInterval(interval)
  }, [state])

  useEffect(() => clearTimers, [clearTimers])

  /*
   * Mock call flow (no telephony yet) — demonstrates how the action buttons
   * change with the call state. Real signalling will be wired in later.
   */
  const startCall = useCallback(() => {
    setState('connecting')
    const timer = setTimeout(() => setState('active'), 1400)

    timersRef.current.push(timer)
  }, [])

  const endCall = useCallback(() => {
    clearTimers()
    setState('ended')
    const timer = setTimeout(() => {
      setState('ready')
      setSeconds(0)
      setMuted(false)
      setOnHold(false)
    }, 1600)

    timersRef.current.push(timer)
  }, [clearTimers])

  const name = contact?.name ?? 'Unknown'
  const number = contact?.number ?? 'No number'
  const isLive = state === 'active' || state === 'connecting'

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm">
      {/* Minimal close control */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close dialer"
        className="absolute right-2 top-2 z-10 flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <PanelRightClose className="size-4" />
      </button>

      {/* Contact + timer */}
      <div className="flex flex-col items-center px-6 pb-4 pt-7 text-center">
        <div className="relative">
          {contact?.avatarUrl ? (
            <img
              src={contact.avatarUrl}
              alt={name}
              className="size-20 rounded-full object-cover"
            />
          ) : (
            <div className="flex size-20 items-center justify-center rounded-full bg-muted text-2xl font-semibold text-foreground/70">
              {getInitials(contact?.name)}
            </div>
          )}
          {state === 'active' && (
            <span className="absolute inset-0 animate-ping rounded-full ring-2 ring-emerald-500/40" />
          )}
        </div>

        <h3 className="mt-3 truncate text-lg font-semibold leading-tight">
          {name}
        </h3>
        <p className="truncate text-sm text-muted-foreground">{number}</p>

        <div className="mt-3 font-mono text-4xl font-semibold tabular-nums tracking-tight">
          {formatDuration(seconds)}
        </div>
        <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {STATUS_LABEL[state]}
        </p>
      </div>

      {/* In-call secondary controls */}
      {state === 'active' && (
        <div className="grid grid-cols-3 gap-2 px-4 pb-1">
          <SecondaryControl
            icon={
              muted ? <MicOff className="size-5" /> : <Mic className="size-5" />
            }
            label={muted ? 'Unmute' : 'Mute'}
            active={muted}
            onClick={() => setMuted((value) => !value)}
          />
          <SecondaryControl
            icon={<Pause className="size-5" />}
            label={onHold ? 'Resume' : 'Hold'}
            active={onHold}
            onClick={() => setOnHold((value) => !value)}
          />
          <SecondaryControl
            icon={<Grid3x3 className="size-5" />}
            label="Keypad"
          />
        </div>
      )}

      {/* Primary actions — change with call state */}
      <div className="flex flex-col gap-2 border-t p-4">
        {state === 'ready' && (
          <>
            <Button
              type="button"
              onClick={startCall}
              className="h-12 w-full bg-emerald-600 text-base font-semibold text-white hover:bg-emerald-700"
            >
              <Phone className="size-5" />
              Start Call
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-11 w-full"
            >
              Cancel
            </Button>
          </>
        )}

        {isLive && (
          <Button
            type="button"
            onClick={endCall}
            className="h-12 w-full bg-red-600 text-base font-semibold text-white hover:bg-red-700"
          >
            {state === 'connecting' ? (
              <PhoneCall className="size-5 animate-pulse" />
            ) : (
              <PhoneOff className="size-5" />
            )}
            {state === 'connecting' ? 'Cancel' : 'End Call'}
          </Button>
        )}

        {state === 'ended' && (
          <Button
            type="button"
            variant="outline"
            disabled
            className="h-12 w-full text-base font-medium"
          >
            <Delete className="size-5" />
            Call ended
          </Button>
        )}
      </div>
    </div>
  )
}

function SecondaryControl({
  icon,
  label,
  active,
  onClick,
}: {
  icon: ReactNode
  label: string
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1 rounded-xl border py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted',
        active && 'border-foreground/20 bg-muted text-foreground',
      )}
    >
      {icon}
      {label}
    </button>
  )
}
```

### 3b. `src/components/crm/record-detail-layout.tsx`

```tsx
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
      `}
      </style>

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
        <div className="flex items-center gap-2 border-b px-3 py-2">
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
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border bg-card/80 shadow-sm lg:flex-row"
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
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border bg-card/80 shadow-sm lg:flex-row">
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
```

### 3c. `src/components/crm/related-contacts-table.tsx`

A soft, searchable contacts table with a **leading `⋮` action menu** (Email / Call /
SMS / Meeting), row click opens the contact. Used by the Company "Team" tab and the
Deal "Contacts" tab.

```tsx
import { useMemo, useState, type MouseEvent as ReactMouseEvent } from 'react'

import {
  CalendarPlus,
  EllipsisVertical,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Search,
  Users,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/animate-ui/components/radix/dropdown-menu'

export interface RelatedContact {
  id?: string
  name?: string
  email?: string
  mobile?: string
  job_title?: string
}

export interface RelatedContactsTableProps {
  contacts: Array<RelatedContact>
  isLoading?: boolean
  addLabel?: string
  searchPlaceholder?: string
  emptyLabel?: string
  onAddContact: () => void
  onOpenContact: (id: string) => void
  onEmail: (contact: RelatedContact) => void
  onCall: (contact: RelatedContact) => void
  onSms?: (contact: RelatedContact) => void
  onMeeting?: (contact: RelatedContact) => void
}

const GRID_COLS =
  'grid grid-cols-[2rem_minmax(0,1.7fr)_minmax(0,1.5fr)_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[2rem_minmax(0,1.7fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)]'

function getInitials(name?: string): string {
  if (!name) return '#'

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function stop(event: ReactMouseEvent) {
  event.stopPropagation()
}

export function RelatedContactsTable({
  contacts,
  isLoading,
  addLabel = 'New Contact',
  searchPlaceholder = 'Search contacts…',
  emptyLabel = 'No contacts yet',
  onAddContact,
  onOpenContact,
  onEmail,
  onCall,
  onSms,
  onMeeting,
}: RelatedContactsTableProps) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()

    if (!q) return contacts

    return contacts.filter((c) => {
      const haystack = [c.name, c.email, c.mobile, c.job_title]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(q)
    })
  }, [contacts, query])

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Toolbar — search + add */}
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-8 border-none bg-muted/50 pl-8 text-[13px] shadow-none focus-visible:ring-1"
          />
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-8 shrink-0 gap-1.5"
          onClick={onAddContact}
        >
          <Plus className="size-3.5" />
          {addLabel}
        </Button>
      </div>

      {/* Header */}
      <div
        className={cn(
          GRID_COLS,
          'px-4 pb-2 pt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70',
        )}
      >
        <span />
        <span>Name</span>
        <span>Email</span>
        <span className="max-sm:hidden">Phone</span>
        <span>Title</span>
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-auto px-2 pb-2">
        {isLoading ? (
          <div className="space-y-1 px-1">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-11 animate-pulse rounded-lg bg-muted/40"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-full min-h-40 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Users className="size-5" />
            </div>
            <p className="text-[13px] text-muted-foreground">
              {query ? 'No contacts match your search.' : emptyLabel}
            </p>
            {!query && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={onAddContact}
              >
                <Plus className="size-3.5" />
                {addLabel}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-0.5">
            {filtered.map((contact) => (
              <div
                key={contact.id}
                role="button"
                tabIndex={0}
                onClick={() => contact.id && onOpenContact(contact.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && contact.id)
                    onOpenContact(contact.id)
                }}
                className={cn(
                  GRID_COLS,
                  'group cursor-pointer rounded-lg px-2 py-2 text-sm transition-colors hover:bg-muted/60',
                )}
              >
                {/* Action menu — leading */}
                <div
                  onClick={stop}
                  className="flex items-center justify-center"
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        onClick={stop}
                        aria-label="Contact actions"
                        className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:bg-background hover:text-foreground hover:shadow-sm data-[state=open]:bg-background data-[state=open]:text-foreground data-[state=open]:shadow-sm"
                      >
                        <EllipsisVertical className="size-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="w-44"
                      onClick={stop}
                    >
                      <DropdownMenuItem onClick={() => onEmail(contact)}>
                        <Mail className="size-4 text-blue-500" />
                        Send email
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onCall(contact)}>
                        <Phone className="size-4 text-emerald-600" />
                        Call
                      </DropdownMenuItem>
                      {onSms && (
                        <DropdownMenuItem onClick={() => onSms(contact)}>
                          <MessageSquare className="size-4 text-violet-500" />
                          Send SMS
                        </DropdownMenuItem>
                      )}
                      {onMeeting && (
                        <DropdownMenuItem onClick={() => onMeeting(contact)}>
                          <CalendarPlus className="size-4 text-amber-500" />
                          Schedule meeting
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-foreground/70">
                    {getInitials(contact.name)}
                  </span>
                  <span className="truncate font-medium">
                    {contact.name ?? '—'}
                  </span>
                </div>
                <span className="truncate text-muted-foreground">
                  {contact.email ?? '—'}
                </span>
                <span className="truncate text-muted-foreground max-sm:hidden">
                  {contact.mobile ?? '—'}
                </span>
                <span className="truncate text-muted-foreground">
                  {contact.job_title ?? '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

### 3d. `src/components/crm/related-deals-table.tsx`

Soft, searchable deals table, **no action menu**, row click opens the deal. Used by
Contact "Deals" and Company "Deals" tabs.

```tsx
import { useMemo, useState } from 'react'

import { CalendarClock, Search, Target } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

export interface RelatedDeal {
  id?: string
  name?: string
  stage?: { name?: string } | string
  deal_value?: number
  expected_closing_date?: string
}

export interface RelatedDealsTableProps {
  deals: Array<RelatedDeal>
  isLoading?: boolean
  searchPlaceholder?: string
  emptyLabel?: string
  onOpenDeal: (id: string) => void
}

const GRID_COLS =
  'grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]'

function stageName(stage: RelatedDeal['stage']): string | undefined {
  if (typeof stage === 'string') return stage || undefined

  return stage?.name
}

export function RelatedDealsTable({
  deals,
  isLoading,
  searchPlaceholder = 'Search deals…',
  emptyLabel = 'No deals yet',
  onOpenDeal,
}: RelatedDealsTableProps) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()

    if (!q) return deals

    return deals.filter((deal) => {
      const haystack = [deal.name, stageName(deal.stage)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(q)
    })
  }, [deals, query])

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Toolbar */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-8 border-none bg-muted/50 pl-8 text-[13px] shadow-none focus-visible:ring-1"
          />
        </div>
      </div>

      {/* Header */}
      <div
        className={cn(
          GRID_COLS,
          'px-4 pb-2 pt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70',
        )}
      >
        <span>Deal</span>
        <span>Stage</span>
        <span>Value</span>
        <span className="max-sm:hidden">Close date</span>
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-auto px-2 pb-2">
        {isLoading ? (
          <div className="space-y-1 px-1">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-11 animate-pulse rounded-lg bg-muted/40"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-full min-h-40 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Target className="size-5" />
            </div>
            <p className="text-[13px] text-muted-foreground">
              {query ? 'No deals match your search.' : emptyLabel}
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {filtered.map((deal) => {
              const value =
                typeof deal.deal_value === 'number'
                  ? deal.deal_value.toLocaleString()
                  : '—'
              const close = deal.expected_closing_date
                ? new Date(deal.expected_closing_date).toLocaleDateString()
                : '—'

              return (
                <div
                  key={deal.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => deal.id && onOpenDeal(deal.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && deal.id) onOpenDeal(deal.id)
                  }}
                  className={cn(
                    GRID_COLS,
                    'group cursor-pointer rounded-lg px-2 py-2 text-sm transition-colors hover:bg-muted/60',
                  )}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <Target className="size-3.5" />
                    </span>
                    <span className="truncate font-medium">
                      {deal.name ?? '—'}
                    </span>
                  </div>
                  <span className="truncate">
                    {stageName(deal.stage) ? (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {stageName(deal.stage)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </span>
                  <span className="truncate tabular-nums text-muted-foreground">
                    {value}
                  </span>
                  <span className="flex items-center gap-1 truncate text-muted-foreground max-sm:hidden">
                    {close !== '—' && (
                      <CalendarClock className="size-3.5 shrink-0" />
                    )}
                    {close}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## 4. Global wiring (once)

The dialer is a context; the panel renders _inside_ `RecordDetailLayout`. So you only
need to wrap the app with `DialerProvider`. In the app layout (e.g. `app-layout.tsx`),
around the routed content:

```tsx
import { DialerProvider } from '@/components/dialer/dialer-widget'

// inside the layout return, wrapping the app shell:
;<DialerProvider>
  <SidebarProvider>{/* …sidebar + header + <Outlet/>… */}</SidebarProvider>
</DialerProvider>
```

No floating button is mounted globally — the launcher lives in each detail page's tab bar.

---

## 5. Optional bug fix — activity icon crash

If the target repo has the same `contact-activity-panel` and you navigate to a record
whose activity has an unmapped `type`, you'll hit
`Cannot read properties of undefined (reading 'icon')`. Make the type→config lookup
total in `src/components/docyrus/contact-activity-panel/activity-type-config.ts`:

```ts
/** Fallback for unknown / unmapped activity types (avoids runtime crashes). */
export const DEFAULT_ACTIVITY_TYPE_CONFIG: ActivityTypeConfig = {
  icon: ActivityIcon, // import { ActivityIcon } from 'lucide-react'
  label: 'Activity',
  colorClass: 'text-gray-400',
  bgClass: 'bg-gray-400/10',
}

export function getActivityTypeConfig(type: ActivityType): ActivityTypeConfig {
  return ACTIVITY_TYPE_CONFIG[type] ?? DEFAULT_ACTIVITY_TYPE_CONFIG
}
```

(If a component reads `ACTIVITY_TYPE_CONFIG[type]` directly while mapping a fixed list,
guard with `if (!config) return null;`.)

---

## 6. Per-page migration recipe

For each detail page (one entity at a time), replace the old return with
`RecordDetailLayout`. The data layer barely changes — you mostly re-shape the render.

**Step 1 — keep/add the data.** You need:

- `record` query (`collection.get(id, { columns })`). Always pass `columns`.
- `activities`, `files`, `comments` via the item sub-resources (only the ones the
  entity supports). `users` + `currentUser` for comment mentions.
- Any related-list queries the tabs need (e.g. contacts/deals/tasks filtered by a
  relation field — see the entity's relations).

**Step 2 — fields.** Build `detailFields: RecordDetailField[]` from your field config
(the same `*_DETAIL_FIELDS` arrays you already have), and a `fieldSlugs: string[]`
array for ordering. Build `flatRecord` by flattening relation/enum objects to their
`id` (the inline editor expects scalar ids), e.g.:

```ts
status: typeof r.status === 'object' ? r.status?.id : r.status
```

**Step 3 — handlers.** `onInlineSave(changes, values)` → build a payload from changed
slugs → `collection.update(id, payload)` → invalidate the record + list queries.
Plus file upload/delete and comment create/update/delete (copy the URL pattern).

**Step 4 — tabs.** Build `tabs: RecordDetailTab[]`. Typical set:

- `overview`: `<RecordKpiCard>` ×3 under a "Highlights" heading + a framed
  **Recent activity** (`activitiesData.slice(0, 2)`).
- `activity`: full `RecordActivityPanel` (or `ContactActivityPanel` for contacts).
- `emails`, `calls`: `<RecordTabPlaceholder>` ("not available yet"); Emails may show a
  "Compose email" action.
- entity-specific relation tabs: `RelatedContactsTable` / `RelatedDealsTable` / a tasks
  list. Mark these `bare: true` (they manage their own padding/scroll).
- `notes`: `CommentsPanel`. `files`: `FileAttachmentPanel`. `tasks`: list or placeholder
  if no task relation exists.

**Step 5 — render.** Wire it up:

```tsx
const [activeTab, setActiveTab] = useState('overview');
const [emailTarget, setEmailTarget] = useState<{ to?: string; name?: string } | null>(null);
const dialer = useDialer();

// quick actions above the attributes (Note jumps to a tab, Email opens composer, etc.)
const attributeActions = (/* <Button>s: Note / Email / SMS / Call */);

// dialer launcher per entity (see Step 6)
const dialerTrigger = (/* a phone button OR a contact-picker dropdown */);

return (
  <>
    <RecordDetailLayout
      isLoading={recordLoading}
      avatar={<AvatarOrInitials/>}
      title={recordName}
      subtitle={statusOrSummary}
      onBack={() => navigate({ to: /* list route */ })}
      detailFields={detailFields}
      fieldSlugs={FIELD_SLUGS}
      record={flatRecord}
      onInlineSave={handleInlineSave}
      editTitle="Edit details"
      attributeActions={attributeActions}
      readOnly={/* true for locked/converted records, else omit */}
      dialerTrigger={dialerTrigger}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab} />

    <RecordEmailComposerDialog
      open={!!emailTarget}
      onOpenChange={open => !open && setEmailTarget(null)}
      to={emailTarget?.to}
      recipientName={emailTarget?.name}
      defaultSubject={emailTarget?.name} />
    {/* + any create dialogs the relation tabs need */}
  </>
);
```

**Step 6 — dialer launch per entity:**

- **Person-like record with its own phone** (Contact, Lead) → `dialerTrigger` is a plain
  phone button: `onClick={() => dialer.open({ name, number: record.mobile })}`.
- **Container record (Company, Deal)** → `dialerTrigger` is a `DropdownMenu` of the
  related contacts; each item calls `dialer.open({ name: c.name, number: c.mobile })`.
  (Deal resolves contacts via its organization.)
- Omit `dialerTrigger` to get the default button (opens a demo contact).

---

## 7. Schema adaptation checklist (the only real per-project work)

The target CRM's entities/fields will differ. For each detail page, fill in:

- [ ] **App + data-source slugs** for the item sub-resource URLs
      (`/v1/apps/{app}/data-sources/{ds}/items/{id}/…`). In this repo Company/Contact
      were `base`, Deal/Lead were `crm` — confirm the target's slugs.
- [ ] **Collection hook** (`useXxxCollection`) and its `get`/`update`/`list` shape.
- [ ] **`columns`** to request (include relation expansion like `organization(id,name)`).
- [ ] **`*_DETAIL_FIELDS`** field config + the `fieldSlugs` order.
- [ ] **Relation flattening** in `flatRecord` (which fields are objects → `.id`).
- [ ] **Which tabs apply** + which relations feed them (e.g. a Tasks tab only if the
      task entity has a relation back to this record).
- [ ] **List routes** for `onBack` and **detail routes** for row-click navigation —
      use plain routes (`/contacts/$id`, `/deals/$id`, …). > **No product / tenant split here.** The source project had a `docyrus` vs > `attornaid` product key with prefixed routes (`/$productKey/contacts/$id`) and > `related_product`-filtered list views. **This CRM has none of that** — single > Contacts / Leads / Deals tables. Ignore every `productKey` / `buildProductPath` > pattern; the shared components carry **zero** product coupling, so just navigate > with plain paths and drop any product params.
- [ ] **KPI choices** for the Overview (3 meaningful fields per entity).
- [ ] **Any entity-specific extras** (e.g. a "Convert" action → render it as a primary
      button in `attributeActions`, and pass `readOnly` once converted).

---

## 8. Decisions & gotchas (the "why")

- **Inline fields use `editHint="progressive"` + `size="sm"`.** Without `progressive`
  the field renders as an always-on boxed input (looks like a form, not Attio). The
  scoped `.crm-attribute-panel [data-editing] … { height: 1.5rem }` CSS stops the
  click-to-edit input from growing taller than the row and overlapping the next one.
- **`useRecordVersion` key** keeps the inline editor and the modal editor in sync and
  refreshes them after a save-triggered refetch — without remounting mid-typing.
- **Tabs are controlled** (`activeTab`/`onTabChange`) so quick-action buttons (e.g.
  "Note") can jump to a tab.
- **Single shared divider:** both panes live in one bordered card; the 1px divider is
  the drag handle (don't give each pane its own border).
- **Overview shows only 2 recent activities** on purpose — the full list is the Activity tab.
- **`motion` import path is `motion/react`** (matches animate-ui in this starter).
- **ESLint is strict & stylistic** (multiline-ternary, array-element-newline, named
  React type imports, no synchronous `setState` in effects, auto-removes unused
  imports). Run `pnpm eslint --fix <file>` after each page and fix the rest.

---

## 9. Verify

After each page:

```bash
pnpm eslint --fix src/pages/<entity>/<entity>-detail-page.tsx
pnpm exec tsc --noEmit          # expect no NEW errors in your files
pnpm dev                        # click through: inline edit, edit-all modal,
                                # tab switching, dialer open/close, relation tables
```

Migrate one entity end-to-end, eyeball it, then repeat for the rest. The shared
components don't change between entities — only the page wiring does.
