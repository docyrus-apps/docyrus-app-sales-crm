'use client';

// @ts-nocheck
/* eslint-disable */
import { type ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';

import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation';

export interface DocyrusAgentMemoryLevel {
  id: string;
  name: string;
}

export interface DocyrusAgentMemoryCandidate {
  id?: string;
  title: string;
  content?: string;
  suggestedLevel?: string;
  suggestedImportance?: number;
  tags?: Array<string>;
  reason?: string;
  sourceMessageId?: string;
  /** Animation hint surfaced by the row. The dialog typically toggles this between save/skip + null. */
  animating?: 'save' | 'skip' | null;
}

export interface DocyrusAgentMemoryCandidateRowProps {
  candidate: DocyrusAgentMemoryCandidate;
  /** Memory levels available in the level selector. */
  levels: ReadonlyArray<DocyrusAgentMemoryLevel>;
  onSave?: (candidate: DocyrusAgentMemoryCandidate) => void;
  onSkip?: (candidate: DocyrusAgentMemoryCandidate) => void;
  onLevelChange?: (candidate: DocyrusAgentMemoryCandidate, level: string) => void;
  /** Replace the row layout entirely. */
  children?: ReactNode;
  className?: string;
}

/**
 * Single candidate row used by `DocyrusAgentMemoryExtractionDialog`. Exported so consumers
 * can swap in their own row design via the dialog's `renderRow` slot.
 */
export const DocyrusAgentMemoryCandidateRow = ({
  candidate,
  levels,
  onSave,
  onSkip,
  onLevelChange,
  children,
  className
}: DocyrusAgentMemoryCandidateRowProps) => {
  const { t } = useUiTranslation();

  if (children) return <div className={className}>{children}</div>;

  return (
    <div
      className={cn(
        'rounded-md border bg-background p-2.5 transition-all duration-300',
        candidate.animating === 'save' && 'translate-x-full opacity-0',
        candidate.animating === 'skip' && '-translate-x-full opacity-0',
        className
      )}>
      <div className="flex items-center gap-1.5">
        <p className="truncate text-sm font-medium">{candidate.title}</p>
        {candidate.suggestedImportance != null && (
          <span className="flex shrink-0 items-center gap-0.5 text-xs text-muted-foreground">
            <Star className="size-2.5" />
            {candidate.suggestedImportance}/10
          </span>
        )}
      </div>
      {candidate.content && (
        <p className="mt-0.5 line-clamp-3 text-left text-xs text-muted-foreground">{candidate.content}</p>
      )}
      {candidate.tags && candidate.tags.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {candidate.tags.map(tag => (
            <Badge key={tag} className="px-1.5 py-0 text-xs" variant="secondary">{tag}</Badge>
          ))}
        </div>
      )}
      <div className="mt-1.5 flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">
            {t('ui.agent.memory.level', 'Level')}:
          </span>
          <select
            className="rounded border bg-background px-1.5 py-0.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            value={candidate.suggestedLevel ?? levels[0]?.id ?? ''}
            onChange={event => onLevelChange?.(candidate, event.target.value)}>
            {levels.map(level => (
              <option key={level.id} value={level.id}>{level.name}</option>
            ))}
          </select>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <Button
            className="h-6 px-2 text-xs"
            disabled={!!candidate.animating}
            size="sm"
            variant="outline"
            onClick={() => onSkip?.(candidate)}>
            {t('ui.agent.memory.skip', 'Skip')}
          </Button>
          <Button
            className="h-6 bg-emerald-600 px-2 text-xs text-white hover:bg-emerald-700"
            disabled={!!candidate.animating}
            size="sm"
            onClick={() => onSave?.(candidate)}>
            {t('ui.agent.memory.save', 'Save')}
          </Button>
        </div>
      </div>
    </div>
  );
};