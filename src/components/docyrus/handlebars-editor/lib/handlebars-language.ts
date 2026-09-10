// @ts-nocheck
/* eslint-disable */
import Handlebars from 'handlebars'

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

import { type HandlebarsHelper } from '../handlebars-editor-types'
import {
  HANDLEBARS_BLOCK_HELPERS,
  HANDLEBARS_DATA_VARIABLES,
  HANDLEBARS_HELPER_MAP,
  HANDLEBARS_HELPERS,
  HANDLEBARS_KEYWORDS,
} from '../handlebars-helpers'

const extraHelperNamesFacet: Facet<string[], string[]> = Facet.define<
  string[],
  string[]
>({
  combine: (values) => values.flat(),
})

const contextPathsFacet: Facet<ContextPath[], ContextPath[]> = Facet.define<
  ContextPath[],
  ContextPath[]
>({
  combine: (values) => values.flat(),
})

type MustacheKind =
  | 'none'
  | 'expression'
  | 'unescaped'
  | 'comment'
  | 'commentBlock'

interface HandlebarsStreamState {
  mode: MustacheKind
  expectHelper: boolean
}

function isDigit(ch: string): boolean {
  return ch >= '0' && ch <= '9'
}

function consumeQuoted(stream: StringStream, quote: string): void {
  stream.next()

  let escaped = false
  let ch: string | void

  while ((ch = stream.next()) != null) {
    if (ch === quote && !escaped) break
    escaped = ch === '\\' && !escaped
  }
}

function tokenizeOutsideMustache(
  stream: StringStream,
  state: HandlebarsStreamState,
): string | null {
  if (stream.match('{{!--')) {
    state.mode = 'commentBlock'

    return 'comment'
  }

  if (stream.match('{{!')) {
    state.mode = 'comment'

    return 'comment'
  }

  if (stream.match('{{{')) {
    state.mode = 'unescaped'
    state.expectHelper = true

    return 'bracket'
  }

  if (stream.match('{{')) {
    state.mode = 'expression'
    state.expectHelper = true

    return 'bracket'
  }

  stream.next()

  return null
}

function tokenizeComment(
  stream: StringStream,
  state: HandlebarsStreamState,
): string {
  if (stream.match('}}')) {
    state.mode = 'none'

    return 'comment'
  }

  stream.next()

  return 'comment'
}

function tokenizeCommentBlock(
  stream: StringStream,
  state: HandlebarsStreamState,
): string {
  if (stream.match('--}}')) {
    state.mode = 'none'

    return 'comment'
  }

  if (stream.skipTo('--}}')) {
    return 'comment'
  }

  stream.skipToEnd()

  return 'comment'
}

function tokenizeInsideMustache(
  stream: StringStream,
  state: HandlebarsStreamState,
): string | null {
  if (state.mode === 'unescaped' && stream.match('}}}')) {
    state.mode = 'none'

    return 'bracket'
  }

  if (stream.match('}}')) {
    state.mode = 'none'

    return 'bracket'
  }

  if (stream.eatSpace()) return null

  const ch = stream.peek()

  if (ch == null) return null

  if (ch === '"' || ch === "'") {
    consumeQuoted(stream, ch)
    state.expectHelper = false

    return 'string'
  }

  if (
    isDigit(ch) ||
    (ch === '-' && isDigit(stream.string.charAt(stream.pos + 1)))
  ) {
    stream.match(/^-?\d+(?:\.\d+)?/)
    state.expectHelper = false

    return 'number'
  }

  if (ch === '#' || ch === '/' || ch === '>' || ch === '^') {
    stream.next()
    state.expectHelper = true

    return 'keyword'
  }

  if (ch === '@') {
    stream.next()
    stream.match(/^[A-Za-z_][A-Za-z0-9_./]*/)
    state.expectHelper = false

    return 'variableName'
  }

  if (ch === '(') {
    stream.next()
    state.expectHelper = true

    return 'bracket'
  }

  if (ch === ')') {
    stream.next()
    state.expectHelper = false

    return 'bracket'
  }

  if (ch === '=' || ch === ',' || ch === '|') {
    stream.next()
    state.expectHelper = false

    return 'operator'
  }

  if (stream.match('../')) {
    state.expectHelper = false

    return 'variableName'
  }

  if (/[A-Za-z_]/.test(ch)) {
    const match = stream.match(/^[A-Za-z_][A-Za-z0-9_\-./]*/)

    if (!Array.isArray(match)) {
      stream.next()

      return null
    }

    const text = match[0]

    if (text === 'true' || text === 'false') {
      state.expectHelper = false

      return 'bool'
    }

    if (text === 'null' || text === 'undefined') {
      state.expectHelper = false

      return 'null'
    }

    if (HANDLEBARS_KEYWORDS.includes(text)) {
      state.expectHelper = false

      return 'keyword'
    }

    if (state.expectHelper) {
      state.expectHelper = false

      return 'function'
    }

    return 'propertyName'
  }

  stream.next()

  return null
}

