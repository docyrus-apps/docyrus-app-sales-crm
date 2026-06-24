// @ts-nocheck
/* eslint-disable */
import jsonata from 'jsonata'

import {
  autocompletion,
  type Completion,
  type CompletionContext,
  type CompletionResult,
  snippetCompletion,
} from '@codemirror/autocomplete'
import {
  LanguageSupport,
  StreamLanguage,
  type StringStream,
} from '@codemirror/language'
import { linter, type Diagnostic } from '@codemirror/lint'
import { Facet, type Extension } from '@codemirror/state'
import { EditorView, hoverTooltip } from '@codemirror/view'
import { tags as t } from '@lezer/highlight'

import {
  type ContextPath,
  type ContextPathInput,
  normalizeContextPaths,
} from '@/lib/docyrus/context-paths'

import { type JsonataFunction } from '../jsonata-editor-types'
import {
  JSONATA_FUNCTION_MAP,
  JSONATA_FUNCTION_NAMES,
  JSONATA_FUNCTIONS,
} from '../jsonata-functions'

const contextPathsFacet: Facet<ContextPath[], ContextPath[]> = Facet.define<
  ContextPath[],
  ContextPath[]
>({
  combine: (values) => values.flat(),
})

/*
 * ────────────────────────────────────────────────────────────
 * Stream tokenizer
 * ────────────────────────────────────────────────────────────
 */

interface JsonataStreamState {
  /** A block comment is open and spanning lines. */
  inComment: boolean
  /** Whether a `/` at the cursor should begin a regex literal. */
  regexAllowed: boolean
}

const FLOW_KEYWORDS = new Set(['function', 'and', 'or', 'in'])

function isDigit(ch: string): boolean {
  return ch >= '0' && ch <= '9'
}

/** Consumes a quoted string body (the opening quote is still at the cursor). */
function consumeQuoted(stream: StringStream, quote: string): void {
  stream.next()

  let escaped = false
  let ch: string | void

  while ((ch = stream.next()) != null) {
    if (ch === quote && !escaped) break
    escaped = ch === '\\' && !escaped
  }
}

function tokenizeJsonata(
  stream: StringStream,
  state: JsonataStreamState,
): string | null {
  if (state.inComment) {
    if (stream.skipTo('*/')) {
      stream.match('*/')
      state.inComment = false
    } else {
      stream.skipToEnd()
    }

    return 'comment'
  }

  if (stream.eatSpace()) return null

  if (stream.match('/*')) {
    if (stream.skipTo('*/')) {
      stream.match('*/')
    } else {
      stream.skipToEnd()
      state.inComment = true
    }

    return 'comment'
  }

  const ch = stream.peek()

  if (ch == null) return null

  if (ch === '"' || ch === "'") {
    consumeQuoted(stream, ch)
    state.regexAllowed = false

    return 'string'
  }

  if (ch === '`') {
    consumeQuoted(stream, '`')
    state.regexAllowed = false

    return 'property'
  }

  if (ch === '/' && state.regexAllowed) {
    stream.next()

    let escaped = false
    let c: string | void

    while ((c = stream.next()) != null) {
      if (c === '/' && !escaped) break
      escaped = c === '\\' && !escaped
    }

    stream.match(/^[a-z]*/)
    state.regexAllowed = false

    return 'regexp'
  }

  if (ch === '$') {
    stream.next()

    if (stream.peek() === '$') stream.next()

    const name = stream.match(/^[A-Za-z_][A-Za-z0-9_]*/)

    state.regexAllowed = false

    if (Array.isArray(name) && JSONATA_FUNCTION_NAMES.has(`$${name[0]}`)) {
      return 'function'
    }

    return 'variable'
  }

  if (isDigit(ch)) {
    stream.match(/^\d+\.?\d*([eE][+-]?\d+)?/)
    state.regexAllowed = false

    return 'number'
  }

  if (ch === '.' && isDigit(stream.string.charAt(stream.pos + 1))) {
    stream.match(/^\.\d+([eE][+-]?\d+)?/)
    state.regexAllowed = false

    return 'number'
  }

  if (/[A-Za-z_]/.test(ch)) {
    const word = stream.match(/^[A-Za-z_][A-Za-z0-9_]*/)

    state.regexAllowed = false

    if (!Array.isArray(word)) {
      stream.next()

      return null
    }

    const text = word[0]

    if (text === 'true' || text === 'false') return 'boolean'
    if (text === 'null') return 'null'

    if (FLOW_KEYWORDS.has(text)) {
      state.regexAllowed = true

      return 'keyword'
    }

    return 'property'
  }

  if (
    stream.match(':=') ||
    stream.match('~>') ||
    stream.match('!=') ||
    stream.match('<=') ||
    stream.match('>=') ||
    stream.match('..')
  ) {
    state.regexAllowed = true

    return 'operator'
  }

  const op = stream.next()

  if (op == null) return null

  if (op === ')' || op === ']' || op === '}') {
    state.regexAllowed = false

    return null
  }

  if ('([{,;.:'.includes(op)) {
    state.regexAllowed = true

    return null
  }

  if ('+-*/%&|=<>?!@#^'.includes(op)) {
    state.regexAllowed = true

    return 'operator'
  }

  state.regexAllowed = false

  return null
}

