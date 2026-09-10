// @ts-nocheck
/* eslint-disable */
import { type ReactNode } from 'react'

import { type TElement } from 'platejs'

export const HBS_VARIABLE_KEY = 'hbs_variable' as const
export const HBS_BLOCK_OPEN_KEY = 'hbs_block_open' as const
export const HBS_BLOCK_CLOSE_KEY = 'hbs_block_close' as const
export const HBS_ELSE_KEY = 'hbs_else' as const
export const COMPUTED_TABLE_KEY = 'computed_table' as const

export interface THandlebarsVariableElement extends TElement {
  type: typeof HBS_VARIABLE_KEY
  name: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strikethrough?: boolean
  code?: boolean
}

export const HBS_VARIABLE_MARK_KEYS = [
  'bold',
  'italic',
  'underline',
  'strikethrough',
  'code',
] as const

export type HbsVariableMarkKey = (typeof HBS_VARIABLE_MARK_KEYS)[number]

export interface THandlebarsBlockOpenElement extends TElement {
  type: typeof HBS_BLOCK_OPEN_KEY
  helper: string
  expression: string
  /**
   * Set to `true` when the chip was originally authored *inside* a
   * `<tbody>` / `<thead>` / `<tfoot>` / `<table>` — slate's table model
   * can't hold inline-void elements there, so the deserializer hoists the
   * chip out as a sibling of the table and the serializer re-injects it
   * back into the table HTML on emit. Without this anchor the round-trip
   * would silently move the chip out of the iteration scope.
   */
  tableAnchored?: boolean
}

export interface THandlebarsBlockCloseElement extends TElement {
  type: typeof HBS_BLOCK_CLOSE_KEY
  helper: string
  /** See `THandlebarsBlockOpenElement.tableAnchored`. */
  tableAnchored?: boolean
}

export interface THandlebarsElseElement extends TElement {
  type: typeof HBS_ELSE_KEY
  /** See `THandlebarsBlockOpenElement.tableAnchored`. */
  tableAnchored?: boolean
}

export interface HandlebarsVariable {
  name: string
  label?: string
  description?: string
  category?: string
}

export interface HandlebarsBlockHelper {
  name: string
  label?: string
  description?: string
  defaultExpression?: string
}

export const DEFAULT_HELPERS: HandlebarsBlockHelper[] = [
  {
    name: 'if',
    label: '#if',
    description: 'Render block if condition is truthy',
    defaultExpression: 'condition',
  },
  {
    name: 'unless',
    label: '#unless',
    description: 'Render block if condition is falsy',
    defaultExpression: 'condition',
  },
  {
    name: 'each',
    label: '#each',
    description: 'Iterate over a list or object',
    defaultExpression: 'items',
  },
  {
    name: 'with',
    label: '#with',
    description: 'Change the context to a nested object',
    defaultExpression: 'object',
  },
]

/*
 * ── Computed table — schema-driven generic primitive ──
 *
 * The editor ships a single block-void element type (`computed_table`) whose
 * UI is fully described by a consumer-supplied `ComputedTableSchema`. The
 * element node stores ONLY the per-instance state (rows + optional overrides);
 * column definitions, footer aggregates, defaults and labels live in the
 * schema, indexed by `schemaId`. Consumers register schemas via the
 * `tableSchemas` prop on `<HtmlTemplateEditor>` — quote, invoice, expense,
 * hours, anything-with-line-items.
 */

/** A row is an open dictionary — columns pick the fields they care about. */
export type ComputedRow = Record<string, unknown> & { id: string }

export type ComputedColumnType =
  | 'text'
  | 'number'
  | 'currency'
  | 'percent'
  /** Read-only column produced by `compute(row, ctx)`. */
  | 'computed'

export interface ComputedColumnContext {
  currency: string
  locale: string
  /** All rows — for cross-row computations (rare, but supported). */
  rows: ComputedRow[]
  /** This row's index (0-based). */
  index: number
}

