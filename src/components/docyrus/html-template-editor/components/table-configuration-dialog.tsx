'use client'

// @ts-nocheck
/* eslint-disable */
import { type ReactNode, useMemo, useState } from 'react'

import {
  ChevronRightIcon,
  CircleAlertIcon,
  DatabaseIcon,
  SparklesIcon,
  TableIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import {
  useUiTranslation,
  type TranslateFn,
} from '@/hooks/docyrus/use-ui-translation'

import { useHbsContext } from '../lib/hbs-context'
import {
  type ComputedAggregate,
  type ComputedColumnConfig,
  type ComputedColumnFormat,
  type ComputedFontSize,
  type ComputedFontWeight,
  type ComputedFooterConfig,
} from '../types'

interface TableConfigurationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Parsed JSON the editor was mounted with — `null` if data tab is empty / invalid. */
  data: unknown
  /** Called with the resolved config when the user confirms. */
  onConfirm: (config: {
    dataPath: string
    label?: string
    columns: ComputedColumnConfig[]
    footer: ComputedFooterConfig[]
  }) => void
  /**
   * Seed values when re-opening the dialog on an existing ad-hoc table.
   * Switches the dialog into "edit" mode (confirm label and per-row state).
   */
  initialConfig?: {
    dataPath: string
    label?: string
    columns: ComputedColumnConfig[]
    footer?: ComputedFooterConfig[]
  }
}

/* ── Path discovery ────────────────────────────────────────────────────── */

interface ArrayPathCandidate {
  /** Dot-joined path string used by Handlebars (e.g. `users.0.orders`). */
  path: string
  /** Indent depth for the tree UI. */
  depth: number
  /** Number of items in the array. */
  itemCount: number
  /** Inferred field keys from the first object row. */
  fieldKeys: string[]
}

const MAX_DEPTH = 6

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isArrayOfObjects(
  value: unknown,
): value is Array<Record<string, unknown>> {
  return Array.isArray(value) && value.length > 0 && isPlainObject(value[0])
}

/**
 * Walks the JSON tree depth-first and collects every array-of-objects path.
 * Limits recursion to MAX_DEPTH to keep huge documents from exploding the UI.
 */
function findArrayPaths(value: unknown): ArrayPathCandidate[] {
  const out: ArrayPathCandidate[] = []

  function walk(node: unknown, parts: string[], depth: number) {
    if (depth > MAX_DEPTH) return

    if (isArrayOfObjects(node)) {
      const [firstRow] = node

      if (!firstRow) return
      const fieldKeys = Object.keys(firstRow)

      out.push({
        path: parts.join('.'),
        depth: parts.length,
        itemCount: node.length,
        fieldKeys,
      })

      walk(firstRow, [...parts, '0'], depth + 1)

      return
    }

    if (isPlainObject(node)) {
      for (const [k, v] of Object.entries(node)) {
        walk(v, [...parts, k], depth + 1)
      }
    }
  }

  walk(value, [], 0)

  return out
}

/* ── Type inference ────────────────────────────────────────────────────── */

/*
 * Percent hints checked BEFORE currency hints because keys like `discount_pct`
 * or `tax_pct` substring-match both — and `pct`-suffixed columns are percents.
 */
const PERCENT_KEY_HINT = /(percent$|_pct$|pct$|_percent|rate$|ratio$)/i
const CURRENCY_KEY_HINT =
  /(price|amount|total|subtotal|cost|fee|tax|discount|paid|balance|net|gross)/i
const DATE_KEY_HINT = /(date|created|updated|at$|_at$|time)/i
const IDENTIFIER_KEY_HINT = /(^id$|_id$|^uuid$|^guid$|^row_?id$|^pk$)/i

function isIdentifierKey(key: string): boolean {
  return IDENTIFIER_KEY_HINT.test(key)
}

function inferFormatForKey(
  key: string,
  sampleValue: unknown,
): ComputedColumnFormat {
  if (typeof sampleValue === 'number') {
    if (PERCENT_KEY_HINT.test(key)) return 'percent'
    if (CURRENCY_KEY_HINT.test(key)) return 'currency'

    return 'number'
  }
  if (typeof sampleValue === 'string') {
    if (DATE_KEY_HINT.test(key)) return 'date'

    return 'text'
  }

  return 'text'
}

function inferAlignForFormat(
  format: ComputedColumnFormat,
): 'left' | 'right' | 'center' {
  if (format === 'number' || format === 'currency' || format === 'percent') {
    return 'right'
  }

  return 'left'
}