const jsonataStreamLanguage = StreamLanguage.define<JsonataStreamState>({
  name: 'jsonata',
  startState: () => ({ inComment: false, regexAllowed: true }),
  token: tokenizeJsonata,
  languageData: {
    commentTokens: { block: { open: '/*', close: '*/' } },
    closeBrackets: { brackets: ['(', '[', '{', '"', "'", '`'] },
  },
  tokenTable: {
    comment: t.comment,
    string: t.string,
    number: t.number,
    regexp: t.regexp,
    keyword: t.keyword,
    boolean: t.bool,
    null: t.null,
    function: t.function(t.variableName),
    variable: t.variableName,
    property: t.propertyName,
    operator: t.operator,
  },
})

/*
 * ────────────────────────────────────────────────────────────
 * Hover & completion tooltips
 * ────────────────────────────────────────────────────────────
 */

/** Builds the rich DOM tooltip shown for a built-in function. */
function renderFunctionTooltip(fn: JsonataFunction): HTMLElement {
  const dom = document.createElement('div')

  dom.className = 'cm-jsonata-tooltip'

  const signature = document.createElement('div')

  signature.className = 'cm-jsonata-tooltip-signature'
  signature.textContent = fn.signature
  dom.appendChild(signature)

  const description = document.createElement('div')

  description.className = 'cm-jsonata-tooltip-desc'
  description.textContent = fn.description
  dom.appendChild(description)

  if (fn.params.length > 0) {
    const params = document.createElement('div')

    params.className = 'cm-jsonata-tooltip-params'

    for (const param of fn.params) {
      const row = document.createElement('div')

      const name = document.createElement('span')

      name.className = 'cm-jsonata-tooltip-param-name'
      name.textContent = param.optional ? `${param.name}?` : param.name
      row.appendChild(name)

      const type = document.createElement('span')

      type.className = 'cm-jsonata-tooltip-param-type'
      type.textContent = ` ${param.type}`
      row.appendChild(type)

      const desc = document.createElement('span')

      desc.className = 'cm-jsonata-tooltip-param-desc'
      desc.textContent = ` — ${param.description}`
      row.appendChild(desc)

      params.appendChild(row)
    }

    dom.appendChild(params)
  }

  const returns = document.createElement('div')

  returns.className = 'cm-jsonata-tooltip-returns'
  returns.textContent = `Returns: ${fn.returns}`
  dom.appendChild(returns)

  if (fn.examples && fn.examples.length > 0) {
    const example = document.createElement('pre')

    example.className = 'cm-jsonata-tooltip-example'
    example.textContent = fn.examples.join('\n')
    dom.appendChild(example)
  }

  return dom
}

