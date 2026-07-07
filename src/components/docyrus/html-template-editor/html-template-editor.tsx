'use client'

// @ts-nocheck
/* eslint-disable */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import CodeMirror from '@uiw/react-codemirror'
import { loadLanguage } from '@uiw/codemirror-extensions-langs'
import {
  BaselineIcon,
  BoldIcon,
  BracesIcon,
  Code2Icon,
  CodeIcon,
  EyeIcon,
  FileTextIcon,
  ItalicIcon,
  Loader2Icon,
  PaintBucketIcon,
  StrikethroughIcon,
  TypeIcon,
  UnderlineIcon,
} from 'lucide-react'
import { KEYS, type Value } from 'platejs'
/*
 * NOTE: we intentionally do NOT use platejs/static's `getEditorDOMFromHtmlString`
 * here — that helper only resolves HTML that was previously *exported* by Plate
 * (it queries for `[data-slate-editor="true"]` and returns null otherwise). For
 * arbitrary user-authored HTML templates we build the DOM ourselves below.
 */
import { Plate, createPlatePlugin, usePlateEditor } from 'platejs/react'

import { AlignKit } from '@/components/editor/plugins/align-kit'
import { BasicBlocksKit } from '@/components/editor/plugins/basic-blocks-kit'
import { BasicMarksKit } from '@/components/editor/plugins/basic-marks-kit'
import { CalloutKit } from '@/components/editor/plugins/callout-kit'
import { ColumnKit } from '@/components/editor/plugins/column-kit'
import { FontKit } from '@/components/editor/plugins/font-kit'
import { LinkKit } from '@/components/editor/plugins/link-kit'
import { ListKit } from '@/components/editor/plugins/list-kit'
import { TableKit } from '@/components/editor/plugins/table-kit'
import { Editor, EditorContainer } from '@/components/editor/editor'
import { AlignToolbarButton } from '@/components/editor/ui/align-toolbar-button'
import { FontColorToolbarButton } from '@/components/editor/ui/font-color-toolbar-button'
import { FontSizeToolbarButton } from '@/components/editor/ui/font-size-toolbar-button'
import { FixedToolbar } from '@/components/editor/ui/fixed-toolbar'
import {
  BulletedListToolbarButton,
  NumberedListToolbarButton,
} from '@/components/editor/ui/list-toolbar-button'
import { LinkToolbarButton } from '@/components/editor/ui/link-toolbar-button'
import { MarkToolbarButton } from '@/components/editor/ui/mark-toolbar-button'
import { TableToolbarButton } from '@/components/editor/ui/table-toolbar-button'
import { TurnIntoToolbarButton } from '@/components/editor/ui/turn-into-toolbar-button'
import { ToolbarGroup } from '@/components/editor/ui/toolbar'
import {
  UndoToolbarButton,
  RedoToolbarButton,
} from '@/components/editor/ui/history-toolbar-button'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { CodyAgentToggle } from '@/components/docyrus/editor-agent'
import { useDocyTheme } from '@/lib/docyrus/theme'
import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation'

import { InsertComputedTableButton } from './components/insert-computed-table-button'
import { InsertVariablePopover } from './components/insert-variable-popover'
import { InsertBlockPopover } from './components/insert-block-popover'
import { ComputedTableElement } from './elements/computed-table-element'
import { HandlebarsBlockCloseElement } from './elements/handlebars-block-close-element'
import { HandlebarsBlockOpenElement } from './elements/handlebars-block-open-element'
import { HandlebarsElseElement } from './elements/handlebars-else-element'
import { HandlebarsVariableElement } from './elements/handlebars-variable-element'
import { HbsTriggerCombobox } from './components/hbs-trigger-combobox'
import { TableCellActionBar } from './components/table-cell-action-bar'
import { HbsContext } from './lib/hbs-context'
import { preprocessHbsHtml } from './lib/deserialize'
import { registerHandlebarsHelpers } from './lib/handlebars-helpers'
import { createEditorTemplateEngine } from './lib/editor-template-engine'
import { serializePlateToHbs } from './lib/serialize'
import { htmlTemplateToPdf, pdfBytesToObjectUrl } from './lib/html-to-pdf'
import {
  HandlebarsBlockClosePlugin,
  HandlebarsBlockOpenPlugin,
  HandlebarsElsePlugin,
  HandlebarsNormalizerPlugin,
  HandlebarsVariablePlugin,
} from './plugins/handlebars-plugin'
import { ComputedTablePlugin } from './plugins/computed-table-plugin'
import {
  DEFAULT_HELPERS,
  type ComputedTableSchema,
  type HandlebarsBlockHelper,
  type HandlebarsVariable,
  type HtmlTemplateEditorProps,
  type HtmlTemplateEditorTab,
} from './types'

/*
 * Keep global registration for consumers that compile templates directly
 * via Handlebars.compile() outside the editor. The editor itself uses
 * createEditorTemplateEngine (isolated instance) instead of the global singleton.
 */
registerHandlebarsHelpers()

/* ── Plate editor instance type ── */

type PlateEditorInstance = ReturnType<typeof usePlateEditor>

/*
 * A4 page surface — 210mm × 297mm at 96 DPI ≈ 794 × 1123 px.
 * 64 px (≈ 17 mm) inner padding gives standard letter margins.
 * The Visual + Preview tabs render content inside this fixed sheet so users
 * see a 1:1 printed-page representation. PDF export later runs Puppeteer
 * against the same dimensions, eliminating "web ≠ PDF" surprise — the single
 * loudest user complaint about Proposify/PandaDoc/Qwilr.
 */
const A4_WIDTH_PX = 794
const A4_HEIGHT_PX = 1123
const A4_PADDING_PX = 64

