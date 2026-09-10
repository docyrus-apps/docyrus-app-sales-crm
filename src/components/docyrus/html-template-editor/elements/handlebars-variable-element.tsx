'use client'

// @ts-nocheck
/* eslint-disable */
import { useState } from 'react'

import {
  type PlateElementProps,
  PlateElement,
  useFocused,
  useReadOnly,
  useSelected,
} from 'platejs/react'

import { cn } from '@/lib/utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

import { VariablePicker } from '../components/variable-picker'
import { useHbsContext } from '../lib/hbs-context'
import { type THandlebarsVariableElement } from '../types'

/*
 * Deterministic color from category string — cycles through a fixed palette
 * so the same category always gets the same color across renders.
 */
const CATEGORY_COLORS = [
  'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300',
]

const DEFAULT_COLOR =
  'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300'

function categoryColor(category: string | undefined): string {
  if (!category) return DEFAULT_COLOR

  let hash = 0

  for (let i = 0; i < category.length; i++) {
    hash = (hash * 31 + category.charCodeAt(i)) & 0xff_ff_ff_ff
  }

  return (
    CATEGORY_COLORS[Math.abs(hash) % CATEGORY_COLORS.length] ?? DEFAULT_COLOR
  )
}

export function HandlebarsVariableElement(
  props: PlateElementProps<THandlebarsVariableElement>,
) {
  const { editor, element, children } = props
  const selected = useSelected()
  const focused = useFocused()
  const readOnly = useReadOnly()
  const { variables } = useHbsContext()

  const [open, setOpen] = useState(false)

  const varDef = variables.find((v) => v.name === element.name)
  const displayLabel = varDef?.label ?? element.name
  const colorClass = categoryColor(varDef?.category)
  const { bold, italic, underline, strikethrough, code } = element

  /*
   * Update the slate node's `name` in-place — pass the element itself as
   * `at`. This is Plate's canonical inline-void edit pattern (see
   * `date-node.tsx`); it's more robust than `findPath` + path because
   * Plate resolves `element` against its internal NodeEntry map, which
   * stays valid across re-renders. `setNodes` merges props, so bold /
   * italic / underline marks on the chip survive the swap.
   */
  function handleSelect(nextName: string) {
    editor.tf.setNodes({ name: nextName }, { at: element })
    setOpen(false)
  }

  const chip = (
    <span
      contentEditable={false}
      draggable
      /*
       * Stop pointer events from bubbling to the surrounding `<td>` / `<tr>` —
       * Plate's table plugin listens on mousedown to spawn the cell-selection
       * floating toolbar (paint/delete/arrows). Without this guard, clicking
       * any chip inside a table cell pops BOTH the variable picker AND that
       * toolbar simultaneously. Radix's `PopoverTrigger asChild` composes its
       * own handler on top of ours, so the popover still opens normally.
       */
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      title={`{{${element.name}}}${varDef?.description ? ` — ${varDef.description}` : ''}${readOnly ? '' : ' (click to edit)'}`}
      className={cn(
        'relative inline-flex select-none items-center gap-0.5',
        'mx-0.5 rounded-md border px-1.5 py-0 align-middle text-xs font-medium',
        colorClass,
        'transition-colors',
        readOnly
          ? 'cursor-default'
          : 'cursor-pointer hover:ring-1 hover:ring-ring/40',
        bold && 'font-bold',
        italic && 'italic',
        underline && 'underline underline-offset-2',
        strikethrough && 'line-through',
        code && 'font-mono',
        selected && focused && 'ring-2 ring-ring ring-offset-1',
      )}
    >
      <span aria-hidden="true">
        <span className={cn('font-mono', bold ? 'opacity-60' : 'opacity-50')}>
          {'{{'}
        </span>
        <span>{displayLabel}</span>
        <span className={cn('font-mono', bold ? 'opacity-60' : 'opacity-50')}>
          {'}}'}
        </span>
      </span>
    </span>
  )

  return (
    <PlateElement
      {...props}
      as="span"
      className="inline-block"
      attributes={{
        ...props.attributes,
        contentEditable: false,
      }}
    >
      {readOnly ? (
        chip
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>{chip}</PopoverTrigger>
          <PopoverContent
            className="w-64 p-0"
            align="start"
            side="top"
            sideOffset={6}
            collisionPadding={8}
          >
            <VariablePicker
              variables={variables}
              currentName={element.name}
              onSelect={handleSelect}
            />
          </PopoverContent>
        </Popover>
      )}
      {children}
    </PlateElement>
  )
}
