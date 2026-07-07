// @ts-nocheck
/* eslint-disable */
import Handlebars from 'handlebars'

/*
 * Locale-aware currency formatting used by quote/invoice templates.
 * Format: ₺1.250,00 (TR), $1,250.00 (US), €1.250,00 (EU)
 */
export function formatCurrency(
  value: unknown,
  currency: unknown,
  locale: unknown,
): string {
  const amount = Number(value)

  if (!Number.isFinite(amount)) return ''

  const c = typeof currency === 'string' && currency ? currency : 'USD'
  const l =
    typeof locale === 'string' && locale
      ? locale
      : c === 'TRY'
        ? 'tr-TR'
        : 'en-US'

  try {
    return new Intl.NumberFormat(l, {
      style: 'currency',
      currency: c,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return amount.toFixed(2)
  }
}

export function formatNumber(
  value: unknown,
  locale: unknown,
  fractionDigits: unknown,
): string {
  const amount = Number(value)

  if (!Number.isFinite(amount)) return ''
  const l = typeof locale === 'string' && locale ? locale : 'en-US'
  const fd = Number(fractionDigits)
  const digits = Number.isFinite(fd) ? fd : 2

  return new Intl.NumberFormat(l, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount)
}

export function formatPercent(value: unknown): string {
  const amount = Number(value)

  if (!Number.isFinite(amount)) return ''

  return `%${formatNumber(amount, 'en-US', amount % 1 === 0 ? 0 : 2)}`
}

/*
 * Date formatter — accepts ISO string or millis. Supported tokens (subset):
 *   DD.MM.YYYY  →  21.05.2026
 *   YYYY-MM-DD  →  2026-05-21
 *   DD MMM YYYY →  21 May 2026 (locale-aware)
 */
export function formatDate(
  value: unknown,
  format: unknown,
  locale: unknown,
): string {
  if (value == null || value === '') return ''
  const d = value instanceof Date ? value : new Date(value as string | number)

  if (Number.isNaN(d.getTime())) return String(value)

  const f = typeof format === 'string' && format ? format : 'DD.MM.YYYY'
  const l = typeof locale === 'string' && locale ? locale : 'en-US'
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = String(d.getFullYear())
  const longMonth = d.toLocaleDateString(l, { month: 'long' })
  const shortMonth = d.toLocaleDateString(l, { month: 'short' })

  return f
    .replace(/YYYY/g, yyyy)
    .replace(/MMMM/g, longMonth)
    .replace(/MMM/g, shortMonth)
    .replace(/MM/g, mm)
    .replace(/DD/g, dd)
}

/*
 * Arithmetic helpers for line-item math.
 *   {{multiply qty unitPrice}}        → number
 *   {{add a b c …}}                    → number
 *   {{subtract a b}}                   → number
 *   {{lineTotal qty unitPrice discountPct}}
 *       qty * unitPrice * (1 - discountPct/100)
 *   {{sumProperty items 'lineTotal'}}  → sum of array[i][key]
 *   {{sumLineTotals items}}            → sum each item's qty*price*(1-discount/100)
 *   {{sumLineTaxes items}}             → sum each item's lineNet * taxPct/100
 */
/**
 * Round a number to `places` decimal places using EPSILON correction.
 *
 * Plain `Math.round(n * 100) / 100` is unreliable for IEEE-754 corner cases
 * (e.g. `Math.round(1.005 * 100) / 100 === 1`). Adding `Number.EPSILON`
 * before multiplying nudges values that are exactly representable past the
 * binary tie so they round the way humans expect — critical for currency
 * math where `1.005` must become `1.01`, not `1.00`.
 *
 * Use at every place where float results get accumulated or displayed.
 */
export function roundDecimal(n: number, places = 2): number {
  if (!Number.isFinite(n)) return n
  const factor = 10 ** places

  return Math.round((n + Number.EPSILON) * factor) / factor
}

export function toNum(v: unknown): number {
  const n = Number(v)

  return Number.isFinite(n) ? n : 0
}

export function multiply(a: unknown, b: unknown): number {
  return toNum(a) * toNum(b)
}

export function add(...args: unknown[]): number {
  const nums = args.slice(0, -1).map(toNum)

  return nums.reduce((acc, n) => acc + n, 0)
}

export function subtract(a: unknown, b: unknown): number {
  return toNum(a) - toNum(b)
}

export function divide(a: unknown, b: unknown): number {
  const denom = toNum(b)

  return denom === 0 ? 0 : toNum(a) / denom
}

export function sumProperty(items: unknown, key: unknown): number {
  if (!Array.isArray(items) || typeof key !== 'string') return 0
  const raw = items.reduce(
    (acc, it) => acc + toNum((it as Record<string, unknown>)?.[key]),
    0,
  )

  return roundDecimal(raw)
}

export function avgProperty(items: unknown, key: unknown): number {
  if (!Array.isArray(items) || items.length === 0 || typeof key !== 'string')
    return 0

  return roundDecimal(sumProperty(items, key) / items.length)
}

export function minProperty(items: unknown, key: unknown): number {
  if (!Array.isArray(items) || items.length === 0 || typeof key !== 'string')
    return 0
  let m = Infinity

  for (const it of items) {
    const n = toNum((it as Record<string, unknown>)?.[key])

    if (n < m) m = n
  }

  return m === Infinity ? 0 : m
}

export function maxProperty(items: unknown, key: unknown): number {
  if (!Array.isArray(items) || items.length === 0 || typeof key !== 'string')
    return 0
  let m = -Infinity

  for (const it of items) {
    const n = toNum((it as Record<string, unknown>)?.[key])

    if (n > m) m = n
  }

  return m === -Infinity ? 0 : m
}

export function countItems(items: unknown): number {
  return Array.isArray(items) ? items.length : 0
}

export function lineNet(
  qty: unknown,
  unitPrice: unknown,
  discountPct: unknown,
): number {
  return roundDecimal(
    toNum(qty) * toNum(unitPrice) * (1 - toNum(discountPct) / 100),
  )
}

export function lineTotalWithTax(
  qty: unknown,
  unitPrice: unknown,
  discountPct: unknown,
  taxPct: unknown,
): number {
  const net = lineNet(qty, unitPrice, discountPct)

  return roundDecimal(net + (net * toNum(taxPct)) / 100)
}

interface QuoteItem {
  qty?: number
  unitPrice?: number
  discountPct?: number
  taxPct?: number
}

export function sumLineNets(items: unknown): number {
  if (!Array.isArray(items)) return 0

  return roundDecimal(
    (items as QuoteItem[]).reduce(
      (acc, it) => acc + lineNet(it.qty, it.unitPrice, it.discountPct),
      0,
    ),
  )
}

export function sumLineTaxes(items: unknown): number {
  if (!Array.isArray(items)) return 0

  return roundDecimal(
    (items as QuoteItem[]).reduce((acc, it) => {
      const net = lineNet(it.qty, it.unitPrice, it.discountPct)

      return acc + (net * toNum(it.taxPct)) / 100
    }, 0),
  )
}

export function sumGrandTotal(items: unknown): number {
  return roundDecimal(sumLineNets(items) + sumLineTaxes(items))
}

/*
 * ── Keyed variants for ad-hoc tables ────────────────────────────────────
 * The hardcoded `sumLineNets` / `sumLineTaxes` / `sumGrandTotal` helpers
 * above assume `qty`, `unitPrice`, `discountPct`, `taxPct` field names.
 * Ad-hoc tables can use arbitrary column keys, so we also expose keyed
 * variants the dialog can target via its "Akıllı toplam" presets.
 */

export function lineNetKeyed(
  row: unknown,
  qtyKey: unknown,
  priceKey: unknown,
  discountKey: unknown,
): number {
  if (typeof row !== 'object' || row === null) return 0
  const r = row as Record<string, unknown>
  const qty = toNum(r[String(qtyKey)])
  const price = toNum(r[String(priceKey)])
  const discount = discountKey ? toNum(r[String(discountKey)]) : 0

  /*
   * Round each per-row net so the eventual sum reflects what an accountant
   * would compute line by line (and so cumulative IEEE-754 drift can't move
   * the displayed total by ₺0,01).
   */
  return roundDecimal(qty * price * (1 - discount / 100))
}

export function sumLineNetsKeyed(
  items: unknown,
  qtyKey: unknown,
  priceKey: unknown,
  discountKey: unknown,
): number {
  if (!Array.isArray(items)) return 0

  return roundDecimal(
    items.reduce(
      (acc: number, it) =>
        acc + lineNetKeyed(it, qtyKey, priceKey, discountKey),
      0,
    ),
  )
}

export function sumLineTaxesKeyed(
  items: unknown,
  qtyKey: unknown,
  priceKey: unknown,
  discountKey: unknown,
  taxKey: unknown,
): number {
  if (!Array.isArray(items)) return 0

  return roundDecimal(
    items.reduce((acc: number, it) => {
      const net = lineNetKeyed(it, qtyKey, priceKey, discountKey)
      const tax = taxKey
        ? toNum((it as Record<string, unknown>)?.[String(taxKey)])
        : 0

      return acc + (net * tax) / 100
    }, 0),
  )
}

export function sumLineGrossKeyed(
  items: unknown,
  qtyKey: unknown,
  priceKey: unknown,
  discountKey: unknown,
  taxKey: unknown,
): number {
  return roundDecimal(
    sumLineNetsKeyed(items, qtyKey, priceKey, discountKey) +
      sumLineTaxesKeyed(items, qtyKey, priceKey, discountKey, taxKey),
  )
}

/*
 * ── Safe expression evaluator ──────────────────────────────────────────
 *
 * Parses user-typed math like `qty * unitPrice * (1 - discountPct/100)`
 * with column-name identifiers, numeric literals and the operators
 *   `+`  `-`  `*`  `/`  `%`  parentheses, unary minus.
 *
 * Implementation: tiny recursive-descent parser. Identifiers resolve
 * against the row dictionary at evaluation time. Anything that fails to
 * parse / evaluate is silently treated as 0 so a typo in the textarea
 * doesn't blow up the preview.
 *
 * Deliberately avoids `eval`/`new Function`: templates are persisted in
 * data-config payloads that can travel to other users, and we don't want
 * a stored formula to be a code-injection vector.
 */

type ExprToken =
  | { type: 'NUMBER'; value: number }
  | { type: 'IDENT'; value: string }
  | { type: 'OP'; value: '+' | '-' | '*' | '/' | '%' }
  | { type: 'LPAREN' }
  | { type: 'RPAREN' }

type ExprNode =
  | { kind: 'num'; value: number }
  | { kind: 'ident'; name: string }
  | {
      kind: 'binop'
      op: '+' | '-' | '*' | '/' | '%'
      left: ExprNode
      right: ExprNode
    }
  | { kind: 'unary'; op: '-'; operand: ExprNode }

function tokenizeExpr(input: string): ExprToken[] {
  const tokens: ExprToken[] = []
  let i = 0

  while (i < input.length) {
    const ch = input[i] ?? ''

    if (/\s/.test(ch)) {
      i += 1
      continue
    }
    if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(input[i + 1] ?? ''))) {
      let j = i

      while (j < input.length && /[0-9.]/.test(input[j] ?? '')) j += 1
      tokens.push({ type: 'NUMBER', value: Number(input.slice(i, j)) })
      i = j
      continue
    }
    if (/[a-zA-Z_$]/.test(ch)) {
      let j = i

      while (j < input.length && /[a-zA-Z0-9_$]/.test(input[j] ?? '')) j += 1
      tokens.push({ type: 'IDENT', value: input.slice(i, j) })
      i = j
      continue
    }
    if (ch === '+' || ch === '-' || ch === '*' || ch === '/' || ch === '%') {
      tokens.push({ type: 'OP', value: ch })
      i += 1
      continue
    }
    if (ch === '(') {
      tokens.push({ type: 'LPAREN' })
      i += 1
      continue
    }
    if (ch === ')') {
      tokens.push({ type: 'RPAREN' })
      i += 1
      continue
    }
    i += 1
  }

  return tokens
}

