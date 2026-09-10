// @ts-nocheck
/* eslint-disable */
import { type TElement, type TNode, type TText } from 'platejs'

import {
  COMPUTED_TABLE_KEY,
  HBS_BLOCK_CLOSE_KEY,
  HBS_BLOCK_OPEN_KEY,
  HBS_ELSE_KEY,
  HBS_VARIABLE_KEY,
  type ComputedColumn,
  type ComputedColumnConfig,
  type ComputedColumnContext,
  type ComputedFooterConfig,
  type ComputedFooterContext,
  type ComputedRow,
  type ComputedTableSchema,
  type TComputedTableElement,
  type THandlebarsBlockCloseElement,
  type THandlebarsBlockOpenElement,
  type THandlebarsVariableElement,
} from '../types'

const DEFAULT_LOCALE_FOR_CURRENCY: Record<string, string> = {
  TRY: 'tr-TR',
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
}

/*
 * Translatable output strings + default currency for ad-hoc renders. The
 * editor passes its `defaultCurrency` prop + a `t`-resolved messages bundle
 * here so the serialized HTML stays free of hard-coded `"TRY"` / Turkish
 * placeholder strings.
 */
export interface SerializeMessages {
  /** Shown when ad-hoc table has no columns yet. */
  adhocNoColumns: string
  /** Shown when ad-hoc table has no dataPath. */
  adhocNoDataPath: string
  /** Shown when an element references an unregistered `schemaId`. */
  missingSchema: (schemaId: string) => string
}

export interface SerializeOptions {
  defaultCurrency: string
  messages: SerializeMessages
}

const DEFAULT_SERIALIZE_OPTIONS: SerializeOptions = {
  defaultCurrency: 'USD',
  messages: {
    adhocNoColumns: 'Ad-hoc table has no columns',
    adhocNoDataPath: 'Ad-hoc table has no data path',
    missingSchema: (id: string) => `Schema "${id}" not registered`,
  },
}

function defaultLocale(currency: string): string {
  return DEFAULT_LOCALE_FOR_CURRENCY[currency] ?? 'en-US'
}

function fmtMoney(value: unknown, currency: string, locale: string): string {
  const n = Number(value)

  if (!Number.isFinite(n)) return ''
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n)
  } catch {
    return n.toFixed(2)
  }
}

function fmtNumber(value: unknown, locale: string): string {
  const n = Number(value)

  if (!Number.isFinite(n)) return ''

  return new Intl.NumberFormat(locale, { maximumFractionDigits: 4 }).format(n)
}

function fmtPercent(value: unknown): string {
  const n = Number(value)

  if (!Number.isFinite(n)) return ''

  return `%${n % 1 === 0 ? n.toString() : n.toFixed(2)}`
}

const BLOCK_TAGS: Record<string, readonly [string, string]> = {
  h1: ['h1', 'h1'],
  h2: ['h2', 'h2'],
  h3: ['h3', 'h3'],
  h4: ['h4', 'h4'],
  h5: ['h5', 'h5'],
  h6: ['h6', 'h6'],
  blockquote: ['blockquote', 'blockquote'],
  ul: ['ul', 'ul'],
  ol: ['ol', 'ol'],
  li: ['li', 'li'],
} as const

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function styleAttr(parts: string[]): string {
  const joined = parts.filter(Boolean).join(';')

  return joined ? ` style="${escHtml(joined)}"` : ''
}

function inlineMarkStyles(node: TText): string[] {
  const parts: string[] = []
  const n = node as Record<string, unknown>

  if (typeof n.color === 'string') parts.push(`color:${n.color}`)
  if (typeof n.backgroundColor === 'string')
    parts.push(`background-color:${n.backgroundColor}`)
  if (typeof n.fontSize === 'string' || typeof n.fontSize === 'number') {
    const v = String(n.fontSize)

    parts.push(`font-size:${/^\d+$/.test(v) ? `${v}px` : v}`)
  }
  if (typeof n.fontFamily === 'string')
    parts.push(`font-family:${n.fontFamily}`)

  return parts
}

function serializeText(node: TText): string {
  let t = escHtml(node.text)

  if (!t) return ''

  const inlineStyles = inlineMarkStyles(node)

  if (inlineStyles.length > 0) t = `<span${styleAttr(inlineStyles)}>${t}</span>`
  if (node.bold) t = `<strong>${t}</strong>`
  if (node.italic) t = `<em>${t}</em>`
  if (node.underline) t = `<u>${t}</u>`
  if (node.strikethrough) t = `<s>${t}</s>`
  if ((node as Record<string, unknown>).code) t = `<code>${t}</code>`

  return t
}

