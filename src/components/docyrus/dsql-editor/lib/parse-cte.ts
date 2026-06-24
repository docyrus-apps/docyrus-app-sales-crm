// @ts-nocheck
/* eslint-disable */
/**
 * Heuristically extracts the output columns of each CTE in a DSQL query so they
 * can be fed to autocomplete as pseudo-tables. CodeMirror's `@codemirror/lang-sql`
 * resolves table/alias columns from a static schema but has no knowledge of
 * `WITH name AS (SELECT … )` output columns — so `ts.task_count` (a CTE alias)
 * never completes. This parser fills that gap.
 *
 * It is intentionally tolerant (string-literal + paren aware, not a full SQL
 * parser): it finds every `name AS ( … )` definition, isolates the top-level
 * SELECT list of the body, and derives each item's output name from a depth-0
 * `AS <ident>` or the trailing identifier (`t.project` → `project`). Unaliased
 * expressions (e.g. `count(*)`) are skipped. Returns `{ cteName: [columns] }`.
 */
export function parseCteColumns(query: string): Record<string, string[]> {
  const out: Record<string, string[]> = {}

  if (!query) return out

  const defRe = /(?:^|[\s,(])([a-zA-Z_]\w*)\s+as\s*\(/gi
  let match: RegExpExecArray | null

  while ((match = defRe.exec(query)) !== null) {
    const name = match[1]

    if (!name) continue

    const body = balancedBody(query, defRe.lastIndex - 1)

    if (body == null) continue

    const columns = extractSelectOutputs(body)

    if (columns.length > 0) out[name] = columns
  }

  return out
}

function isQuote(ch: string): boolean {
  return ch === "'" || ch === '"'
}

/** Returns the substring inside the parens starting at `openIdx` (the `(`), or null. */
function balancedBody(text: string, openIdx: number): string | null {
  let depth = 0
  let quote: string | null = null

  for (let i = openIdx; i < text.length; i++) {
    const ch = text[i] as string

    if (quote) {
      if (ch === quote) quote = null

      continue
    }

    if (isQuote(ch)) {
      quote = ch

      continue
    }

    if (ch === '(') {
      depth++
    } else if (ch === ')') {
      depth--

      if (depth === 0) return text.slice(openIdx + 1, i)
    }
  }

  return null
}

/** Index of a depth-0, outside-quotes, whole-word keyword (lowercased match), or -1. */
function findKeywordDepth0(text: string, keyword: string, from = 0): number {
  let depth = 0
  let quote: string | null = null
  const isWord = (c: string | undefined) => c !== undefined && /\w/.test(c)

  for (let i = from; i < text.length; i++) {
    const ch = text[i] as string

    if (quote) {
      if (ch === quote) quote = null

      continue
    }

    if (isQuote(ch)) {
      quote = ch

      continue
    }

    if (ch === '(') {
      depth++

      continue
    }

    if (ch === ')') {
      depth--

      continue
    }

    if (
      depth === 0 &&
      text.slice(i, i + keyword.length).toLowerCase() === keyword &&
      !isWord(text[i - 1]) &&
      !isWord(text[i + keyword.length])
    ) {
      return i
    }
  }

  return -1
}

/** Splits on top-level (depth-0, outside quotes) commas. */
function splitTopLevel(text: string): string[] {
  const parts: string[] = []
  let depth = 0
  let quote: string | null = null
  let start = 0

  for (let i = 0; i < text.length; i++) {
    const ch = text[i] as string

    if (quote) {
      if (ch === quote) quote = null

      continue
    }

    if (isQuote(ch)) {
      quote = ch

      continue
    }

    if (ch === '(') {
      depth++
    } else if (ch === ')') {
      depth--
    } else if (ch === ',' && depth === 0) {
      parts.push(text.slice(start, i))
      start = i + 1
    }
  }

  parts.push(text.slice(start))

  return parts
}

/** Pulls output column names from a `SELECT <list> FROM …` body. */
function extractSelectOutputs(body: string): string[] {
  const selectIdx = findKeywordDepth0(body, 'select')

  if (selectIdx < 0) return []

  const listStart = selectIdx + 'select'.length
  const fromIdx = findKeywordDepth0(body, 'from', listStart)
  const list = body.slice(listStart, fromIdx < 0 ? body.length : fromIdx)

  const columns: string[] = []

  for (const item of splitTopLevel(list)) {
    const name = outputName(item)

    if (name) columns.push(name)
  }

  return columns
}

/** Derives a single select item's output column name (alias or trailing identifier). */
function outputName(item: string): string | null {
  const trimmed = item.trim()

  if (!trimmed || trimmed === '*') return null

  const asIdx = findKeywordDepth0(trimmed, 'as')

  if (asIdx >= 0) {
    const after = trimmed
      .slice(asIdx + 'as'.length)
      .trim()
      .replace(/^["']|["']$/g, '')
    const aliasMatch = /^([a-zA-Z_]\w*)/.exec(after)

    if (aliasMatch?.[1]) return aliasMatch[1]
  }

  /*
   * No alias: only accept a plain column reference (`col` or `alias.col`), not an
   * expression. If the item ends in `)` it's an unaliased call/expression — skip.
   */
  if (trimmed.endsWith(')')) return null

  const tailMatch = /([a-zA-Z_]\w*)\s*$/.exec(trimmed)

  return tailMatch?.[1] ?? null
}