export interface ComputedColumn {
  /** Stable key — matches the field name on each row dict (e.g. `qty`). */
  key: string
  /** Header label shown in the table. */
  label: string
  type: ComputedColumnType
  /** Default cell value applied when a new row is inserted. */
  defaultValue?: unknown
  /** Tailwind/style width hint (`'72px'`, `'20%'`, etc.). */
  width?: string
  align?: 'left' | 'right' | 'center'
  /** Step / min / max for `number`-typed editable columns. */
  step?: number
  min?: number
  max?: number
  /**
   * For `computed` columns: derive the displayed value from the row and ctx.
   * Returned numbers are formatted by the column type (currency/percent/number)
   * unless `format` is supplied.
   */
  compute?: (row: ComputedRow, ctx: ComputedColumnContext) => number | string
  /** Optional formatter override — runs after `compute` / cell read. */
  format?: (
    value: unknown,
    row: ComputedRow,
    ctx: ComputedColumnContext,
  ) => string
  /** Marks the column as toggleable from the row menu. */
  toggleable?: boolean
  /** Initial visibility (default `true`). */
  defaultVisible?: boolean
}

export type ComputedFooterContext = Omit<ComputedColumnContext, 'index'>

export interface ComputedFooter {
  /** Stable key (e.g. `subtotal`, `tax`, `grandTotal`). */
  key: string
  /** Label cell text. */
  label: string
  /** Aggregator over all rows. */
  compute: (rows: ComputedRow[], ctx: ComputedFooterContext) => number | string
  /** Display format. Default: render numbers via the schema's `currency`. */
  format?: (value: number | string, ctx: ComputedFooterContext) => string
  /** Visual weight in the footer table — `'strong'` for grand-total rows. */
  emphasis?: 'normal' | 'strong'
}

export interface ComputedTableLabels {
  /** Title shown above the table inside the editor. */
  title?: string
  /** "Add row" button label. */
  addRow?: string
  /** Shown when `rows.length === 0`. */
  emptyState?: string
  /** Currency picker label. */
  currencyLabel?: string
}

export interface ComputedTableSchema {
  /** Stable id used by element nodes to reference this schema. */
  id: string
  /** Short human label shown in the insert dropdown. */
  label: string
  columns: ComputedColumn[]
  footer?: ComputedFooter[]
  /** Default currency for newly inserted instances. */
  defaultCurrency?: string
  /** Default locale for formatting (defaults to currency-derived). */
  defaultLocale?: string
  /** Initial rows seeded on first insert. Falls back to a single empty row. */
  defaultRows?: ComputedRow[]
  labels?: ComputedTableLabels
  /** Currency picker — show selector & which codes are offered. */
  currencyOptions?: ComputedCurrencyOption[]
}

export interface ComputedCurrencyOption {
  code: string
  label: string
  locale?: string
}

/*
 * ── Ad-hoc table mode ────────────────────────────────────────────────────
 * When a node carries its own `columns` array, it operates in ad-hoc mode
 * (driven by the table configuration dialog) instead of looking up a
 * pre-registered `ComputedTableSchema`. The node-level columns describe both
 * the data binding (`key`) and the per-cell styling. `dataPath` points at an
 * array path inside the editor's bound JSON data (e.g. `orders.0.items`).
 */

export type ComputedColumnFormat =
  | 'text'
  | 'number'
  | 'currency'
  | 'percent'
  | 'date'
  | 'computed'

export type ComputedFontWeight = 'normal' | 'bold'

export type ComputedFontSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl'

export interface ComputedColumnConfig {
  /** Field name on each row in the bound array. */
  key: string
  /** Header label. */
  label: string
  format: ComputedColumnFormat
  visible?: boolean
  align?: 'left' | 'right' | 'center'
  width?: string
  fontWeight?: ComputedFontWeight
  fontSize?: ComputedFontSize
  /** Tailwind class, hex, or CSS color string. */
  textColor?: string
  backgroundColor?: string
  /** Optional override format string (e.g. `0.00`, `dd/MM/yyyy`). */
  formatPattern?: string
}