function blockStyles(el: TElement): string[] {
  const parts: string[] = []
  const r = el as Record<string, unknown>

  if (
    typeof r.align === 'string' &&
    r.align !== 'start' &&
    r.align !== 'left'
  ) {
    parts.push(`text-align:${r.align}`)
  }
  if (typeof r.lineHeight === 'string' || typeof r.lineHeight === 'number') {
    parts.push(`line-height:${r.lineHeight}`)
  }
  if (typeof r.indent === 'number' && r.indent > 0) {
    parts.push(`padding-left:${r.indent * 24}px`)
  }

  return parts
}

function wrapBlock(tag: string, el: TElement, inner: string): string {
  return `<${tag}${styleAttr(blockStyles(el))}>${inner}</${tag}>`
}

/*
 * Table cells (`td` / `th`) carry their visual styling on the Plate node:
 * `background` (fill) and `borders` (per-side `{ size, style, color }`), plus
 * an optional `size` (px width). Plate's table HTML deserializer parses these
 * from inline `background-color` / `border-*` / `width` on the source cell, so
 * emitting them here round-trips custom cell styling (e.g. an invoice's
 * accent-colored header row or bottom-ruled line items). Without this the
 * editor silently dropped every cell fill / border on the first Visual-tab
 * load and the Preview / PDF fell back to the generic table chrome.
 */
const BORDER_SIDES = ['top', 'right', 'bottom', 'left'] as const

function cellStyles(el: TElement): string[] {
  const r = el as Record<string, unknown>
  const parts: string[] = []

  if (typeof r.background === 'string' && r.background) {
    parts.push(`background-color:${r.background}`)
  }

  const borders = r.borders as
    | Record<string, { size?: number; style?: string; color?: string }>
    | undefined

  if (borders && typeof borders === 'object') {
    for (const side of BORDER_SIDES) {
      const b = borders[side]

      if (!b) continue
      const size = typeof b.size === 'number' ? b.size : 1

      /*
       * size 0 means "no border" — emit an explicit reset so the cell can opt
       * out of any inherited / default border.
       */
      if (size <= 0) {
        parts.push(`border-${side}:0`)
        continue
      }
      const style = typeof b.style === 'string' && b.style ? b.style : 'solid'
      const color = typeof b.color === 'string' && b.color ? b.color : '#000'

      parts.push(`border-${side}:${size}px ${style} ${color}`)
    }
  }

  if (typeof r.size === 'number' && r.size > 0) {
    parts.push(`width:${r.size}px`)
  }

  return parts
}

/*
 * ── Computed-table serialization — schema-driven ────────────────────────────
 *
 * Emits a `<div data-computed-table="1" data-config="…">` envelope (so the
 * editor can round-trip it on next mount) PLUS a static pre-rendered HTML
 * table inside, so PDF / iframe preview sees the same layout the editor shows.
 * The static rendering reads the consumer schema from `schemaMap[schemaId]`.
 */
function fmtCell(
  value: unknown,
  column: ComputedColumn,
  ctx: ComputedColumnContext,
): string {
  const row = ctx.rows[ctx.index]

  if (!row) return ''
  if (column.format) return column.format(value, row, ctx)

  switch (column.type) {
    case 'currency':
      return fmtMoney(value, ctx.currency, ctx.locale)

    case 'percent':
      return fmtPercent(value)

    case 'number':
      return fmtNumber(value, ctx.locale)

    case 'computed': {
      const computed = column.compute?.(row, ctx)
      const next = computed ?? value

      if (typeof next === 'number')
        return fmtMoney(next, ctx.currency, ctx.locale)

      return String(next ?? '')
    }

    case 'text':

    default:
      return String(value ?? '')
  }
}

/*
 * ── Ad-hoc table serialization ─────────────────────────────────────────
 * Ad-hoc tables carry their column config + a JSON `dataPath` on the node
 * itself. Output is a Handlebars `{{#each <path>}}` block so the Preview
 * tab iterates over the real bound JSON, and downstream PDF/email renders
 * stay fully data-driven.
 */

const FONT_SIZE_PX: Record<string, string> = {
  xs: '10px',
  sm: '12px',
  base: '14px',
  lg: '16px',
  xl: '18px',
}

