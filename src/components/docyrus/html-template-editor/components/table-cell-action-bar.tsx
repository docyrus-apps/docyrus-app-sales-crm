'use client'

// @ts-nocheck
/* eslint-disable */
import { useState } from 'react'

import { BracesIcon, CodeIcon } from 'lucide-react'
import { useEditorRef, useEditorSelector, useReadOnly } from 'platejs/react'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

import {
  HBS_BLOCK_CLOSE_KEY,
  HBS_BLOCK_OPEN_KEY,
  HBS_VARIABLE_KEY,
  HBS_VARIABLE_MARK_KEYS,
  type HandlebarsBlockHelper,
} from '../types'
import { useHbsContext } from '../lib/hbs-context'

import { BlockHelperForm } from './block-helper-form'
import { VariablePicker } from './variable-picker'

/*
 * Floating action bar that appears above the active `<td>` / `<th>` cell
 * while the cursor sits inside a table. Replaces Plate's default
 * cell-selection toolbar (paint / delete column / insert row / …) which
 * we hide via CSS — its destructive buttons were trimming columns out of
 * `{{#each}}` tables, and the toolbar persisted across tab switches.
 *
 * This bar is template-aware: it only surfaces the two operations that
 * make sense inside an HBS-driven table cell:
 *
 *   1. **Insert Variable** — drops a `{{var}}` chip at the cursor.
 *   2. **Wrap with Block helper** — inserts a `{{#each}} … {{/each}}` /
 *      `{{#if}} … {{/if}}` / `{{#with}}` / `{{#unless}}` pair around the
 *      cursor position. The opener and closer are added to the cell's
 *      inline flow so the user can drop body content between them.
 *
 * Destructive operations (delete column / row) are deliberately omitted —
 * they don't compose with the `{{#each}}` round-trip pipeline (see
 * `lib/serialize.ts`'s `serializeChildren` and the thead/tbody heuristic).
 */
export function TableCellActionBar() {
  const editor = useEditorRef()
  const readOnly = useReadOnly()
  const { helpers } = useHbsContext()

  /*
   * Locate the deepest `<td>` / `<th>` ancestor of the current selection.
   * `useEditorSelector` re-runs only when this lookup's result identity
   * changes — so typing inside the cell doesn't re-render the bar on every
   * keystroke.
   */
  const cellEntry = useEditorSelector(
    (e) => {
      if (!e.selection || readOnly) return null
      const entry = e.api.above({
        match: (n: unknown) => {
          if (!n || typeof n !== 'object' || !('type' in n)) return false
          const t = (n as { type: unknown }).type

          return t === 'td' || t === 'th'
        },
      })

      return entry ?? null
    },
    [readOnly],
  )

  const anchorElement = cellEntry ? editor.api.toDOMNode(cellEntry[0]) : null

  /*
   * Sub-popover state for the two actions. Only one is open at a time;
   * opening one closes the other so the bar UI stays uncluttered.
   */
  const [openAction, setOpenAction] = useState<'variable' | 'block' | null>(
    null,
  )

  if (!anchorElement) return null

  return (
    <Popover open={!!anchorElement} modal={false}>
      <PopoverAnchor virtualRef={{ current: anchorElement }} />
      <PopoverContent
        side="top"
        align="start"
        sideOffset={6}
        collisionPadding={8}
        onOpenAutoFocus={(e) => e.preventDefault()}
        /*
         * `z-40` keeps the bar *below* its own sub-popovers (variable
         * picker / block helper form, which inherit Radix's default
         * `z-50`). The bar's portal often re-mounts on selection change
         * — without an explicit z-index it would end up later in the
         * body's DOM and visually win against a sub-popover that opened
         * earlier, overlapping the picker dropdown.
         */
        className="z-40 flex w-auto flex-row gap-1 p-1"
        /*
         * Prevent the popover from stealing pointer focus from the slate
         * editor — clicking a button inside it shouldn't move the
         * selection out of the cell. Each button still handles its own
         * click normally.
         */
        onMouseDown={(e) => e.preventDefault()}
      >
        <VariableAction
          open={openAction === 'variable'}
          onOpenChange={(next) => setOpenAction(next ? 'variable' : null)}
        />
        <BlockAction
          helpers={helpers}
          open={openAction === 'block'}
          onOpenChange={(next) => setOpenAction(next ? 'block' : null)}
        />
      </PopoverContent>
    </Popover>
  )
}

interface ActionPopoverProps {
  open: boolean
  onOpenChange: (next: boolean) => void
}

