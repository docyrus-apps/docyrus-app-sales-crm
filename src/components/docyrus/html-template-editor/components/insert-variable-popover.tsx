'use client';

// @ts-nocheck
/* eslint-disable */
import { useState } from 'react';

import { BracesIcon } from 'lucide-react';
import { useEditorRef } from 'platejs/react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';

import { HBS_VARIABLE_KEY, HBS_VARIABLE_MARK_KEYS, type HandlebarsVariable } from '../types';

import { VariablePicker } from './variable-picker';

interface InsertVariablePopoverProps {
  variables: HandlebarsVariable[];
  disabled?: boolean;
}

export function InsertVariablePopover({ variables, disabled }: InsertVariablePopoverProps) {
  const editor = useEditorRef();
  const [open, setOpen] = useState(false);

  function insertVariable(name: string) {
    editor.tf.focus();
    /*
     * Read Slate's pending marks (set when user toggles Bold/Italic/etc
     * with no selected text) and apply them to the new variable chip so
     * the chip inherits whatever format the user pre-armed.
     */
    const pendingMarks = (editor as { marks?: Record<string, unknown> }).marks ?? {};
    const variableMarks: Record<string, true> = {};

    for (const key of HBS_VARIABLE_MARK_KEYS) {
      if (pendingMarks[key]) variableMarks[key] = true;
    }
    editor.tf.insertNodes([
      {
        type: HBS_VARIABLE_KEY,
        name,
        ...variableMarks,
        children: [{ text: '' }]
      },
      { text: ' ' }
    ]);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 gap-1.5 px-2 text-xs font-medium text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20"
          disabled={disabled}
          title="Insert variable ({{...}})"
          aria-label="Insert handlebars variable">
          <BracesIcon className="size-3.5" />
          Variable
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <VariablePicker variables={variables} onSelect={insertVariable} />
      </PopoverContent>
    </Popover>
  );
}