function adhocColumnStyle(cfg: ComputedColumnConfig): string {
  const parts: string[] = []

  if (cfg.align) parts.push(`text-align:${cfg.align}`)
  if (cfg.fontWeight === 'bold') parts.push('font-weight:600')
  if (cfg.fontSize)
    parts.push(`font-size:${FONT_SIZE_PX[cfg.fontSize] ?? cfg.fontSize}`)
  if (cfg.textColor) parts.push(`color:${cfg.textColor}`)
  if (cfg.backgroundColor) parts.push(`background-color:${cfg.backgroundColor}`)
  if (cfg.width) parts.push(`width:${cfg.width}`)

  return parts.join(';')
}

/**
 * For Handlebars `{{#each ...}}` blocks, paths with numeric segments need
 * bracket syntax (`orders.[0].items`) so the engine doesn't treat the integer
 * as a literal property name. We rewrite our internal dot-path on the way out.
 */
function toHandlebarsPath(path: string): string {
  return path
    .split('.')
    .map((seg) => (/^\d+$/.test(seg) ? `[${seg}]` : seg))
    .join('.')
}

function renderAdhocCellExpression(
  cfg: ComputedColumnConfig,
  defaultCurrency: string,
): string {
  /*
   * Each-block scope: `this` is the current row, so `{{<key>}}` resolves
   * directly. Format-aware helpers wrap numbers / dates accordingly.
   */
  const { key } = cfg

  switch (cfg.format) {
    case 'currency':
      /*
       * No currency on ad-hoc node yet → default to the editor's configured
       * `defaultCurrency`. Users can edit the generated HTML in Code tab to
       * switch.
       */
      return `{{formatCurrency ${key} "${defaultCurrency}"}}`

    case 'number':
      return `{{formatNumber ${key}}}`

    case 'percent':
      return `{{formatPercent ${key}}}`

    case 'date':
      return `{{formatDate ${key} "${cfg.formatPattern ?? 'DD.MM.YYYY'}"}}`

    case 'computed':

    case 'text':

    default:
      return `{{${key}}}`
  }
}

/**
 * Map a column type to the right value-formatter Handlebars helper. Used by
 * the footer renderer so a `sum` over a `currency` column is formatted as
 * money, a `sum` over a `number` column as a plain number, etc.
 */
function wrapAggregateForFormat(
  expr: string,
  cfg: ComputedColumnConfig | undefined,
  aggregate: string,
  defaultCurrency: string,
): string {
  if (!cfg) return `{{${expr}}}`
  if (aggregate === 'count') return `{{${expr}}}`

  switch (cfg.format) {
    case 'currency':
      return `{{formatCurrency (${expr}) "${defaultCurrency}"}}`

    case 'percent':
      return `{{formatPercent (${expr})}}`

    case 'number':

    default:
      return `{{formatNumber (${expr})}}`
  }
}

function buildAggregateExpression(
  aggregate: string,
  dataPath: string,
  key: string,
): string {
  switch (aggregate) {
    case 'sum':
      return `sumProperty ${dataPath} "${key}"`

    case 'average':
      return `avgProperty ${dataPath} "${key}"`

    case 'min':
      return `minProperty ${dataPath} "${key}"`

    case 'max':
      return `maxProperty ${dataPath} "${key}"`

    case 'count':

    default:
      return `countItems ${dataPath}`
  }
}

/**
 * Per-column aggregate footer — rendered inside the main `<table>`'s
 * `<tfoot>`. Used for "Toplam" pill toggles where each value lives in the
 * column it aggregates.
 */
