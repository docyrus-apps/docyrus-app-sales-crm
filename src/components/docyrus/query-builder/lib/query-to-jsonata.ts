// @ts-nocheck
/* eslint-disable */
/*
 * Converts a react-querybuilder `RuleGroupType` (the JSON authored by
 * <QueryBuilderDocyrus>) into a JSONata expression that evaluates to a boolean
 * when run against a record. The Docyrus operator catalog in
 * `../query-operators` drives the per-operator semantics.
 *
 * Two classes of date handling:
 *   1. Fixed-value comparisons (`=`, `<`, `between`, …) embed pre-computed
 *      millisecond boundaries directly in the expression — they never change.
 *   2. Relative operators (`today`, `last_7_days`, `x_days_ago`, …) emit a
 *      `DateBindingSpec` plus references to `$<id>_s` / `$<id>_e` bindings that
 *      must be recomputed against "now" at every evaluation. Use
 *      `computeDateBindings()` for that.
 *
 * A small set of helper functions (`$toMs`, `$wd`, `$md`, `$tod`) are referenced
 * by the generated expression and provided by `createHelperBindings()`.
 */

import {
  type RuleGroupType,
  type RuleType,
  type RuleGroupTypeAny,
} from 'react-querybuilder'

import {
  type FilterGroup,
  ARRAY_VALUE_OPERATORS,
  BETWEEN_OPERATORS,
  JSON_KEY_OPERATORS,
  JSON_KEY_NO_VALUE_OPERATORS,
  MULTI_VALUE_OPERATORS,
  WEEKDAYS_OPERATORS,
} from '../query-operators'

const DAY_MS = 86_400_000

/** Describes a relative-date boundary that must be recomputed against "now". */
export interface DateBindingSpec {
  /** Unique id; bindings are exposed as `<id>_s` (start) and `<id>_e` (end). */
  id: string
  /** The Docyrus relative operator (e.g. `today`, `last_7_days`, `x_days_ago`). */
  operator: string
  /** Numeric argument for `x_days_ago` / `in_last_x_days` / … operators. */
  amount?: number
}

export interface ConvertQueryOptions {
  /** Resolve a field name to its Docyrus filter group (drives `=` semantics). */
  resolveGroup?: (field: string) => FilterGroup | undefined
  /** Map a field name to a JSONata path. Defaults to identity (dot-aware). */
  fieldResolver?: (field: string) => string
  /**
   * Per-operator escape hatches. Receives the rule plus a small helper API and
   * returns a JSONata fragment (or `null` to skip the rule).
   */
  operatorOverrides?: Record<
    string,
    (rule: RuleType, api: OperatorApi) => string | null
  >
  /**
   * Fragment substituted for operators that cannot be evaluated client-side
   * (role / team / unit / scope checks). `true` keeps them non-restrictive
   * inside AND chains; `false` makes them never match. Default: `true`.
   */
  unsupportedFallback?: boolean
  /** First day of the week for week-relative operators. Default: 1 (Monday). */
  weekStartsOn?: 0 | 1
}

export interface OperatorApi {
  /** The resolved JSONata path for the rule's field. */
  field: string
  /** Quote a value as a JSONata string literal. */
  str: (value: unknown) => string
  /** Render a value as a JSONata number literal (`NaN` → `null`). */
  num: (value: unknown) => string
  /** Render an array as a JSONata array literal of strings. */
  strArr: (values: unknown[]) => string
  /** Resolve another field name to a JSONata path. */
  fieldRef: (name: string) => string
}

export interface ConvertQueryResult {
  /** The generated JSONata expression (always a valid boolean predicate). */
  expression: string
  /** Relative-date bindings that must be recomputed at evaluation time. */
  dateBindings: DateBindingSpec[]
  /** Operators that were emitted as the unsupported fallback. */
  unsupportedOperators: string[]
  /** Human-readable notes about lossy / skipped conversions. */
  warnings: string[]
}

/* -------------------------------------------------------------------------- */
/* Literal + field escaping                                                   */
/* -------------------------------------------------------------------------- */

