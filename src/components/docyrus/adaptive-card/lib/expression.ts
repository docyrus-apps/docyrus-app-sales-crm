// @ts-nocheck
/* eslint-disable */
/*
 * Minimal Adaptive Cards expression evaluator.
 *
 * Supports the subset of Adaptive Expression Language that LLM agents and
 * Teams bots reach for in practice — path resolution, comparison /
 * arithmetic operators, and a small built-in function library. The full AEL
 * (antlr4-based, ~400KB) is intentionally avoided to keep the bundle light.
 *
 * If you need a missing AEL function for a specific card, register it via
 * `registerExpressionFunction(name, fn)` at runtime instead of expanding
 * the grammar here.
 */

export interface ExpressionScope {
  data: unknown
  root: unknown
  index?: number
}

type ExprValue = unknown

type ExprFn = (...args: Array<ExprValue>) => ExprValue

const builtins: Record<string, ExprFn> = {
  if(cond, a, b) {
    return cond ? a : b
  },
  equals(a, b) {
    return a === b
  },
  not(value) {
    return !value
  },
  and(...args) {
    return args.every((v) => Boolean(v))
  },
  or(...args) {
    return args.some((v) => Boolean(v))
  },
  length(value) {
    if (typeof value === 'string') return value.length
    if (Array.isArray(value)) return value.length

    return 0
  },
  count(value) {
    return Array.isArray(value) ? value.length : 0
  },
  empty(value) {
    if (value == null) return true
    if (typeof value === 'string') return value.length === 0
    if (Array.isArray(value)) return value.length === 0
    if (typeof value === 'object')
      return Object.keys(value as object).length === 0

    return false
  },
  add(a, b) {
    return Number(a) + Number(b)
  },
  sub(a, b) {
    return Number(a) - Number(b)
  },
  mul(a, b) {
    return Number(a) * Number(b)
  },
  div(a, b) {
    return Number(a) / Number(b)
  },
  mod(a, b) {
    return Number(a) % Number(b)
  },
  min(...args) {
    return Math.min(...args.map((v) => Number(v)))
  },
  max(...args) {
    return Math.max(...args.map((v) => Number(v)))
  },
  concat(...args) {
    return args.map((v) => (v == null ? '' : String(v))).join('')
  },
  substring(s, start, length) {
    const str = String(s ?? '')
    const startN = Number(start)

    if (length == null) return str.substring(startN)

    return str.substring(startN, startN + Number(length))
  },
  toUpper(s) {
    return String(s ?? '').toUpperCase()
  },
  toLower(s) {
    return String(s ?? '').toLowerCase()
  },
  formatNumber(n, fractionDigits) {
    const num = Number(n)

    if (!Number.isFinite(num)) return ''
    const digits = fractionDigits == null ? undefined : Number(fractionDigits)

    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(num)
  },
  formatDateTime(value, format) {
    const date = value instanceof Date ? value : new Date(String(value))

    if (Number.isNaN(date.getTime())) return String(value ?? '')

    /*
     * `format` follows a small subset of the official AEL format tokens
     * (LongDate, ShortDate, etc.). We map to native Intl options.
     */
    const fmt = String(format ?? 'LongDate')

    switch (fmt) {
      case 'ShortDate':
        return date.toLocaleDateString()

      case 'LongDate':
        return date.toLocaleDateString(undefined, { dateStyle: 'long' })

      case 'ShortTime':
        return date.toLocaleTimeString(undefined, { timeStyle: 'short' })

      case 'LongTime':
        return date.toLocaleTimeString(undefined, { timeStyle: 'long' })

      default:
        return date.toLocaleString()
    }
  },
  json(value) {
    if (value == null) return null
    try {
      return JSON.parse(String(value))
    } catch {
      return null
    }
  },
  string(value) {
    return value == null ? '' : String(value)
  },
  bool(value) {
    return Boolean(value)
  },
  coalesce(...args) {
    for (const v of args) {
      if (v != null && v !== '') return v
    }

    return args[args.length - 1]
  },
}

export function registerExpressionFunction(name: string, fn: ExprFn): void {
  builtins[name] = fn
}

type TokenKind = 'number' | 'string' | 'ident' | 'punct' | 'eof'

interface Token {
  kind: TokenKind
  value: string
  pos: number
}

const PUNCT_MULTI = ['===', '!==', '==', '!=', '<=', '>=', '&&', '||', '??']