function renderAdhocInTableFooter(
  rows: ComputedFooterConfig[],
  visibleColumns: ComputedColumnConfig[],
  dataPath: string,
  defaultCurrency: string,
): string {
  if (rows.length === 0) return ''

  const colByKey = new Map<string, ComputedColumnConfig>()

  for (const c of visibleColumns) colByKey.set(c.key, c)

  const rowsHtml = rows
    .map((row) => {
      const targetCol = colByKey.get(row.key)
      const aggregateExpr = buildAggregateExpression(
        row.aggregate,
        dataPath,
        row.key,
      )
      const valueExpr = wrapAggregateForFormat(
        aggregateExpr,
        targetCol,
        row.aggregate,
        defaultCurrency,
      )

      const cells = visibleColumns
        .map((col) => {
          const baseStyle: string[] = [
            'border-top:1px solid #cbd5e1',
            'font-weight:600',
            'padding:6px 8px',
          ]

          if (col.align) baseStyle.push(`text-align:${col.align}`)
          if (row.backgroundColor)
            baseStyle.push(`background-color:${row.backgroundColor}`)
          if (row.textColor) baseStyle.push(`color:${row.textColor}`)
          const styleStr = baseStyle.join(';')

          if (col.key === row.key) {
            return `<td style="${escHtml(styleStr)}">${valueExpr}</td>`
          }
          if (col === visibleColumns[0]) {
            return `<td style="${escHtml([...baseStyle.filter((s) => !s.startsWith('text-align')), 'text-align:left'].join(';'))}">${escHtml(row.label)}</td>`
          }

          return `<td style="${escHtml(styleStr)}"></td>`
        })
        .join('')

      return `<tr>${cells}</tr>`
    })
    .join('')

  return `<tfoot>${rowsHtml}</tfoot>`
}

/**
 * Smart-total order — canonical invoice / quote order: net subtotal first,
 * then tax, then grand total. Rows whose formula doesn't match a known
 * preset fall to the end in user-defined order.
 */
function smartTotalRank(formula: string): number {
  if (formula.startsWith('sumLineNetsKeyed')) return 1
  if (formula.startsWith('sumLineTaxesKeyed')) return 2
  if (formula.startsWith('sumLineGrossKeyed')) return 3

  return 99
}

/**
 * Smart-total footer — rendered AS A SEPARATE 2-column table below the
 * main table, right-aligned, with strong styling on the grand total row.
 * Mirrors the schema-driven Items table's totals block layout.
 */
function renderAdhocSmartTotals(
  rows: ComputedFooterConfig[],
  defaultCurrency: string,
): string {
  if (rows.length === 0) return ''

  const sorted = [...rows]
    .map((r, i) => ({ r, i, rank: smartTotalRank(r.formula ?? '') }))
    .sort((a, b) => a.rank - b.rank || a.i - b.i)
    .map((x) => x.r)

  const rowsHtml = sorted
    .map((row) => {
      const formula = row.formula ?? ''
      const isGrand = formula.startsWith('sumLineGrossKeyed')
      const synthetic: ComputedColumnConfig = {
        key: row.key,
        label: row.label,
        format: row.formulaFormat ?? 'currency',
      }
      const valueExpr = wrapAggregateForFormat(
        formula,
        synthetic,
        'sum',
        defaultCurrency,
      )
      const labelStyle: string[] = [
        'padding:4px 8px',
        'text-align:left',
        isGrand ? 'font-weight:700' : 'font-weight:500',
        isGrand ? 'color:#0f172a' : 'color:#475569',
      ]
      const valueStyle: string[] = [
        'padding:4px 8px',
        'text-align:right',
        'font-variant-numeric:tabular-nums',
        isGrand ? 'font-weight:700' : 'font-weight:500',
        isGrand ? 'color:#0f172a' : 'color:#0f172a',
      ]

      if (isGrand) {
        labelStyle.push('border-top:2px solid #0f172a')
        labelStyle.push('padding-top:6px')
        valueStyle.push('border-top:2px solid #0f172a')
        valueStyle.push('padding-top:6px')
        labelStyle.push('font-size:13px')
        valueStyle.push('font-size:13px')
      }
      if (row.backgroundColor) {
        labelStyle.push(`background-color:${row.backgroundColor}`)
        valueStyle.push(`background-color:${row.backgroundColor}`)
      }
      if (row.textColor) {
        labelStyle.push(`color:${row.textColor}`)
        valueStyle.push(`color:${row.textColor}`)
      }

      return `<tr><td style="${escHtml(labelStyle.join(';'))}">${escHtml(row.label)}</td><td style="${escHtml(valueStyle.join(';'))}">${valueExpr}</td></tr>`
    })
    .join('')

  return `<table style="margin-left:auto;margin-top:10px;width:320px;border-collapse:collapse;font-size:12px"><tbody>${rowsHtml}</tbody></table>`
}

function renderAdhocFooter(
  el: TComputedTableElement,
  visibleColumns: ComputedColumnConfig[],
  dataPath: string,
  defaultCurrency: string,
): { tfoot: string; afterTable: string } {
  const all = el.footer ?? []
  const inTable = all.filter((r) => !r.formula)
  const smart = all.filter((r) => r.formula)

  return {
    tfoot: renderAdhocInTableFooter(
      inTable,
      visibleColumns,
      dataPath,
      defaultCurrency,
    ),
    afterTable: renderAdhocSmartTotals(smart, defaultCurrency),
  }
}

