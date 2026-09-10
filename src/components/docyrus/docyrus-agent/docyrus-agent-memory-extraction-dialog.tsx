'use client'

// @ts-nocheck
/* eslint-disable */
import { type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { AlertCircle, Brain, Inbox } from 'lucide-react'

import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation'

import {
  type DocyrusAgentMemoryCandidate,
  type DocyrusAgentMemoryLevel,
  DocyrusAgentMemoryCandidateRow,
} from './docyrus-agent-memory-candidate-row'

export const DEFAULT_MEMORY_LEVELS: ReadonlyArray<DocyrusAgentMemoryLevel> = [
  { id: 'user', name: 'User' },
  { id: 'user_agent', name: 'User Agent' },
  { id: 'project', name: 'Project' },
  { id: 'team', name: 'Team' },
  { id: 'team_agent', name: 'Team Agent' },
  { id: 'tenant', name: 'Tenant' },
  { id: 'tenant_agent', name: 'Tenant Agent' },
]

export interface DocyrusAgentMemoryExtractionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  candidates: ReadonlyArray<DocyrusAgentMemoryCandidate>
  loading?: boolean
  saving?: boolean
  error?: string | null
  levels?: ReadonlyArray<DocyrusAgentMemoryLevel>
  onSave?: (candidate: DocyrusAgentMemoryCandidate) => void
  onSkip?: (candidate: DocyrusAgentMemoryCandidate) => void
  onSaveAll?: () => void
  onSkipAll?: () => void
  onLevelChange?: (
    candidate: DocyrusAgentMemoryCandidate,
    level: string,
  ) => void
  /** Override the per-candidate row renderer. */
  renderRow?: (
    candidate: DocyrusAgentMemoryCandidate,
    helpers: DocyrusAgentMemoryExtractionDialogRowHelpers,
  ) => ReactNode
  /** Replace the empty state shown when there are no candidates. */
  emptyState?: ReactNode
  /** Replace the loading state. */
  loadingState?: ReactNode
  /** Replace the error block. */
  errorState?: (error: string) => ReactNode
  /** Replace the dialog title. */
  title?: ReactNode
  /** Replace the informational banner shown above the list. */
  banner?: ReactNode
  /** Replace the footer (Skip all + Save all). */
  footer?: ReactNode
  className?: string
}

export interface DocyrusAgentMemoryExtractionDialogRowHelpers {
  levels: ReadonlyArray<DocyrusAgentMemoryLevel>
  onSave?: (candidate: DocyrusAgentMemoryCandidate) => void
  onSkip?: (candidate: DocyrusAgentMemoryCandidate) => void
  onLevelChange?: (
    candidate: DocyrusAgentMemoryCandidate,
    level: string,
  ) => void
}

/**
 * Modal that surfaces the memory candidates extracted from the active thread and lets the
 * user save or skip each one. Fully controlled — pair with `useDocyrusAgentMemoryCandidates`
 * (or any custom flow) for the data + actions.
 */
export const DocyrusAgentMemoryExtractionDialog = ({
  open,
  onOpenChange,
  candidates,
  loading = false,
  saving = false,
  error = null,
  levels = DEFAULT_MEMORY_LEVELS,
  onSave,
  onSkip,
  onSaveAll,
  onSkipAll,
  onLevelChange,
  renderRow,
  emptyState,
  loadingState,
  errorState,
  title,
  banner,
  footer,
  className,
}: DocyrusAgentMemoryExtractionDialogProps) => {
  const { t } = useUiTranslation()

  const helpers: DocyrusAgentMemoryExtractionDialogRowHelpers = {
    levels,
    onSave,
    onSkip,
    onLevelChange,
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn('flex max-h-[80vh] max-w-xl flex-col', className)}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="size-4" />
            {title ?? t('ui.agent.memory.title', 'Memory Extraction')}
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-hidden">
          {loading ? (
            (loadingState ?? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="mb-4 size-10 animate-spin rounded-full border-b-2 border-primary" />
                <p className="text-sm text-muted-foreground">
                  {t('ui.agent.memory.loading', 'Extracting memories…')}
                </p>
              </div>
            ))
          ) : error ? (
            (errorState?.(error) ?? (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            ))
          ) : candidates.length === 0 ? (
            (emptyState ?? (
              <div className="flex flex-col items-center justify-center py-12">
                <Inbox className="mb-4 size-12 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  {t(
                    'ui.agent.memory.noSuggestions',
                    'No memory candidates surfaced from this conversation.',
                  )}
                </p>
              </div>
            ))
          ) : (
            <div className="space-y-3">
              {banner ?? (
                <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
                  {t(
                    'ui.agent.memory.banner',
                    'Review the candidates below. Save the ones you want stored, skip the rest.',
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {t('ui.agent.memory.count', '{{count}} candidates').replace(
                  '{{count}}',
                  String(candidates.length),
                )}
              </p>
              <ScrollArea className="h-[340px] pr-2">
                <div className="space-y-2">
                  {candidates.map((candidate, index) => (
                    <div key={candidate.id ?? index}>
                      {renderRow ? (
                        renderRow(candidate, helpers)
                      ) : (
                        <DocyrusAgentMemoryCandidateRow
                          candidate={candidate}
                          levels={levels}
                          onLevelChange={onLevelChange}
                          onSave={onSave}
                          onSkip={onSkip}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {footer ?? (
          <DialogFooter className="gap-2">
            <Button
              disabled={saving || loading}
              size="sm"
              variant="outline"
              onClick={onSkipAll}
            >
              {t('ui.agent.memory.skipAll', 'Skip all')}
            </Button>
            <Button
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              disabled={saving || loading || candidates.length === 0}
              size="sm"
              onClick={onSaveAll}
            >
              {saving ? '…' : t('ui.agent.memory.saveAll', 'Save all')}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