function tokenize(src: string): Array<Token> {
  const out: Array<Token> = []
  let i = 0

  while (i < src.length) {
    const ch = src[i]

    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      i++
      continue
    }

    if (
      /[0-9]/.test(ch ?? '') ||
      (ch === '.' && /[0-9]/.test(src[i + 1] ?? ''))
    ) {
      let j = i

      while (j < src.length && /[0-9.]/.test(src[j] ?? '')) j++
      out.push({ kind: 'number', value: src.slice(i, j), pos: i })
      i = j
      continue
    }

    if (ch === "'" || ch === '"') {
      const quote = ch
      let j = i + 1
      let str = ''

      while (j < src.length && src[j] !== quote) {
        if (src[j] === '\\' && j + 1 < src.length) {
          str += src[j + 1]
          j += 2
        } else {
          str += src[j]
          j++
        }
      }
      out.push({ kind: 'string', value: str, pos: i })
      i = j + 1
      continue
    }

    if (/[$A-Za-z_]/.test(ch ?? '')) {
      let j = i

      while (j < src.length && /[$A-Za-z0-9_]/.test(src[j] ?? '')) j++
      out.push({ kind: 'ident', value: src.slice(i, j), pos: i })
      i = j
      continue
    }

    let matched = false

    for (const p of PUNCT_MULTI) {
      if (src.startsWith(p, i)) {
        out.push({ kind: 'punct', value: p, pos: i })
        i += p.length
        matched = true
        break
      }
    }

    if (matched) continue

    if ('.[](){},+-*/%<>!?:'.includes(ch ?? '')) {
      out.push({ kind: 'punct', value: ch ?? '', pos: i })
      i++
      continue
    }

    i++
  }

  out.push({ kind: 'eof', value: '', pos: src.length })

  return out
}

class Parser {
  private tokens: Array<Token>

  private pos = 0

  constructor(tokens: Array<Token>) {
    this.tokens = tokens
  }

  private peek(offset = 0): Token {
    return this.tokens[this.pos + offset] ?? { kind: 'eof', value: '', pos: 0 }
  }

  private consume(): Token {
    const t = this.tokens[this.pos] ?? { kind: 'eof', value: '', pos: 0 }

    this.pos++

    return t
  }

  private expect(value: string): Token {
    const t = this.consume()

    if (t.kind !== 'punct' || t.value !== value) {
      throw new Error(`Expected "${value}", got "${t.value}"`)
    }

    return t
  }

  parse(scope: ExpressionScope): ExprValue {
    return this.parseTernary(scope)
  }

  private parseTernary(scope: ExpressionScope): ExprValue {
    const cond = this.parseLogicalOr(scope)

    if (this.peek().value === '?') {
      this.consume()
      const a = this.parseTernary(scope)

      this.expect(':')
      const b = this.parseTernary(scope)

      return cond ? a : b
    }

    return cond
  }

  private parseLogicalOr(scope: ExpressionScope): ExprValue {
    let left = this.parseLogicalAnd(scope)

    while (this.peek().value === '||' || this.peek().value === '??') {
      const op = this.consume().value
      const right = this.parseLogicalAnd(scope)

      if (op === '||') left = (left || right) as ExprValue
      else left = (left ?? right) as ExprValue
    }

    return left
  }

  private parseLogicalAnd(scope: ExpressionScope): ExprValue {
    let left = this.parseEquality(scope)

    while (this.peek().value === '&&') {
      this.consume()
      const right = this.parseEquality(scope)

      left = (left && right) as ExprValue
    }

    return left
  }

  private parseEquality(scope: ExpressionScope): ExprValue {
    let left = this.parseComparison(scope)

    while (['==', '===', '!=', '!=='].includes(this.peek().value)) {
      const op = this.consume().value
      const right = this.parseComparison(scope)

      if (op === '==' || op === '===') left = left === right
      else left = left !== right
    }

    return left
  }

  private parseComparison(scope: ExpressionScope): ExprValue {
    let left = this.parseAdd(scope)

    while (['<', '>', '<=', '>='].includes(this.peek().value)) {
      const op = this.consume().value
      const right = this.parseAdd(scope)
      const l = Number(left)
      const r = Number(right)

      if (op === '<') left = l < r
      else if (op === '>') left = l > r
      else if (op === '<=') left = l <= r
      else left = l >= r
    }

    return left
  }