const IDENT_RE = /^[A-Za-z_][A-Za-z0-9_]*$/

/** Escapes a single path segment, backtick-wrapping when it isn't an identifier. */
function escapeSegment(segment: string): string {
  if (IDENT_RE.test(segment)) return segment

  return `\`${segment.replace(/`/g, '')}\``
}

/** Default field resolver: dot-aware path with per-segment escaping. */
export function defaultFieldResolver(name: string): string {
  return name.split('.').map(escapeSegment).join('.')
}

/** Quotes an arbitrary value as a JSONata single-quoted string literal. */
function strLit(value: unknown): string {
  const raw = value === null || value === undefined ? '' : String(value)
  const escaped = raw
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')

  return `'${escaped}'`
}

/** Renders a value as a JSONata numeric literal, or `null` when not numeric. */
function numLit(value: unknown): string {
  const n = typeof value === 'number' ? value : Number(value)

  return Number.isFinite(n) ? String(n) : 'null'
}

function strArrLit(values: unknown[]): string {
  return `[${values.map(strLit).join(', ')}]`
}

/* -------------------------------------------------------------------------- */
/* Value parsing                                                              */
/* -------------------------------------------------------------------------- */

function parseArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value

  if (value === null || value === undefined || value === '') return []

  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function parseBetween(value: unknown): [unknown, unknown] {
  const arr = Array.isArray(value) ? value : String(value ?? '').split(',')

  return [arr[0], arr[1]]
}

/** Parses `HH:MM[:SS]` (or a datetime) into minutes-of-day, or `null`. */
function parseTimeToMinutes(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null

  const str = String(value).trim()
  const match = /^(\d{1,2}):(\d{2})/.exec(str)

  if (match) {
    const h = Number(match[1])
    const m = Number(match[2])

    if (Number.isFinite(h) && Number.isFinite(m)) return h * 60 + m
  }

  return null
}

/** Parses a date/datetime value to local milliseconds, or `null`. */
function parseDateMs(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null

  const str = String(value).trim()

  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str)

  if (dateOnly) {
    return new Date(
      Number(dateOnly[1]),
      Number(dateOnly[2]) - 1,
      Number(dateOnly[3]),
    ).getTime()
  }

  const ms = Date.parse(str)

  return Number.isNaN(ms) ? null : ms
}

/* -------------------------------------------------------------------------- */
/* Date math (local time)                                                     */
/* -------------------------------------------------------------------------- */

function startOfDay(ms: number): number {
  const d = new Date(ms)

  d.setHours(0, 0, 0, 0)

  return d.getTime()
}

function startOfWeek(ms: number, weekStartsOn: 0 | 1): number {
  const start = startOfDay(ms)
  const dow = new Date(start).getDay()
  const diff = (dow - weekStartsOn + 7) % 7

  return start - diff * DAY_MS
}

function startOfMonthOffset(ms: number, monthsAhead: number): number {
  const d = new Date(ms)

  return new Date(d.getFullYear(), d.getMonth() + monthsAhead, 1).getTime()
}

function startOfYearOffset(ms: number, yearsAhead: number): number {
  const d = new Date(ms)

  return new Date(d.getFullYear() + yearsAhead, 0, 1).getTime()
}

function startOfQuarter(year: number, quarter: number): number {
  return new Date(year, (quarter - 1) * 3, 1).getTime()
}

function addMonthsExact(ms: number, months: number): number {
  const d = new Date(ms)

  d.setMonth(d.getMonth() + months)

  return d.getTime()
}

const ROLLING_LAST_DAYS: Record<string, number> = {
  last_7_days: 7,
  last_15_days: 15,
  last_30_days: 30,
  last_60_days: 60,
  last_90_days: 90,
  last_120_days: 120,
}

const ROLLING_NEXT_DAYS: Record<string, number> = {
  next_7_days: 7,
  next_15_days: 15,
  next_30_days: 30,
  next_60_days: 60,
  next_90_days: 90,
  next_120_days: 120,
}

/**
 * Computes the `[start, end)` millisecond window (either bound may be omitted)
 * for a relative-date operator, evaluated against `nowMs`.
 */