function prettifyKey(key: string): string {
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function lastSegment(path: string): string {
  const idx = path.lastIndexOf('.')

  return idx >= 0 ? path.slice(idx + 1) : path
}

/*
 * ── Text-based smart-total formula ─────────────────────────────────────
 *
 * Smart totals are now plain math expressions the user types:
 *   `qty * unitPrice * (1 - discountPct/100)`
 * The runtime helper `sumLineExpr` evaluates the expression per row and
 * sums (see `lib/handlebars-helpers.ts`). The serializer wraps user input
 * in:
 *   {{formatCurrency (sumLineExpr items "<expression>") "USD"}}
 *
 * The functions below convert between the canonical Handlebars sub-
 * expression we persist (`formula`) and the user-typed source the dialog
 * shows in the textarea. They also migrate legacy chip-era formulas
 * (`sumLineNetsKeyed`, `sumLineGeneric`, …) into expression strings so a
 * dialog re-open shows editable text instead of opaque DSL.
 */

const LEGACY_DSL_OP_TO_EXPR: Record<string, (key: string) => string> = {
  mul: (k) => `${k}`,
  div: (k) => `÷ ${k}`,
  comp: (k) => `(1 - ${k}/100)`,
  prem: (k) => `(1 + ${k}/100)`,
  pct: (k) => `(${k}/100)`,
}

function legacyDslToExpression(spec: string): string {
  if (!spec) return ''
  const parts = spec
    .split('|')
    .map((part) => {
      const [code, key] = part.split(':')
      const op = (code ?? '').trim()
      const k = (key ?? '').trim()

      if (!k) return ''
      const builder = LEGACY_DSL_OP_TO_EXPR[op]

      return (builder ?? ((x: string) => x))(k)
    })
    .filter(Boolean)

  /*
   * Chain: first part as-is, subsequent parts joined with " * ". A `÷ x`
   * chunk is handled inline; we strip the leading "÷ " and use ` / ` join.
   */
  let out = ''

  for (const p of parts) {
    if (!out) {
      out = p.startsWith('÷ ') ? `1 / ${p.slice(2)}` : p
      continue
    }
    out += p.startsWith('÷ ') ? ` / ${p.slice(2)}` : ` * ${p}`
  }

  return out
}

/** Convert a persisted `formula` sub-expression into an editable text. */
function formulaToExpression(formula: string): string {
  if (!formula) return ''

  const expr = formula.match(/^sumLineExpr items "([^"]*)"/)

  if (expr) return expr[1] ?? ''

  const generic = formula.match(/^sumLineGeneric items "([^"]*)"/)

  if (generic) return legacyDslToExpression(generic[1] ?? '')

  const args = Array.from(formula.matchAll(/"([^"]*)"/g)).map((m) => m[1] ?? '')

  if (formula.startsWith('sumLineNetsKeyed')) {
    const [q, p, d] = args
    const parts: string[] = []

    if (q) parts.push(q)
    if (p) parts.push(p)
    if (d) parts.push(`(1 - ${d}/100)`)

    return parts.join(' * ')
  }
  if (formula.startsWith('sumLineGrossKeyed')) {
    const [q, p, d, t] = args
    const parts: string[] = []

    if (q) parts.push(q)
    if (p) parts.push(p)
    if (d) parts.push(`(1 - ${d}/100)`)
    if (t) parts.push(`(1 + ${t}/100)`)

    return parts.join(' * ')
  }
  if (formula.startsWith('sumLineTaxesKeyed')) {
    const [q, p, d, t] = args
    const parts: string[] = []

    if (q) parts.push(q)
    if (p) parts.push(p)
    if (d) parts.push(`(1 - ${d}/100)`)
    if (t) parts.push(`(${t}/100)`)

    return parts.join(' * ')
  }
  if (
    formula.startsWith('sumGrandTotal') ||
    formula.startsWith('sumLineNets') ||
    formula.startsWith('sumLineTaxes')
  ) {
    /*
     * Old top-level helpers from the schema-driven era — surface as text
     * so user can see what it is and choose to rewrite.
     */
    return formula
      .replace(/items/g, '')
      .replace(/sum\w+/, '')
      .trim()
  }

  return formula
}