/** Builds the side-panel tooltip shown for a schema-derived context path. */
function renderPathTooltip(path: ContextPath): HTMLElement {
  const dom = document.createElement('div')

  dom.className = 'cm-jsonata-tooltip'

  const signature = document.createElement('div')

  signature.className = 'cm-jsonata-tooltip-signature'
  signature.textContent = path.label
    ? `${path.path} — ${path.label}`
    : path.path
  dom.appendChild(signature)

  if (path.type) {
    const type = document.createElement('div')

    type.className = 'cm-jsonata-tooltip-returns'
    type.textContent = `Type: ${path.type}`
    dom.appendChild(type)
  }

  if (path.description) {
    const description = document.createElement('div')

    description.className = 'cm-jsonata-tooltip-desc'
    description.textContent = path.description
    dom.appendChild(description)
  }

  return dom
}

const jsonataHoverTooltip = hoverTooltip((view, pos) => {
  const line = view.state.doc.lineAt(pos)
  const offset = pos - line.from

  for (const match of line.text.matchAll(/\$[A-Za-z_][A-Za-z0-9_]*/g)) {
    const start = match.index ?? 0
    const end = start + match[0].length

    if (offset < start || offset > end) continue

    const fn = JSONATA_FUNCTION_MAP.get(match[0])

    if (!fn) return null

    return {
      pos: line.from + start,
      end: line.from + end,
      above: true,
      create: () => ({ dom: renderFunctionTooltip(fn) }),
    }
  }

  return null
})

/*
 * ────────────────────────────────────────────────────────────
 * Autocomplete
 * ────────────────────────────────────────────────────────────
 */

/** Produces a snippet template covering the required parameters. */
function buildFunctionSnippet(fn: JsonataFunction): string {
  const required = fn.params.filter((param) => !param.optional)

  if (required.length === 0) return `${fn.name}()`

  return `${fn.name}(${required.map((param) => `\${${param.name}}`).join(', ')})`
}

const KEYWORD_COMPLETIONS: Completion[] = [
  'true',
  'false',
  'null',
  'and',
  'or',
  'in',
].map((keyword) => ({
  label: keyword,
  type: 'keyword',
  section: 'Keywords',
}))

const SNIPPET_COMPLETIONS: Completion[] = [
  snippetCompletion('function($${param}) { ${body} }', {
    label: 'function',
    type: 'keyword',
    detail: 'lambda expression',
    section: 'Keywords',
  }),
]

function jsonataCompletionSource(
  context: CompletionContext,
): CompletionResult | null {
  const word = context.matchBefore(/\$?[A-Za-z0-9_.]*/)

  if (!word) return null
  if (word.from === word.to && !context.explicit) return null

  const wantsVariable = word.text.startsWith('$')
  const contextPaths = context.state.facet(contextPathsFacet)

  const functionOptions: Completion[] = JSONATA_FUNCTIONS.map((fn) =>
    snippetCompletion(buildFunctionSnippet(fn), {
      label: fn.name,
      type: 'function',
      detail: fn.returns,
      section: fn.category,
      info: () => renderFunctionTooltip(fn),
    }),
  )

  /*
   * Context paths only make sense when the user is typing a bare identifier
   * (e.g. `customer.name`). When the prefix starts with `$`, the user is
   * referencing a JSONata variable / function and dotted paths would be
   * invalid completions there.
   */
  let pathOptions: Completion[] = []

  if (!wantsVariable && contextPaths.length > 0) {
    pathOptions = contextPaths.map((path) => {
      const completion: Completion = {
        label: path.path,
        type: 'variable',
        section: 'Context',
      }

      if (path.type) completion.detail = path.type
      if (path.description ?? path.label)
        completion.info = () => renderPathTooltip(path)

      return completion
    })
  }

  return {
    from: word.from,
    options: [
      ...pathOptions,
      ...functionOptions,
      ...SNIPPET_COMPLETIONS,
      ...KEYWORD_COMPLETIONS,
    ],
    validFor: /^\$?[A-Za-z0-9_.]*$/,
  }
}

/*
 * ────────────────────────────────────────────────────────────
 * Linter
 * ────────────────────────────────────────────────────────────
 */