export function computeDateWindow(
  spec: DateBindingSpec,
  nowMs: number,
  weekStartsOn: 0 | 1 = 1,
): { start?: number; end?: number } {
  const { operator, amount = 0 } = spec
  const sod = startOfDay(nowMs)
  const year = new Date(nowMs).getFullYear()

  switch (operator) {
    case 'today':
      return { start: sod, end: sod + DAY_MS }

    case 'yesterday':
      return { start: sod - DAY_MS, end: sod }

    case 'tomorrow':
      return { start: sod + DAY_MS, end: sod + 2 * DAY_MS }

    case 'this_week':
      return {
        start: startOfWeek(nowMs, weekStartsOn),
        end: startOfWeek(nowMs, weekStartsOn) + 7 * DAY_MS,
      }

    case 'last_week':
      return {
        start: startOfWeek(nowMs, weekStartsOn) - 7 * DAY_MS,
        end: startOfWeek(nowMs, weekStartsOn),
      }

    case 'next_week':
      return {
        start: startOfWeek(nowMs, weekStartsOn) + 7 * DAY_MS,
        end: startOfWeek(nowMs, weekStartsOn) + 14 * DAY_MS,
      }

    case 'this_month':
      return {
        start: startOfMonthOffset(nowMs, 0),
        end: startOfMonthOffset(nowMs, 1),
      }

    case 'last_month':
      return {
        start: startOfMonthOffset(nowMs, -1),
        end: startOfMonthOffset(nowMs, 0),
      }

    case 'next_month':
      return {
        start: startOfMonthOffset(nowMs, 1),
        end: startOfMonthOffset(nowMs, 2),
      }

    case 'this_year':
      return {
        start: startOfYearOffset(nowMs, 0),
        end: startOfYearOffset(nowMs, 1),
      }

    case 'last_year':
      return {
        start: startOfYearOffset(nowMs, -1),
        end: startOfYearOffset(nowMs, 0),
      }

    case 'next_year':
      return {
        start: startOfYearOffset(nowMs, 1),
        end: startOfYearOffset(nowMs, 2),
      }

    case 'first_quarter':
      return { start: startOfQuarter(year, 1), end: startOfQuarter(year, 2) }

    case 'second_quarter':
      return { start: startOfQuarter(year, 2), end: startOfQuarter(year, 3) }

    case 'third_quarter':
      return { start: startOfQuarter(year, 3), end: startOfQuarter(year, 4) }

    case 'fourth_quarter':
      return {
        start: startOfQuarter(year, 4),
        end: startOfYearOffset(nowMs, 1),
      }

    case 'last_3_months':
      return { start: addMonthsExact(nowMs, -3), end: nowMs }

    case 'last_6_months':
      return { start: addMonthsExact(nowMs, -6), end: nowMs }

    case 'before_today':
      return { end: sod }

    case 'after_today':
      return { start: sod + DAY_MS }

    case 'x_days_ago':
      return {
        start: sod - amount * DAY_MS,
        end: sod - amount * DAY_MS + DAY_MS,
      }

    case 'x_days_later':
      return {
        start: sod + amount * DAY_MS,
        end: sod + amount * DAY_MS + DAY_MS,
      }

    case 'before_last_x_days':
      return { end: sod - amount * DAY_MS }

    case 'after_last_x_days':
      return { start: sod - amount * DAY_MS }

    case 'in_last_x_days':
      return { start: nowMs - amount * DAY_MS, end: nowMs }

    case 'in_next_x_days':
      return { start: nowMs, end: nowMs + amount * DAY_MS }

    default: {
      const lastN = ROLLING_LAST_DAYS[operator]

      if (lastN !== undefined)
        return { start: nowMs - lastN * DAY_MS, end: nowMs }

      const nextN = ROLLING_NEXT_DAYS[operator]

      if (nextN !== undefined)
        return { start: nowMs, end: nowMs + nextN * DAY_MS }

      return {}
    }
  }
}