/*
 * CSS for the editor's *transport-shell* rows. The deserializer wraps every
 * `{{#each}}` / `{{/each}}` / `{{else}}` that sits between table rows in a
 * synthetic `<tr><td colspan="99">…</td></tr>` so slate's table normalizer
 * keeps the chip inside the table at the model level. Without this
 * stylesheet those shells render as fat empty rows (full borders, default
 * cell padding) and visually fight the actual data rows. The selectors
 * walk *up* from the marker chip — keyed off `data-hbs-marker` — so any
 * row that contains nothing but a block marker gets collapsed to a
 * borderless slim band. Multiple :has() variants cover slate's optional
 * `<p>` and leaf-span wrappers around the inline-void chip.
 */
const HBS_WRAP_ROW_CSS = `
  /*
   * Wrap-row detection — \`tr:has([data-hbs-marker])\` matches the chip at
   * any depth (Plate nests it inside \`<p>\` + \`<span data-slate-leaf>\` +
   * \`<span data-slate-node>\` wrappers, so direct-child selectors miss).
   * Any \`<tr>\` that contains ONLY block-marker chip(s) and no normal
   * column cells is treated as a transport shell.
   */
  [data-slate-editor] tr:has([data-hbs-marker]) {
    background: transparent !important;
    border: none !important;
  }
  [data-slate-editor] tr:has([data-hbs-marker]) > td,
  [data-slate-editor] tr:has([data-hbs-marker]) > th {
    border: none !important;
    background: transparent !important;
    padding: 0 !important;
    line-height: 1 !important;
  }
  /*
   * Slate auto-paragraphs inside table cells inject vertical margin that
   * makes the shell row \`~20px\` tall even with cell padding zeroed out.
   * Squash those too — the chip itself carries its own visual padding.
   */
  [data-slate-editor] tr:has([data-hbs-marker]) > td > p,
  [data-slate-editor] tr:has([data-hbs-marker]) > th > p {
    margin: 0 !important;
    padding: 0 !important;
    line-height: 1.2 !important;
  }

  /*
   * Suppress Plate's table cell-selection floating toolbar. Three
   * overlapping selectors because Radix \`asChild\` + Slot merging
   * sometimes drops the \`data-slot\` attribute onto the inner component
   * inconsistently across renders, so we also fall back to (a) the
   * Radix popper wrapper that contains a \`role="toolbar"\` child, and
   * (b) a popover content whose subtree contains the distinctive
   * \`lucide-paint-bucket\` icon (Plate's table toolbar is the only
   * popover here that paints with one). Any one of the three matches
   * hides the entire Plate cell toolbar without touching chip
   * popovers / picker dropdowns.
   */
  [role="toolbar"][data-slot="popover-content"],
  [data-radix-popper-content-wrapper]:has(> [role="toolbar"]),
  [data-slot="popover-content"]:has(.lucide-paint-bucket) {
    display: none !important;
  }
`

const A4_PREVIEW_CSS = `
  *,*::before,*::after{box-sizing:border-box}
  html,body{margin:0;padding:0;background:transparent;font-family:'Inter','Helvetica Neue','Segoe UI',sans-serif;color:#0f172a}
  .page{margin:0 auto;background:#fff;width:${A4_WIDTH_PX}px;min-height:${A4_HEIGHT_PX}px;padding:${A4_PADDING_PX}px;font-size:14px;line-height:1.5;color:#0f172a}
  .page h1{font-size:28px;margin:0 0 12px;font-weight:700;letter-spacing:-.02em}
  .page h2{font-size:22px;margin:24px 0 10px;font-weight:600}
  .page h3{font-size:18px;margin:18px 0 8px;font-weight:600}
  .page p{margin:0 0 10px}
  .page table{border-collapse:collapse;width:100%;margin:8px 0}
  .page th,.page td{padding:8px 10px;text-align:left;vertical-align:top}
  .page th{font-weight:600}
  .page hr{border:0;border-top:1px solid #e2e8f0;margin:16px 0}
  .page a{color:#1d4ed8;text-decoration:underline}
  .page ul,.page ol{margin:0 0 10px;padding-left:24px}
  .page blockquote{border-left:3px solid #cbd5f5;padding:4px 12px;margin:8px 0;color:#475569;font-style:italic}
`

function buildPreviewSrcDoc(html: string, extraStyles?: string): string {
  const extra = extraStyles?.trim() ? `<style>${extraStyles}</style>` : ''

  return `<!doctype html><html><head><meta charset="utf-8"><style>${A4_PREVIEW_CSS}</style>${extra}</head><body><div class="page">${html}</div></body></html>`
}

/* ── Value helpers ── */

const EMPTY_VALUE: Value = [{ type: 'p', children: [{ text: '' }] }]

function createEmptyValue(): Value {
  return [{ type: 'p', children: [{ text: '' }] }]
}

/*
 * Plate's `@platejs/table` plugin sizes columns from the table node's
 * `colSizes` array, falling back to `Array(colCount).fill(0)` when missing.
 * Each 0 then renders at `TABLE_DEFAULT_COLUMN_WIDTH` (120px). The HTML
 * deserializer doesn't populate `colSizes`, so a freshly parsed `<table>`
 * with N cells per row arrives with `colSizes === undefined`, and Plate's
 * fallback computes `colCount` off the FIRST row's children. In templates
 * where that first row is e.g. a `<thead>` `<tr>` with a single `<th
 * colspan>` (or a slate-normalized row with merged cells), `colCount`
 * collapses to 1 and every other column squashes to zero width — which is
 * exactly the "every header letter stacks vertically in a single narrow
 * column" symptom in the editor. Pre-seeding `colSizes` from the widest
 * row defeats that fallback.
 */
const TABLE_DEFAULT_COL_WIDTH = 120