const jsonataParseLinter = linter(
  (view): Diagnostic[] => {
    const text = view.state.doc.toString()

    if (!text.trim()) return []

    try {
      jsonata(text)

      return []
    } catch (err) {
      const detail = (err ?? {}) as {
        message?: string
        position?: number
        token?: unknown
      }
      const { length } = view.state.doc
      const position =
        typeof detail.position === 'number'
          ? Math.min(Math.max(detail.position, 0), length)
          : length
      const tokenLength = detail.token != null ? String(detail.token).length : 1
      const from = Math.max(0, position - tokenLength)
      const to = Math.min(Math.max(from + 1, position), length)

      return [
        {
          from,
          to,
          severity: 'error',
          message: detail.message ?? 'Invalid JSONata expression',
        },
      ]
    }
  },
  { delay: 350 },
)

/*
 * ────────────────────────────────────────────────────────────
 * Tooltip theme
 * ────────────────────────────────────────────────────────────
 */

const jsonataTooltipTheme = EditorView.baseTheme({
  '.cm-jsonata-tooltip': {
    padding: '8px 10px',
    maxWidth: '360px',
    lineHeight: '1.5',
  },
  '.cm-jsonata-tooltip-signature': {
    fontFamily: 'monospace',
    fontWeight: '600',
    fontSize: '12px',
    marginBottom: '4px',
  },
  '.cm-jsonata-tooltip-desc': {
    fontSize: '12px',
    marginBottom: '6px',
  },
  '.cm-jsonata-tooltip-params': {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    fontSize: '11px',
    marginBottom: '6px',
  },
  '.cm-jsonata-tooltip-param-name': {
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  '.cm-jsonata-tooltip-param-type': {
    fontFamily: 'monospace',
    opacity: '0.7',
  },
  '.cm-jsonata-tooltip-param-desc': {
    opacity: '0.8',
  },
  '.cm-jsonata-tooltip-returns': {
    fontSize: '11px',
    opacity: '0.7',
    marginBottom: '4px',
  },
  '.cm-jsonata-tooltip-example': {
    margin: '0',
    padding: '4px 6px',
    fontFamily: 'monospace',
    fontSize: '11px',
    borderRadius: '4px',
    background: 'rgba(127, 127, 127, 0.15)',
    whiteSpace: 'pre-wrap',
  },
})

/*
 * ────────────────────────────────────────────────────────────
 * Public API
 * ────────────────────────────────────────────────────────────
 */

/** CodeMirror `LanguageSupport` for JSONata (highlighting + autocomplete). */
export function jsonataLanguage(): LanguageSupport {
  return new LanguageSupport(jsonataStreamLanguage, [
    jsonataStreamLanguage.data.of({ autocomplete: jsonataCompletionSource }),
  ])
}

/** Options for {@link jsonataExtensions}. */
export interface JsonataExtensionOptions {
  /** Include the parse-error linter (inline squiggles). Default `true`. */
  lint?: boolean
  /** Include hover tooltips for built-in functions. Default `true`. */
  hover?: boolean
  /**
   * Suggest these context paths in autocomplete (e.g. extracted from input or
   * derived from a JSON Schema). Accepts bare dotted-path strings or rich
   * {@link ContextPath} descriptors carrying a `type` / `description`.
   */
  contextPaths?: ContextPathInput[]
}

/**
 * Full CodeMirror extension bundle for editing JSONata: language support,
 * autocomplete, hover docs and (optionally) inline parse-error linting.
 */
export function jsonataExtensions(
  options: JsonataExtensionOptions = {},
): Extension[] {
  const { lint = true, hover = true, contextPaths } = options

  const extensions: Extension[] = [
    jsonataLanguage(),
    autocompletion(),
    jsonataTooltipTheme,
  ]
  const normalizedPaths = normalizeContextPaths(contextPaths)

  if (normalizedPaths.length > 0)
    extensions.push(contextPathsFacet.of(normalizedPaths))
  if (hover) extensions.push(jsonataHoverTooltip)
  if (lint) extensions.push(jsonataParseLinter)

  return extensions
}