/** Builds the `<id>_s` / `<id>_e` binding map for the given relative-date specs. */
export function computeDateBindings(
  specs: DateBindingSpec[],
  nowMs: number,
  weekStartsOn: 0 | 1 = 1,
): Record<string, number> {
  const bindings: Record<string, number> = {}

  for (const spec of specs) {
    const { start, end } = computeDateWindow(spec, nowMs, weekStartsOn)

    if (start !== undefined) bindings[`${spec.id}_s`] = start

    if (end !== undefined) bindings[`${spec.id}_e`] = end
  }

  return bindings
}

/* -------------------------------------------------------------------------- */
/* Helper function bindings                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The JSONata helper functions referenced by generated expressions. Returned as
 * a plain bindings object: `{ toMs, wd, md, tod }` → `$toMs(...)` etc.
 */
export function createHelperBindings(): Record<
  string,
  (value: unknown) => number | undefined
> {
  const toMs = (value: unknown): number | undefined => {
    const ms = parseDateMs(value)

    return ms === null ? undefined : ms
  }

  const wd = (value: unknown): number | undefined => {
    const ms = toMs(value)

    return ms === undefined ? undefined : new Date(ms).getDay()
  }

  const md = (value: unknown): number | undefined => {
    const ms = toMs(value)

    return ms === undefined ? undefined : new Date(ms).getDate()
  }

  const tod = (value: unknown): number | undefined => {
    const direct = parseTimeToMinutes(value)

    if (direct !== null) return direct

    const ms = toMs(value)

    if (ms === undefined) return undefined

    const d = new Date(ms)

    return d.getHours() * 60 + d.getMinutes()
  }

  return {
    toMs,
    wd,
    md,
    tod,
  }
}

/* -------------------------------------------------------------------------- */
/* Operator catalogues used during conversion                                 */
/* -------------------------------------------------------------------------- */

const RELATIVE_NO_VALUE_DATE_OPS = new Set<string>([
  'today',
  'yesterday',
  'tomorrow',
  'this_week',
  'last_week',
  'next_week',
  'this_month',
  'last_month',
  'next_month',
  'this_year',
  'last_year',
  'next_year',
  'first_quarter',
  'second_quarter',
  'third_quarter',
  'fourth_quarter',
  'last_3_months',
  'last_6_months',
  'before_today',
  'after_today',
  ...Object.keys(ROLLING_LAST_DAYS),
  ...Object.keys(ROLLING_NEXT_DAYS),
])

const RELATIVE_AMOUNT_DATE_OPS = new Set<string>([
  'x_days_ago',
  'x_days_later',
  'before_last_x_days',
  'after_last_x_days',
  'in_last_x_days',
  'in_next_x_days',
])

const END_ONLY_DATE_OPS = new Set<string>([
  'before_today',
  'before_last_x_days',
])
const START_ONLY_DATE_OPS = new Set<string>([
  'after_today',
  'after_last_x_days',
])

const TIME_COMPARE_OPS: Record<string, string> = {
  time_is: '=',
  time_greater: '>',
  time_greater_or_equals: '>=',
  time_lower: '<',
  time_lower_or_equals: '<=',
}

const UNSUPPORTED_OWNER_OPS = new Set<string>([
  'in_role',
  'not_in_role',
  'in_team',
  'not_in_team',
  'in_active_user_team',
  'not_in_active_user_team',
  'in_active_user_scope',
  'not_in_active_user_scope',
  'in_unit',
  'not_in_unit',
  'in_sub_unit',
  'not_in_sub_unit',
])

/* -------------------------------------------------------------------------- */
/* Conversion                                                                 */
/* -------------------------------------------------------------------------- */

interface ConvertContext {
  resolveGroup: (field: string) => FilterGroup | undefined
  fieldResolver: (field: string) => string
  operatorOverrides: NonNullable<ConvertQueryOptions['operatorOverrides']>
  unsupportedFallback: string
  dateBindings: DateBindingSpec[]
  unsupportedOperators: string[]
  warnings: string[]
  counter: { value: number }
}