  private parseAdd(scope: ExpressionScope): ExprValue {
    let left = this.parseMul(scope)

    while (this.peek().value === '+' || this.peek().value === '-') {
      const op = this.consume().value
      const right = this.parseMul(scope)

      if (op === '+') {
        if (typeof left === 'string' || typeof right === 'string') {
          left = String(left ?? '') + String(right ?? '')
        } else {
          left = Number(left) + Number(right)
        }
      } else {
        left = Number(left) - Number(right)
      }
    }

    return left
  }

  private parseMul(scope: ExpressionScope): ExprValue {
    let left = this.parseUnary(scope)

    while (['*', '/', '%'].includes(this.peek().value)) {
      const op = this.consume().value
      const right = this.parseUnary(scope)
      const l = Number(left)
      const r = Number(right)

      if (op === '*') left = l * r
      else if (op === '/') left = l / r
      else left = l % r
    }

    return left
  }

  private parseUnary(scope: ExpressionScope): ExprValue {
    if (this.peek().value === '!') {
      this.consume()

      return !this.parseUnary(scope)
    }

    if (this.peek().value === '-') {
      this.consume()

      return -Number(this.parseUnary(scope))
    }

    return this.parsePostfix(scope)
  }

  private parsePostfix(scope: ExpressionScope): ExprValue {
    let value = this.parsePrimary(scope)

    while (true) {
      const next = this.peek()

      if (next.value === '.') {
        this.consume()
        const member = this.consume()

        if (member.kind !== 'ident')
          throw new Error(
            `Expected identifier after '.', got "${member.value}"`,
          )
        value = readMember(value, member.value)
        continue
      }

      if (next.value === '[') {
        this.consume()
        const key = this.parseTernary(scope)

        this.expect(']')
        value = readMember(value, key)
        continue
      }

      break
    }

    return value
  }

  private parsePrimary(scope: ExpressionScope): ExprValue {
    const t = this.peek()

    if (t.kind === 'number') {
      this.consume()

      return Number(t.value)
    }

    if (t.kind === 'string') {
      this.consume()

      return t.value
    }

    if (t.value === '(') {
      this.consume()
      const v = this.parseTernary(scope)

      this.expect(')')

      return v
    }

    if (t.kind === 'ident') {
      this.consume()

      if (this.peek().value === '(') {
        this.consume()
        const args: Array<ExprValue> = []

        if (this.peek().value !== ')') {
          args.push(this.parseTernary(scope))
          while (this.peek().value === ',') {
            this.consume()
            args.push(this.parseTernary(scope))
          }
        }

        this.expect(')')

        const fn = builtins[t.value]

        if (!fn) {
          throw new Error(`Unknown function: ${t.value}`)
        }

        return fn(...args)
      }

      if (t.value === 'true') return true
      if (t.value === 'false') return false
      if (t.value === 'null') return null
      if (t.value === 'undefined') return undefined

      if (t.value === '$root') return scope.root
      if (t.value === '$data') return scope.data
      if (t.value === '$index') return scope.index ?? 0

      return readMember(scope.data, t.value)
    }

    return undefined
  }
}

function readMember(value: ExprValue, key: ExprValue): ExprValue {
  if (value == null) return undefined
  const k = typeof key === 'number' ? key : String(key)

  return (value as Record<string | number, ExprValue>)[k as string]
}

export function evaluateExpression(
  expr: string,
  scope: ExpressionScope,
): ExprValue {
  try {
    const tokens = tokenize(expr)
    const parser = new Parser(tokens)

    return parser.parse(scope)
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[AdaptiveCard] Expression error in "${expr}":`, error)
    }

    return undefined
  }
}

const INTERP_RE = /\$\{([^}]+)\}/g

export function interpolateString(
  input: string,
  scope: ExpressionScope,
): string {
  /*
   * Single-expression form: entire string is one `${expr}` — return the
   * evaluated value (possibly non-string) so callers can decide what to do.
   * Used by template expander to pipe arrays / booleans into $data / $when.
   */
  const single = input.match(/^\$\{([^}]+)\}$/)

  if (single) {
    const v = evaluateExpression(single[1] ?? '', scope)

    return v == null ? '' : String(v)
  }

  return input.replace(INTERP_RE, (_match, expr: string) => {
    const v = evaluateExpression(expr, scope)

    return v == null ? '' : String(v)
  })
}

export function evaluateMaybeExpression(
  input: string,
  scope: ExpressionScope,
): ExprValue {
  const single = input.match(/^\$\{([^}]+)\}$/)

  if (single) return evaluateExpression(single[1] ?? '', scope)

  return interpolateString(input, scope)
}