function parseExpr(tokens: ExprToken[]): ExprNode {
  let pos = 0
  const peek = () => tokens[pos]
  const advance = () => tokens[pos++]

  function parseAddSub(): ExprNode {
    let left = parseMulDiv()

    while (true) {
      const t = peek()

      if (!t || t.type !== 'OP' || (t.value !== '+' && t.value !== '-')) break
      advance()
      const right = parseMulDiv()

      left = {
        kind: 'binop',
        op: t.value,
        left,
        right,
      }
    }

    return left
  }

  function parseMulDiv(): ExprNode {
    let left = parseUnary()

    while (true) {
      const t = peek()

      if (
        !t ||
        t.type !== 'OP' ||
        (t.value !== '*' && t.value !== '/' && t.value !== '%')
      )
        break
      advance()
      const right = parseUnary()

      left = {
        kind: 'binop',
        op: t.value,
        left,
        right,
      }
    }

    return left
  }

  function parseUnary(): ExprNode {
    const t = peek()

    if (t?.type === 'OP' && t.value === '-') {
      advance()

      return { kind: 'unary', op: '-', operand: parseUnary() }
    }
    if (t?.type === 'OP' && t.value === '+') {
      advance()

      return parseUnary()
    }

    return parseAtom()
  }

  function parseAtom(): ExprNode {
    const t = advance()

    if (!t) return { kind: 'num', value: 0 }
    if (t.type === 'NUMBER') return { kind: 'num', value: t.value }
    if (t.type === 'IDENT') return { kind: 'ident', name: t.value }
    if (t.type === 'LPAREN') {
      const inner = parseAddSub()
      const next = peek()

      if (next?.type === 'RPAREN') advance()

      return inner
    }

    return { kind: 'num', value: 0 }
  }

  return parseAddSub()
}