function renderAdhocComputedTable(
  el: TComputedTableElement,
  opts: SerializeOptions,
): string {
  const columns = (el.columns ?? []).filter((c) => c.visible !== false)

  if (columns.length === 0) {
    return `<div style="padding:8px;color:#94a3b8;font-size:12px">[${escHtml(opts.messages.adhocNoColumns)}]</div>`
  }
  const { dataPath } = el

  if (!dataPath) {
    return `<div style="padding:8px;color:#94a3b8;font-size:12px">[${escHtml(opts.messages.adhocNoDataPath)}]</div>`
  }

  const headerCells = columns
    .map((cfg) => {
      const style = adhocColumnStyle({
        ...cfg,
        backgroundColor: cfg.backgroundColor ?? '#f8fafc',
      })
      const styleAttrStr = style ? ` style="${escHtml(style)}"` : ''

      return `<th${styleAttrStr}>${escHtml(cfg.label)}</th>`
    })
    .join('')

  const bodyCells = columns
    .map((cfg) => {
      const style = adhocColumnStyle(cfg)
      const styleAttrStr = style ? ` style="${escHtml(style)}"` : ''

      return `<td${styleAttrStr}>${renderAdhocCellExpression(cfg, opts.defaultCurrency)}</td>`
    })
    .join('')

  /*
   * Footer helpers reference the dataPath verbatim (un-bracketed) because
   * they run in the outer scope, not inside the each block. Smart totals
   * render as a separate right-aligned table BELOW the main one.
   */
  const { tfoot, afterTable } = renderAdhocFooter(
    el,
    columns,
    dataPath,
    opts.defaultCurrency,
  )
  const hbPath = toHandlebarsPath(dataPath)
  const title = el.label?.trim()
  const caption = title
    ? `<caption style="caption-side:top;text-align:left;font-weight:600;font-size:12px;padding-bottom:4px;color:#0f172a">${escHtml(title)}</caption>`
    : ''
  const mainTable = `<table style="width:100%;border-collapse:collapse">${caption}<thead><tr>${headerCells}</tr></thead><tbody>{{#each ${hbPath}}}<tr>${bodyCells}</tr>{{/each}}</tbody>${tfoot}</table>`

  return mainTable + afterTable
}

function renderComputedTable(
  el: TComputedTableElement,
  schemaMap: Record<string, ComputedTableSchema>,
  opts: SerializeOptions,
): string {
  if (Array.isArray(el.columns) && el.columns.length > 0) {
    return renderAdhocComputedTable(el, opts)
  }

  const schema = schemaMap[el.schemaId]

  if (!schema) {
    return `<div style="padding:8px;color:#94a3b8;font-size:12px">[${escHtml(opts.messages.missingSchema(el.schemaId))}]</div>`
  }

  const rows: ComputedRow[] = Array.isArray(el.rows) ? el.rows : []
  const currency = el.currency ?? schema.defaultCurrency ?? opts.defaultCurrency
  const locale = el.locale ?? schema.defaultLocale ?? defaultLocale(currency)

  const visibleColumns = schema.columns.filter((col) => {
    if (el.columnVisibility && col.key in el.columnVisibility)
      return el.columnVisibility[col.key] === true
    if (col.defaultVisible === false) return false

    return true
  })

  const headerCells = visibleColumns
    .map((col) => {
      const align = col.align ?? (col.type === 'text' ? 'left' : 'right')
      const widthStyle = col.width ? `width:${col.width};` : ''

      return `<th style="${widthStyle}text-align:${align}">${escHtml(col.label)}</th>`
    })
    .join('')

  const rowsHtml = rows
    .map((row, index) => {
      const ctx: ComputedColumnContext = {
        currency,
        locale,
        rows,
        index,
      }
      const cells = visibleColumns
        .map((col) => {
          const value =
            col.type === 'computed'
              ? col.compute
                ? col.compute(row, ctx)
                : ''
              : row[col.key]
          const formatted = fmtCell(value, col, ctx)
          const align = col.align ?? (col.type === 'text' ? 'left' : 'right')
          const emphasis = col.type === 'computed' ? '<strong>' : ''
          const emphasisEnd = col.type === 'computed' ? '</strong>' : ''

          return `<td style="text-align:${align}">${emphasis}${escHtml(formatted)}${emphasisEnd}</td>`
        })
        .join('')

      return `<tr>${cells}</tr>`
    })
    .join('')

  const emptyRow = `<tr><td colspan="${visibleColumns.length}" style="color:#94a3b8;text-align:center">${escHtml(schema.labels?.emptyState ?? '— —')}</td></tr>`

  const footerCtx: ComputedFooterContext = { currency, locale, rows }
  const footerHtml = (schema.footer ?? [])
    .map((footer) => {
      const value = footer.compute(rows, footerCtx)
      const formatted = footer.format
        ? footer.format(value, footerCtx)
        : typeof value === 'number'
          ? fmtMoney(value, currency, locale)
          : String(value)
      const cellTag = footer.emphasis === 'strong' ? 'th' : 'td'

      return `<tr><${cellTag}>${escHtml(footer.label)}</${cellTag}><${cellTag} style="text-align:right">${escHtml(formatted)}</${cellTag}></tr>`
    })
    .join('')

  const mainTable = `<table><tr>${headerCells}</tr>${rowsHtml || emptyRow}</table>`
  const totalsTable = footerHtml
    ? `<table style="margin-left:auto;width:360px;margin-top:8px">${footerHtml}</table>`
    : ''

  return mainTable + totalsTable
}

