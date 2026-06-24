'use client'

// @ts-nocheck
/* eslint-disable */
import { useState } from 'react'

import { CodeIcon } from 'lucide-react'
import { useEditorRef } from 'platejs/react'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

import {
  HBS_BLOCK_CLOSE_KEY,
  HBS_BLOCK_OPEN_KEY,
  type HandlebarsBlockHelper,
} from '../types'

import { BlockHelperForm } from './block-helper-form'

interface InsertBlockPopoverProps {
  helpers: HandlebarsBlockHelper[]
  disabled?: boolean
}

export function InsertBlockPopover({
  helpers,
  disabled,
}: InsertBlockPopoverProps) {
  const editor = useEditorRef()
  const [open, setOpen] = useState(false)
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

    setOpen(false)
    reset()
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) reset()
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 gap-1.5 px-2 text-xs font-medium text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/20"
          disabled={disabled}
          title="Insert block helper ({{#...}}...{{/...}})"
          aria-label="Insert handlebars block helper"
        >
          <CodeIcon className="size-3.5" />
          Block
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
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