/** `($exists(F) = false or F = null or F = '' or $count(F) = 0)` */
function emptyExpr(field: string): string {
  return `($exists(${field}) = false or ${field} = null or ${field} = '' or $count(${field}) = 0)`
}

function nextDateId(ctx: ConvertContext): string {
  return `d${ctx.counter.value++}`
}

function buildRelativeDate(
  field: string,
  operator: string,
  amount: number | undefined,
  ctx: ConvertContext,
): string {
  const id = nextDateId(ctx)

  ctx.dateBindings.push({ id, operator, amount })

  const f = `$toMs(${field})`

  if (END_ONLY_DATE_OPS.has(operator)) return `(${f} < $${id}_e)`

  if (START_ONLY_DATE_OPS.has(operator)) return `(${f} >= $${id}_s)`

  return `(${f} >= $${id}_s and ${f} < $${id}_e)`
}

function buildFixedDate(
  field: string,
  group: FilterGroup,
  operator: string,
  value: unknown,
  ctx: ConvertContext,
): string | null {
  const isDate = group === 'DATE'
  const f = `$toMs(${field})`

  if (BETWEEN_OPERATORS.has(operator)) {
    const [a, b] = parseBetween(value)
    const aMs = parseDateMs(a)
    const bMs = parseDateMs(b)

    if (aMs === null && bMs === null) {
      ctx.warnings.push(
        `Skipped "${operator}" on a date field: no valid bounds.`,
      )

      return null
    }

    const lo = isDate && aMs !== null ? startOfDay(aMs) : aMs
    const hi = isDate && bMs !== null ? startOfDay(bMs) + DAY_MS : bMs
    const parts: string[] = []

    if (lo !== null) parts.push(`${f} >= ${lo}`)

    if (hi !== null) parts.push(isDate ? `${f} < ${hi}` : `${f} <= ${hi}`)

    return `(${parts.join(' and ')})`
  }

  const ms = parseDateMs(value)

  if (ms === null) {
    ctx.warnings.push(
      `Skipped "${operator}" on a date field: value is not a valid date.`,
    )

    return null
  }

  const sod = startOfDay(ms)

  switch (operator) {
    case '=':
      return isDate
        ? `(${f} >= ${sod} and ${f} < ${sod + DAY_MS})`
        : `(${f} = ${ms})`

    case '<>':

    case '!=':
      return isDate
        ? `($not(${f} >= ${sod} and ${f} < ${sod + DAY_MS}))`
        : `(${f} != ${ms})`

    case '>':
      return isDate ? `(${f} >= ${sod + DAY_MS})` : `(${f} > ${ms})`

    case '>=':
      return isDate ? `(${f} >= ${sod})` : `(${f} >= ${ms})`

    case '<':
      return isDate ? `(${f} < ${sod})` : `(${f} < ${ms})`

    case '<=':
      return isDate ? `(${f} < ${sod + DAY_MS})` : `(${f} <= ${ms})`

    default:
      return null
  }
}

function buildGenericCompare(
  field: string,
  group: FilterGroup | undefined,
  rule: RuleType,
  ctx: ConvertContext,
): string | null {
  const { operator, value } = rule
  const numeric = group === 'NUMERIC'
  const useField = rule.valueSource === 'field'
  const rhs = useField
    ? ctx.fieldResolver(String(value))
    : numeric
      ? numLit(value)
      : strLit(value)

  switch (operator) {
    case '=':
      return `(${field} = ${rhs})`

    case '<>':

    case '!=':
      return `(${field} != ${rhs})`

    case '<':
      return `(${field} < ${rhs})`

    case '<=':
      return `(${field} <= ${rhs})`

    case '>':
      return `(${field} > ${rhs})`

    case '>=':
      return `(${field} >= ${rhs})`

    case 'like':
      return `($contains($lowercase($string(${field})), $lowercase(${strLit(value)})))`

    case 'not like':
      return `($not($contains($lowercase($string(${field})), $lowercase(${strLit(value)}))))`

    case 'starts with': {
      const needle = String(value ?? '').toLowerCase()

      if (!needle) return null

      return `($substring($lowercase($string(${field})), 0, ${needle.length}) = ${strLit(needle)})`
    }

    case 'ends with': {
      const needle = String(value ?? '').toLowerCase()

      if (!needle) return null

      return `($lowercase($substring($string(${field}), -${needle.length})) = ${strLit(needle)})`
    }

    default:
      return markUnsupported(operator, ctx)
  }
}