function evalExprNode(node: ExprNode, row: Record<string, unknown>): number {
  switch (node.kind) {
    case 'num':
      return node.value

    case 'ident':
      return toNum(row[node.name])

    case 'unary':
      return -evalExprNode(node.operand, row)

    case 'binop': {
      const l = evalExprNode(node.left, row)
      const r = evalExprNode(node.right, row)

      switch (node.op) {
        case '+':
          return l + r

        case '-':
          return l - r

        case '*':
          return l * r

        case '/':
          return r === 0 ? 0 : l / r

        case '%':
          return r === 0 ? 0 : l % r

        default:
          return 0
      }
    }

    default:
      return 0
  }
}

/**
 * Public expression evaluator. Errors swallow to 0 so a typo doesn't blow
 * up the entire template render.
 */
export function evaluateExpression(
  expression: string,
  row: Record<string, unknown>,
): number {
  if (!expression) return 0
  try {
    const tokens = tokenizeExpr(expression)

    if (tokens.length === 0) return 0
    const ast = parseExpr(tokens)

    return evalExprNode(ast, row)
  } catch {
    return 0
  }
}

/**
 * Sum a user-typed expression over an array of rows.
 *   {{formatCurrency (sumLineExpr items "qty * unitPrice * (1 - discountPct/100)") "USD"}}
 *
 * Each row is evaluated independently and rounded, then accumulated and
 * rounded again — matches the per-line accounting behavior of the keyed
 * helpers above.
 */
