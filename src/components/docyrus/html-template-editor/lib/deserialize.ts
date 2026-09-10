// @ts-nocheck
/* eslint-disable */
/**
 * Pre-processes HTML containing Handlebars markers into valid HTML that
 * Plate's HTML deserializer can understand with custom element rules.
 *
 * {{varname}}         → <span data-hbs="var" data-n="varname"></span>
 * {{#helper expr}}    → <span data-hbs="block_open" data-h="helper" data-e="expr"></span>
 * {{/helper}}         → <span data-hbs="block_close" data-h="helper"></span>
 * {{else}}            → <span data-hbs="else"></span>
 *
 * Variables can be wrapped in inline formatting tags (<strong>, <em>, <u>,
 * <s>, <code>) and those wrappers are preserved by encoding the marks as
 * data-mark-* attributes on the produced span, so the chip can render bold /
 * italic / etc. styling without losing the original HTML semantics.
 *
 * ── Table foster-parenting workaround ─────────────────────────────────────
 * Block markers are first converted to HTML *comments* (e.g.
 * `<!--HBS-OPEN:each:items-->`), not `<span>` elements. Comments are valid
 * children of `<tbody>` / `<thead>` / `<tfoot>` / `<table>` per the HTML
 * parser spec, whereas `<span>` is not — placing a `<span>` directly inside
 * `<tbody>` triggers "foster parenting", moving the span *outside* the
 * surrounding table. The previous span-based preprocessor silently displaced
 * any `{{#each}}…{{/each}}` that wrapped a `<tr>` row, so editing any chip
 * caused the re-serialized template to render an empty table. We swap the
 * comments back to spans *after* the DOM is built, where mutation never
 * re-triggers foster parenting.
 */

