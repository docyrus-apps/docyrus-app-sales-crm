'use client';

// @ts-nocheck
/* eslint-disable */
import { type ReactNode, useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  MoreVertical, Pencil, Trash2
} from 'lucide-react';

import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation';

import { type DocyrusAgentThread } from '@/hooks/docyrus/use-docyrus-agent-threads';

export interface DocyrusAgentThreadItemProps {
  thread: DocyrusAgentThread;
  isActive?: boolean;
  onSelect?: (thread: DocyrusAgentThread) => void;
  onRename?: (thread: DocyrusAgentThread, subject: string) => void | Promise<void>;
  onDelete?: (thread: DocyrusAgentThread) => void | Promise<void>;
  /** Hide the actions dropdown — useful for read-only displays. */
  hideActions?: boolean;
  /** Override the meta row shown beneath the title when the item is active. */
  meta?: ReactNode;
  className?: string;
}

/**
 * Single thread row. Collapsed by default (title only); when `isActive`, expands to a
 * two-line layout with a soft background and a meta row beneath the title.
 */
export const DocyrusAgentThreadItem = ({
  thread,
  isActive,
  onSelect,
  onRename,
  onDelete,
  hideActions,
  meta,
  className
}: DocyrusAgentThreadItemProps) => {
  const { t } = useUiTranslation();
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [draft, setDraft] = useState(thread.title);

  const showExtras = isActive || hovered || menuOpen;

  const handleRenameSubmit = async () => {
    const next = draft.trim();

    if (!next || next === thread.title) {
      setRenameOpen(false);

      return;
    }

    await onRename?.(thread, next);
    setRenameOpen(false);
  };

  const defaultMeta = (
    <div
      className={cn(
        'mt-0.5 items-baseline justify-between gap-2 text-xs text-muted-foreground',
        showExtras ? 'flex' : 'hidden'
      )}>
      <span className="truncate">{formatDate(thread.updatedAt)}</span>
      {thread.createdByName && <span className="truncate">{thread.createdByName}</span>}
    </div>
  );

  return (
    <div
      className={cn(
        'relative w-full max-w-full cursor-pointer overflow-hidden rounded-md px-2 py-2 transition-colors',
        isActive ? 'bg-muted/60' : 'hover:bg-muted/40',
        className
      )}
      onClick={() => onSelect?.(thread)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>
      <p
        className={cn(
          'truncate text-sm',
          isActive ? 'font-medium text-foreground' : 'text-foreground'
        )}>
        {thread.title}
      </p>
      {meta ?? defaultMeta}

      {!hideActions && (onRename || onDelete) && (
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label="Thread actions"
              className={cn(
                'absolute right-1 top-1.5 size-6 transition-opacity',
                showExtras ? 'opacity-100' : 'pointer-events-none opacity-0'
              )}
              size="icon"
              variant="ghost"
              onClick={event => event.stopPropagation()}>
              <MoreVertical className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-40"
            onClick={event => event.stopPropagation()}>
            {onRename && (
              <DropdownMenuItem
                onSelect={() => {
                  setDraft(thread.title);
                  setRenameOpen(true);
                }}>
                <Pencil className="size-4" />
                {t('ui.agent.rename', 'Rename')}
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => setDeleteOpen(true)}>
                <Trash2 className="size-4" />
                {t('ui.agent.delete', 'Delete')}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <AlertDialog open={renameOpen} onOpenChange={setRenameOpen}>
        <AlertDialogContent onClick={event => event.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('ui.agent.renameThread', 'Rename thread')}</AlertDialogTitle>
          </AlertDialogHeader>
          <Input
            autoFocus
            value={draft}
            onChange={event => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void handleRenameSubmit();
            }} />
          <AlertDialogFooter>
            <AlertDialogCancel>{t('ui.common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleRenameSubmit()}>
              {t('ui.common.save', 'Save')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent onClick={event => event.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('ui.agent.deleteThread', 'Delete thread?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'ui.agent.deleteThreadDescription',
                'This will permanently remove the conversation and its messages.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('ui.common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                await onDelete?.(thread);
                setDeleteOpen(false);
              }}>
              {t('ui.agent.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}.${month}.${year}`;
}