'use client';

// @ts-nocheck
/* eslint-disable */
import { type ReactNode, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, Brain, Plus, Search
} from 'lucide-react';

import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation';

import { type DocyrusAgentMemoryLevel } from './docyrus-agent-memory-candidate-row';
import { DEFAULT_MEMORY_LEVELS } from './docyrus-agent-memory-extraction-dialog';
import {
  type DocyrusAgentMemoryFormState,
  EMPTY_MEMORY_FORM
} from './docyrus-agent-memory-form';
import { DocyrusAgentMemoryFormDialog } from './docyrus-agent-memory-form-dialog';
import {
  type DocyrusAgentMemory,
  DocyrusAgentMemoryRow
} from './docyrus-agent-memory-row';

export interface DocyrusAgentMemoriesViewProps {
  memories: ReadonlyArray<DocyrusAgentMemory>;
  loading?: boolean;
  saving?: boolean;
  deletingId?: string | null;
  error?: string | null;
  levels?: ReadonlyArray<DocyrusAgentMemoryLevel>;
  /** Default form values for a fresh memory. */
  defaultMemoryFormValue?: DocyrusAgentMemoryFormState;

  /** Fires when the back arrow is pressed. */
  onBack?: () => void;
  /** Persist a new memory. Called from the create form dialog. */
  onCreate?: (form: DocyrusAgentMemoryFormState) => void | Promise<void>;
  /** Persist edits to an existing memory. Called from the edit form dialog. */
  onUpdate?: (memory: DocyrusAgentMemory, form: DocyrusAgentMemoryFormState) => void | Promise<void>;
  /** Delete a memory. */
  onDelete?: (memory: DocyrusAgentMemory) => void | Promise<void>;

  /** Override the local search filter — supply when filtering server-side. */
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  /** Hide the built-in search input entirely. */
  hideSearch?: boolean;
  /** Hide the built-in "New memory" button — useful when adding the action elsewhere. */
  hideCreateButton?: boolean;
  /** Hide the back arrow (e.g. when the view is the only page on the panel). */
  hideBackButton?: boolean;

  /** Override the per-row presentation. */
  renderRow?: (memory: DocyrusAgentMemory, helpers: DocyrusAgentMemoriesViewRowHelpers) => ReactNode;
  /** Override the heading. */
  title?: ReactNode;
  /** Replace the empty state. */
  emptyState?: ReactNode;
  /** Replace the loading state. */
  loadingState?: ReactNode;
  /** Replace the error block. */
  errorState?: (error: string) => ReactNode;
  /** Slot rendered between the search and the list (e.g. filters / tabs). */
  beforeList?: ReactNode;
  /** Slot rendered between the title and the "New memory" button. */
  headerTrailing?: ReactNode;
  className?: string;
}

export interface DocyrusAgentMemoriesViewRowHelpers {
  onEdit: (memory: DocyrusAgentMemory) => void;
  onDelete?: (memory: DocyrusAgentMemory) => void;
  isDeleting: boolean;
}

/**
 * Full-page "Memories" view rendered inside the chat panel (mirrors the pro `MemoriesPanel`
 * + `Memories` tab pattern). Use it via `view === 'memories'`-style state in the host app
 * — `onBack` returns to the chat. The internal create / edit form is hosted by
 * `DocyrusAgentMemoryFormDialog`. Compose-first: every section is replaceable via slots.
 */
export const DocyrusAgentMemoriesView = ({
  memories,
  loading = false,
  saving = false,
  deletingId = null,
  error,
  levels = DEFAULT_MEMORY_LEVELS,
  defaultMemoryFormValue = EMPTY_MEMORY_FORM,
  onBack,
  onCreate,
  onUpdate,
  onDelete,
  searchQuery: controlledQuery,
  onSearchQueryChange,
  hideSearch = false,
  hideCreateButton = false,
  hideBackButton = false,
  renderRow,
  title,
  emptyState,
  loadingState,
  errorState,
  beforeList,
  headerTrailing,
  className
}: DocyrusAgentMemoriesViewProps) => {
  const { t } = useUiTranslation();

  const [internalQuery, setInternalQuery] = useState('');
  const searchQuery = controlledQuery ?? internalQuery;
  const setSearchQuery = (next: string) => {
    if (onSearchQueryChange) {
      onSearchQueryChange(next);

      return;
    }
    setInternalQuery(next);
  };

  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<DocyrusAgentMemory | null>(null);

  const openCreate = () => {
    setEditingMemory(null);
    setFormDialogOpen(true);
  };

  const openEdit = (memory: DocyrusAgentMemory) => {
    setEditingMemory(memory);
    setFormDialogOpen(true);
  };

  const filterLocally = (list: ReadonlyArray<DocyrusAgentMemory>) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();

    return list.filter(m => m.title.toLowerCase().includes(q) || m.content.toLowerCase().includes(q));
  };

  const filtered = controlledQuery !== undefined ? memories : filterLocally(memories);

  const handleFormSubmit = async (form: DocyrusAgentMemoryFormState) => {
    if (editingMemory) {
      await onUpdate?.(editingMemory, form);
    } else {
      await onCreate?.(form);
    }
    setFormDialogOpen(false);
    setEditingMemory(null);
  };

  return (
    <div className={cn('flex h-full flex-col overflow-hidden', className)}>
      {!hideBackButton && (
        <div className="flex h-10 shrink-0 items-center gap-1 px-3">
          <Button
            aria-label={t('ui.agent.memories.back', 'Back')}
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-foreground"
            onClick={onBack}>
            <ArrowLeft className="size-4" />
          </Button>
        </div>
      )}

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 pb-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">
            {title ?? t('ui.agent.memories.viewTitle', 'Memories')}
          </h1>
          <div className="flex items-center gap-2">
            {headerTrailing}
            {!hideCreateButton && (
              <Button size="sm" onClick={openCreate}>
                <Plus className="size-4" />
                {t('ui.agent.memories.new', 'New memory')}
              </Button>
            )}
          </div>
        </div>

        {!hideSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder={t('ui.agent.memories.searchPlaceholder', 'Search memories…')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)} />
          </div>
        )}

        {beforeList}

        {error && (errorState?.(error) ?? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        ))}

        {loading ? (loadingState ?? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            {t('ui.agent.memories.loading', 'Loading memories…')}
          </div>
        )) : filtered.length === 0 ? (emptyState ?? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
            <Brain className="size-10 opacity-30" />
            <p className="text-sm">{t('ui.agent.memories.empty', 'No memories yet')}</p>
          </div>
        )) : (
          <div className="flex flex-col gap-2">
            {filtered.map((memory) => {
              const helpers: DocyrusAgentMemoriesViewRowHelpers = {
                isDeleting: deletingId === memory.id,
                onDelete,
                onEdit: openEdit
              };

              return (
                <div key={memory.id}>
                  {renderRow?.(memory, helpers) ?? (
                    <DocyrusAgentMemoryRow
                      memory={memory}
                      isDeleting={helpers.isDeleting}
                      onClick={openEdit}
                      onDelete={onDelete} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <DocyrusAgentMemoryFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        memory={editingMemory}
        levels={levels}
        saving={saving}
        defaultValue={defaultMemoryFormValue}
        onSubmit={handleFormSubmit} />
    </div>
  );
};