export function sumLineExpr(items: unknown, expression: unknown): number {
  if (
    !Array.isArray(items) ||
    typeof expression !== 'string' ||
    !expression.trim()
  )
    return 0
  let sum = 0

  for (const row of items) {
    if (typeof row !== 'object' || row === null) continue
    sum += roundDecimal(
      evaluateExpression(expression, row as Record<string, unknown>),
    )
  }

  return roundDecimal(sum)
}

/*
 * ── Generic chained formula evaluator ──────────────────────────────────
 *
 * Walks a `op:key|op:key|...` DSL and reduces each line into a value
 * starting from 1. Supported short codes:
 *   mul   → multiply              acc *= value
 *   div   → divide                acc  = (value === 0) ? 0 : acc / value
 *   comp  → multiply_complement   acc *= (1 - value/100)   (discount)
 *   prem  → multiply_premium      acc *= (1 + value/100)   (markup / VAT)
 *   pct   → multiply_pct          acc *= (value/100)       (percent-only)
 *
 * Returns the rounded sum across all rows.
 */
function applyTerm(acc: number, op: string, value: number): number {
  switch (op) {
    case 'mul':
      return acc * value

    case 'div':
      return value === 0 ? 0 : acc / value

    case 'comp':
      return acc * (1 - value / 100)

    case 'prem':
      return acc * (1 + value / 100)

    case 'pct':
      return acc * (value / 100)

    default:
      return acc
  }
}

export function sumLineGeneric(items: unknown, spec: unknown): number {
  if (!Array.isArray(items) || typeof spec !== 'string' || !spec) return 0
  const terms = spec
    .split('|')
    .map((part) => {
      const [op, key] = part.split(':')

      return { op: (op ?? '').trim(), key: (key ?? '').trim() }
    })
    .filter((t) => t.op && t.key)

  if (terms.length === 0) return 0

  let sum = 0

  for (const row of items) {
    if (typeof row !== 'object' || row === null) continue
    let line = 1

    for (const t of terms) {
      const value = toNum((row as Record<string, unknown>)[t.key])

      line = applyTerm(line, t.op, value)
    }
    sum += roundDecimal(line)
  }

  return roundDecimal(sum)
}

/* Comparison helpers — useful inside {{#if}} branches. */
export function eq(a: unknown, b: unknown): boolean {
  return a === b
}
export function gt(a: unknown, b: unknown): boolean {
  return toNum(a) > toNum(b)
}
export function lt(a: unknown, b: unknown): boolean {
  return toNum(a) < toNum(b)
}

