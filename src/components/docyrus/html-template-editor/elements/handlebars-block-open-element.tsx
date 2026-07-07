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

import { BlockHelperForm } from '../components/block-helper-form'
import { useHbsContext } from '../lib/hbs-context'
import {
  type HandlebarsBlockHelper,
  type THandlebarsBlockOpenElement,
} from '../types'

const HELPER_COLORS: Record<string, string> = {
  if: 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  unless:
    'border-orange-300 bg-orange-50 text-orange-800 dark:border-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  each: 'border-green-300 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-900/30 dark:text-green-300',
  with: 'border-purple-300 bg-purple-50 text-purple-800 dark:border-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
}

const DEFAULT_HELPER_COLOR =
  'border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'

function resolveHelperDefinition(
  name: string,
  helpers: HandlebarsBlockHelper[],
): HandlebarsBlockHelper {
  return helpers.find((h) => h.name === name) ?? { name }
}

export function HandlebarsBlockOpenElement(
  props: PlateElementProps<THandlebarsBlockOpenElement>,
) {
  const { editor, element, children } = props
  const selected = useSelected()
  const focused = useFocused()
  const readOnly = useReadOnly()
  const { helpers } = useHbsContext()

  const [open, setOpen] = useState(false)
  /*
   * Draft expression lives in popover-local state so the user can edit and
   * abandon (Cancel / close) without mutating the slate node. We re-seed
   * from `element.expression` on every open so reopening reflects the
   * current node value (e.g. after an external edit).
   */
  const [draftExpression, setDraftExpression] = useState(element.expression)

  const colorClass = HELPER_COLORS[element.helper] ?? DEFAULT_HELPER_COLOR
  const helperDef = resolveHelperDefinition(element.helper, helpers)

  function handleOpenChange(next: boolean) {
    if (next) setDraftExpression(element.expression)
    setOpen(next)
  }

  function handleSubmit() {
    /*
     * `editor.api.findPath(element)` resolves the element to its current
     * slate Path; using the path (not the element itself) for `at` is the
     * safe pattern when there are multiple structurally identical void
     * inline nodes in the document — e.g. several `{{#each ...}}` chips.
     * Passing the element directly has been observed to non-deterministically
     * patch the wrong chip when more than one block_open exists.
     */
    const path = editor.api.findPath(element)

    if (!path) {
      setOpen(false)

      return
    }
    editor.tf.setNodes({ expression: draftExpression.trim() }, { at: path })
    setOpen(false)
  }

  const chip = (
    <span
      contentEditable={false}
      draggable
      /*
       * Stop pointer events from bubbling — see same guard in
       * handlebars-variable-element.tsx for the full reasoning. Prevents
       * Plate's table cell-selection floating toolbar from appearing
       * alongside this chip's edit popover.
       */
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      title={`Block helper open: {{#${element.helper}${element.expression ? ` ${element.expression}` : ''}}}${readOnly ? '' : ' (click to edit)'}`}
      className={cn(
        'relative inline-flex select-none items-center gap-1',
        'mx-0.5 rounded-md border px-2 py-0 align-middle text-xs font-mono font-medium',
        colorClass,
        'transition-colors',
        readOnly
          ? 'cursor-default'
          : 'cursor-pointer hover:ring-1 hover:ring-ring/40',
        selected && focused && 'ring-2 ring-ring ring-offset-1',
      )}
    >
      <span aria-hidden="true">
        <span className="opacity-60">{'{{#'}</span>
        <span className="font-semibold">{element.helper}</span>
        {element.expression && (
          <span className="ml-1 opacity-75">{element.expression}</span>
        )}
        <span className="opacity-60">{'}}'}</span>
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
        /*
         * `data-hbs-marker` is a CSS hook used by `html-template-editor.tsx`
         * to detect that this chip is sitting alone inside a synthetic
         * `<tr><td>` shell (the transport mechanism that keeps chips
         * anchored between table rows) — when so, the surrounding row gets
         * minimal styling so the shell doesn't look like a fat empty row.
         */
        'data-hbs-marker': 'block-open',
      }}
    >
      {readOnly ? (
        chip
      ) : (
        <Popover open={open} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>{chip}</PopoverTrigger>
          <PopoverContent
            className="w-80 p-0"
            align="start"
            side="top"
            sideOffset={6}
            collisionPadding={8}
          >
            <BlockHelperForm
              helper={helperDef}
              expression={draftExpression}
              onExpressionChange={setDraftExpression}
              onCancel={() => setOpen(false)}
              onSubmit={handleSubmit}
              submitLabel="Save"
            />
          </PopoverContent>
        </Popover>
      )}
      {children}
    </PlateElement>
  )
}