export type ComputedAggregate = 'sum' | 'average' | 'count' | 'min' | 'max'

/*
 * ── Generic formula model for ad-hoc smart totals ──────────────────────
 * A formula is an ordered chain of terms applied left-to-right starting
 * from 1. Each term has an operator type that decides how its column's
 * value contributes:
 *   multiply              → acc = acc × value
 *   divide                → acc = acc ÷ value   (value === 0 ⇒ 0)
 *   multiply_complement   → acc = acc × (1 − value/100)   (discount-style)
 *   multiply_premium      → acc = acc × (1 + value/100)   (markup / KDV-style)
 *   multiply_pct          → acc = acc × (value/100)       (percent-only, e.g. tax amount)
 *
 * The dialog encodes the term chain into a single Handlebars sub-expression:
 *   sumLineGeneric items "mul:qty|mul:unitPrice|comp:discountPct|prem:taxPct"
 */
export type FormulaTermOp =
  | 'multiply'
  | 'divide'
  | 'multiply_complement'
  | 'multiply_premium'
  | 'multiply_pct'

export interface FormulaTerm {
  op: FormulaTermOp
  key: string
}

export interface ComputedFooterConfig {
  /** Column key the aggregate applies to (drives the cell placement). */
  key: string
  label: string
  aggregate: ComputedAggregate
  /**
   * Optional raw Handlebars sub-expression. When set, the serializer emits
   * this instead of the standard `aggregate` expression — used by the
   * "Akıllı toplam" presets (line totals with discount + tax) which can't be
   * expressed as a single-column aggregate.
   */
  formula?: string
  /**
   * Hint for the format wrapper around the formula output. When omitted,
   * the renderer falls back to the format of the target column.
   */
  formulaFormat?: ComputedColumnFormat
  textColor?: string
  backgroundColor?: string
}

export interface TComputedTableElement extends TElement {
  type: typeof COMPUTED_TABLE_KEY
  schemaId: string
  rows: ComputedRow[]
  currency?: string
  locale?: string
  /** Per-instance override of `column.defaultVisible`. */
  columnVisibility?: Record<string, boolean>
  /**
   * Ad-hoc mode only. Path into the editor's bound JSON data; serializer
   * emits `{{#each <dataPath>}}` and the editor projects rows from the
   * resolved array at render time.
   */
  dataPath?: string
  /**
   * Optional title shown above the table in ad-hoc mode (falls back to the
   * trailing segment of `dataPath`).
   */
  label?: string
  /**
   * Ad-hoc column definitions. Presence of this field flips the element into
   * ad-hoc mode — `columns` takes precedence over the schema's columns and
   * carries the per-cell styling configured in the table dialog.
   */
  columns?: ComputedColumnConfig[]
  /** Ad-hoc footer entries — emitted by the serializer as `<tfoot>` rows. */
  footer?: ComputedFooterConfig[]
}

export const ADHOC_TABLE_SCHEMA_ID = '__adhoc__' as const

export type HtmlTemplateEditorTab =
  | 'visual'
  | 'code'
  | 'data'
  | 'preview'
  | 'pdf'

/*
 * A consumer-supplied Handlebars helper. The library only registers a small
 * generic set by default (`formatCurrency`, `formatDate`, `multiply`, sum/line
 * aggregates…). Locale-specific or domain-specific helpers — e.g. Turkish
 * number-to-words from `@docyrus/ui/components/html-template-editor/locale-tr`
 * — are passed in here.
 */
export type ExtraHandlebarsHelper = (...args: unknown[]) => unknown