function VariableAction({ open, onOpenChange }: ActionPopoverProps) {
  const editor = useEditorRef()
  const { variables } = useHbsContext()

  function insertVariable(name: string) {
    editor.tf.focus()
    /*
     * Apply Slate's pending text-mark state to the new chip so the user's
     * pre-toggled bold/italic/etc. carries onto the inserted variable.
     * Mirrors the behavior in `InsertVariablePopover`.
     */
    const pendingMarks =
      (editor as { marks?: Record<string, unknown> }).marks ?? {}
    const variableMarks: Record<string, true> = {}

    for (const key of HBS_VARIABLE_MARK_KEYS) {
      if (pendingMarks[key]) variableMarks[key] = true
    }
    editor.tf.insertNodes([
      {
        type: HBS_VARIABLE_KEY,
        name,
        ...variableMarks,
        children: [{ text: '' }],
      },
      { text: ' ' },
    ])
    onOpenChange(false)
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 gap-1.5 px-2 text-xs font-medium text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20"
          title="Insert variable into this cell"
          aria-label="Insert variable into this cell"
        >
          <BracesIcon className="size-3.5" />
          Değişken
        </Button>
      </PopoverTrigger>
      <PopoverContent
        /*
         * Open below the action bar (bar is above the cell, so "bottom"
         * lands the picker over the cell content itself). Going `side=top`
         * here would collision-flip onto the bar — Radix renders both
         * popovers with `z-50` so the bar ends up *over* the picker.
         * Bottom keeps them stacked vertically with no overlap.
         */
        className="w-64 p-0"
        align="start"
        side="bottom"
        sideOffset={6}
        collisionPadding={8}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <VariablePicker variables={variables} onSelect={insertVariable} />
      </PopoverContent>
    </Popover>
  )
}

interface BlockActionProps extends ActionPopoverProps {
  helpers: HandlebarsBlockHelper[]
}

function BlockAction({ helpers, open, onOpenChange }: BlockActionProps) {
  const editor = useEditorRef()
  const [selectedHelper, setSelectedHelper] =
    useState<HandlebarsBlockHelper | null>(null)
  const [expression, setExpression] = useState('')

  function reset() {
    setSelectedHelper(null)
    setExpression('')
  }

  function handleSelectHelper(helper: HandlebarsBlockHelper) {
    setSelectedHelper(helper)
    setExpression(helper.defaultExpression ?? '')
  }

  function handleInsert() {
    if (!selectedHelper) return
    editor.tf.focus()
    /*
     * Insert the `{{#helper expr}}` + space + `{{/helper}}` pair at the
     * cursor inside the cell. Same payload shape as `InsertBlockPopover`
     * — the difference here is the trigger lives near the cell, so the
     * user doesn't lose context to the top toolbar.
     */
    editor.tf.insertNodes([
      {
        type: HBS_BLOCK_OPEN_KEY,
        helper: selectedHelper.name,
        expression: expression.trim(),
        children: [{ text: '' }],
      },
      { text: ' ' },
      {
        type: HBS_BLOCK_CLOSE_KEY,
        helper: selectedHelper.name,
        children: [{ text: '' }],
      },
    ])
    onOpenChange(false)
    reset()
  }

  function handleOpenChange(next: boolean) {
    onOpenChange(next)
    if (!next) reset()
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 gap-1.5 px-2 text-xs font-medium text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/20"
          title="Wrap cell content with a block helper"
          aria-label="Wrap cell content with a block helper"
        >
          <CodeIcon className="size-3.5" />
          Blok
        </Button>
      </PopoverTrigger>
      <PopoverContent
        /* See variable picker comment above — same reason for `side=bottom`. */
        className="w-80 p-0"
        align="start"
        side="bottom"
        sideOffset={6}
        collisionPadding={8}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {!selectedHelper ? (
          <Command>
            <CommandList className="max-h-56">
              <CommandGroup heading="Block Helpers">
                {helpers.map((h) => (
                  <CommandItem
                    key={h.name}
                    value={h.name}
                    onSelect={() => handleSelectHelper(h)}
                    className="cursor-pointer"
                  >
                    <span className="flex flex-1 items-center gap-2">
                      <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs font-semibold">
                        {`{{#${h.name}}}`}
                      </code>
                      {h.description && (
                        <span className="text-xs text-muted-foreground">
                          {h.description}
                        </span>
                      )}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        ) : (
          <BlockHelperForm
            helper={selectedHelper}
            expression={expression}
            onExpressionChange={setExpression}
            onBack={reset}
            onCancel={() => handleOpenChange(false)}
            onSubmit={handleInsert}
            submitLabel="Insert Block"
          />
        )}
      </PopoverContent>
    </Popover>
  )
}