function ensureTableColSizes(nodes: Value): Value {
  function walk(node: unknown): void {
    if (!node || typeof node !== 'object') return
    const n = node as Record<string, unknown>

    if (n.type === 'table') {
      const children = Array.isArray(n.children)
        ? (n.children as Array<Record<string, unknown>>)
        : []
      let maxCells = 0

      for (const row of children) {
        if (!row || row.type !== 'tr') continue
        const cells = Array.isArray(row.children)
          ? (row.children as Array<Record<string, unknown>>)
          : []
        let rowCells = 0

        for (const cell of cells) {
          if (cell?.type !== 'td' && cell?.type !== 'th') continue
          const colSpan = typeof cell.colSpan === 'number' ? cell.colSpan : 1

          rowCells += colSpan
        }
        if (rowCells > maxCells) maxCells = rowCells
      }

      const existing = Array.isArray(n.colSizes)
        ? (n.colSizes as unknown[])
        : null
      const needsUpdate = !existing || existing.length !== maxCells

      if (maxCells > 0 && needsUpdate) {
        n.colSizes = Array.from(
          { length: maxCells },
          () => TABLE_DEFAULT_COL_WIDTH,
        )
      }
    }

    if (Array.isArray(n.children)) {
      for (const child of n.children) walk(child)
    }
  }

  for (const node of nodes) walk(node)

  return nodes
}

function hbsHtmlToPlateValue(editor: PlateEditorInstance, html: string): Value {
  if (!html?.trim() || !editor) return createEmptyValue()

  let preprocessed: string
  let rootElement: Element

  try {
    preprocessed = preprocessHbsHtml(html)
    /*
     * Build the DOM container manually. Plate's html.deserialize walks the
     * element's CHILDREN, so we need a wrapper whose children are our top-level
     * template blocks.
     */
    const container = document.createElement('div')

    container.innerHTML = preprocessed
    rootElement = container
  } catch {
    return createEmptyValue()
  }

  /*
   * First try: deserialize the whole document at once (fast path).
   *
   * `collapseWhiteSpace: false` is critical — by default Plate strips the
   * leading whitespace from any text node that follows a void inline element
   * (e.g. our `{{…}}` chips). That silently turned `{{a}} • {{b}}` into
   * `{{a}}•{{b}}` after a round-trip and ate every separator in the template.
   */
  try {
    const nodes = editor.api.html?.deserialize({
      element: rootElement,
      collapseWhiteSpace: false,
    })

    if (nodes && nodes.length > 0) {
      return ensureTableColSizes(nodes as Value)
    }
  } catch {}

  /*
   * Fallback: deserialize each top-level child individually so one broken
   * block doesn't take down the whole document.
   */
  const collected: Value = []
  const children = Array.from(rootElement.children)

  for (let i = 0; i < children.length; i += 1) {
    const child = children[i]

    if (!child) continue
    const wrapper = rootElement.ownerDocument.createElement('div')

    wrapper.appendChild(child.cloneNode(true))
    try {
      const nodes = editor.api.html?.deserialize({
        element: wrapper,
        collapseWhiteSpace: false,
      })

      if (nodes && nodes.length > 0) {
        collected.push(...(nodes as Value))
      }
    } catch {
      collected.push({
        type: 'p',
        children: [
          { text: `[Unparseable block: <${child.tagName.toLowerCase()}>]` },
        ],
      } as never)
    }
  }

  if (collected.length === 0) return createEmptyValue()

  return ensureTableColSizes(collected)
}

/* ── Toolbar (Visual Editor only) ── */

interface ToolbarProps {
  variables: HandlebarsVariable[]
  helpers: HandlebarsBlockHelper[]
  readOnly: boolean
}

function TemplateEditorToolbar({ variables, helpers, readOnly }: ToolbarProps) {
  if (readOnly) return null

  return (
    <FixedToolbar>
      <div className="flex w-full flex-wrap items-center gap-0.5 px-1">
        <ToolbarGroup>
          <UndoToolbarButton />
          <RedoToolbarButton />
        </ToolbarGroup>

        <ToolbarGroup>
          <TurnIntoToolbarButton />
          <FontSizeToolbarButton />
        </ToolbarGroup>

        <ToolbarGroup>
          <MarkToolbarButton nodeType={KEYS.bold} tooltip="Bold (⌘B)">
            <BoldIcon />
          </MarkToolbarButton>
          <MarkToolbarButton nodeType={KEYS.italic} tooltip="Italic (⌘I)">
            <ItalicIcon />
          </MarkToolbarButton>
          <MarkToolbarButton nodeType={KEYS.underline} tooltip="Underline (⌘U)">
            <UnderlineIcon />
          </MarkToolbarButton>
          <MarkToolbarButton
            nodeType={KEYS.strikethrough}
            tooltip="Strikethrough"
          >
            <StrikethroughIcon />
          </MarkToolbarButton>
          <MarkToolbarButton nodeType={KEYS.code} tooltip="Inline code (⌘E)">
            <Code2Icon />
          </MarkToolbarButton>
        </ToolbarGroup>

        <ToolbarGroup>
          <FontColorToolbarButton nodeType={KEYS.color} tooltip="Yazı rengi">
            <BaselineIcon />
          </FontColorToolbarButton>
          <FontColorToolbarButton
            nodeType={KEYS.backgroundColor}
            tooltip="Vurgu rengi"
          >
            <PaintBucketIcon />
          </FontColorToolbarButton>
        </ToolbarGroup>

        <ToolbarGroup>
          <AlignToolbarButton />
          <BulletedListToolbarButton />
          <NumberedListToolbarButton />
          <LinkToolbarButton />
          <TableToolbarButton />
        </ToolbarGroup>

        <Separator orientation="vertical" className="mx-1 h-5" />

        <div className="flex items-center gap-0.5">
          <InsertVariablePopover variables={variables} />
          <InsertBlockPopover helpers={helpers} />
          <InsertComputedTableButton />
        </div>
      </div>
    </FixedToolbar>
  )
}

