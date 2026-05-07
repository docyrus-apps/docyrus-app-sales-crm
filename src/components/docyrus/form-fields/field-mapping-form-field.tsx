'use client'

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
  type KeyboardEvent,
} from 'react'

import { cn } from '@/lib/utils'
import { Field, FieldError } from '@/components/ui/field'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

import { type IField } from './types'

import { FormFieldLabel } from './form-field-label'

/*
 * ---------------------------------------------------------------------------
 * Public types
 * ---------------------------------------------------------------------------
 */

export interface AvailableField {
  /** Slug / identifier used in the encoded value */
  name: string
  /** Human-readable label shown in dropdowns */
  label: string
  type: string
  icon?: string
}

export interface FieldMappingFormFieldProps {
  field: IField
  form: any
  disabled?: boolean
  required?: boolean
  className?: string
  /** Selectable fields for Field Mapping / Template / Formula tabs */
  availableFields?: AvailableField[]
  /**
   * Which tabs are shown. Defaults to all four.
   * The first enabled tab is used as the fallback when the current value
   * doesn't match any of the enabled modes.
   */
  modes?: MappingTab[]
  /**
   * The original form field component shown in the Fixed Value tab.
   * It must handle its own form.Field subscription internally.
   */
  children: ReactNode
}

/*
 * ---------------------------------------------------------------------------
 * Shared types
 * ---------------------------------------------------------------------------
 */

export type MappingTab = 'fixed' | 'field-mapping' | 'template' | 'formula'

interface MentionState {
  query: string
  top: number
  left: number
  atIndex: number
  textNode: Text
  cursorPos: number
}

/*
 * ---------------------------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------------------------
 */

function detectTab(value: unknown): MappingTab {
  if (typeof value === 'string') {
    if (value.startsWith('#FIELD=')) return 'field-mapping'
    if (value.startsWith('#TEMPLATE=')) return 'template'
    if (value.startsWith('#FORMULA=')) return 'formula'
  }

  return 'fixed'
}

function stripPrefix(value: string, prefix: string): string {
  return value.startsWith(prefix) ? value.slice(prefix.length) : value
}

const MENTION_SPAN_CLASS =
  'inline-flex items-center rounded bg-primary/10 text-primary px-1 py-0.5 text-xs font-medium mx-0.5 select-none'

function buildMentionSpan(af: AvailableField): HTMLSpanElement {
  const span = document.createElement('span')

  span.setAttribute('data-field-name', af.name)
  span.setAttribute('data-field-label', af.label)
  span.setAttribute('data-field-type', af.type)
  if (af.icon) span.setAttribute('data-field-icon', af.icon)
  span.setAttribute('contenteditable', 'false')
  span.className = MENTION_SPAN_CLASS
  span.textContent = `@${af.label}`

  return span
}

/**
 * Populate the editor from a stored HTML string using strict allowlist parsing.
 * Only text nodes, <br> elements, and our own data-field-name span elements
 * are reconstructed — everything else is discarded, preventing XSS.
 */
