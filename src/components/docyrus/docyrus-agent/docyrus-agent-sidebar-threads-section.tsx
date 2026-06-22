'use client';

// @ts-nocheck
/* eslint-disable */
import { type ReactNode, Fragment, useState } from 'react';

import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation';

import { type DocyrusAgentThread } from '@/hooks/docyrus/use-docyrus-agent-threads';

import { DocyrusAgentThreadItem } from './docyrus-agent-thread-item';

export interface DocyrusAgentSidebarThreadsSectionRenderItemProps {
  isActive: boolean;
  onSelect?: (thread: DocyrusAgentThread) => void;
  onRename?: (thread: DocyrusAgentThread, subject: string) => void | Promise<void>;
  onDelete?: (thread: DocyrusAgentThread) => void | Promise<void>;
}

export interface DocyrusAgentSidebarThreadsSectionProps {
  threads: Array<DocyrusAgentThread>;
  activeThreadId?: string | null;
  isLoading?: boolean;
  /** Section label override. Defaults to "RECENT SESSIONS". */
  label?: ReactNode;
  /** Whether the list starts collapsed. */
  defaultCollapsed?: boolean;
  onSelectThread?: (thread: DocyrusAgentThread) => void;
  onRenameThread?: (thread: DocyrusAgentThread, subject: string) => void | Promise<void>;
  onDeleteThread?: (thread: DocyrusAgentThread) => void | Promise<void>;
  /** Custom empty state shown when `threads` is empty. */
  emptyState?: ReactNode;
  /** Custom loading state. Defaults to a centered spinner. */
  loadingState?: ReactNode;
  /** Replace the per-thread row renderer. Defaults to `DocyrusAgentThreadItem`. */
  renderItem?: (thread: DocyrusAgentThread, props: DocyrusAgentSidebarThreadsSectionRenderItemProps) => ReactNode;
  className?: string;
}

/**
 * Recent Sessions section for the agent sidebar — uppercase label + count + chevron
 * collapse toggle, plus the scrollable list of `DocyrusAgentThreadItem`s underneath.
 */
export const DocyrusAgentSidebarThreadsSection = ({
  threads,
  activeThreadId,
  isLoading,
  label,
  defaultCollapsed = false,
  onSelectThread,
  onRenameThread,
  onDeleteThread,
  emptyState,
  loadingState,
  renderItem,
  className
}: DocyrusAgentSidebarThreadsSectionProps) => {
  const { t } = useUiTranslation();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col', className)}>
      <div className="mt-2 flex items-center gap-2 px-4 pb-1 pt-2">
        <button
          className="flex flex-1 items-center gap-1.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
          type="button"
          onClick={() => setCollapsed(prev => !prev)}>
          <span>
            {label ?? t('ui.agent.recentSessions', 'Recent Sessions')}
            {threads.length > 0 && <span className="ml-1 font-normal">({threads.length})</span>}
          </span>
          {collapsed ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        </button>
      </div>

      {!collapsed && (
        <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
          {isLoading && threads.length === 0 ? (
            loadingState ?? (
              <div className="flex items-center justify-center py-6 text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
              </div>
            )
          ) : threads.length === 0 ? (
            emptyState ?? (
              <div className="flex flex-col items-center justify-center gap-1 py-6 text-center text-xs text-muted-foreground">
                {t('ui.agent.noThreadsYet', 'No threads yet.')}
              </div>
            )
          ) : (
            threads.map((thread) => {
              const itemProps = {
                isActive: thread.id === activeThreadId,
                onSelect: onSelectThread,
                onRename: onRenameThread,
                onDelete: onDeleteThread
              };

              if (renderItem) {
                return <Fragment key={thread.id}>{renderItem(thread, itemProps)}</Fragment>;
              }

              return (
                <DocyrusAgentThreadItem
                  key={thread.id}
                  isActive={itemProps.isActive}
                  thread={thread}
                  onDelete={itemProps.onDelete}
                  onRename={itemProps.onRename}
                  onSelect={itemProps.onSelect} />
              );
            })
          )}
        </div>
      )}
    </div>
  );
};