const RE_BLOCK_OPEN = /\{\{#(\w+)(?:\s+([^}]*))?\}\}/g
const RE_BLOCK_CLOSE = /\{\{\/(\w+)\}\}/g
const RE_ELSE = /\{\{else\}\}/g
const RE_VARIABLE = /\{\{([^#/!>^{}][^{}]*?)\}\}/

const COMMENT_OPEN_RE = /^HBS-OPEN:(\w+):(.*)$/
const COMMENT_CLOSE_RE = /^HBS-CLOSE:(\w+)$/

const FORMAT_TAG_TO_MARK: Record<string, string> = {
  strong: 'bold',
  b: 'bold',
  em: 'italic',
  i: 'italic',
  u: 'underline',
  s: 'strikethrough',
  strike: 'strikethrough',
  del: 'strikethrough',
  code: 'code',
}

function replaceBlockMarkersWithComments(html: string): string {
  return html
    .replace(
      RE_BLOCK_OPEN,
      (_, helper: string, expr = '') =>
        `<!--HBS-OPEN:${helper}:${encodeURIComponent((expr as string).trim())}-->`,
    )
    .replace(
      RE_BLOCK_CLOSE,
      (_, helper: string) => `<!--HBS-CLOSE:${helper}-->`,
    )
    .replace(RE_ELSE, '<!--HBS-ELSE-->')
}

/**
 * SSR / no-DOM fallback: spans don't get foster-parented at the string level
 * (only at parse time), so this matches the previous behavior. Users running
 * in a real browser go through the comment-then-DOM path instead.
 */
function spanFromBlockMarkers(html: string): string {
  return html
    .replace(
      RE_BLOCK_OPEN,
      (_, helper: string, expr = '') =>
        `<span data-hbs="block_open" data-h="${helper}" data-e="${encodeURIComponent((expr as string).trim())}"></span>`,
    )
    .replace(
      RE_BLOCK_CLOSE,
      (_, helper: string) =>
        `<span data-hbs="block_close" data-h="${helper}"></span>`,
    )
    .replace(RE_ELSE, '<span data-hbs="else"></span>')
}

function variableSpan(name: string, marks: Set<string>): string {
  const markAttrs = Array.from(marks)
    .map((m) => ` data-mark-${m}="1"`)
    .join('')

  return `<span data-hbs="var" data-n="${encodeURIComponent(name.trim())}"${markAttrs}></span>`
}

function blockMarkerSpanFromComment(
  comment: Comment,
  doc: Document,
): Element | null {
  const { data } = comment

  const openMatch = COMMENT_OPEN_RE.exec(data)

  if (openMatch) {
    const span = doc.createElement('span')

    span.setAttribute('data-hbs', 'block_open')
    span.setAttribute('data-h', openMatch[1] ?? '')
    span.setAttribute('data-e', openMatch[2] ?? '')

    return span
  }

  const closeMatch = COMMENT_CLOSE_RE.exec(data)

  if (closeMatch) {
    const span = doc.createElement('span')

    span.setAttribute('data-hbs', 'block_close')
    span.setAttribute('data-h', closeMatch[1] ?? '')

    return span
  }

  if (data === 'HBS-ELSE') {
    const span = doc.createElement('span')

    span.setAttribute('data-hbs', 'else')

    return span
  }

  return null
}

/**
 * Find the nearest ancestor that's NOT a table-section element. Used when a
 * block marker sits between `<tr>` rows (i.e. inside `<tbody>` directly) —
 * in that position the chip can't survive at the slate level because
 * slate's table model only accepts `tr` as a child of `table`. To avoid
 * mangling the table's column layout with synthetic shell rows we lift the
 * chip OUT of the table at preprocessing time and re-inject it during
 * serialization (see `serializeChildren` in `serialize.ts`).
 */
function isInsideTableSection(parent: Node | null): boolean {
  if (!parent || parent.nodeType !== Node.ELEMENT_NODE) return false
  const tag = (parent as Element).tagName?.toLowerCase()

  return (
    tag === 'tbody' || tag === 'thead' || tag === 'tfoot' || tag === 'table'
  )
}

function blockMarkerElementFromComment(
  comment: Comment,
  doc: Document,
): Element | null {
  const span = blockMarkerSpanFromComment(comment, doc)

  if (!span) return null

  if (isInsideTableSection(comment.parentNode)) {
    /*
     * Mark the chip so the serializer can recognize "this chip used to live
     * inside a table" and re-position it during emit even after slate
     * normalization has hoisted it next to (rather than inside) the table.
     */
    span.setAttribute('data-hbs-table-anchored', '1')
  }

  return span
}

/**
 * Hoists table-section-anchored chips out of `<tbody>` / `<thead>` /
 * `<tfoot>` / `<table>` *as DOM siblings of the enclosing table*. Plate's
 * table deserializer would otherwise drop or mis-position them — slate
 * doesn't allow inline-void elements as direct children of `table`. The
 * chips keep their `data-hbs-table-anchored="1"` attribute so the
 * serializer knows to re-inject them back inside the table on emit.
 */
function liftTableAnchoredChipsOutOfTables(container: Element): void {
  const chips = container.querySelectorAll('span[data-hbs-table-anchored="1"]')

  for (const chip of Array.from(chips)) {
    let cursor: Element | null = chip.parentElement
    let table: Element | null = null

    while (cursor) {
      if (cursor.tagName.toLowerCase() === 'table') {
        table = cursor
        break
      }
      cursor = cursor.parentElement
    }
    if (!table || !table.parentNode) continue

    const role = chip.getAttribute('data-hbs')

    if (role === 'block_open' || role === 'else') {
      table.parentNode.insertBefore(chip, table)
    } else {
      table.parentNode.insertBefore(chip, table.nextSibling)
    }
  }
}

/**
 * Unwrap `<thead>` / `<tbody>` / `<tfoot>` so the `<tr>` rows become direct
 * children of `<table>`. Plate's table plugin doesn't carry these section
 * wrappers in the slate model — its `<table>` element only accepts `<tr>`
 * children — and the built-in HTML deserializer doesn't transparently
 * collapse them either. Without this unwrap the section wrappers get
 * dropped while their child rows end up orphaned, which manifests in the
 * editor view as cells stacking character-by-character (Plate falling back
 * to its single-column default because the row tree never reaches
 * `<table>`'s direct children).
 */
function unwrapTableSections(container: Element): void {
  const sections = container.querySelectorAll('thead, tbody, tfoot')

  for (const section of Array.from(sections)) {
    const parent = section.parentNode

    if (!parent) continue
    while (section.firstChild) {
      parent.insertBefore(section.firstChild, section)
    }
    parent.removeChild(section)
  }
}

/**
 * Strip whitespace-only text nodes that sit *directly* inside `<table>` /
 * `<tr>` / `<thead>` / `<tbody>` / `<tfoot>`. They're invisible to authors
 * but very visible to Plate's deserializer: when it walks a `<tr>` and sees
 * a stray `"  \n  "` text node between two `<td>` elements, slate's
 * paragraph normalization wraps that text in a `<p>` block and inserts it
 * as a tr child — emitting an invalid `<tr><div class="slate-p">…</div></tr>`
 * (React's hydration error: "tr cannot contain div"). The wrapped
 * paragraph also displaces a real cell from the column index, which is
 * why the data row visually rendered chips in alternating positions
 * before this cleanup ran.
 */
function stripTableStructuralWhitespace(container: Element): void {
  const containers = container.querySelectorAll(
    'table, thead, tbody, tfoot, tr',
  )

  for (const el of Array.from(containers)) {
    /*
     * `childNodes` is a live list — snapshot before mutation so the index
     * doesn't shift under us mid-iteration.
     */
    const children = Array.from(el.childNodes)

    for (const child of children) {
      if (child.nodeType !== Node.TEXT_NODE) continue
      const text = child.nodeValue ?? ''

      if (text.trim() === '') el.removeChild(child)
    }
  }
}

/**
 * Walk the DOM, find the placeholder HBS comments inserted by
 * `replaceBlockMarkersWithComments`, and replace each one with the
 * corresponding `<span data-hbs="…">` element. DOM mutation does *not*
 * trigger foster parenting, so the spans end up exactly where the original
 * `{{#each}}` / `{{/each}}` were authored — including inside `<tbody>`.
 */
function replaceHbsCommentsWithSpans(container: Element): void {
  const doc = container.ownerDocument

  if (!doc) return

  const walker = doc.createTreeWalker(container, NodeFilter.SHOW_COMMENT)
  const comments: Comment[] = []
  let current = walker.nextNode()

  while (current) {
    if ((current as Comment).data.startsWith('HBS-'))
      comments.push(current as Comment)
    current = walker.nextNode()
  }

  for (const comment of comments) {
    const replacement = blockMarkerElementFromComment(comment, doc)

    if (!replacement) continue
    comment.parentNode?.replaceChild(replacement, comment)
  }
}

function processTextNodeInDom(textNode: Text): void {
  let value = textNode.nodeValue ?? ''

  if (!value.includes('{{')) return
  const { ownerDocument } = textNode

  if (!ownerDocument) return

  const marks = new Set<string>()
  let node: Node | null = textNode.parentNode

  while (node && node.nodeType === Node.ELEMENT_NODE) {
    const tagName = (node as Element).tagName?.toLowerCase()

    if (tagName && tagName in FORMAT_TAG_TO_MARK)
      marks.add(FORMAT_TAG_TO_MARK[tagName] as string)
    node = node.parentNode
  }

  const fragment = ownerDocument.createDocumentFragment()
  let match = RE_VARIABLE.exec(value)

  if (!match) return

  while (match) {
    const before = value.slice(0, match.index)

    if (before) fragment.appendChild(ownerDocument.createTextNode(before))
    const wrapper = ownerDocument.createElement('template')

    wrapper.innerHTML = variableSpan(match[1] ?? '', marks)
    fragment.appendChild(wrapper.content)
    value = value.slice(match.index + match[0].length)
    match = RE_VARIABLE.exec(value)
  }
  if (value) fragment.appendChild(ownerDocument.createTextNode(value))
  textNode.parentNode?.replaceChild(fragment, textNode)
}

export function preprocessHbsHtml(html: string): string {
  if (!html || !html.trim()) return '<p></p>'

  /*
   * Without a DOM (SSR), fall back to inline string replaces — we lose the
   * comment-based foster-parent workaround AND the wrap-mark detection, but
   * the editor only renders on the client anyway so SSR output is
   * placeholder.
   */
  if (typeof document === 'undefined' || typeof DOMParser === 'undefined') {
    return spanFromBlockMarkers(html).replace(RE_VARIABLE, (_, name: string) =>
      variableSpan(name, new Set()),
    )
  }

  const processed = replaceBlockMarkersWithComments(html)

  const container = document.createElement('div')

  container.innerHTML = processed

  /*
   * Comments → spans, done via DOM mutation after parse so foster parenting
   * doesn't displace the resulting `<span>` outside its surrounding table
   * section.
   */
  replaceHbsCommentsWithSpans(container)

  /*
   * Lift table-anchored chips out of `<tbody>` / `<thead>` / `<tfoot>` /
   * `<table>` so slate's table normalizer doesn't drop them. The serializer
   * keys off `data-hbs-table-anchored="1"` to put them back inside the
   * table on the way out. Runs BEFORE `unwrapTableSections` so anchoring
   * decisions are made against the original section structure.
   */
  liftTableAnchoredChipsOutOfTables(container)

  /*
   * Unwrap `<thead>` / `<tbody>` / `<tfoot>` so `<tr>` rows become direct
   * children of `<table>`. Required for Plate's HTML deserializer to find
   * the rows — without this the cells render as a single-column collapse
   * (visible as character-by-character vertical wrapping in the editor).
   */
  unwrapTableSections(container)

  /*
   * Strip whitespace text nodes inside table structures — they confuse
   * Plate into wrapping them in `<p>` blocks and emitting invalid
   * `<tr><div>…</div></tr>` HTML. Has to run AFTER `unwrapTableSections`
   * because that step exposes the previously-hidden whitespace inside
   * tbody/thead/tfoot to the immediate `<table>` parent.
   */
  stripTableStructuralWhitespace(container)

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
  const textNodes: Text[] = []
  let current = walker.nextNode()

  while (current) {
    textNodes.push(current as Text)
    current = walker.nextNode()
  }

  for (const textNode of textNodes) processTextNodeInDom(textNode)

  return container.innerHTML
}