function loadSanitizedHtml(editor: HTMLDivElement, html: string) {
  while (editor.firstChild) editor.removeChild(editor.firstChild)
  if (!html) return

  const parser = new DOMParser()
  const doc = parser.parseFromString(`<body>${html}</body>`, 'text/html')

  function cloneAllowed(node: Node): Node | null {
    if (node.nodeType === Node.TEXT_NODE) {
      return document.createTextNode(node.textContent ?? '')
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return null

    const el = node as Element
    const tag = el.tagName.toLowerCase()

    if (tag === 'br') {
      return document.createElement('br')
    }

    if (tag === 'span' && el.hasAttribute('data-field-name')) {
      const fieldName = el.getAttribute('data-field-name') ?? ''
      const fieldLabel = el.getAttribute('data-field-label') ?? fieldName
      const fieldType = el.getAttribute('data-field-type') ?? ''
      const fieldIcon = el.getAttribute('data-field-icon')

      const span = document.createElement('span')

      span.setAttribute('data-field-name', fieldName)
      span.setAttribute('data-field-label', fieldLabel)
      span.setAttribute('data-field-type', fieldType)
      if (fieldIcon) span.setAttribute('data-field-icon', fieldIcon)
      span.setAttribute('contenteditable', 'false')
      span.className = MENTION_SPAN_CLASS
      span.textContent = `@${fieldLabel}`

      return span
    }

    if (tag === 'div' || tag === 'p') {
      const frag = document.createDocumentFragment()

      for (const child of el.childNodes) {
        const cloned = cloneAllowed(child)

        if (cloned) frag.appendChild(cloned)
      }
      frag.appendChild(document.createElement('br'))

      return frag
    }

    return null
  }

  for (const child of doc.body.childNodes) {
    const cloned = cloneAllowed(child)

    if (cloned) editor.appendChild(cloned)
  }
}

/*
 * ---------------------------------------------------------------------------
 * MentionEditor — contenteditable with @ autocomplete
 * ---------------------------------------------------------------------------
 */

interface MentionEditorProps {
  /** Raw HTML string (prefix already stripped) */
  initialHtml: string
  prefix: string
  placeholder: string
  availableFields: AvailableField[]
  disabled?: boolean
  onChange: (encodedValue: string) => void
  onBlur?: () => void
}

function MentionEditor({
  initialHtml,
  prefix,
  placeholder,
  availableFields,
  disabled,
  onChange,
  onBlur,
}: MentionEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [mention, setMention] = useState<MentionState | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const mentionRef = useRef<MentionState | null>(null)
  /*
   * Snapshot initialHtml at mount time — ref stays stable, so the mount
   * effect below won't re-run if the prop changes after tab-open
   */
  const initialHtmlRef = useRef(initialHtml)

  mentionRef.current = mention

  useEffect(() => {
    if (editorRef.current) {
      loadSanitizedHtml(editorRef.current, initialHtmlRef.current)
    }
  }, [])

  const filteredFields = useMemo(() => {
    if (mention === null) return []

    const query = mention.query.toLowerCase()

    return availableFields.filter(
      (f) =>
        f.label.toLowerCase().includes(query) ||
        f.name.toLowerCase().includes(query),
    )
  }, [mention, availableFields])

  const emitChange = useCallback(() => {
    if (!editorRef.current) return
    onChange(prefix + editorRef.current.innerHTML)
  }, [onChange, prefix])

  const closeMention = useCallback(() => {
    setMention(null)
    setSelectedIndex(0)
  }, [])

  const insertMention = useCallback(
    (af: AvailableField) => {
      const m = mentionRef.current

      if (!m || !editorRef.current) return

      const { textNode, atIndex, cursorPos } = m

      textNode.deleteData(atIndex, cursorPos - atIndex)

      const afterText = textNode.splitText(atIndex)
      const span = buildMentionSpan(af)
      const parent = textNode.parentNode

      if (!parent) return

      parent.insertBefore(span, afterText)

      const sel = window.getSelection()

      if (sel) {
        const range = document.createRange()

        range.setStart(afterText, 0)
        range.collapse(true)
        sel.removeAllRanges()
        sel.addRange(range)
      }

      emitChange()
      closeMention()
      editorRef.current.focus()
    },
    [emitChange, closeMention],
  )

  const handleInput = useCallback(() => {
    emitChange()

    const sel = window.getSelection()

    if (!sel?.rangeCount) {
      closeMention()

      return
    }

    const range = sel.getRangeAt(0)

    if (range.startContainer.nodeType !== Node.TEXT_NODE) {
      closeMention()

      return
    }

    const textNode = range.startContainer as Text
    const text = textNode.textContent ?? ''
    const pos = range.startOffset
    const beforeCursor = text.slice(0, pos)
    const atIdx = beforeCursor.lastIndexOf('@')

    if (atIdx === -1 || beforeCursor.slice(atIdx + 1).includes(' ')) {
      closeMention()

      return
    }

    const query = beforeCursor.slice(atIdx + 1)
    let top = 24
    let left = 0

    try {
      const caretRange = range.cloneRange()

      caretRange.collapse(true)
      const caretRect = caretRange.getBoundingClientRect()
      const editor = editorRef.current

      if (editor) {
        const editorRect = editor.getBoundingClientRect()

        top = caretRect.bottom - editorRect.top + 4
        left = Math.max(0, caretRect.left - editorRect.left)
      }
    } catch {}

    setMention({
      query,
      top,
      left,
      atIndex: atIdx,
      textNode,
      cursorPos: pos,
    })
    setSelectedIndex(0)
  }, [emitChange, closeMention])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (!mention || filteredFields.length === 0) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, filteredFields.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const selected = filteredFields[selectedIndex]

        if (selected) insertMention(selected)
      } else if (e.key === 'Escape') {
        closeMention()
      }
    },
    [mention, filteredFields, selectedIndex, insertMention, closeMention],
  )

  return (
    <div className="relative">
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onBlur={onBlur}
        suppressContentEditableWarning
        data-placeholder={placeholder}
        className={cn(
          'min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm leading-relaxed outline-none transition-[color,box-shadow]',
          'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
          'empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground empty:before:pointer-events-none',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      />

      {mention !== null && filteredFields.length > 0 && (
        <div
          className="absolute z-50 min-w-[180px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
          style={{ top: mention.top, left: mention.left }}
        >
          {filteredFields.map((af, i) => (
            <button
              key={af.name}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                insertMention(af)
              }}
              className={cn(
                'flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-accent',
                i === selectedIndex && 'bg-accent',
              )}
            >
              {af.icon && (
                <span className="shrink-0 text-muted-foreground">
                  {af.icon}
                </span>
              )}
              <span className="flex-1 truncate text-left">{af.label}</span>
              <span className="shrink-0 font-mono text-muted-foreground opacity-60">
                {af.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/*
 * ---------------------------------------------------------------------------
 * FieldMappingSelector — Field Mapping tab
 * ---------------------------------------------------------------------------
 */

interface FieldMappingSelectorProps {
  fieldConfig: IField
  field: any
  availableFields: AvailableField[]
  required?: boolean
  disabled?: boolean
}

function FieldMappingSelector({
  fieldConfig,
  field,
  availableFields,
  required,
  disabled,
}: FieldMappingSelectorProps) {
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
  const currentSlug =
    typeof field.state.value === 'string'
      ? stripPrefix(field.state.value, '#FIELD=')
      : ''

  return (
    <Field data-invalid={isInvalid}>
      <FormFieldLabel required={required}>{fieldConfig.name}</FormFieldLabel>
      <div className="flex flex-col gap-1 rounded-md border border-input p-1">
        {availableFields.length === 0 && (
          <p className="px-2 py-3 text-xs text-muted-foreground">
            No available fields
          </p>
        )}
        {availableFields.map((af) => (
          <button
            key={af.name}
            type="button"
            disabled={disabled}
            onClick={() => field.handleChange(`#FIELD=${af.name}`)}
            className={cn(
              'flex items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors hover:bg-accent',
              currentSlug === af.name &&
                'bg-primary/10 text-primary font-medium',
            )}
          >
            {af.icon && (
              <span className="shrink-0 text-muted-foreground">{af.icon}</span>
            )}
            <span className="flex-1 truncate text-left">{af.label}</span>
            <span className="shrink-0 font-mono text-muted-foreground opacity-60">
              {af.name}
            </span>
          </button>
        ))}
      </div>
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  )
}

/*
 * ---------------------------------------------------------------------------
 * TemplateMentionField — Template / Formula tab
 * ---------------------------------------------------------------------------
 */

interface TemplateMentionFieldProps {
  fieldConfig: IField
  field: any
  availableFields: AvailableField[]
  prefix: '#TEMPLATE=' | '#FORMULA='
  placeholder: string
  required?: boolean
  disabled?: boolean
}

function TemplateMentionField({
  fieldConfig,
  field,
  availableFields,
  prefix,
  placeholder,
  required,
  disabled,
}: TemplateMentionFieldProps) {
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
  const rawHtml =
    typeof field.state.value === 'string'
      ? stripPrefix(field.state.value, prefix)
      : ''

  return (
    <Field data-invalid={isInvalid}>
      <FormFieldLabel required={required}>{fieldConfig.name}</FormFieldLabel>
      <MentionEditor
        initialHtml={rawHtml}
        prefix={prefix}
        placeholder={placeholder}
        availableFields={availableFields}
        disabled={disabled}
        onChange={field.handleChange}
        onBlur={field.handleBlur}
      />
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  )
}

/*
 * ---------------------------------------------------------------------------
 * FieldMappingFormField — main export
 * ---------------------------------------------------------------------------
 */

const ALL_TABS: { value: MappingTab; label: string }[] = [
  { value: 'fixed', label: 'Fixed Value' },
  { value: 'field-mapping', label: 'Field Mapping' },
  { value: 'template', label: 'Template' },
  { value: 'formula', label: 'Formula' },
]

export function FieldMappingFormField({
  field: fieldConfig,
  form,
  disabled,
  required,
  className,
  availableFields = [],
  modes,
  children,
}: FieldMappingFormFieldProps) {
  const enabledTabs = modes
    ? ALL_TABS.filter((t) => modes.includes(t.value))
    : ALL_TABS

  const [tab, setTab] = useState<MappingTab>(() => {
    const detected = detectTab(form.getFieldValue?.(fieldConfig.slug))

    return enabledTabs.some((t) => t.value === detected)
      ? detected
      : (enabledTabs[0]?.value ?? 'fixed')
  })

  const handleTabChange = useCallback(
    (newTab: string) => {
      const next = newTab as MappingTab
      const currentValue =
        (form.getFieldValue?.(fieldConfig.slug) as string) ?? ''
      const currentTab = detectTab(currentValue)

      if (currentTab !== next) {
        if (next === 'template') {
          form.setFieldValue?.(fieldConfig.slug, '#TEMPLATE=')
        } else if (next === 'formula') {
          form.setFieldValue?.(fieldConfig.slug, '#FORMULA=')
        } else {
          form.setFieldValue?.(fieldConfig.slug, '')
        }
      }

      setTab(next)
    },
    [form, fieldConfig.slug],
  )

  if (enabledTabs.length === 1 && enabledTabs[0]) {
    const only = enabledTabs[0].value

    if (only === 'fixed') return children
    if (only === 'field-mapping') {
      return (
        <form.Field
          name={fieldConfig.slug}
          children={(field: any) => (
            <FieldMappingSelector
              fieldConfig={fieldConfig}
              field={field}
              availableFields={availableFields}
              required={required}
              disabled={disabled}
            />
          )}
        />
      )
    }
    if (only === 'template' || only === 'formula') {
      const prefix =
        only === 'template' ? ('#TEMPLATE=' as const) : ('#FORMULA=' as const)
      const placeholder =
        only === 'template'
          ? 'Type your template… use @ to insert a field'
          : 'Type your formula… use @ to insert a field'

      return (
        <form.Field
          name={fieldConfig.slug}
          children={(field: any) => (
            <TemplateMentionField
              fieldConfig={fieldConfig}
              field={field}
              availableFields={availableFields}
              prefix={prefix}
              placeholder={placeholder}
              required={required}
              disabled={disabled}
            />
          )}
        />
      )
    }
  }

  return (
    <div className={className}>
      <Tabs value={tab} onValueChange={handleTabChange}>
        <TabsList
          variant="line"
          className="mb-1 h-7 w-full justify-start gap-0 rounded-none border-b border-input bg-transparent p-0"
        >
          {enabledTabs.map(({ value, label }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="h-7 rounded-none px-2.5 text-[11px]"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Fixed Value — render the wrapped field component as-is */}
        {enabledTabs.some((t) => t.value === 'fixed') && (
          <TabsContent value="fixed" className="mt-0">
            {children}
          </TabsContent>
        )}

        {/* Field Mapping — select a field from the list */}
        {enabledTabs.some((t) => t.value === 'field-mapping') && (
          <TabsContent value="field-mapping" className="mt-0">
            <form.Field
              name={fieldConfig.slug}
              children={(field: any) => (
                <FieldMappingSelector
                  fieldConfig={fieldConfig}
                  field={field}
                  availableFields={availableFields}
                  required={required}
                  disabled={disabled}
                />
              )}
            />
          </TabsContent>
        )}

        {/* Template — contenteditable with @ field mentions */}
        {enabledTabs.some((t) => t.value === 'template') && (
          <TabsContent value="template" className="mt-0">
            <form.Field
              name={fieldConfig.slug}
              children={(field: any) => (
                <TemplateMentionField
                  fieldConfig={fieldConfig}
                  field={field}
                  availableFields={availableFields}
                  prefix="#TEMPLATE="
                  placeholder="Type your template… use @ to insert a field"
                  required={required}
                  disabled={disabled}
                />
              )}
            />
          </TabsContent>
        )}

        {/* Formula — same editor, different prefix */}
        {enabledTabs.some((t) => t.value === 'formula') && (
          <TabsContent value="formula" className="mt-0">
            <form.Field
              name={fieldConfig.slug}
              children={(field: any) => (
                <TemplateMentionField
                  fieldConfig={fieldConfig}
                  field={field}
                  availableFields={availableFields}
                  prefix="#FORMULA="
                  placeholder="Type your formula… use @ to insert a field"
                  required={required}
                  disabled={disabled}
                />
              )}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