let registered = false

/**
 * Idempotent helper registration. Handlebars module is a singleton — call this
 * once at runtime before compiling any template that uses these helpers.
 */
export function registerHandlebarsHelpers(): void {
  if (registered) return
  registered = true

  Handlebars.registerHelper('formatCurrency', formatCurrency)
  Handlebars.registerHelper('formatNumber', formatNumber)
  Handlebars.registerHelper('formatPercent', formatPercent)
  Handlebars.registerHelper('formatDate', formatDate)

  Handlebars.registerHelper('multiply', multiply)
  Handlebars.registerHelper('add', add)
  Handlebars.registerHelper('subtract', subtract)
  Handlebars.registerHelper('divide', divide)

  Handlebars.registerHelper('sumProperty', sumProperty)
  Handlebars.registerHelper('avgProperty', avgProperty)
  Handlebars.registerHelper('minProperty', minProperty)
  Handlebars.registerHelper('maxProperty', maxProperty)
  Handlebars.registerHelper('countItems', countItems)
  Handlebars.registerHelper('lineNet', lineNet)
  Handlebars.registerHelper('lineTotal', lineTotalWithTax)
  Handlebars.registerHelper('sumLineNets', sumLineNets)
  Handlebars.registerHelper('sumLineTaxes', sumLineTaxes)
  Handlebars.registerHelper('sumGrandTotal', sumGrandTotal)
  Handlebars.registerHelper('lineNetKeyed', lineNetKeyed)
  Handlebars.registerHelper('sumLineNetsKeyed', sumLineNetsKeyed)
  Handlebars.registerHelper('sumLineTaxesKeyed', sumLineTaxesKeyed)
  Handlebars.registerHelper('sumLineGrossKeyed', sumLineGrossKeyed)
  Handlebars.registerHelper('sumLineGeneric', sumLineGeneric)
  Handlebars.registerHelper('sumLineExpr', sumLineExpr)

  Handlebars.registerHelper('eq', eq)
  Handlebars.registerHelper('gt', gt)
  Handlebars.registerHelper('lt', lt)
}

/**
 * Register consumer-supplied helpers (e.g. locale-specific number-to-words,
 * domain formatters). Idempotent per helper name — overwrites on re-register
 * so callers can hot-swap implementations during HMR.
 */
export function registerExtraHelpers(
  helpers: Record<string, (...args: unknown[]) => unknown>,
): void {
  for (const [name, fn] of Object.entries(helpers)) {
    Handlebars.registerHelper(name, fn as never)
  }
}

/**
 * Catalog of helpers exposed to the editor's block-helper picker. The custom
 * block popover uses this when suggesting `#each`, `#if`, etc. — math helpers
 * are inline (used as `{{multiply …}}`) so they show up in the variable picker
 * instead. We keep them as documentation here.
 */
export const TEMPLATE_HELPERS_DOCS = [
  {
    name: 'formatCurrency',
    sample: '{{formatCurrency total currency}}',
    description: 'Locale-aware money formatting (₺/€/$)',
  },
  {
    name: 'formatNumber',
    sample: '{{formatNumber value}}',
    description: 'Locale-aware number with thousands separators',
  },
  {
    name: 'formatPercent',
    sample: '{{formatPercent value}}',
    description: 'Display value as percent (5 → %5)',
  },
  {
    name: 'formatDate',
    sample: '{{formatDate date "DD.MM.YYYY"}}',
    description: 'Format ISO date with DD/MM/YYYY tokens',
  },
  {
    name: 'multiply',
    sample: '{{multiply qty unitPrice}}',
    description: 'Multiply two values',
  },
  {
    name: 'lineNet',
    sample: '{{lineNet qty unitPrice discountPct}}',
    description: 'Net line total after discount',
  },
  {
    name: 'lineTotal',
    sample: '{{lineTotal qty unitPrice discountPct taxPct}}',
    description: 'Gross line total with tax',
  },
  {
    name: 'sumLineNets',
    sample: '{{sumLineNets items}}',
    description: 'Sum of all line nets (subtotal)',
  },
  {
    name: 'sumLineTaxes',
    sample: '{{sumLineTaxes items}}',
    description: 'Sum of all line taxes',
  },
  {
    name: 'sumGrandTotal',
    sample: '{{sumGrandTotal items}}',
    description: 'Net + tax for all lines',
  },
] as const