/* ── Static plugin instances with element components ── */

const HBS_VAR_PLUGIN = HandlebarsVariablePlugin.withComponent(
  HandlebarsVariableElement,
)
const HBS_OPEN_PLUGIN = HandlebarsBlockOpenPlugin.withComponent(
  HandlebarsBlockOpenElement,
)
const HBS_CLOSE_PLUGIN = HandlebarsBlockClosePlugin.withComponent(
  HandlebarsBlockCloseElement,
)
const HBS_ELSE_PLUGIN = HandlebarsElsePlugin.withComponent(
  HandlebarsElseElement,
)
const COMPUTED_TABLE_PLUGIN =
  ComputedTablePlugin.withComponent(ComputedTableElement)

/* ── Tab definitions ── */

const DEFAULT_DATA = '{\n  \n}'

const TAB_DEFS: Array<{
  value: HtmlTemplateEditorTab
  label: string
  Icon: typeof CodeIcon
}> = [
  { value: 'visual', label: 'Visual Editor', Icon: TypeIcon },
  { value: 'code', label: 'Code Editor', Icon: CodeIcon },
  { value: 'data', label: 'Data', Icon: BracesIcon },
  { value: 'preview', label: 'Preview', Icon: EyeIcon },
  { value: 'pdf', label: 'PDF', Icon: FileTextIcon },
]

const CM_BASIC_SETUP = {
  lineNumbers: true,
  bracketMatching: true,
  closeBrackets: true,
  autocompletion: true,
  highlightActiveLine: true,
  tabSize: 2,
} as const

/* ── Main component ── */

const EMPTY_SCHEMAS: ComputedTableSchema[] = []
/*
 * Stable module-level defaults for the `variables` and `helpers` props.
 *
 * If we leave the destructured default as an inline literal (`variables = []`),
 * a brand-new array is allocated on EVERY render of `HtmlTemplateEditor`. That
 * fresh reference invalidates the `useMemo([variables, helpers])` cache for
 * `plugins`, which in turn invalidates `usePlateEditor({...}, [plugins])` and
 * RECREATES THE ENTIRE PLATE EDITOR INSTANCE on every render. A freshly
 * constructed Plate editor starts with `EMPTY_VALUE`, throwing away whatever
 * we just pushed in via `editor.tf.replaceNodes(...)` — Visual tab silently
 * goes blank after any external `value` update (most visibly: the AI
 * Assistant's `applyHtmlTemplate` tool writes a template, the user sees
 * `applied: true`, but the canvas stays empty).
 *
 * Pinning the defaults to module-level constants keeps the reference stable
 * across renders so the editor instance survives.
 */
const DEFAULT_VARIABLES: HandlebarsVariable[] = []

