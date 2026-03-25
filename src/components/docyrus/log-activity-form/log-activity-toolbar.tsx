'use client';

import { useCallback } from 'react';

import { ListStyleType, someList, toggleList } from '@platejs/list';
import {
  AtSignIcon,
  BoldIcon,
  ItalicIcon,
  ListIcon,
  Loader2Icon
} from 'lucide-react';
import { KEYS } from 'platejs';
import {
  useEditorRef,
  useEditorSelector,
  useMarkToolbarButton,
  useMarkToolbarButtonState
} from 'platejs/react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface LogActivityToolbarProps {
  onSubmit: () => void;
  submitLabel: string;
  showKeyboardHint: boolean;
  isSubmitting: boolean;
  disabled: boolean;
  isEmpty: boolean;
}

function BoldButton({ disabled }: { disabled: boolean }) {
  const state = useMarkToolbarButtonState({ nodeType: KEYS.bold });
  const { props: buttonProps } = useMarkToolbarButton(state);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={buttonProps.onClick}
      onMouseDown={buttonProps.onMouseDown}
      className={cn(
        'flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50',
        buttonProps.pressed && 'bg-accent text-foreground'
      )}>
      <BoldIcon className="size-3.5" />
    </button>
  );
}

function ItalicButton({ disabled }: { disabled: boolean }) {
  const state = useMarkToolbarButtonState({ nodeType: KEYS.italic });
  const { props: buttonProps } = useMarkToolbarButton(state);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={buttonProps.onClick}
      onMouseDown={buttonProps.onMouseDown}
      className={cn(
        'flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50',
        buttonProps.pressed && 'bg-accent text-foreground'
      )}>
      <ItalicIcon className="size-3.5" />
    </button>
  );
}

export function LogActivityToolbar({
  onSubmit,
  submitLabel,
  showKeyboardHint,
  isSubmitting,
  disabled,
  isEmpty
}: LogActivityToolbarProps) {
  const editor = useEditorRef();

  const isListActive = useEditorSelector(
    e => someList(e, [ListStyleType.Disc]),
    []
  );

  const handleList = useCallback(() => {
    toggleList(editor, { listStyleType: ListStyleType.Disc });
    editor.tf.focus();
  }, [editor]);

  const handleAtMention = useCallback(() => {
    editor.tf.insertText('@');
    editor.tf.focus();
  }, [editor]);

  return (
    <div className="flex items-center justify-between border-t px-3 py-2">
      <div className="flex items-center gap-0.5">
        <BoldButton disabled={disabled} />
        <ItalicButton disabled={disabled} />

        <button
          type="button"
          disabled={disabled}
          onClick={handleList}
          className={cn(
            'flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50',
            isListActive && 'bg-accent text-foreground'
          )}>
          <ListIcon className="size-3.5" />
        </button>

        <Separator orientation="vertical" className="mx-1 h-4" />

        <button
          type="button"
          disabled={disabled}
          onClick={handleAtMention}
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50">
          <AtSignIcon className="size-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        {showKeyboardHint && (
          <span className="hidden text-xs text-muted-foreground sm:inline">
            Press <kbd className="rounded border px-1 py-0.5 text-[10px] font-medium">⌘</kbd>+<kbd className="rounded border px-1 py-0.5 text-[10px] font-medium">Enter</kbd> to save
          </span>
        )}

        <Button
          size="sm"
          disabled={disabled || isSubmitting || isEmpty}
          onClick={onSubmit}>
          {isSubmitting && <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}