/** Wrap a user expression in the Handlebars sub-expression we persist. */
function expressionToFormula(expression: string): string {
  const safe = expression.replace(/"/g, '')

  return `sumLineExpr items "${safe}"`
}

/* ── Defaults / palette ────────────────────────────────────────────────── */

/*
 * Static value lists kept module-level for stability; the human-readable
 * labels are resolved at render time through `useUiTranslation()` so the
 * dialog adapts to the host app's locale.
 */
const FORMAT_VALUES: ComputedColumnFormat[] = [
  'text',
  'number',
  'currency',
  'percent',
  'date',
  'computed',
]
const ALIGN_VALUES = ['left', 'center', 'right'] as const
const WEIGHT_VALUES: ComputedFontWeight[] = ['normal', 'bold']
const SIZE_VALUES: ComputedFontSize[] = ['xs', 'sm', 'base', 'lg', 'xl']

function formatOptions(
  t: TranslateFn,
): Array<{ value: ComputedColumnFormat; label: string }> {
  return FORMAT_VALUES.map((v) => ({ value: v, label: formatLabel(t, v) }))
}

function alignOptions(
  t: TranslateFn,
): Array<{ value: 'left' | 'center' | 'right'; label: string }> {
  return ALIGN_VALUES.map((v) => ({ value: v, label: alignLabel(t, v) }))
}

function weightOptions(
  t: TranslateFn,
): Array<{ value: ComputedFontWeight; label: string }> {
  return WEIGHT_VALUES.map((v) => ({ value: v, label: weightLabel(t, v) }))
}

function sizeOptions(): Array<{ value: ComputedFontSize; label: string }> {
  return SIZE_VALUES.map((v) => ({ value: v, label: v.toUpperCase() }))
}

function formatLabel(t: TranslateFn, value: ComputedColumnFormat): string {
  switch (value) {
    case 'text':
      return t('ui.htmlTemplateEditor.formatText', 'Text')

    case 'number':
      return t('ui.htmlTemplateEditor.formatNumber', 'Number')

    case 'currency':
      return t('ui.htmlTemplateEditor.formatCurrency', 'Currency')

    case 'percent':
      return t('ui.htmlTemplateEditor.formatPercent', 'Percent')

    case 'date':
      return t('ui.htmlTemplateEditor.formatDate', 'Date')

    case 'computed':
      return t('ui.htmlTemplateEditor.formatComputed', 'Computed')

    default:
      return value
  }
}

function alignLabel(
  t: TranslateFn,
  value: 'left' | 'center' | 'right',
): string {
  switch (value) {
    case 'left':
      return t('ui.htmlTemplateEditor.alignLeft', 'Left')

    case 'center':
      return t('ui.htmlTemplateEditor.alignCenter', 'Center')

    case 'right':
      return t('ui.htmlTemplateEditor.alignRight', 'Right')

    default:
      return value
  }
}

function weightLabel(t: TranslateFn, value: ComputedFontWeight): string {
  switch (value) {
    case 'normal':
      return t('ui.htmlTemplateEditor.weightNormal', 'Normal')

    case 'bold':
      return t('ui.htmlTemplateEditor.weightBold', 'Bold')

    default:
      return value
  }
}

function aggregateLabel(t: TranslateFn, value: ComputedAggregate): string {
  switch (value) {
    case 'sum':
      return t('ui.htmlTemplateEditor.aggregateSum', 'Sum')

    case 'average':
      return t('ui.htmlTemplateEditor.aggregateAverage', 'Avg')

    case 'min':
      return t('ui.htmlTemplateEditor.aggregateMin', 'Min')

    case 'max':
      return t('ui.htmlTemplateEditor.aggregateMax', 'Max')

    case 'count':
      return t('ui.htmlTemplateEditor.aggregateCount', 'Count')

    default:
      return value
  }
}

/*
 * Color names stay English/CSS-native — they map to literal Tailwind palette
 * entries that the user might paste into their data. Translation here would
 * confuse the mapping more than it would help.
 */
const COLOR_SWATCHES: Array<{
  value: string
  nameKey: string
  nameFallback: string
}> = [
  {
    value: '',
    nameKey: 'ui.htmlTemplateEditor.colorNone',
    nameFallback: 'None',
  },
  {
    value: '#0f172a',
    nameKey: 'ui.htmlTemplateEditor.colorSlate',
    nameFallback: 'Slate',
  },
  {
    value: '#ef4444',
    nameKey: 'ui.htmlTemplateEditor.colorRed',
    nameFallback: 'Red',
  },
  {
    value: '#f59e0b',
    nameKey: 'ui.htmlTemplateEditor.colorAmber',
    nameFallback: 'Amber',
  },
  {
    value: '#10b981',
    nameKey: 'ui.htmlTemplateEditor.colorEmerald',
    nameFallback: 'Emerald',
  },
  {
    value: '#3b82f6',
    nameKey: 'ui.htmlTemplateEditor.colorBlue',
    nameFallback: 'Blue',
  },
  {
    value: '#a855f7',
    nameKey: 'ui.htmlTemplateEditor.colorViolet',
    nameFallback: 'Violet',
  },
  {
    value: '#f3f4f6',
    nameKey: 'ui.htmlTemplateEditor.colorGrayBg',
    nameFallback: 'Light gray bg',
  },
  {
    value: '#fef3c7',
    nameKey: 'ui.htmlTemplateEditor.colorAmberBg',
    nameFallback: 'Light amber bg',
  },
]

/* ── Local types ───────────────────────────────────────────────────────── */

interface FieldDraft extends ComputedColumnConfig {
  /** Sample value drawn from the first row — used for the dialog preview. */
  sampleValue: unknown
}

interface FooterDraft extends ComputedFooterConfig {
  /** Runtime-only stable id so React doesn't reuse rows on add/remove. */
  _uid: string
}

let footerUidCounter = 0

function makeFooterUid(): string {
  footerUidCounter += 1

  return `fr_${footerUidCounter}`
}

function buildInitialColumns(
  candidate: ArrayPathCandidate,
  sampleRow: Record<string, unknown>,
): FieldDraft[] {
  return candidate.fieldKeys.map((key) => {
    const sample = sampleRow[key]
    const format = inferFormatForKey(key, sample)

    return {
      key,
      label: prettifyKey(key),
      format,
      /*
       * Identifier-like columns start hidden — users can re-enable from the
       * field row if they actually want them in the table.
       */
      visible: !isIdentifierKey(key),
      align: inferAlignForFormat(format),
      fontWeight: 'normal',
      fontSize: 'sm',
      sampleValue: sample,
    }
  })
}

/* ── Component ─────────────────────────────────────────────────────────── */

/*
 * `DialogShell` owns only the visibility — the heavy state (path / fields /
 * label drafts) lives in `DialogBody`, which is mounted only while `open` is
 * true. Remounting on open gives us fresh `useState` initializers without any
 * `useEffect` reset logic.
 */
export function TableConfigurationDialog({
  open,
  onOpenChange,
  data,
  onConfirm,
  initialConfig,
}: TableConfigurationDialogProps) {
  return (
    /*
     * `modal={false}` is intentional. Radix Dialog v1.1.x sets
     * `aria-hidden="true"` on every sibling of the dialog (incl. `#root`)
     * when modal — and the Plate slate-editor that lives in `#root`
     * keeps focus through toolbar clicks, leading to Chrome's "focus
     * inside aria-hidden ancestor" a11y warning. Switching to non-modal
     * skips the aria-hidden mutation; we still render an overlay and a
     * close button so the dialog *looks* modal to the user, but the
     * editor below stays accessible to screen readers. Trade-off: no
     * focus trap and no scroll lock — acceptable for this config form.
     */
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogContent className="!flex max-h-[90vh] max-w-[min(96vw,1200px)] flex-col gap-3 overflow-hidden p-0 sm:max-w-[min(96vw,1200px)]">
        {open && (
          <DialogBody
            data={data}
            initialConfig={initialConfig}
            onCancel={() => onOpenChange(false)}
            onConfirm={onConfirm}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

interface DialogBodyProps {
  data: unknown
  initialConfig?: TableConfigurationDialogProps['initialConfig']
  onCancel: () => void
  onConfirm: TableConfigurationDialogProps['onConfirm']
}

function DialogBody({
  data,
  initialConfig,
  onCancel,
  onConfirm,
}: DialogBodyProps) {
  const { t } = useUiTranslation()
  const candidates = useMemo(() => findArrayPaths(data), [data])
  const isEditMode = !!initialConfig

  /*
   * Seed state lazily from props — no effect needed since the body is remounted
   * on every open. In edit mode the initial values come from the existing
   * node config; in create mode we default to the first array candidate.
   */
  const [selectedPath, setSelectedPath] = useState<string | null>(
    () => initialConfig?.dataPath ?? candidates[0]?.path ?? null,
  )
  const [tableLabel, setTableLabel] = useState<string>(
    () =>
      initialConfig?.label ??
      (candidates[0]
        ? prettifyKey(
            lastSegment(candidates[0].path) ||
              t('ui.htmlTemplateEditor.insertTable', 'Table'),
          )
        : ''),
  )
  /*
   * Per-field user overrides keyed by `(path, key)`. In edit mode we pre-seed
   * the overrides from the saved column config so labels / visibility /
   * styling match the existing table.
   */
  const [overrides, setOverrides] = useState<
    Record<string, Partial<FieldDraft>>
  >(() => (initialConfig ? seedOverridesFromConfig(initialConfig) : {}))
  /*
   * Footer aggregate rows; each row maps to a `<tr>` inside the table's
   * `<tfoot>` at serialize time. Drafts carry a runtime-only `_uid` so React
   * keeps each row's input state stable across add / remove.
   */
  const [footerRows, setFooterRows] = useState<FooterDraft[]>(() =>
    (initialConfig?.footer ?? []).map((cfg) => ({
      ...cfg,
      _uid: makeFooterUid(),
    })),
  )

  const fields = useMemo<FieldDraft[]>(() => {
    if (!selectedPath) return []
    const cand = candidates.find((c) => c.path === selectedPath)

    if (!cand) return []
    const sampleRow = readPath(data, selectedPath)?.[0] ?? {}
    const base = buildInitialColumns(cand, sampleRow)

    return base.map((f) => ({
      ...f,
      ...overrides[`${selectedPath}::${f.key}`],
    }))
  }, [selectedPath, candidates, data, overrides])

  const updateField = (key: string, patch: Partial<FieldDraft>) => {
    if (!selectedPath) return
    const k = `${selectedPath}::${key}`

    setOverrides((prev) => ({ ...prev, [k]: { ...prev[k], ...patch } }))
  }

  /**
   * Toggle a per-field aggregate. Existing `(fieldKey, aggregate)` entry is
   * removed; otherwise a new footer row is appended with a smart default
   * label derived from the field label + aggregate name.
   */
  const toggleAggregate = (fieldKey: string, aggregate: ComputedAggregate) => {
    setFooterRows((prev) => {
      const exists = prev.some(
        (r) => r.key === fieldKey && r.aggregate === aggregate,
      )

      if (exists) {
        return prev.filter(
          (r) => !(r.key === fieldKey && r.aggregate === aggregate),
        )
      }
      const target = fields.find((f) => f.key === fieldKey)

      return [
        ...prev,
        {
          key: fieldKey,
          label: defaultAggregateLabel(t, target?.label ?? fieldKey, aggregate),
          aggregate,
          _uid: makeFooterUid(),
        },
      ]
    })
  }

  const numericFields = useMemo(
    () =>
      fields.filter(
        (f) =>
          f.visible !== false &&
          (f.format === 'currency' ||
            f.format === 'number' ||
            f.format === 'percent'),
      ),
    [fields],
  )

  /*
   * Smart-total formula state. The dialog edits a single term chain inline;
   * users save it as a footer entry under their own label, and may save
   * multiple labelled formulas (e.g. Ara toplam + KDV + Genel toplam). Seed
   * either from the auto-detection or from the first saved formula in
   * edit-mode.
   */
  const showSmartBanner = numericFields.length >= 2

  /** Footer rows that hold a smart-total formula — used for the list. */
  const smartFooters = useMemo(
    () => footerRows.filter((r) => !!r.formula),
    [footerRows],
  )

  /**
   * Append a new empty smart-total entry. The user types the label and
   * the math expression directly into the textareas in the list.
   */
  const addSmartFormula = () => {
    setFooterRows((prev) => [
      ...prev,
      {
        key: numericFields[numericFields.length - 1]?.key ?? '',
        label: '',
        aggregate: 'sum',
        formula: expressionToFormula(''),
        formulaFormat: 'currency',
        _uid: makeFooterUid(),
      },
    ])
  }

  const updateSmartFooterLabel = (uid: string, nextLabel: string) => {
    setFooterRows((prev) =>
      prev.map((r) => (r._uid === uid ? { ...r, label: nextLabel } : r)),
    )
  }

  const updateSmartFooterExpression = (uid: string, nextExpression: string) => {
    setFooterRows((prev) =>
      prev.map((r) =>
        r._uid === uid
          ? { ...r, formula: expressionToFormula(nextExpression) }
          : r,
      ),
    )
  }

  const removeSmartFooter = (uid: string) => {
    setFooterRows((prev) => prev.filter((r) => r._uid !== uid))
  }

  const handleConfirm = () => {
    if (!selectedPath) return
    const visible = fields.filter((f) => f.visible !== false)

    if (visible.length === 0) return
    const columns: ComputedColumnConfig[] = fields.map(stripSampleValue)

    onConfirm({
      dataPath: selectedPath,
      label: tableLabel.trim() || undefined,
      columns,
      footer: footerRows.map(stripFooterUid),
    })
  }

  const visibleCount = fields.filter((f) => f.visible !== false).length
  const canConfirm = !!selectedPath && visibleCount > 0

  return (
    <>
      <DialogHeader className="shrink-0 border-b px-6 pt-6 pb-4">
        <DialogTitle className="flex items-center gap-2">
          <TableIcon className="size-4" />
          {isEditMode
            ? t('ui.htmlTemplateEditor.dialogTitleEdit', 'Edit table')
            : t(
                'ui.htmlTemplateEditor.dialogTitleCreate',
                'Create table from data',
              )}
        </DialogTitle>
        <DialogDescription>
          {t(
            'ui.htmlTemplateEditor.dialogDescription',
            'Pick an array path from the JSON data, choose which fields to display and configure column styling.',
          )}
        </DialogDescription>
      </DialogHeader>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
        {candidates.length === 0 ? (
          <EmptyDataState />
        ) : (
          <div className="grid grid-cols-[260px_1fr] gap-4">
            <PathPicker
              candidates={candidates}
              selectedPath={selectedPath}
              onSelect={setSelectedPath}
            />

            <div className="flex min-w-0 flex-col gap-3">
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="table-label"
                  className="w-20 shrink-0 text-xs text-muted-foreground"
                >
                  {t('ui.htmlTemplateEditor.dialogTitleFieldLabel', 'Title')}
                </Label>
                <Input
                  id="table-label"
                  value={tableLabel}
                  onChange={(e) => setTableLabel(e.target.value)}
                  placeholder={t(
                    'ui.htmlTemplateEditor.dialogTitleFieldPlaceholder',
                    'Table title',
                  )}
                  className="h-8 text-sm"
                />
              </div>
              <Separator />
              {showSmartBanner && (
                <SmartFormulaList
                  availableKeys={fields
                    .filter((f) => f.visible !== false)
                    .map((f) => f.key)}
                  savedFooters={smartFooters}
                  onAdd={addSmartFormula}
                  onLabelChange={updateSmartFooterLabel}
                  onExpressionChange={updateSmartFooterExpression}
                  onRemove={removeSmartFooter}
                />
              )}
              <FieldsEditor
                fields={fields}
                footers={footerRows}
                onChange={updateField}
                onToggleAggregate={toggleAggregate}
              />
            </div>
          </div>
        )}
      </div>

      <DialogFooter className="shrink-0 border-t bg-background px-6 py-4">
        <Button variant="ghost" onClick={onCancel}>
          {t('ui.htmlTemplateEditor.cancel', 'Cancel')}
        </Button>
        <Button onClick={handleConfirm} disabled={!canConfirm}>
          {isEditMode
            ? t('ui.htmlTemplateEditor.save', 'Save changes')
            : t('ui.htmlTemplateEditor.insert', 'Insert table')}
        </Button>
      </DialogFooter>
    </>
  )
}

/* ── Subcomponents ─────────────────────────────────────────────────────── */

function EmptyDataState() {
  const { t } = useUiTranslation()

  return (
    <div className="flex items-start gap-3 rounded-md border border-dashed bg-muted/30 px-4 py-6 text-sm text-muted-foreground">
      <CircleAlertIcon className="mt-0.5 size-4 shrink-0" />
      <div className="space-y-1">
        <div className="font-medium text-foreground">
          {t(
            'ui.htmlTemplateEditor.dialogEmptyTitle',
            'No suitable data found',
          )}
        </div>
        <p>
          {t(
            'ui.htmlTemplateEditor.dialogEmptyBody',
            'Paste a JSON containing an object list into the Data tab to create a table.',
          )}{' '}
          <code className="rounded bg-muted px-1 text-[11px]">{`{ items: [{...}, {...}] }`}</code>
        </p>
      </div>
    </div>
  )
}

interface PathPickerProps {
  candidates: ArrayPathCandidate[]
  selectedPath: string | null
  onSelect: (path: string) => void
}

function PathPicker({ candidates, selectedPath, onSelect }: PathPickerProps) {
  const { t } = useUiTranslation()

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <DatabaseIcon className="size-3" />
        {t('ui.htmlTemplateEditor.dialogPathLabel', 'Data source')}
      </div>
      <ScrollArea className="h-72 rounded-md border bg-muted/20">
        <div className="flex flex-col gap-0.5 p-1.5">
          {candidates.map((c) => {
            const isSelected = c.path === selectedPath
            const label =
              lastSegment(c.path) ||
              t('ui.htmlTemplateEditor.dialogPathRootLabel', 'root')

            return (
              <button
                type="button"
                key={c.path}
                onMouseDown={(e) => {
                  /*
                   * Prevent mouse-click focus capture. Radix Dialog flips
                   * content to `aria-hidden` (e.g., when a Select popper opens
                   * on top); a focused picker button under that hidden
                   * subtree triggers a Chrome a11y warning. mouseDown blocks
                   * focus on click; the blur in onClick covers keyboard
                   * activation (Space/Enter) where focus did land.
                   */
                  e.preventDefault()
                }}
                onClick={(e) => {
                  onSelect(c.path)
                  ;(e.currentTarget as HTMLButtonElement).blur()
                }}
                className={cn(
                  'flex items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  isSelected && 'bg-primary/10 text-primary',
                )}
                style={{ paddingLeft: 8 + c.depth * 10 }}
              >
                <span className="flex min-w-0 items-center gap-1">
                  <ChevronRightIcon className="size-3 shrink-0 opacity-50" />
                  <span className="truncate font-mono">{label}</span>
                </span>
                <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">
                  {c.itemCount} · {c.fieldKeys.length}
                </span>
              </button>
            )
          })}
        </div>
      </ScrollArea>
      {selectedPath && (
        <code className="rounded bg-muted px-2 py-1 font-mono text-[10px] break-all text-muted-foreground">
          {selectedPath || '(root)'}
        </code>
      )}
    </div>
  )
}

/* ── Aggregate pill helpers ─────────────────────────────────────────── */

const AGGREGATE_VALUES_NUMERIC: ComputedAggregate[] = [
  'sum',
  'average',
  'min',
  'max',
  'count',
]
const AGGREGATE_VALUES_TEXT: ComputedAggregate[] = ['count']

function aggregatePillOptions(
  t: TranslateFn,
  format: ComputedColumnFormat,
): Array<{ value: ComputedAggregate; label: string }> {
  const values = isNumericFormat(format)
    ? AGGREGATE_VALUES_NUMERIC
    : AGGREGATE_VALUES_TEXT

  return values.map((v) => ({ value: v, label: aggregateLabel(t, v) }))
}

function isNumericFormat(format: ComputedColumnFormat): boolean {
  return format === 'currency' || format === 'number' || format === 'percent'
}

function defaultAggregateLabel(
  t: TranslateFn,
  fieldLabel: string,
  aggregate: ComputedAggregate,
): string {
  switch (aggregate) {
    case 'sum':
      return t(
        'ui.htmlTemplateEditor.aggregateSumOfLabel',
        `${fieldLabel} — total`,
      )

    case 'average':
      return t(
        'ui.htmlTemplateEditor.aggregateAvgOfLabel',
        `${fieldLabel} — average`,
      )

    case 'min':
      return t(
        'ui.htmlTemplateEditor.aggregateMinOfLabel',
        `${fieldLabel} — min`,
      )

    case 'max':
      return t(
        'ui.htmlTemplateEditor.aggregateMaxOfLabel',
        `${fieldLabel} — max`,
      )

    case 'count':
      return t('ui.htmlTemplateEditor.aggregateCount', 'Count')

    default:
      return fieldLabel
  }
}

/* ── Smart formula list (text-based) ──────────────────────────────────── */

interface SmartFormulaListProps {
  /** All visible column keys — surfaced as a hint above the list. */
  availableKeys: string[]
  savedFooters: FooterDraft[]
  onAdd: () => void
  onLabelChange: (uid: string, nextLabel: string) => void
  onExpressionChange: (uid: string, nextExpression: string) => void
  onRemove: (uid: string) => void
}

/**
 * Free-form list of footer formulas. Each entry is two textareas — label
 * and math expression — that the user fills in. The expression is
 * evaluated per row at render time by the `sumLineExpr` Handlebars helper.
 *
 * No chip UI, no presets, no operator menus: the user types whatever
 * makes sense for their data.
 */
function SmartFormulaList({
  availableKeys,
  savedFooters,
  onAdd,
  onLabelChange,
  onExpressionChange,
  onRemove,
}: SmartFormulaListProps) {
  const { t } = useUiTranslation()

  return (
    <div className="flex flex-col gap-3 rounded-md border border-primary/30 bg-primary/5 px-3 py-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
          <SparklesIcon className="size-3.5" />
          {t(
            'ui.htmlTemplateEditor.smartTotalTitle',
            'Smart total — write your own formula',
          )}
        </div>
        <Button
          size="sm"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onAdd}
          className="h-7 gap-1 px-2 text-xs"
        >
          {t('ui.htmlTemplateEditor.smartTotalAdd', '+ Add total')}
        </Button>
      </div>

      {availableKeys.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 text-[10px] text-muted-foreground">
          <span className="uppercase tracking-wider">
            {t(
              'ui.htmlTemplateEditor.smartTotalAvailableFields',
              'Available fields:',
            )}
          </span>
          {availableKeys.map((k) => (
            <code
              key={k}
              className="rounded bg-background px-1.5 py-0.5 font-mono text-[10px] text-primary"
            >
              {k}
            </code>
          ))}
        </div>
      )}

      {savedFooters.length === 0 ? (
        <div className="rounded-md border border-dashed border-primary/30 bg-background px-3 py-4 text-center text-[11px] text-muted-foreground">
          {t(
            'ui.htmlTemplateEditor.smartTotalEmptyHint',
            'No totals yet. Click "+ Add total" to start — you can write expressions like',
          )}{' '}
          <code className="rounded bg-muted px-1 text-[10px]">
            qty * unitPrice * (1 - discountPct/100)
          </code>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {savedFooters.map((row) => (
            <SmartFormulaRow
              key={row._uid}
              row={row}
              onLabelChange={onLabelChange}
              onExpressionChange={onExpressionChange}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface SmartFormulaRowProps {
  row: FooterDraft
  onLabelChange: (uid: string, nextLabel: string) => void
  onExpressionChange: (uid: string, nextExpression: string) => void
  onRemove: (uid: string) => void
}

function SmartFormulaRow({
  row,
  onLabelChange,
  onExpressionChange,
  onRemove,
}: SmartFormulaRowProps) {
  const { t } = useUiTranslation()
  /*
   * Derive the user-typed expression from the canonical formula every render
   * — the textarea is fully controlled by `row.formula`.
   */
  const expression = formulaToExpression(row.formula ?? '')

  return (
    <div className="flex items-start gap-2 rounded-md border border-primary/20 bg-background p-2">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {t('ui.htmlTemplateEditor.smartTotalLabelHeader', 'Label')}
          </span>
          <Textarea
            value={row.label}
            onChange={(e) => onLabelChange(row._uid, e.target.value)}
            placeholder={t(
              'ui.htmlTemplateEditor.smartTotalLabelPlaceholder',
              'e.g. Subtotal — any notation works',
            )}
            rows={2}
            className="min-h-[44px] w-full resize-y border-primary/20 bg-background px-2 py-1.5 text-xs font-semibold text-primary placeholder:font-normal placeholder:text-muted-foreground/60 focus-visible:border-primary/60"
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {t('ui.htmlTemplateEditor.smartTotalFormulaHeader', 'Formula')}
          </span>
          <Textarea
            value={expression}
            onChange={(e) => onExpressionChange(row._uid, e.target.value)}
            placeholder="qty * unitPrice * (1 - discountPct/100) * (1 + taxPct/100)"
            rows={2}
            spellCheck={false}
            className="min-h-[44px] w-full resize-y border-primary/20 bg-background px-2 py-1.5 font-mono text-xs text-foreground placeholder:text-muted-foreground/60 focus-visible:border-primary/60"
          />
        </div>
      </div>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onRemove(row._uid)}
        aria-label={t(
          'ui.htmlTemplateEditor.smartTotalRemoveAria',
          'Remove total',
        )}
        className="shrink-0 rounded-sm p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
      >
        ✕
      </button>
    </div>
  )
}

interface FieldsEditorProps {
  fields: FieldDraft[]
  footers: FooterDraft[]
  onChange: (key: string, patch: Partial<FieldDraft>) => void
  onToggleAggregate: (fieldKey: string, aggregate: ComputedAggregate) => void
}

function FieldsEditor({
  fields,
  footers,
  onChange,
  onToggleAggregate,
}: FieldsEditorProps) {
  const { t } = useUiTranslation()

  if (fields.length === 0) {
    return (
      <div className="rounded-md border border-dashed bg-muted/20 px-4 py-6 text-center text-xs text-muted-foreground">
        {t(
          'ui.htmlTemplateEditor.fieldsEmpty',
          'No fields found at the selected path.',
        )}
      </div>
    )
  }

  /*
   * Map each field key → set of active aggregates so we can light up pills
   * without scanning the full footers array on every render of each row.
   */
  const activeAggregates = new Map<string, Set<ComputedAggregate>>()

  for (const f of footers) {
    const set = activeAggregates.get(f.key) ?? new Set<ComputedAggregate>()

    set.add(f.aggregate)
    activeAggregates.set(f.key, set)
  }

  return (
    <ScrollArea className="h-80">
      <div className="flex flex-col gap-2 pr-2">
        {fields.map((f) => (
          <FieldRow
            key={f.key}
            field={f}
            activeAggregates={activeAggregates.get(f.key) ?? EMPTY_AGG_SET}
            onChange={onChange}
            onToggleAggregate={onToggleAggregate}
          />
        ))}
      </div>
    </ScrollArea>
  )
}

const EMPTY_AGG_SET: ReadonlySet<ComputedAggregate> = new Set()

interface FieldRowProps {
  field: FieldDraft
  activeAggregates: ReadonlySet<ComputedAggregate>
  onChange: (key: string, patch: Partial<FieldDraft>) => void
  onToggleAggregate: (fieldKey: string, aggregate: ComputedAggregate) => void
}

function FieldRow({
  field,
  activeAggregates,
  onChange,
  onToggleAggregate,
}: FieldRowProps) {
  const { t } = useUiTranslation()
  const enabled = field.visible !== false
  const formatOpts = formatOptions(t)
  const alignOpts = alignOptions(t)
  const weightOpts = weightOptions(t)
  const sizeOpts = sizeOptions()
  const aggregatePills = aggregatePillOptions(t, field.format)

  return (
    <div
      className={cn(
        'flex flex-col gap-2.5 rounded-md border bg-card px-3 py-2.5 text-xs',
        !enabled && 'opacity-60',
      )}
    >
      {/* Row 1: enable / key / label / live preview */}
      <div className="flex items-center gap-2">
        <Checkbox
          checked={enabled}
          onCheckedChange={(v) => onChange(field.key, { visible: v === true })}
        />
        <code className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          {field.key}
        </code>
        <Input
          value={field.label}
          onChange={(e) => onChange(field.key, { label: e.target.value })}
          placeholder={t(
            'ui.htmlTemplateEditor.fieldLabelPlaceholder',
            'Header label',
          )}
          className="h-7 flex-1 text-xs"
        />
        <FieldStylePreview field={field} />
      </div>

      {/* Row 2: format / align / weight / size / colors — toolbar style */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <LabeledControl label={t('ui.htmlTemplateEditor.fieldFormat', 'Type')}>
          <Select
            value={field.format}
            onValueChange={(v) =>
              onChange(field.key, {
                format: v as ComputedColumnFormat,
                align: inferAlignForFormat(v as ComputedColumnFormat),
              })
            }
          >
            <SelectTrigger className="h-7 min-w-[110px] gap-1 px-2 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {formatOpts.map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-xs">
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </LabeledControl>

        <LabeledControl label={t('ui.htmlTemplateEditor.fieldAlign', 'Align')}>
          <SegmentedToggle
            value={field.align ?? 'left'}
            options={alignOpts}
            onChange={(v) =>
              onChange(field.key, { align: v as FieldDraft['align'] })
            }
          />
        </LabeledControl>

        <LabeledControl
          label={t('ui.htmlTemplateEditor.fieldWeight', 'Weight')}
        >
          <SegmentedToggle
            value={field.fontWeight ?? 'normal'}
            options={weightOpts}
            onChange={(v) =>
              onChange(field.key, { fontWeight: v as ComputedFontWeight })
            }
          />
        </LabeledControl>

        <LabeledControl label={t('ui.htmlTemplateEditor.fieldSize', 'Size')}>
          <Select
            value={field.fontSize ?? 'sm'}
            onValueChange={(v) =>
              onChange(field.key, { fontSize: v as ComputedFontSize })
            }
          >
            <SelectTrigger className="h-7 min-w-[68px] gap-1 px-2 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sizeOpts.map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-xs">
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </LabeledControl>

        <LabeledControl
          label={t('ui.htmlTemplateEditor.fieldTextColor', 'Text color')}
        >
          <ColorPicker
            value={field.textColor ?? ''}
            onChange={(v) => onChange(field.key, { textColor: v || undefined })}
          />
        </LabeledControl>

        <LabeledControl
          label={t('ui.htmlTemplateEditor.fieldBgColor', 'Background')}
        >
          <ColorPicker
            value={field.backgroundColor ?? ''}
            onChange={(v) =>
              onChange(field.key, { backgroundColor: v || undefined })
            }
          />
        </LabeledControl>

        <LabeledControl
          label={t('ui.htmlTemplateEditor.fieldAggregate', 'Footer total')}
        >
          <div className="inline-flex h-7 items-center gap-1">
            {aggregatePills.map((p) => {
              const active = activeAggregates.has(p.value)

              return (
                <button
                  type="button"
                  key={p.value}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onToggleAggregate(field.key, p.value)}
                  className={cn(
                    'rounded-md border px-2 text-[11px] leading-none h-7 transition-colors',
                    active
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                  title={`${p.label} (${field.label})`}
                >
                  {p.label}
                </button>
              )
            })}
          </div>
        </LabeledControl>
      </div>
    </div>
  )
}

interface LabeledControlProps {
  label: string
  children: ReactNode
}

function LabeledControl({ label, children }: LabeledControlProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  )
}

interface SegmentedToggleProps<T extends string> {
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (v: T) => void
}

function SegmentedToggle<T extends string>({
  value,
  options,
  onChange,
}: SegmentedToggleProps<T>) {
  return (
    <div className="inline-flex h-7 items-stretch overflow-hidden rounded-md border bg-background">
      {options.map((o) => {
        const active = o.value === value

        return (
          <button
            type="button"
            key={o.value}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onChange(o.value)}
            className={cn(
              'inline-flex h-full items-center justify-center px-2 text-xs leading-none transition-colors first:rounded-l-md last:rounded-r-md',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

interface ColorPickerProps {
  value: string
  onChange: (v: string) => void
}

function ColorPicker({ value, onChange }: ColorPickerProps) {
  const { t } = useUiTranslation()
  const noneLabel = t('ui.htmlTemplateEditor.colorNone', 'None')
  const swatchOptions = COLOR_SWATCHES.map((s) => ({
    ...s,
    label: t(s.nameKey, s.nameFallback),
  }))
  const currentLabel =
    swatchOptions.find((s) => s.value === value)?.label ?? (value || noneLabel)

  return (
    <Select
      value={value || '__none__'}
      onValueChange={(v) => onChange(v === '__none__' ? '' : v)}
    >
      <SelectTrigger className="h-7 w-[112px] gap-2 px-2 text-xs">
        <span
          className="inline-block size-3.5 shrink-0 rounded-sm border"
          style={{
            backgroundColor: value || 'transparent',
            backgroundImage: value
              ? undefined
              : 'linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)',
            backgroundSize: value ? undefined : '6px 6px',
            backgroundPosition: value
              ? undefined
              : '0 0, 0 3px, 3px -3px, -3px 0',
          }}
        />
        <SelectValue placeholder={noneLabel}>{currentLabel}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__" className="text-xs">
          {noneLabel}
        </SelectItem>
        {swatchOptions
          .filter((s) => s.value)
          .map((s) => (
            <SelectItem key={s.value} value={s.value} className="text-xs">
              <span className="flex items-center gap-2">
                <span
                  className="size-3.5 rounded-sm border"
                  style={{ backgroundColor: s.value }}
                />
                {s.label}
              </span>
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  )
}

const PREVIEW_FONT_SIZE_CLASS: Record<ComputedFontSize, string> = {
  xs: 'text-[10px]',
  sm: 'text-xs',
  base: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
}

function FieldStylePreview({ field }: { field: FieldDraft }) {
  const { t } = useUiTranslation()
  const { defaultCurrency } = useHbsContext()
  const formatted = formatSampleValue(field, defaultCurrency)

  return (
    <span
      className={cn(
        'inline-flex min-w-[88px] max-w-[200px] shrink-0 items-center justify-center truncate rounded border px-2 py-1 tabular-nums',
        PREVIEW_FONT_SIZE_CLASS[field.fontSize ?? 'sm'],
        field.fontWeight === 'bold' ? 'font-semibold' : 'font-normal',
        field.align === 'right' && 'justify-end',
        field.align === 'center' && 'justify-center',
        (field.align ?? 'left') === 'left' && 'justify-start',
      )}
      style={{
        color: field.textColor || undefined,
        backgroundColor: field.backgroundColor || undefined,
      }}
      title={t('ui.htmlTemplateEditor.fieldPreviewTitle', 'Preview')}
    >
      {formatted}
    </span>
  )
}

const PREVIEW_LOCALE_FOR_CURRENCY: Record<string, string> = {
  TRY: 'tr-TR',
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
}

function formatSampleValue(field: FieldDraft, currency: string): string {
  const v = field.sampleValue
  const locale = PREVIEW_LOCALE_FOR_CURRENCY[currency] ?? 'en-US'

  if (v === null || v === undefined) return '—'
  if (field.format === 'currency' && typeof v === 'number') {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(v)
    } catch {
      return v.toFixed(2)
    }
  }
  if (field.format === 'percent' && typeof v === 'number') {
    return `%${v % 1 === 0 ? v.toString() : v.toFixed(2)}`
  }
  if (field.format === 'number' && typeof v === 'number') {
    try {
      return new Intl.NumberFormat(locale).format(v)
    } catch {
      return String(v)
    }
  }
  const text = String(v)

  return text.length > 18 ? `${text.slice(0, 18)}…` : text
}

/* ── Path resolver ─────────────────────────────────────────────────────── */

function readPath(
  data: unknown,
  path: string,
): Array<Record<string, unknown>> | undefined {
  if (!path) {
    return Array.isArray(data) && isPlainObject(data[0])
      ? (data as Array<Record<string, unknown>>)
      : undefined
  }
  const segments = path.split('.')
  let cur: unknown = data

  for (const seg of segments) {
    if (cur === null || cur === undefined) return undefined
    if (Array.isArray(cur)) {
      const idx = Number(seg)

      if (!Number.isInteger(idx)) return undefined
      cur = cur[idx]
    } else if (isPlainObject(cur)) {
      cur = cur[seg]
    } else {
      return undefined
    }
  }
  if (Array.isArray(cur) && isPlainObject(cur[0])) {
    return cur as Array<Record<string, unknown>>
  }

  return undefined
}

function stripFooterUid(draft: FooterDraft): ComputedFooterConfig {
  return {
    key: draft.key,
    label: draft.label,
    aggregate: draft.aggregate,
    formula: draft.formula,
    formulaFormat: draft.formulaFormat,
    textColor: draft.textColor,
    backgroundColor: draft.backgroundColor,
  }
}

function stripSampleValue(draft: FieldDraft): ComputedColumnConfig {
  return {
    key: draft.key,
    label: draft.label,
    format: draft.format,
    visible: draft.visible,
    align: draft.align,
    width: draft.width,
    fontWeight: draft.fontWeight,
    fontSize: draft.fontSize,
    textColor: draft.textColor,
    backgroundColor: draft.backgroundColor,
    formatPattern: draft.formatPattern,
  }
}

/**
 * Convert a saved ad-hoc config into the dialog's `overrides` map so a
 * remount in edit mode starts with the user's previous choices applied on
 * top of the auto-detected drafts.
 */
function seedOverridesFromConfig(cfg: {
  dataPath: string
  columns: ComputedColumnConfig[]
}): Record<string, Partial<FieldDraft>> {
  const out: Record<string, Partial<FieldDraft>> = {}

  for (const col of cfg.columns) {
    out[`${cfg.dataPath}::${col.key}`] = col
  }

  return out
}
