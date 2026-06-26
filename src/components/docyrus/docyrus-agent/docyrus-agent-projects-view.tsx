'use client';

// @ts-nocheck
/* eslint-disable */
import { type ReactNode, useMemo, useState } from 'react';

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
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ArrowLeft, Plus, Search } from 'lucide-react';

import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation';

import { type DocyrusAgentProject } from '@/hooks/docyrus/use-docyrus-agent-projects';

import { DocyrusAgentProjectCard } from './docyrus-agent-project-card';

export interface DocyrusAgentProjectsViewRenderCardProps {
  onSelect?: (project: DocyrusAgentProject) => void;
  onEdit?: (project: DocyrusAgentProject) => void;
  onDelete?: (project: DocyrusAgentProject) => void;
}

export interface DocyrusAgentProjectsViewProps {
  projects: Array<DocyrusAgentProject>;
  /** Fires when the back arrow is pressed. */
  onBack?: () => void;
  /** Fires when "New project" is pressed. */
  onNewProject?: () => void;
  /** Fires when the View button on a project card is pressed. */
  onSelectProject?: (project: DocyrusAgentProject) => void;
  /** Fires when the user confirms the built-in rename dialog. */
  onRenameProject?: (project: DocyrusAgentProject, name: string) => void | Promise<void>;
  /** Fires when the user confirms the built-in delete dialog. */
  onDeleteProject?: (project: DocyrusAgentProject) => void | Promise<void>;
  /**
   * Intercept the Edit button before the built-in rename dialog opens. When supplied,
   * the built-in dialog is suppressed and the host app drives the rename flow itself.
   */
  onEditClick?: (project: DocyrusAgentProject) => void;
  /**
   * Intercept the Delete button before the built-in delete dialog opens. When supplied,
   * the built-in dialog is suppressed and the host app drives the delete flow itself.
   */
  onDeleteClick?: (project: DocyrusAgentProject) => void;
  /** Override the heading. */
  title?: string;
  /** Override the subtitle. */
  subtitle?: string;
  /** Compact 1-column layout (vs the default 2-col on >= md). */
  compact?: boolean;
  /** Replace the search input with a custom node, or set to `null` to hide the search row. */
  search?: ReactNode | null;
  /** Replace the per-project card renderer. */
  renderCard?: (project: DocyrusAgentProject, props: DocyrusAgentProjectsViewRenderCardProps) => ReactNode;
  /** Slot rendered to the left of the back link — typically a sidebar-toggle spacer. */
  headerLeading?: ReactNode;
  className?: string;
}

/**
 * Full-pane projects browser. Mirror of the standalone `AssistantProjectsPanel` in
 * `docyrus-ui-pro` — drop it where the chat would render to switch the agent surface into
 * project-management mode. Owns its own search, rename, and delete dialogs; emits the
 * resolved action via the corresponding callback.
 */
export const DocyrusAgentProjectsView = ({
  projects,
  onBack,
  onNewProject,
  onSelectProject,
  onRenameProject,
  onDeleteProject,
  onEditClick,
  onDeleteClick,
  title,
  subtitle,
  compact,
  search,
  renderCard,
  headerLeading,
  className
}: DocyrusAgentProjectsViewProps) => {
  const { t } = useUiTranslation();
  const [query, setQuery] = useState('');
  const [renameTarget, setRenameTarget] = useState<DocyrusAgentProject | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DocyrusAgentProject | null>(null);
  const [renameDraft, setRenameDraft] = useState('');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    if (!needle) return projects;

    return projects.filter(project => project.name.toLowerCase().includes(needle) || project.description?.toLowerCase().includes(needle));
  }, [projects, query]);

  const handleRenameSubmit = async () => {
    if (!renameTarget) return;
    const next = renameDraft.trim();

    if (!next || next === renameTarget.name) {
      setRenameTarget(null);

      return;
    }

    await onRenameProject?.(renameTarget, next);
    setRenameTarget(null);
  };

  const handleEdit = (project: DocyrusAgentProject) => {
    if (onEditClick) {
      onEditClick(project);

      return;
    }

    setRenameDraft(project.name);
    setRenameTarget(project);
  };

  const handleDelete = (project: DocyrusAgentProject) => {
    if (onDeleteClick) {
      onDeleteClick(project);

      return;
    }

    setDeleteTarget(project);
  };

  return (
    <div className={cn('flex h-full flex-col bg-background', className)}>
      <div className="flex shrink-0 items-center gap-2 px-4 py-3">
        {headerLeading}
        {onBack && (
          <Button
            aria-label={t('ui.common.back', 'Back')}
            className="size-8"
            size="icon"
            variant="ghost"
            onClick={onBack}>
            <ArrowLeft className="size-4" />
          </Button>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pb-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col">
            <h1 className="text-2xl font-semibold tracking-tight">
              {title ?? t('ui.agent.projects', 'Projects')}
            </h1>
            {!compact && (
              <p className="text-sm text-muted-foreground">
                {subtitle ?? t('ui.agent.manageProjects', 'Manage projects')}
              </p>
            )}
          </div>
          {onNewProject && (
            <Button className="shrink-0" size="sm" onClick={onNewProject}>
              <Plus className="size-4" />
              {!compact && t('ui.agent.newProject', 'New project')}
            </Button>
          )}
        </div>

        {search === null ? null : search ?? (
          <div className="relative mb-6">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder={t('ui.agent.searchProjects', 'Search projects')}
              value={query}
              onChange={event => setQuery(event.target.value)} />
          </div>
        )}

        {projects.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-sm text-muted-foreground">
            {t('ui.agent.noProjectsYet', 'No projects yet.')}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-sm text-muted-foreground">
            {t('ui.agent.noProjectsMatch', 'No projects match your search.')}
          </div>
        ) : (
          <div className={cn('grid gap-3', compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2')}>
            {filtered.map((project) => {
              const cardProps = {
                onSelect: onSelectProject,
                onEdit: (onEditClick ?? onRenameProject) ? handleEdit : undefined,
                onDelete: (onDeleteClick ?? onDeleteProject) ? handleDelete : undefined
              };

              if (renderCard) return renderCard(project, cardProps);

              return (
                <DocyrusAgentProjectCard
                  key={project.id}
                  project={project}
                  onDelete={cardProps.onDelete}
                  onEdit={cardProps.onEdit}
                  onSelect={cardProps.onSelect} />
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog
        open={!!renameTarget}
        onOpenChange={(open) => {
          if (!open) setRenameTarget(null);
        }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('ui.agent.renameProject', 'Rename project')}</AlertDialogTitle>
          </AlertDialogHeader>
          <Input
            autoFocus
            value={renameDraft}
            onChange={event => setRenameDraft(event.target.value)}
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

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('ui.agent.deleteProject', 'Delete project?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'ui.agent.deleteProjectDescription',
                'Threads inside this project will remain but be detached from it.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('ui.common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (deleteTarget) await onDeleteProject?.(deleteTarget);
                setDeleteTarget(null);
              }}>
              {t('ui.agent.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};