export interface HtmlTemplateEditorProps {
  value?: string
  onChange?: (value: string) => void
  variables?: HandlebarsVariable[]
  helpers?: HandlebarsBlockHelper[]
  /**
   * Schema-driven computed table definitions. Each schema becomes an
   * insertable, auto-calculating Plate element with consumer-defined columns,
   * formulas and footers. Element node references schema by `id`.
   */
  tableSchemas?: ComputedTableSchema[]
  /**
   * Additional Handlebars helpers, registered once on first editor mount.
   * Use this for domain/locale-specific functions (e.g. `numberToWordsTR`).
   */
  extraHelpers?: Record<string, ExtraHandlebarsHelper>
  readOnly?: boolean
  /**
   * Makes ONLY the Data tab read-only while leaving the template editors
   * (Visual / Code) editable. Independent of `readOnly` (which freezes the
   * whole editor). Useful for record-bound previews where the sample data is
   * the real record and must not be tampered with, but the template body is
   * still being authored. Defaults to `false`.
   */
  dataReadOnly?: boolean
  className?: string
  placeholder?: string
  minHeight?: string
  /** Initial JSON data string used by the Data / Preview tabs. */
  data?: string
  /** Called whenever the user edits the JSON data in the Data tab. */
  onDataChange?: (data: string) => void
  /**
   * Restricts which tabs are rendered (and in which order). Defaults to all
   * five (`['visual', 'code', 'data', 'preview', 'pdf']`). Pass a subset to
   * build a focused surface — e.g. `['preview']` for a read-only record
   * preview, or `['visual', 'code', 'data', 'preview']` to hide the
   * client-side PDF tab when a server-side export path is used instead. The
   * tab strip auto-hides when only a single tab is visible.
   */
  visibleTabs?: HtmlTemplateEditorTab[]
  /**
   * Extra CSS injected into the Preview tab's iframe `<head>` (after the
   * built-in A4 chrome). Use this to apply a saved template's own stylesheet
   * to the preview without baking a `<style>` block into the Plate document
   * tree (which the Visual editor would mangle / drop on round-trip).
   */
  previewStyles?: string
  /**
   * Default currency code used when an ad-hoc table column is rendered as
   * `currency`. Defaults to `'USD'`. Pass `'TRY'`, `'EUR'`, `'GBP'`, etc. to
   * match the host application's locale.
   */
  defaultCurrency?: string
  /** Tab to show on first render. Defaults to "visual". */
  defaultTab?: HtmlTemplateEditorTab
  /**
   * Controlled open state for the AI Assistant drawer. When provided, the
   * editor no longer manages the drawer's open state internally — pair with
   * `onAiAssistantOpenChange` to wire it to your own state.
   */
  aiAssistantOpen?: boolean
  /** Fired when the AI Assistant button toggles. */
  onAiAssistantOpenChange?: (open: boolean) => void
  /**
   * Mounts an AI Assistant drawer on the left of the editor. When provided,
   * the tabs row shows a Bot toggle button that opens/closes the drawer; this
   * render fn provides the drawer body (typically a `<DocyrusAgent>` or
   * `<EditorAgent>` wrapper). Without this prop the AI button is hidden.
   */
  renderAiAssistant?: (ctx: IHtmlTemplateAiAssistantRenderContext) => ReactNode
  /** Drawer width in pixels when open. Default `380`. */
  aiAssistantWidth?: number
}

/**
 * Context handed to {@link HtmlTemplateEditorProps.renderAiAssistant}. Mirrors
 * everything a custom assistant body needs to read live editor state.
 */
export interface IHtmlTemplateAiAssistantRenderContext {
  /** Whether the drawer is currently open. */
  open: boolean
  /** Width the drawer animates to when open, in pixels. */
  width: number
  /** Call to close the drawer from inside the slot. */
  onClose: () => void
  /** Current template HTML in the editor. */
  html: string
  /** Current JSON input string in the Data tab. */
  data: string
}