function markUnsupported(operator: string, ctx: ConvertContext): string {
  if (!ctx.unsupportedOperators.includes(operator))
    ctx.unsupportedOperators.push(operator)

  ctx.warnings.push(
    `Operator "${operator}" cannot be evaluated client-side; using fallback (${ctx.unsupportedFallback}).`,
  )

  return ctx.unsupportedFallback
}

function buildRule(rule: RuleType, ctx: ConvertContext): string | null {
  const { operator } = rule
  const field = ctx.fieldResolver(rule.field)
  const group = ctx.resolveGroup(rule.field)
  const { value } = rule

  const override = ctx.operatorOverrides[operator]

  if (override) {
    return override(rule, {
      field,
      str: strLit,
      num: numLit,
      strArr: strArrLit,
      fieldRef: ctx.fieldResolver,
    })
  }

  if (operator === 'empty') return emptyExpr(field)

  if (operator === 'not empty') return `($not(${emptyExpr(field)}))`

  if (operator === 'true') return `($boolean(${field}) = true)`

  if (operator === 'false') return `($boolean(${field}) = false)`

  switch (operator) {
    case 'active_user':
      return `(${field} = $activeUserId)`

    case 'not_active_user':
      return `(${field} != $activeUserId)`

    case 'contains_active_user':
      return `($activeUserId in ${field})`

    case 'not_contains_active_user':
      return `($not($activeUserId in ${field}))`

    case 'contains_member_of_active_user_team':
      return `($count(${field}[$ in $activeUserTeamMemberIds]) > 0)`

    default:
      break
  }

  if (UNSUPPORTED_OWNER_OPS.has(operator)) return markUnsupported(operator, ctx)

  if (operator === 'is_other_field')
    return `(${field} = ${ctx.fieldResolver(String(value))})`

  if (operator === 'is_not_other_field')
    return `(${field} != ${ctx.fieldResolver(String(value))})`

  if (
    JSON_KEY_OPERATORS.has(operator) ||
    JSON_KEY_NO_VALUE_OPERATORS.has(operator)
  ) {
    const arr = Array.isArray(value) ? value : String(value ?? '').split(':')
    const key = String(arr[0] ?? '')
    const lookup = `$lookup(${field}, ${strLit(key)})`

    if (operator === 'json_key_is')
      return `(${lookup} = ${strLit(arr[1] ?? '')})`

    if (operator === 'json_key_is_not')
      return `(${lookup} != ${strLit(arr[1] ?? '')})`

    if (operator === 'json_key_is_empty')
      return `($exists(${lookup}) = false or ${lookup} = '')`

    if (operator === 'json_key_is_not_empty')
      return `($exists(${lookup}) and ${lookup} != '')`
  }

  if (ARRAY_VALUE_OPERATORS.has(operator)) {
    const list = strArrLit(parseArray(value))

    return operator === 'is one of'
      ? `(${field} in ${list})`
      : `($not(${field} in ${list}))`
  }

  if (MULTI_VALUE_OPERATORS.has(operator)) {
    const items = parseArray(value)
    const list = strArrLit(items)

    /*
     * `contains all`: every selected value must be present in the field array.
     * The base is the literal value list, so the membership predicate has to
     * reference the *root* field via `$$` — a bare `${field}` would resolve
     * relative to the predicate's current item (a string) and never match.
     */
    if (operator === 'contains all')
      return `($count(${list}[$ in $$.${field}]) = ${items.length})`

    if (operator === 'not contains')
      return `($count(${field}[$ in ${list}]) = 0)`

    return `($count(${field}[$ in ${list}]) > 0)`
  }

  if (operator === 'not like' && group === 'FOLLOWER') {
    return `($count(${field}[$ in ${strArrLit(parseArray(value))}]) = 0)`
  }

  if (WEEKDAYS_OPERATORS.has(operator)) {
    const nums = parseArray(value)
      .map((v) => numLit(v))
      .join(', ')

    return `($wd(${field}) in [${nums}])`
  }

  if (operator === 'weekday_is') return `($wd(${field}) = ${numLit(value)})`

  if (operator === 'monthday_is') return `($md(${field}) = ${numLit(value)})`

  if (operator in TIME_COMPARE_OPS) {
    const minutes = parseTimeToMinutes(value)

    if (minutes === null) {
      ctx.warnings.push(`Skipped "${operator}": value is not a valid time.`)

      return null
    }

    return `($tod(${field}) ${TIME_COMPARE_OPS[operator]} ${minutes})`
  }

  if (RELATIVE_AMOUNT_DATE_OPS.has(operator)) {
    const amount = Number(value)

    return buildRelativeDate(
      field,
      operator,
      Number.isFinite(amount) ? amount : 0,
      ctx,
    )
  }

  if (RELATIVE_NO_VALUE_DATE_OPS.has(operator)) {
    return buildRelativeDate(field, operator, undefined, ctx)
  }

  if (
    (group === 'DATE' || group === 'DATETIME') &&
    (operator === '=' ||
      operator === '<>' ||
      operator === '!=' ||
      operator === '>' ||
      operator === '>=' ||
      operator === '<' ||
      operator === '<=' ||
      BETWEEN_OPERATORS.has(operator))
  ) {
    return buildFixedDate(field, group, operator, value, ctx)
  }

  if (
    group === 'TIME' &&
    (operator === '=' ||
      operator === '<>' ||
      operator === '!=' ||
      operator === '>' ||
      operator === '<')
  ) {
    const minutes = parseTimeToMinutes(value)

    if (minutes === null) {
      ctx.warnings.push(
        `Skipped "${operator}" on a time field: value is not a valid time.`,
      )

      return null
    }

    const cmp = operator === '<>' ? '!=' : operator

    return `($tod(${field}) ${cmp} ${minutes})`
  }

  if (group === 'NUMERIC' && BETWEEN_OPERATORS.has(operator)) {
    const [a, b] = parseBetween(value)

    return `(${field} >= ${numLit(a)} and ${field} <= ${numLit(b)})`
  }

  return buildGenericCompare(field, group, rule, ctx)
}