function tokenizeHandlebars(
  stream: StringStream,
  state: HandlebarsStreamState,
): string | null {
  if (state.mode === 'none') return tokenizeOutsideMustache(stream, state)
  if (state.mode === 'comment') return tokenizeComment(stream, state)
  if (state.mode === 'commentBlock') return tokenizeCommentBlock(stream, state)

  return tokenizeInsideMustache(stream, state)
}

const handlebarsStreamLanguage = StreamLanguage.define<HandlebarsStreamState>({
  name: 'handlebars',
  startState: () => ({ mode: 'none', expectHelper: false }),
  token: tokenizeHandlebars,
  languageData: {
    commentTokens: { block: { open: '{{!--', close: '--}}' } },
    closeBrackets: { brackets: ['(', '[', '{', '"', "'"] },
  },
  tokenTable: {
    comment: t.comment,
    string: t.string,
    number: t.number,
    keyword: t.keyword,
    bool: t.bool,
    null: t.null,
    function: t.function(t.variableName),
    variableName: t.variableName,
    propertyName: t.propertyName,
    operator: t.operator,
    bracket: t.bracket,
  },
})

function renderHelperTooltip(helper: HandlebarsHelper): HTMLElement {
  const dom = document.createElement('div')

  dom.className = 'cm-handlebars-tooltip'

  const signature = document.createElement('div')

  signature.className = 'cm-handlebars-tooltip-signature'
  signature.textContent = helper.signature
  dom.appendChild(signature)

  const description = document.createElement('div')

  description.className = 'cm-handlebars-tooltip-desc'
  description.textContent = helper.description
  dom.appendChild(description)

  if (helper.params.length > 0) {
    const params = document.createElement('div')

    params.className = 'cm-handlebars-tooltip-params'

    for (const param of helper.params) {
      const row = document.createElement('div')

      const name = document.createElement('span')

      name.className = 'cm-handlebars-tooltip-param-name'
      name.textContent = param.optional ? `${param.name}?` : param.name
      row.appendChild(name)

      const type = document.createElement('span')

      type.className = 'cm-handlebars-tooltip-param-type'
      type.textContent = ` ${param.type}`
      row.appendChild(type)

      const desc = document.createElement('span')

      desc.className = 'cm-handlebars-tooltip-param-desc'
      desc.textContent = ` — ${param.description}`
      row.appendChild(desc)

      params.appendChild(row)
    }

    dom.appendChild(params)
  }

  const returns = document.createElement('div')

  returns.className = 'cm-handlebars-tooltip-returns'
  returns.textContent = `Returns: ${helper.returns}`
  dom.appendChild(returns)

  if (helper.examples && helper.examples.length > 0) {
    const example = document.createElement('pre')

    example.className = 'cm-handlebars-tooltip-example'
    example.textContent = helper.examples.join('\n')
    dom.appendChild(example)
  }

  return dom
}

/** Builds the side-panel tooltip shown for a schema-derived context path. */
function renderPathTooltip(path: ContextPath): HTMLElement {
  const dom = document.createElement('div')

  dom.className = 'cm-handlebars-tooltip'

  const signature = document.createElement('div')

  signature.className = 'cm-handlebars-tooltip-signature'
  signature.textContent = path.label
    ? `${path.path} — ${path.label}`
    : path.path
  dom.appendChild(signature)

  if (path.type) {
    const type = document.createElement('div')

    type.className = 'cm-handlebars-tooltip-returns'
    type.textContent = `Type: ${path.type}`
    dom.appendChild(type)
  }

  if (path.description) {
    const description = document.createElement('div')

    description.className = 'cm-handlebars-tooltip-desc'
    description.textContent = path.description
    dom.appendChild(description)
  }

  return dom
}

