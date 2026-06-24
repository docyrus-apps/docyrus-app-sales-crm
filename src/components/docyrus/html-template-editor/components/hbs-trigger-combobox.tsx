'use client'

// @ts-nocheck
/* eslint-disable */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { createPortal } from 'react-dom'

import { useEditorRef, useEditorSelector } from 'platejs/react'

import { cn } from '@/lib/utils'

import {
  HBS_BLOCK_CLOSE_KEY,
  HBS_BLOCK_OPEN_KEY,
  HBS_ELSE_KEY,
  HBS_VARIABLE_KEY,
  HBS_VARIABLE_MARK_KEYS,
  type HandlebarsBlockHelper,
  type HandlebarsVariable,
} from '../types'

/* ── Types ── */

interface ComboboxItem {
  id: string
  label: string
  preview: string
  description?: string
  type: 'variable' | 'block_open' | 'block_close' | 'else'
  helper?: string
  expression?: string
}

interface TriggerState {
  query: string
  startOffset: number
}

/* ── Detect {{ trigger in current text leaf ── */

function getTriggerState(editor: any): TriggerState | null {
  const sel = editor.selection

  if (!sel) return null

  const { focus, anchor } = sel
  const sameOffset = focus.offset === anchor.offset
  const samePath =
    focus.path.length === anchor.path.length &&
    focus.path.every((v: number, i: number) => v === anchor.path[i])

  if (!sameOffset || !samePath) return null

  /* Walk editor.children to reach the leaf */
  let current: any = editor

  for (const idx of focus.path) {
    current = current.children?.[idx]
    if (!current) return null
  }

  if (typeof current.text !== 'string') return null

  const textBefore = current.text.slice(0, focus.offset)
  const match = /\{\{([^{}\n]*)$/.exec(textBefore)

  if (!match) return null

  return { query: (match[1] ?? '').toLowerCase(), startOffset: match.index }
}

/* ── Build item list from variables + helpers ── */

function buildItems(
  variables: HandlebarsVariable[],
  helpers: HandlebarsBlockHelper[],
): ComboboxItem[] {
  const items: ComboboxItem[] = []

  for (const v of variables) {
    items.push({
      id: v.name,
      label: v.label ?? v.name,
      preview: `{{${v.name}}}`,
      description: v.description ?? v.category,
      type: 'variable',
    })
  }

  items.push({
    id: '__else',
    label: 'else',
    preview: '{{else}}',
    description: 'Conditional else branch',
    type: 'else',
  })

  for (const h of helpers) {
    items.push({
      id: `#${h.name}`,
      label: `#${h.name}`,
      preview: `{{#${h.name} …}}`,
      description: h.description ?? h.label,
      type: 'block_open',
      helper: h.name,
      expression: h.defaultExpression ?? '',
    })
    items.push({
      id: `/${h.name}`,
      label: `/${h.name}`,
      preview: `{{/${h.name}}}`,
      description: `Close ${h.name} block`,
      type: 'block_close',
      helper: h.name,
    })
  }

  return items
}

function filterItems(items: ComboboxItem[], query: string): ComboboxItem[] {
  if (!query) return items

  const q = query.toLowerCase()

  return items.filter(
    (item) =>
      item.id.toLowerCase().includes(q) ||
      item.label.toLowerCase().includes(q) ||
      (item.description?.toLowerCase().includes(q) ?? false),
  )
}

/* ── Insert selected item into editor ── */

function applyItem(editor: any, item: ComboboxItem, startOffset: number) {
  const sel = editor.selection

  if (!sel) return

  const { path, offset: endOffset } = sel.focus

  editor.tf.delete({
    at: {
      anchor: { path, offset: startOffset },
      focus: { path, offset: endOffset },
    },
  })

  let chipNode: any

  if (item.type === 'variable') {
    const pendingMarks = (editor.marks ?? {}) as Record<string, unknown>
    const variableMarks: Record<string, true> = {}

    for (const key of HBS_VARIABLE_MARK_KEYS) {
      if (pendingMarks[key]) variableMarks[key] = true
    }
    chipNode = {
      type: HBS_VARIABLE_KEY,
      name: item.id,
      ...variableMarks,
      children: [{ text: '' }],
    }
  } else if (item.type === 'else') {
    chipNode = { type: HBS_ELSE_KEY, children: [{ text: '' }] }
  } else if (item.type === 'block_open') {
    chipNode = {
      type: HBS_BLOCK_OPEN_KEY,
      helper: item.helper ?? '',
      expression: item.expression ?? '',
      children: [{ text: '' }],
    }
  } else {
    chipNode = {
      type: HBS_BLOCK_CLOSE_KEY,
      helper: item.helper ?? '',
      children: [{ text: '' }],
    }
  }

  editor.tf.insertNodes([chipNode, { text: ' ' }], {
    at: { path, offset: startOffset },
  })
}

/* ── Combobox inner (rendered inside portal, has editor context) ── */

interface ComboboxInnerProps {
  variables: HandlebarsVariable[]
  helpers: HandlebarsBlockHelper[]
}

function ComboboxInner({ variables, helpers }: ComboboxInnerProps) {
  const editorRef = useEditorRef()

  const triggerState = useEditorSelector<TriggerState | null>(
    (ed) => getTriggerState(ed as any),
    [],
  )

  const [activeIndex, setActiveIndex] = useState(0)
  const buttonListRef = useRef<(HTMLButtonElement | null)[]>([])

  const allItems = useMemo(
    () => buildItems(variables, helpers),
    [variables, helpers],
  )

  const items = useMemo(
    () => (triggerState ? filterItems(allItems, triggerState.query) : []),
    [allItems, triggerState],
  )

  const isOpen = !!triggerState && items.length > 0

  const rect = (() => {
    if (!isOpen) return null

    const domSel = window.getSelection()

    if (!domSel || domSel.rangeCount === 0) return null

    return domSel.getRangeAt(0).getBoundingClientRect()
  })()

  const clampedActiveIndex =
    items.length === 0 ? 0 : Math.min(activeIndex, items.length - 1)

  /* Scroll active item into view */
  useEffect(() => {
    buttonListRef.current[clampedActiveIndex]?.scrollIntoView({
      block: 'nearest',
    })
  }, [clampedActiveIndex])

  const selectItem = useCallback(
    (item: ComboboxItem) => {
      if (!triggerState) return
      applyItem(editorRef as any, item, triggerState.startOffset)
    },
    [editorRef, triggerState],
  )

  /* Keyboard navigation — capture phase so Plate doesn't see these keys */
  useEffect(() => {
    if (!isOpen) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, items.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        const item = items[clampedActiveIndex]

        if (item) {
          e.preventDefault()
          selectItem(item)
        }
      }
    }

    window.addEventListener('keydown', onKeyDown, true)

    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [isOpen, items, clampedActiveIndex, selectItem])

  if (!isOpen || !rect) return null

  return (
    <div
      className="pointer-events-auto fixed z-[9999] w-60"
      style={{ top: rect.bottom + 6, left: Math.max(rect.left, 8) }}
    >
      <div className="max-h-64 overflow-y-auto rounded-md border bg-popover shadow-lg ring-1 ring-black/5">
        <div className="p-1">
          {items.map((item, index) => (
            <button
              key={item.id}
              ref={(itemButtonRef) => {
                buttonListRef.current[index] = itemButtonRef
              }}
              type="button"
              className={cn(
                'flex w-full flex-col gap-0.5 rounded-sm px-2 py-1.5 text-left transition-colors',
                index === clampedActiveIndex
                  ? 'bg-accent text-accent-foreground'
                  : 'text-popover-foreground hover:bg-accent/60',
              )}
              onMouseDown={(e) => {
                e.preventDefault()
                selectItem(item)
              }}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <span className="font-mono text-xs font-semibold">
                {item.preview}
              </span>
              {item.description && (
                <span className="text-[11px] text-muted-foreground leading-tight">
                  {item.description}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Portal wrapper — escapes editor container stacking context ── */

export interface HbsTriggerComboboxProps {
  variables: HandlebarsVariable[]
  helpers: HandlebarsBlockHelper[]
}

export function HbsTriggerCombobox({
  variables,
  helpers,
}: HbsTriggerComboboxProps) {
  if (typeof document === 'undefined') return null

  return createPortal(
    <ComboboxInner variables={variables} helpers={helpers} />,
    document.body,
  )
}
