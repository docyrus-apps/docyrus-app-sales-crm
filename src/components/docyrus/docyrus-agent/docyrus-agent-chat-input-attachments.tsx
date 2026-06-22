'use client';

// @ts-nocheck
/* eslint-disable */
import { type ReactNode } from 'react';

import {
  PromptInputHeader,
  usePromptInputAttachments
} from '@/components/ai-elements/prompt-input';
import { cn } from '@/lib/utils';
import { FileIcon, XIcon } from 'lucide-react';

export type DocyrusAgentChatInputAttachmentFile = ReturnType<typeof usePromptInputAttachments>['files'][number];

export interface DocyrusAgentChatInputAttachmentsProps {
  className?: string;
  /**
   * Override the per-chip renderer. Receives the attachment file part plus a `remove` callback.
   */
  renderChip?: (file: DocyrusAgentChatInputAttachmentFile, remove: () => void) => ReactNode;
}

/**
 * Chip strip showing currently attached files. Renders inside `PromptInput` only —
 * it pulls its state from `usePromptInputAttachments()` and returns `null` when there
 * are no attachments. Layout-wise it occupies the `block-start` slot of the input group
 * via `PromptInputHeader`, so it spans full width above the textarea.
 */
export const DocyrusAgentChatInputAttachments = ({
  className,
  renderChip
}: DocyrusAgentChatInputAttachmentsProps) => {
  const attachments = usePromptInputAttachments();

  if (attachments.files.length === 0) return null;

  return (
    <PromptInputHeader
      className={cn(
        'flex items-center justify-start gap-2 overflow-x-auto border-b pb-2',
        className
      )}>
      {attachments.files.map((file) => {
        const remove = () => attachments.remove(file.id);

        if (renderChip) return renderChip(file, remove);

        const isImage = file.mediaType?.startsWith('image/');

        return (
          <div
            key={file.id}
            className="group relative flex shrink-0 items-center gap-1 rounded-md border bg-background px-1.5 py-0.5 text-[11px]">
            {isImage && file.url ? (
              <img
                alt={file.filename ?? 'attachment'}
                className="size-4 rounded-sm object-cover"
                src={file.url} />
            ) : (
              <FileIcon className="size-3 text-muted-foreground" />
            )}
            <span className="max-w-24 truncate text-muted-foreground">
              {file.filename ?? 'file'}
            </span>
            <button
              aria-label="Remove attachment"
              className="ml-0.5 flex size-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              type="button"
              onClick={remove}>
              <XIcon className="size-2.5" />
            </button>
          </div>
        );
      })}
    </PromptInputHeader>
  );
};