function serializeComputedTable(
  el: TComputedTableElement,
  schemaMap: Record<string, ComputedTableSchema>,
  opts: SerializeOptions,
): string {
  /*
   * Persist only the minimum needed to reconstruct the element. The schema
   * itself lives in editor props and is looked up on next mount.
   */
  const payload = {
    schemaId: el.schemaId,
    rows: el.rows ?? [],
    currency: el.currency,
    locale: el.locale,
    columnVisibility: el.columnVisibility,
    dataPath: el.dataPath,
    label: el.label,
    columns: el.columns,
    footer: el.footer,
  }
  const config = encodeURIComponent(JSON.stringify(payload))

  return `<div data-computed-table="1" data-config="${config}">${renderComputedTable(el, schemaMap, opts)}</div>`
}

/* ── Table-anchored chip re-injection ───────────────────────────────────── */

function isTextLeaf(node: TNode): node is TText {
  return typeof (node as TText).text === 'string'
}

function isEmptyTextLeaf(node: TNode): boolean {
  return isTextLeaf(node) && node.text.length === 0
}

function isElementOfType(node: TNode, type: string): node is TElement {
  return !isTextLeaf(node) && (node as TElement).type === type
}

function isAnchoredOpen(node: TNode): node is THandlebarsBlockOpenElement {
  return (
    isElementOfType(node, HBS_BLOCK_OPEN_KEY) &&
    (node as THandlebarsBlockOpenElement).tableAnchored === true
  )
}

function isAnchoredClose(node: TNode): node is THandlebarsBlockCloseElement {
  return (
    isElementOfType(node, HBS_BLOCK_CLOSE_KEY) &&
    (node as THandlebarsBlockCloseElement).tableAnchored === true
  )
}

/**
 * Walk forward past empty text leaves and return the next meaningful node
 * index, or `-1` if we hit the end of the array. Used so `{{#each}}` /
 * `<table>` / `{{/each}}` adjacency detection isn't broken by the empty
 * text leaves slate inserts around inline-void elements.
 */
function nextMeaningfulIndex(children: TNode[], from: number): number {
  let i = from

  while (i < children.length && isEmptyTextLeaf(children[i] as TNode)) i++

  return i < children.length ? i : -1
}

/**
 * Plate's HTML deserializer wraps consecutive inline-void elements (chips)
 * that arrive at a block-level container into a single shared `<p>` —
 * which makes `{{#each}}` end up nested inside a paragraph instead of as
 * a direct sibling of the table. The adjacency pattern matcher below only
 * sees direct siblings, so we pre-flatten: any paragraph carrying an
 * anchored chip is split apart, the chip floats out as a sibling and the
 * surrounding non-chip content stays in its own (cloned) paragraph.
 *
 * Non-anchored chips (`{{#if}}` blocks at the body level) are left inside
 * their paragraphs — they don't participate in adjacency matching and we
 * don't want to disturb the visual layout for them.
 */