export function HtmlTemplateEditor({
  value: initialValue = '',
  onChange,
  variables = DEFAULT_VARIABLES,
  helpers = DEFAULT_HELPERS,
  tableSchemas = EMPTY_SCHEMAS,
  extraHelpers,
  readOnly = false,
  dataReadOnly = false,
  className,
  placeholder = 'Write your template…',
  minHeight = `${A4_HEIGHT_PX + A4_PADDING_PX * 2}px`,
  data: initialData,
  onDataChange,
  visibleTabs,
  previewStyles,
  defaultCurrency = 'USD',
  defaultTab = 'visual',
  aiAssistantOpen,
  onAiAssistantOpenChange,
  renderAiAssistant,
  aiAssistantWidth = 380,
}: HtmlTemplateEditorProps) {
  const { isDark } = useDocyTheme()
  const { t } = useUiTranslation()

  /*
   * Isolated Handlebars engine — created once per `extraHelpers` reference change.
   * Bundles both the editor-specific helper set (formatCurrency, lineNet, …) and
   * the app-utils-compatible set (formula/JSONata, repeat, sum, json).
   */
  const engine = useMemo(
    () => createEditorTemplateEngine({ extraHelpers }),
    [extraHelpers],
  )

  /*
   * Serialize options — currency + translated placeholder messages handed to
   * the serializer so ad-hoc tables don't bake `"TRY"` / Turkish text into
   * their generated HTML.
   */
  const serializeOptions = useMemo(
    () => ({
      defaultCurrency,
      messages: {
        adhocNoColumns: t(
          'ui.htmlTemplateEditor.serializeAdhocNoColumns',
          'Ad-hoc table has no columns',
        ),
        adhocNoDataPath: t(
          'ui.htmlTemplateEditor.serializeAdhocNoDataPath',
          'Ad-hoc table has no data path',
        ),
        missingSchema: (id: string) =>
          t(
            'ui.htmlTemplateEditor.serializeMissingSchema',
            `Schema "${id}" not registered`,
          ),
      },
    }),
    [defaultCurrency, t],
  )

  /*
   * Schema lookup map — passed into HbsContext for the element + into the
   * serializer for static HTML rendering.
   */
  const schemaMap = useMemo(() => {
    const map: Record<string, ComputedTableSchema> = {}

    for (const s of tableSchemas) map[s.id] = s

    return map
  }, [tableSchemas])

  /*
   * templateHtml is the single source of truth. Both Visual (Plate) and Code
   * (CodeMirror) editors read from / write to it through different paths:
   *   - Visual: load via editor.tf.replaceNodes when entering tab, serialize
   *     via debounced onValueChange while editing.
   *   - Code:   bound to CodeMirror as a controlled value.
   */
  /*
   * Resolve which tabs to render. When `visibleTabs` is supplied, filter the
   * canonical TAB_DEFS (preserving canonical order) down to the requested
   * subset; otherwise show all five. The strip auto-hides when a single tab
   * remains so a one-tab surface (e.g. a record preview) reads as a plain pane.
   */
  const tabDefs = useMemo(() => {
    if (!visibleTabs || visibleTabs.length === 0) return TAB_DEFS
    const allowed = new Set(visibleTabs)

    return TAB_DEFS.filter((def) => allowed.has(def.value))
  }, [visibleTabs])

  const resolvedDefaultTab = useMemo<HtmlTemplateEditorTab>(() => {
    if (tabDefs.some((def) => def.value === defaultTab)) return defaultTab

    return tabDefs[0]?.value ?? defaultTab
  }, [tabDefs, defaultTab])

  const visibleTabSet = useMemo(
    () => new Set(tabDefs.map((def) => def.value)),
    [tabDefs],
  )

  const [activeTab, setActiveTab] =
    useState<HtmlTemplateEditorTab>(resolvedDefaultTab)

  /*
   * Keep `activeTab` valid if the visible set changes at runtime and no longer
   * includes the current tab (e.g. toggling `templateEditable` flips the
   * available tabs). Falls back to the first visible tab.
   */
  useEffect(() => {
    if (tabDefs.some((def) => def.value === activeTab)) return
    // eslint-disable-next-line @eslint-react/set-state-in-effect
    setActiveTab(resolvedDefaultTab)
  }, [tabDefs, activeTab, resolvedDefaultTab])
  const [templateHtml, setTemplateHtml] = useState(initialValue)
  const [dataValue, setDataValue] = useState(initialData ?? DEFAULT_DATA)

  const isAiAssistantEnabled = typeof renderAiAssistant === 'function'
  const [aiOpenInternal, setAiOpenInternal] = useState(false)
  const isAiOpenControlled = aiAssistantOpen !== undefined
  const aiOpen = isAiOpenControlled ? aiAssistantOpen : aiOpenInternal
  const setAiOpen = useCallback(
    (next: boolean) => {
      if (!isAiOpenControlled) setAiOpenInternal(next)
      onAiAssistantOpenChange?.(next)
    },
    [isAiOpenControlled, onAiAssistantOpenChange],
  )
  const closeAiAssistant = useCallback(() => setAiOpen(false), [setAiOpen])

  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  /*
   * `loadingFromExternalRef` is set true while we're programmatically pushing
   * a value into Plate via replaceNodes, and reset false after the React
   * frame settles. Any onValueChange fired in between is treated as our own
   * write — not a user edit — and ignored.
   */
  const loadingFromExternalRef = useRef(false)
  /*
   * `liveEditorHtmlRef` mirrors editor.children at the latest possible moment
   * (no debounce) so:
   *  - leaving-Visual transitions can read the truly current state without
   *    waiting for the debounced setTemplateHtml to commit, and
   *  - the controlled `value`-sync effect below can diff incoming prop changes
   *    against what Plate has actually rendered, avoiding a re-load loop when
   *    the parent simply echoes our own emitted HTML back as the next prop.
   *
   * Crucially this starts at `''` to match Plate's initial `EMPTY_VALUE`, NOT
   * at `initialValue` — otherwise the first `initialValue → ref` comparison
   * would falsely match before the mount-load has happened.
   */
  const liveEditorHtmlRef = useRef('')
  const lastEmittedDataRef = useRef(initialData ?? DEFAULT_DATA)

  const plugins = useMemo(() => {
    const normalizerWithOptions = HandlebarsNormalizerPlugin.configure({
      options: { variables, helpers },
    })

    /*
     * Combobox uses Plate's `afterEditable` slot because it's a portal-rooted
     * floater that needs editor context but no specific DOM position. The
     * toolbar, by contrast, is rendered manually below as a sibling of the A4
     * canvas — putting it in `beforeEditable` would nest it INSIDE the white
     * page (Word-style chrome should sit outside the sheet).
     */
    const comboboxPlugin = createPlatePlugin({
      key: 'hbs-trigger-combobox',
      render: {
        afterEditable: () => (
          <HbsTriggerCombobox variables={variables} helpers={helpers} />
        ),
      },
    })

    /*
     * Template-aware floating action bar that replaces Plate's default
     * cell-selection toolbar. Renders above the active `<td>` / `<th>`
     * with Insert Variable + Wrap-with-Block actions only — no
     * delete-column / insert-row buttons that would break the
     * `{{#each}}` round-trip.
     */
    const cellActionBarPlugin = createPlatePlugin({
      key: 'hbs-table-cell-action-bar',
      render: {
        afterEditable: () => <TableCellActionBar />,
      },
    })

    return [
      ...BasicBlocksKit,
      ...BasicMarksKit,
      ...ListKit,
      ...LinkKit,
      ...AlignKit,
      ...FontKit,
      ...ColumnKit,
      ...TableKit,
      ...CalloutKit,
      HBS_VAR_PLUGIN,
      HBS_OPEN_PLUGIN,
      HBS_CLOSE_PLUGIN,
      HBS_ELSE_PLUGIN,
      COMPUTED_TABLE_PLUGIN,
      normalizerWithOptions,
      comboboxPlugin,
      cellActionBarPlugin,
    ]
  }, [variables, helpers])

  const editor = usePlateEditor({ plugins, value: EMPTY_VALUE }, [plugins])

  /*
   * Hydrate Plate from a given HTML string. Used on initial mount and on
   * every Visual tab activation so the editor always reflects the SSOT.
   * We skip the load entirely if Plate already shows the same HTML to avoid
   * fighting Plate's selection/normalization machinery.
   */
  const loadTemplateIntoEditor = useCallback(
    (html: string) => {
      const current = serializePlateToHbs(
        editor.children as Value,
        schemaMap,
        serializeOptions,
      )

      if (current === html) {
        liveEditorHtmlRef.current = html

        return
      }
      loadingFromExternalRef.current = true
      const nodes = hbsHtmlToPlateValue(editor, html)

      editor.tf.replaceNodes(nodes, { at: [], children: true })

      /*
       * After deserialize, immediately re-serialize so we publish the canonical
       * form to the parent. Inputs like `<div data-computed-table="1" data-config="…"></div>`
       * arrive as empty shells; only after serialization do they carry the
       * pre-rendered inner <table>…</table> needed for downstream Handlebars
       * compilation (preview iframe, PDF export). Without this push the parent's
       * `html` state would lag behind the editor's tree until the first edit.
       */
      const reSerialized = serializePlateToHbs(
        editor.children as Value,
        schemaMap,
        serializeOptions,
      )

      liveEditorHtmlRef.current = reSerialized
      const shouldPublish = reSerialized !== html

      if (shouldPublish && debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }

      /*
       * replaceNodes may trigger multiple onValueChange events. Defer the
       * canonical-form state push (and parent notify) plus the loading-flag
       * release to a microtask so React doesn't re-render mid-effect and the
       * lingering replaceNodes events still see `loadingFromExternalRef = true`.
       */
      queueMicrotask(() => {
        if (shouldPublish) {
          // eslint-disable-next-line @eslint-react/set-state-in-effect
          setTemplateHtml(reSerialized)
          onChangeRef.current?.(reSerialized)
        }
        loadingFromExternalRef.current = false
      })
    },
    [editor, schemaMap, serializeOptions],
  )

  /*
   * Sync external `value` changes into Plate. Runs on mount AND whenever the
   * parent updates `value` (e.g. AI agent's `applyHtmlTemplate` tool calls
   * `setHtml(nextHtml)`). The diff against `liveEditorHtmlRef.current` short-
   * circuits the common "parent echoes our own onChange back" round-trip so
   * we don't redundantly re-deserialize on every keystroke.
   */
  useEffect(() => {
    if (initialValue === liveEditorHtmlRef.current) return

    /*
     * When the Visual (Plate) tab isn't part of the visible set, there is no
     * WYSIWYG editing surface — so we must NOT round-trip the template through
     * Plate's deserialize→serialize. That round-trip is lossy for complex
     * nested-block table templates (e.g. `{{#if items}}{{#each items}}…<tr>…
     * {{/each}}{{/if}}`): the table-anchored chip hoisting can reorder the
     * closing markers and produce invalid Handlebars ("each doesn't match
     * if"). For preview-only / code-only surfaces we keep the raw template
     * verbatim so the Preview / PDF / Code tabs compile exactly what the
     * source contains.
     */
    if (!visibleTabSet.has('visual')) {
      liveEditorHtmlRef.current = initialValue
      // eslint-disable-next-line @eslint-react/set-state-in-effect
      setTemplateHtml(initialValue)

      return
    }

    loadTemplateIntoEditor(initialValue)
  }, [initialValue, loadTemplateIntoEditor, visibleTabSet])

  const handleValueChange = useCallback(
    ({ value }: { value: Value }) => {
      if (loadingFromExternalRef.current) return
      const html = serializePlateToHbs(value, schemaMap, serializeOptions)

      liveEditorHtmlRef.current = html
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = setTimeout(() => {
        setTemplateHtml(html)
        onChangeRef.current?.(html)
      }, 300)
    },
    [schemaMap, serializeOptions],
  )

  const handleCodeChange = useCallback((val: string) => {
    liveEditorHtmlRef.current = val
    setTemplateHtml(val)
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => {
      onChangeRef.current?.(val)
    }, 300)
  }, [])

  const handleDataChange = useCallback(
    (val: string) => {
      lastEmittedDataRef.current = val
      setDataValue(val)
      onDataChange?.(val)
    },
    [onDataChange],
  )

  /*
   * Sync external `data` changes (parent → editor). Mirrors the `value` sync
   * effect — diff against `lastEmittedDataRef` so the parent echoing our own
   * `onDataChange` back doesn't trigger a re-render loop.
   */
  useEffect(() => {
    const next = initialData ?? DEFAULT_DATA

    if (next === lastEmittedDataRef.current) return
    lastEmittedDataRef.current = next
    // eslint-disable-next-line @eslint-react/set-state-in-effect
    setDataValue(next)
  }, [initialData])

  const handleTabChange = useCallback(
    (nextRaw: string) => {
      const next = nextRaw as HtmlTemplateEditorTab

      if (next === activeTab) return

      /*
       * Leaving Visual: flush any pending debounced serialize so templateHtml
       * is current before switching. We synchronously serialize the live
       * editor.children — never rely on the stale React state.
       */
      if (activeTab === 'visual') {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current)
          debounceTimerRef.current = null
        }
        const html = serializePlateToHbs(
          editor.children as Value,
          schemaMap,
          serializeOptions,
        )

        liveEditorHtmlRef.current = html
        setTemplateHtml(html)
        onChangeRef.current?.(html)
      }

      /*
       * Entering Visual: re-hydrate Plate from the latest known HTML. Read
       * from the live ref rather than the closure's templateHtml so we don't
       * miss writes that happened in this same React frame.
       */
      if (next === 'visual' && activeTab !== 'visual') {
        loadTemplateIntoEditor(liveEditorHtmlRef.current)
      }

      setActiveTab(next)
    },
    [activeTab, editor, loadTemplateIntoEditor, schemaMap, serializeOptions],
  )

  useEffect(
    () => () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    },
    [],
  )

  const htmlExtension = useMemo(() => {
    const lang = loadLanguage('html')

    return lang ? [lang] : []
  }, [])

  const jsonExtension = useMemo(() => {
    const lang = loadLanguage('json')

    return lang ? [lang] : []
  }, [])

  const [preview, setPreview] = useState<{
    result: string
    error?: string
  } | null>(null)

  useEffect(() => {
    if (activeTab !== 'preview') {
      // eslint-disable-next-line @eslint-react/set-state-in-effect
      setPreview(null)

      return
    }

    let cancelled = false
    let data: unknown = {}

    if (dataValue.trim()) {
      try {
        data = JSON.parse(dataValue) as unknown
      } catch {
        data = {}
      }
    }

    ;(async () => {
      try {
        const result = await engine.compileTpl(templateHtml)(data)

        if (!cancelled) {
          setPreview({ result })
        }
      } catch (err) {
        if (!cancelled) {
          setPreview({
            result: '',
            error: err instanceof Error ? err.message : String(err),
          })
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [activeTab, templateHtml, dataValue, engine])

  /*
   * PDF tab. We compile the template (same path as Preview) then rasterize the
   * resulting HTML to a client-side A4 PDF (`lib/html-to-pdf`) and feed the
   * object URL to the embedpdf-based `<PDFViewer>`. Generation only runs while
   * the PDF tab is active so the heavy html2canvas + pdf-lib work is never paid
   * for on the other tabs. The previous object URL is revoked whenever a new
   * one supersedes it (or on unmount / tab-leave) to avoid blob leaks.
   */
  const [pdf, setPdf] = useState<{
    url: string
    loading: boolean
    error?: string
  }>({
    url: '',
    loading: false,
  })
  const pdfUrlRef = useRef('')

  const revokePdfUrl = useCallback(() => {
    if (pdfUrlRef.current) {
      URL.revokeObjectURL(pdfUrlRef.current)
      pdfUrlRef.current = ''
    }
  }, [])

  useEffect(() => {
    if (activeTab !== 'pdf') {
      revokePdfUrl()
      // eslint-disable-next-line @eslint-react/set-state-in-effect
      setPdf({ url: '', loading: false })

      return
    }

    let cancelled = false
    let data: unknown = {}

    if (dataValue.trim()) {
      try {
        data = JSON.parse(dataValue) as unknown
      } catch {
        data = {}
      }
    }

    // eslint-disable-next-line @eslint-react/set-state-in-effect
    setPdf((prev) => ({ url: prev.url, loading: true, error: undefined }))
    ;(async () => {
      try {
        const html = await engine.compileTpl(templateHtml)(data)
        const bytes = await htmlTemplateToPdf(html)

        if (cancelled) return
        const url = pdfBytesToObjectUrl(bytes)

        revokePdfUrl()
        pdfUrlRef.current = url
        setPdf({ url, loading: false })
      } catch (genErr) {
        if (cancelled) return
        revokePdfUrl()
        setPdf({
          url: '',
          loading: false,
          error: genErr instanceof Error ? genErr.message : String(genErr),
        })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [activeTab, templateHtml, dataValue, engine, revokePdfUrl])

  useEffect(() => () => revokePdfUrl(), [revokePdfUrl])

  const parsedData = useMemo(() => {
    const trimmed = dataValue.trim()

    if (!trimmed) return null
    try {
      return JSON.parse(trimmed) as unknown
    } catch {
      return null
    }
  }, [dataValue])

  const hbsContextValue = useMemo(
    () => ({
      variables,
      helpers,
      tableSchemas: schemaMap,
      data: parsedData,
      defaultCurrency,
    }),
    [variables, helpers, schemaMap, parsedData, defaultCurrency],
  )

  return (
    <HbsContext value={hbsContextValue}>
      <TooltipProvider>
        {/*
         * Inject the wrap-row stylesheet once at the editor boundary so the
         * rules apply to all `[data-slate-editor]` descendants without
         * polluting host pages. Inlining is fine: the CSS is short, static,
         * defined at module scope (no user input), and ships with the
         * bundle anyway.
         */}
        {/* eslint-disable-next-line @eslint-react/dom-no-dangerously-set-innerhtml */}
        <style dangerouslySetInnerHTML={{ __html: HBS_WRAP_ROW_CSS }} />
        {/*
         * `height` is sourced from the `minHeight` prop so the editor self-
         * contains its scroll: the toolbar header (Word-style) stays
         * pinned at the top of the editor pane while the A4 canvas
         * scrolls *inside* the editor. Previously the outer container
         * had only `minHeight` and could expand unbounded, so the
         * toolbar's `sticky top-0` resolved its scroll-anchor up to the
         * page viewport — visually "way up there" while content scrolled
         * below it. Bounding the height pulls scroll back inside the
         * editor where it belongs. The `minHeight` prop name is kept for
         * API stability; functionally it is now the editor's *fixed*
         * height.
         */}
        <div
          className={cn(
            'relative flex w-full flex-col overflow-hidden rounded-md border',
            className,
          )}
          style={{ height: minHeight }}
        >
          {/*
           * `isolation-isolate` traps Plate's `FixedToolbar` `sticky z-50`
           * (and any future high z-indexes inside the editor) inside its own
           * stacking context. The AI Assistant drawer is a SIBLING of this
           * Tabs container; with isolation in place its z-10 in the root
           * context wins over anything nested under Tabs.
           */}
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="isolate flex min-h-0 w-full flex-1 flex-col gap-0"
          >
            <div className="flex shrink-0 items-center justify-between gap-2 border-b bg-muted/40 px-2 pt-1.5">
              <div className="flex items-center gap-1">
                {isAiAssistantEnabled && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <CodyAgentToggle
                        active={aiOpen}
                        aria-label={t(
                          'ui.htmlTemplateEditor.aiAssistant',
                          'AI Assistant',
                        )}
                        onClick={() => setAiOpen(!aiOpen)}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="bottom" sideOffset={6}>
                      {t('ui.htmlTemplateEditor.aiAssistant', 'AI Assistant')}
                    </TooltipContent>
                  </Tooltip>
                )}
                {tabDefs.length > 1 && (
                  <TabsList variant="line" className="h-8 gap-1 bg-transparent">
                    {tabDefs.map(({ value, label, Icon }) => (
                      <TabsTrigger
                        key={value}
                        value={value}
                        className="h-7 gap-1.5 px-2.5 text-xs font-medium"
                      >
                        <Icon className="size-3.5" />
                        {label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                )}
              </div>
            </div>

            {/* Visual editor stays mounted so Plate keeps its editor view alive. */}
            {visibleTabSet.has('visual') && (
              <TabsContent
                value="visual"
                forceMount
                className="m-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden!"
              >
                <Plate
                  editor={editor}
                  readOnly={readOnly}
                  onValueChange={handleValueChange}
                >
                  {/*
                   * Word-style layout: toolbar pinned to the top of the
                   * editor pane (outside the white A4 sheet) as a
                   * `shrink-0` flex row — no `sticky` needed because the
                   * adjacent canvas takes `flex-1` and owns the scroll.
                   * That way the toolbar never travels with the page;
                   * scroll happens *inside* the editor.
                   */}
                  {!readOnly && (
                    <div className="shrink-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                      <TemplateEditorToolbar
                        variables={variables}
                        helpers={helpers}
                        readOnly={readOnly}
                      />
                    </div>
                  )}
                  <div className="min-h-0 flex-1 overflow-auto bg-muted/30 p-6">
                    <div
                      className="mx-auto rounded-sm bg-white text-zinc-900 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.18)] ring-1 ring-zinc-200"
                      style={{ width: A4_WIDTH_PX, minHeight: A4_HEIGHT_PX }}
                    >
                      <EditorContainer className="!bg-transparent">
                        <Editor
                          placeholder={placeholder}
                          disabled={readOnly}
                          readOnly={readOnly}
                          className="!bg-transparent"
                          style={{
                            minHeight: A4_HEIGHT_PX - 2 * A4_PADDING_PX,
                            padding: `${A4_PADDING_PX}px`,
                          }}
                        />
                      </EditorContainer>
                    </div>
                  </div>
                </Plate>
              </TabsContent>
            )}

            {visibleTabSet.has('code') && (
              <TabsContent
                value="code"
                className="m-0 flex min-h-0 w-full flex-1 overflow-auto"
              >
                <CodeMirror
                  value={templateHtml}
                  extensions={htmlExtension}
                  onChange={handleCodeChange}
                  theme={isDark ? 'dark' : 'light'}
                  editable={!readOnly}
                  readOnly={readOnly}
                  basicSetup={CM_BASIC_SETUP}
                  style={{ minWidth: '100%' }}
                  className="text-sm [&_.cm-editor]:min-w-full"
                />
              </TabsContent>
            )}

            {visibleTabSet.has('data') && (
              <TabsContent
                value="data"
                className="m-0 flex min-h-0 w-full flex-1 overflow-auto"
              >
                <CodeMirror
                  value={dataValue}
                  extensions={jsonExtension}
                  onChange={handleDataChange}
                  theme={isDark ? 'dark' : 'light'}
                  editable={!readOnly && !dataReadOnly}
                  readOnly={readOnly || dataReadOnly}
                  basicSetup={CM_BASIC_SETUP}
                  style={{ minWidth: '100%' }}
                  className="text-sm [&_.cm-editor]:min-w-full"
                />
              </TabsContent>
            )}

            {visibleTabSet.has('preview') && (
              <TabsContent
                value="preview"
                className="m-0 flex min-h-0 flex-1 flex-col"
              >
                <div className="min-h-0 flex-1 overflow-auto bg-muted/30 p-6">
                  {preview?.error ? (
                    <div
                      className="mx-auto flex items-start rounded-sm bg-destructive/5 p-3 ring-1 ring-destructive/20"
                      style={{ width: A4_WIDTH_PX, minHeight: A4_HEIGHT_PX }}
                    >
                      <p className="font-mono text-xs text-destructive">
                        {preview.error}
                      </p>
                    </div>
                  ) : (
                    <iframe
                      title="Template preview"
                      className="mx-auto block border-0 bg-white"
                      srcDoc={buildPreviewSrcDoc(
                        preview?.result ?? '',
                        previewStyles,
                      )}
                      sandbox="allow-same-origin"
                      style={{ width: A4_WIDTH_PX, height: A4_HEIGHT_PX }}
                    />
                  )}
                </div>
              </TabsContent>
            )}

            {visibleTabSet.has('pdf') && (
              <TabsContent
                value="pdf"
                className="m-0 flex min-h-0 flex-1 flex-col"
              >
                {pdf.error ? (
                  <div className="min-h-0 flex-1 overflow-auto bg-muted/30 p-6">
                    <div
                      className="mx-auto flex items-start rounded-sm bg-destructive/5 p-3 ring-1 ring-destructive/20"
                      style={{ width: A4_WIDTH_PX, minHeight: A4_HEIGHT_PX }}
                    >
                      <p className="font-mono text-xs text-destructive">
                        {pdf.error}
                      </p>
                    </div>
                  </div>
                ) : pdf.loading && !pdf.url ? (
                  <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 bg-muted/30 text-muted-foreground">
                    <Loader2Icon className="size-5 animate-spin" />
                    <p className="text-sm">
                      {t(
                        'ui.htmlTemplateEditor.pdfGenerating',
                        'Generating PDF…',
                      )}
                    </p>
                  </div>
                ) : pdf.url ? (
                  <iframe
                    title="Template PDF"
                    src={pdf.url}
                    className="size-full border-0 bg-muted/30"
                  />
                ) : (
                  <div className="flex min-h-0 flex-1 items-center justify-center bg-muted/30 text-sm text-muted-foreground">
                    {t(
                      'ui.htmlTemplateEditor.pdfEmpty',
                      'Nothing to render yet.',
                    )}
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>
          {renderAiAssistant?.({
            open: aiOpen,
            width: aiAssistantWidth,
            onClose: closeAiAssistant,
            html: templateHtml,
            data: dataValue,
          })}
        </div>
      </TooltipProvider>
    </HbsContext>
  )
}