const handlebarsHoverTooltip = hoverTooltip((view, pos) => {
  const line = view.state.doc.lineAt(pos)
  const offset = pos - line.from

  for (const match of line.text.matchAll(/[#/]?([A-Za-z_][A-Za-z0-9_]*)/g)) {
    const start = match.index ?? 0
    const end = start + match[0].length

    if (offset < start || offset > end) continue

    const name = match[1]

    if (!name) continue

    const helper = HANDLEBARS_HELPER_MAP.get(name)

    if (!helper) continue

    return {
      pos: line.from + start,
      end: line.from + end,
      above: true,
      create: () => ({ dom: renderHelperTooltip(helper) }),
    }
  }

  return null
})

function buildHelperSnippet(helper: HandlebarsHelper): string {
  if (helper.block) {
    return `#${helper.name} \${arg}}}\${body}{{/${helper.name}`
  }

  const required = helper.params.filter((param) => !param.optional)

  if (required.length === 0) return helper.name

  return `${helper.name} ${required.map((param) => `\${${param.name}}`).join(' ')}`
}

const KEYWORD_COMPLETIONS: Completion[] = HANDLEBARS_KEYWORDS.map(
  (keyword) => ({
    label: keyword,
    type: 'keyword',
    section: 'Keywords',
  }),
)

const DATA_VARIABLE_COMPLETIONS: Completion[] = HANDLEBARS_DATA_VARIABLES.map(
  (name) => ({
    label: name,
    type: 'variable',
    detail: '@data variable',
    section: 'Data',
  }),
)

function findMustacheContext(
  text: string,
  pos: number,
): { from: number; inside: boolean } | null {
  const open = Math.max(
    text.lastIndexOf('{{', pos - 1),
    text.lastIndexOf('{{{', pos - 1),
  )

  if (open < 0) return { from: 0, inside: false }

  const closeBefore = text.lastIndexOf('}}', pos - 1)

  if (closeBefore > open) return { from: 0, inside: false }

  return { from: open, inside: true }
}

function handlebarsCompletionSource(
  context: CompletionContext,
): CompletionResult | null {
  const text = context.state.doc.toString()
  const mustache = findMustacheContext(text, context.pos)

  if (!mustache?.inside) return null

  const word = context.matchBefore(/[#/>^@A-Za-z0-9_./-]*/)

  if (!word) return null
  if (word.from === word.to && !context.explicit) return null

  const extraHelperNames = context.state.facet(extraHelperNamesFacet)
  const contextPaths = context.state.facet(contextPathsFacet)

  const helperOptions: Completion[] = HANDLEBARS_HELPERS.map((helper) =>
    snippetCompletion(buildHelperSnippet(helper), {
      label: helper.name,
      type: helper.block ? 'class' : 'function',
      detail: helper.returns,
      section: helper.category,
      info: () => renderHelperTooltip(helper),
    }),
  )

  const extraHelperOptions: Completion[] = extraHelperNames
    .filter((name) => !HANDLEBARS_HELPER_MAP.has(name))
    .map((name) => ({
      label: name,
      type: 'function',
      detail: 'custom helper',
      section: 'Custom',
    }))

  const pathOptions: Completion[] = contextPaths.map((path) => {
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

  return {
    from: word.from,
    options: [
      ...helperOptions,
      ...extraHelperOptions,
      ...pathOptions,
      ...DATA_VARIABLE_COMPLETIONS,
      ...KEYWORD_COMPLETIONS,
    ],
    validFor: /^[#/>^@A-Za-z0-9_./-]*$/,
  }
}

interface HandlebarsParseError {
  message?: string
  hash?: { line?: number; column?: number }
  lineNumber?: number
  column?: number
}

function positionFromLineColumn(
  text: string,
  line: number | undefined,
  column: number | undefined,
): number {
  if (typeof line !== 'number') return 0

  let offset = 0
  let currentLine = 1

  for (let i = 0; i < text.length; i++) {
    if (currentLine === line) {
      return offset + (column ?? 0)
    }

    if (text.charCodeAt(i) === 10) {
      currentLine += 1
      offset = i + 1
    }
  }

  return text.length
}

const handlebarsParseLinter = linter(
  (view): Diagnostic[] => {
    const text = view.state.doc.toString()

    if (!text.trim()) return []

    try {
      Handlebars.precompile(text, { strict: false })

      return []
    } catch (err) {
      const detail = (err ?? {}) as HandlebarsParseError
      const line = detail.hash?.line ?? detail.lineNumber
      const column = detail.hash?.column ?? detail.column
      const { length } = view.state.doc
      const from = Math.min(
        Math.max(positionFromLineColumn(text, line, column), 0),
        length,
      )
      const to = Math.min(from + 1, length)

      return [
        {
          from,
          to,
          severity: 'error',
          message: detail.message ?? 'Invalid Handlebars template',
        },
      ]
    }
  },
  { delay: 350 },
)

const handlebarsBlockLinter = linter(
  (view): Diagnostic[] => {
    const text = view.state.doc.toString()
    const stack: { name: string; from: number; to: number }[] = []
    const diagnostics: Diagnostic[] = []

    const blockOpenRegex = /\{\{#([A-Za-z_][A-Za-z0-9_-]*)/g
    const blockCloseRegex = /\{\{\/([A-Za-z_][A-Za-z0-9_-]*)\s*\}\}/g
    const tokens: {
      kind: 'open' | 'close'
      name: string
      from: number
      to: number
    }[] = []

    let match: RegExpExecArray | null

    while ((match = blockOpenRegex.exec(text)) != null) {
      const name = match[1]

      if (!name) continue

      tokens.push({
        kind: 'open',
        name,
        from: match.index,
        to: match.index + match[0].length,
      })
    }

    while ((match = blockCloseRegex.exec(text)) != null) {
      const name = match[1]

      if (!name) continue

      tokens.push({
        kind: 'close',
        name,
        from: match.index,
        to: match.index + match[0].length,
      })
    }

    tokens.sort((a, b) => a.from - b.from)

    for (const token of tokens) {
      if (token.kind === 'open') {
        stack.push({ name: token.name, from: token.from, to: token.to })

        continue
      }

      const last = stack.pop()

      if (!last || last.name !== token.name) {
        diagnostics.push({
          from: token.from,
          to: token.to,
          severity: 'error',
          message: last
            ? `Closing tag {{/${token.name}}} does not match opening {{#${last.name}}}.`
            : `Closing tag {{/${token.name}}} has no matching opening block.`,
        })
      }
    }

    for (const open of stack) {
      diagnostics.push({
        from: open.from,
        to: open.to,
        severity: 'warning',
        message: `Block {{#${open.name}}} is not closed.`,
      })
    }

    void HANDLEBARS_BLOCK_HELPERS

    return diagnostics
  },
  { delay: 400 },
)

const handlebarsTooltipTheme = EditorView.baseTheme({
  '.cm-handlebars-tooltip': {
    padding: '8px 10px',
    maxWidth: '360px',
    lineHeight: '1.5',
  },
  '.cm-handlebars-tooltip-signature': {
    fontFamily: 'monospace',
    fontWeight: '600',
    fontSize: '12px',
    marginBottom: '4px',
  },
  '.cm-handlebars-tooltip-desc': {
    fontSize: '12px',
    marginBottom: '6px',
  },
  '.cm-handlebars-tooltip-params': {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    fontSize: '11px',
    marginBottom: '6px',
  },
  '.cm-handlebars-tooltip-param-name': {
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  '.cm-handlebars-tooltip-param-type': {
    fontFamily: 'monospace',
    opacity: '0.7',
  },
  '.cm-handlebars-tooltip-param-desc': {
    opacity: '0.8',
  },
  '.cm-handlebars-tooltip-returns': {
    fontSize: '11px',
    opacity: '0.7',
    marginBottom: '4px',
  },
  '.cm-handlebars-tooltip-example': {
    margin: '0',
    padding: '4px 6px',
    fontFamily: 'monospace',
    fontSize: '11px',
    borderRadius: '4px',
    background: 'rgba(127, 127, 127, 0.15)',
    whiteSpace: 'pre-wrap',
  },
})

/** CodeMirror `LanguageSupport` for Handlebars (highlighting + autocomplete). */
export function handlebarsLanguage(): LanguageSupport {
  return new LanguageSupport(handlebarsStreamLanguage, [
    handlebarsStreamLanguage.data.of({
      autocomplete: handlebarsCompletionSource,
    }),
  ])
}

/** Options for {@link handlebarsExtensions}. */
export interface HandlebarsExtensionOptions {
  /** Include the parse-error linter (inline squiggles). Default `true`. */
  lint?: boolean
  /** Include hover tooltips for built-in helpers. Default `true`. */
  hover?: boolean
  /** Extra helper names to surface in autocomplete (in addition to built-ins). */
  helperNames?: string[]
  /**
   * Suggest these context paths in autocomplete (e.g. extracted from input or
   * derived from a JSON Schema). Accepts bare dotted-path strings or rich
   * {@link ContextPath} descriptors carrying a `type` / `description`.
   */
  contextPaths?: ContextPathInput[]
}

/**
 * Full CodeMirror extension bundle for editing Handlebars: language support,
 * autocomplete, hover docs and (optionally) inline parse-error linting.
 */
export function handlebarsExtensions(
  options: HandlebarsExtensionOptions = {},
): Extension[] {
  const { lint = true, hover = true, helperNames, contextPaths } = options

  const extensions: Extension[] = [
    handlebarsLanguage(),
    autocompletion(),
    handlebarsTooltipTheme,
  ]
  const normalizedPaths = normalizeContextPaths(contextPaths)

  if (helperNames && helperNames.length > 0)
    extensions.push(extraHelperNamesFacet.of(helperNames))
  if (normalizedPaths.length > 0)
    extensions.push(contextPathsFacet.of(normalizedPaths))
  if (hover) extensions.push(handlebarsHoverTooltip)
  if (lint) {
    extensions.push(handlebarsParseLinter)
    extensions.push(handlebarsBlockLinter)
  }

  return extensions
}
