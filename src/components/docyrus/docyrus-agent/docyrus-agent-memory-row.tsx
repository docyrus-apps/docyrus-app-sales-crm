'use client';

// @ts-nocheck
/* eslint-disable */
import { type ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Star, Trash } from 'lucide-react';

import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation';

export interface DocyrusAgentMemory {
  id: string;
  title: string;
  content: string;
  memoryLevel?: string;
  importance?: number;
  tags?: ReadonlyArray<string>;
  alwaysInclude?: boolean;
  archived?: boolean;
  createdOn?: string;
  lastModifiedOn?: string | null;
  sourceType?: string;
  tenantAiAgentId?: string | null;
}

export interface DocyrusAgentMemoryRowProps {
  memory: DocyrusAgentMemory;
  onClick?: (memory: DocyrusAgentMemory) => void;
  onDelete?: (memory: DocyrusAgentMemory) => void;
  isDeleting?: boolean;
  /** Replace the entire body of the row (still inside the clickable container). */
  children?: ReactNode;
  /** Slot rendered at the end of the meta row (next to the importance score). */
  trailingMeta?: ReactNode;
  /** Slot rendered next to the delete button. */
  actions?: ReactNode;
  className?: string;
}

/**
 * Compact list row used by `DocyrusAgentMemoryManagerDialog`. Click anywhere on the row
 * (except the delete button) triggers `onClick`. Fully controlled — supply your own
 * presentation via `children` to drop into custom layouts.
 */
export const DocyrusAgentMemoryRow = ({
  memory,
  onClick,
  onDelete,
  isDeleting,
  children,
  trailingMeta,
  actions,
  className
}: DocyrusAgentMemoryRowProps) => {
  const { t } = useUiTranslation();

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn(
        'group relative flex items-start justify-between gap-2 rounded-lg border border-border bg-card p-3 transition-all',
        onClick && 'cursor-pointer hover:border-primary/40 hover:shadow-sm',
        className
      )}
      onClick={onClick ? () => onClick(memory) : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(memory);
        }
      } : undefined}>
      <div className="flex-1 min-w-0">
        {children ?? (
          <>
            <div className="mb-1 flex flex-wrap items-center gap-1.5">
              {memory.alwaysInclude && (
                <Star className="size-3 shrink-0 text-amber-500" />
              )}
              <span className="text-sm font-medium">{memory.title}</span>
              {memory.memoryLevel && (
                <Badge variant="secondary" className="h-4 px-1.5 text-xs">
                  {memory.memoryLevel}
                </Badge>
              )}
              {memory.importance != null && (
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                  {memory.importance}/10
                </span>
              )}
              {trailingMeta}
            </div>
            {memory.content && (
              <p className="line-clamp-2 text-xs text-muted-foreground">{memory.content}</p>
            )}
            {memory.tags && memory.tags.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {memory.tags.map(tag => (
                  <span key={tag} className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      {actions ?? (onDelete && (
        <Button
          aria-label={t('ui.agent.memories.delete', 'Delete memory')}
          variant="ghost"
          size="icon"
          disabled={isDeleting}
          className="size-7 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(memory);
          }}>
          <Trash className="size-3.5" />
        </Button>
      ))}
    </div>
  );
};