function buildGroup(group: RuleGroupType, ctx: ConvertContext): string {
  const isOr = group.combinator === 'or'
  const joiner = isOr ? ' or ' : ' and '
  const parts: string[] = []

  for (const child of group.rules) {
    if (typeof child === 'string') continue // independent-combinator separators (unused here)

    const expr =
      'rules' in child
        ? buildGroup(child as RuleGroupType, ctx)
        : buildRule(child as RuleType, ctx)

    if (expr !== null && expr !== '') parts.push(expr)
  }

  let expression =
    parts.length === 0 ? (isOr ? 'false' : 'true') : `(${parts.join(joiner)})`

  if (group.not) expression = `$not(${expression})`

  return expression
}

/** Converts a query group into a JSONata boolean predicate. */
export function convertQueryToJsonata(
  query: RuleGroupTypeAny | undefined | null,
  options: ConvertQueryOptions = {},
): ConvertQueryResult {
  const ctx: ConvertContext = {
    resolveGroup: options.resolveGroup ?? (() => undefined),
    fieldResolver: options.fieldResolver ?? defaultFieldResolver,
    operatorOverrides: options.operatorOverrides ?? {},
    unsupportedFallback:
      options.unsupportedFallback === false ? 'false' : 'true',
    dateBindings: [],
    unsupportedOperators: [],
    warnings: [],
    counter: { value: 0 },
  }

  const expression =
    query && 'rules' in query ? buildGroup(query as RuleGroupType, ctx) : 'true'

  return {
    expression,
    dateBindings: ctx.dateBindings,
    unsupportedOperators: ctx.unsupportedOperators,
    warnings: ctx.warnings,
  }
}