function flattenAnchoredChipsFromParagraphs(children: TNode[]): TNode[] {
  const result: TNode[] = []

  for (const child of children) {
    if (isTextLeaf(child)) {
      result.push(child)
      continue
    }
    const el = child as TElement

    if (el.type !== 'p') {
      result.push(child)
      continue
    }

    const hasAnchored = (el.children as TNode[]).some(
      (c) => !isTextLeaf(c) && (isAnchoredOpen(c) || isAnchoredClose(c)),
    )

    if (!hasAnchored) {
      result.push(child)
      continue
    }

    let segment: TNode[] = []

    const flushSegment = () => {
      const hasMeaningful = segment.some(
        (c) => !isTextLeaf(c) || c.text.trim().length > 0,
      )

      if (hasMeaningful) result.push({ ...el, children: segment } as TNode)
      segment = []
    }

    for (const grandchild of el.children as TNode[]) {
      if (
        !isTextLeaf(grandchild) &&
        (isAnchoredOpen(grandchild) || isAnchoredClose(grandchild))
      ) {
        flushSegment()
        result.push(grandchild)
      } else {
        segment.push(grandchild)
      }
    }
    flushSegment()
  }

  return result
}

/**
 * Serialize a children array with awareness of `[anchored_open, table,
 * anchored_close]` adjacency. When detected, the chips get emitted *inside*
 * the resulting `<table>` so the round-trip stays semantically `{{#each
 * items}}<tr>…</tr>{{/each}}`. The chips were lifted out of the table at
 * deserialize time because slate's table model can't host inline-void as
 * direct children of `<table>`.
 */
function serializeChildren(
  rawChildren: TNode[],
  schemaMap: Record<string, ComputedTableSchema>,
  opts: SerializeOptions,
): string {
  const children = flattenAnchoredChipsFromParagraphs(rawChildren)
  let out = ''
  let i = 0

  while (i < children.length) {
    const child = children[i] as TNode

    if (isAnchoredOpen(child)) {
      const jTable = nextMeaningfulIndex(children, i + 1)

      if (
        jTable !== -1 &&
        isElementOfType(children[jTable] as TNode, 'table')
      ) {
        const kClose = nextMeaningfulIndex(children, jTable + 1)

        if (kClose !== -1) {
          const closer = children[kClose] as TNode

          if (isAnchoredClose(closer) && closer.helper === child.helper) {
            const table = children[jTable] as TElement
            const openerHbs = serializeNode(child, schemaMap, opts)
            const closerHbs = serializeNode(closer, schemaMap, opts)

            /*
             * Heuristic: separate trs into thead (first) + tbody (rest), and
             * wrap the chips around the tbody body only. The deserializer
             * dropped `<thead>` / `<tbody>` sections (Plate's table model
             * doesn't carry them), so without this split the each loop ends
             * up wrapping every row including the header — which compiles to
             * N tables-with-headers instead of one table with N data rows.
             * Single-row tables are treated as all-body (no header).
             */
            const trs = (table.children as TNode[]).filter(
              (c) => !isTextLeaf(c) && (c as TElement).type === 'tr',
            ) as TElement[]

            let tableInner: string

            if (trs.length >= 2) {
              const headerHtml = `<thead>${serializeNode(trs[0] as TNode, schemaMap, opts)}</thead>`
              const bodyTrsHtml = trs
                .slice(1)
                .map((tr) => serializeNode(tr as TNode, schemaMap, opts))
                .join('')

              tableInner = `${headerHtml}<tbody>${openerHbs}${bodyTrsHtml}${closerHbs}</tbody>`
            } else if (trs.length === 1) {
              tableInner = `<tbody>${openerHbs}${serializeNode(trs[0] as TNode, schemaMap, opts)}${closerHbs}</tbody>`
            } else {
              tableInner = `<tbody>${openerHbs}${closerHbs}</tbody>`
            }

            out += `<table>${tableInner}</table>`
            i = kClose + 1
            continue
          }
        }
      }
    }

    out += serializeNode(child, schemaMap, opts)
    i++
  }

  return out
}

/* ── Main walker ─────────────────────────────────────────────────────────── */

function serializeNode(
  node: TNode,
  schemaMap: Record<string, ComputedTableSchema>,
  opts: SerializeOptions,
): string {
  if (typeof (node as TText).text === 'string')
    return serializeText(node as TText)

  const el = node as TElement
  /*
   * Children are serialized via `serializeChildren`, NOT a naive `map().join('')`,
   * so the `[anchored_open, table, anchored_close]` adjacency pattern is
   * recognized and the chips get re-injected *inside* the resulting
   * `<table>` HTML. See `serializeChildren` for details.
   */
  const inner = serializeChildren(el.children as TNode[], schemaMap, opts)

  switch (el.type) {
    case HBS_VARIABLE_KEY: {
      const v = el as THandlebarsVariableElement
      let out = `{{${v.name}}}`

      if (v.code) out = `<code>${out}</code>`
      if (v.strikethrough) out = `<s>${out}</s>`
      if (v.underline) out = `<u>${out}</u>`
      if (v.italic) out = `<em>${out}</em>`
      if (v.bold) out = `<strong>${out}</strong>`

      return out
    }

    case HBS_BLOCK_OPEN_KEY: {
      const b = el as THandlebarsBlockOpenElement

      return `{{#${b.helper}${b.expression ? ` ${b.expression}` : ''}}}`
    }

    case HBS_BLOCK_CLOSE_KEY: {
      const b = el as THandlebarsBlockCloseElement

      return `{{/${b.helper}}}`
    }

    case HBS_ELSE_KEY:
      return '{{else}}'

    case COMPUTED_TABLE_KEY:
      return serializeComputedTable(
        el as TComputedTableElement,
        schemaMap,
        opts,
      )

    case 'p':
      return wrapBlock('p', el, inner)

    case 'code_block':
      return `<pre><code>${inner}</code></pre>`

    case 'code_line':
      return `${inner}\n`

    case 'a': {
      const href = escHtml(String((el as Record<string, unknown>).url ?? ''))

      return `<a href="${href}">${inner}</a>`
    }

    case 'lic':
      return inner

    case 'hr':
      return '<hr/>'

    case 'table':
      return `<table>${inner}</table>`

    case 'tr':
      return `<tr>${inner}</tr>`

    case 'td':

    case 'th': {
      const r = el as Record<string, unknown>
      const cs =
        typeof r.colSpan === 'number' && r.colSpan > 1
          ? ` colspan="${r.colSpan}"`
          : ''
      const rs =
        typeof r.rowSpan === 'number' && r.rowSpan > 1
          ? ` rowspan="${r.rowSpan}"`
          : ''

      return `<${el.type}${cs}${rs}${styleAttr(cellStyles(el))}>${inner}</${el.type}>`
    }

    case 'column_group':
      return `<div style="display:flex;gap:24px">${inner}</div>`

    case 'column': {
      const { width } = el as Record<string, unknown>
      const w = typeof width === 'string' && width ? width : 'auto'

      return `<div style="flex:${w === 'auto' ? '1' : `0 0 ${w}`}">${inner}</div>`
    }

    case 'callout': {
      const { variant } = el as Record<string, unknown>
      const v = typeof variant === 'string' ? variant : 'note'
      const bg =
        v === 'warning' ? '#fef3c7' : v === 'error' ? '#fee2e2' : '#eff6ff'
      const bd =
        v === 'warning' ? '#f59e0b' : v === 'error' ? '#ef4444' : '#3b82f6'

      return `<div style="background:${bg};border-left:3px solid ${bd};padding:12px 16px;border-radius:4px;margin:8px 0">${inner}</div>`
    }

    default: {
      const tags = BLOCK_TAGS[el.type]

      if (tags) return wrapBlock(tags[0], el, inner)

      return inner ? wrapBlock('p', el, inner) : ''
    }
  }
}

/**
 * Serialize the Plate document back to Handlebars-aware HTML. Pass the same
 * `tableSchemas` map that the editor was mounted with so computed-table
 * elements can render their static preview accurately. `options` carries the
 * editor's `defaultCurrency` + translated placeholder messages so the output
 * stays free of hard-coded `"TRY"` / Turkish text.
 */
export function serializePlateToHbs(
  value: TElement[],
  schemaMap: Record<string, ComputedTableSchema> = {},
  options?: Partial<SerializeOptions>,
): string {
  const opts: SerializeOptions = {
    defaultCurrency:
      options?.defaultCurrency ?? DEFAULT_SERIALIZE_OPTIONS.defaultCurrency,
    messages: { ...DEFAULT_SERIALIZE_OPTIONS.messages, ...options?.messages },
  }

  /*
   * Top-level walk also goes through `serializeChildren` so anchored chips
   * sitting at the document root (the common case after slate hoists them
   * out of a top-level `<table>`) are re-injected back into the table.
   * `\n` separator is preserved between non-wrapped children for HBS
   * readability via a custom join below.
   */
  return serializeChildren(value as TNode[], schemaMap, opts)
}
