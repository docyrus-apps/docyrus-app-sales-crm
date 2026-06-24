'use client'

// @ts-nocheck
/* eslint-disable */
import { type ReactNode, Fragment } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'

import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation'

import { type DocyrusAgentProject } from '@/hooks/docyrus/use-docyrus-agent-projects'

import { DocyrusAgentProjectItem } from './docyrus-agent-project-item'

export interface DocyrusAgentSidebarProjectsSectionRenderItemProps {
  isActive: boolean
  onSelect?: (project: DocyrusAgentProject) => void
  onRename?: (
    project: DocyrusAgentProject,
    name: string,
  ) => void | Promise<void>
  onDelete?: (project: DocyrusAgentProject) => void | Promise<void>
}

export interface DocyrusAgentSidebarProjectsSectionProps {
  projects: Array<DocyrusAgentProject>
  activeProjectId?: string | null
  /** Maximum projects rendered before "Show more" is shown. Defaults to 3. */
  maxVisibleProjects?: number
  /** Section label override. Defaults to "PROJECTS". */
  label?: ReactNode
  /** When supplied, clicking the section label calls this with `null` (clears filter). */
  onSelectProject?: (project: DocyrusAgentProject | null) => void
  onNewProject?: () => void
  onRenameProject?: (
    project: DocyrusAgentProject,
    name: string,
  ) => void | Promise<void>
  onDeleteProject?: (project: DocyrusAgentProject) => void | Promise<void>
  /** Click handler for the "Show more" footer link. Omit to hide the link. */
  onShowMoreProjects?: () => void
  /** Custom empty state. */
  emptyState?: ReactNode
  /** Replace the per-project row renderer. Defaults to `DocyrusAgentProjectItem`. */
  renderItem?: (
    project: DocyrusAgentProject,
    props: DocyrusAgentSidebarProjectsSectionRenderItemProps,
  ) => ReactNode
  /**
   * Replace the entire header (label + new project button). Set to `null` to hide the
   * header.
   */
  header?: ReactNode | null
  /** Replace the "Show more" trailing button. Receives a default click handler. */
  renderShowMore?: (props: { onClick: () => void }) => ReactNode
  className?: string
}

/**
 * Projects section for the agent sidebar — uppercase label + `+` create button, the top
 * N project rows, and an optional "Show more" link to a full projects page. Each slice
 * (header, item renderer, show-more button) can be replaced through props.
 */
export const DocyrusAgentSidebarProjectsSection = ({
  projects,
  activeProjectId,
  maxVisibleProjects = 3,
  label,
  onSelectProject,
  onNewProject,
  onRenameProject,
  onDeleteProject,
  onShowMoreProjects,
  emptyState,
  renderItem,
  header,
  renderShowMore,
  className,
}: DocyrusAgentSidebarProjectsSectionProps) => {
  const { t } = useUiTranslation()

  const defaultHeader = (
    <div className="flex items-center justify-between px-2 py-1">
      <button
        className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
        type="button"
        onClick={() => onSelectProject?.(null)}
      >
        {label ?? t('ui.agent.projects', 'Projects')}
      </button>
      {onNewProject && (
        <Button
          aria-label={t('ui.agent.newProject', 'New project')}
          className="size-6 text-muted-foreground hover:text-foreground"
          size="icon"
          variant="ghost"
          onClick={onNewProject}
        >
          <Plus className="size-3.5" />
        </Button>
      )}
    </div>
  )

  return (
    <div className={cn('mt-2 flex flex-col gap-0.5 px-2', className)}>
      {header === null ? null : (header ?? defaultHeader)}
      {projects.slice(0, maxVisibleProjects).map((project) => {
        const itemProps = {
          isActive: project.id === activeProjectId,
          onSelect: (p: DocyrusAgentProject) => onSelectProject?.(p),
          onRename: onRenameProject,
          onDelete: onDeleteProject,
        }

        if (renderItem) {
          return (
            <Fragment key={project.id}>
              {renderItem(project, itemProps)}
            </Fragment>
          )
        }

        return (
          <DocyrusAgentProjectItem
            key={project.id}
            isActive={itemProps.isActive}
            project={project}
            onDelete={itemProps.onDelete}
            onRename={itemProps.onRename}
            onSelect={itemProps.onSelect}
          />
        )
      })}
      {projects.length === 0 &&
        (emptyState ?? (
          <div className="px-2 py-1 text-xs text-muted-foreground">
            {t('ui.agent.noProjectsYet', 'No projects yet.')}
          </div>
        ))}
      {onShowMoreProjects &&
        (renderShowMore ? (
          renderShowMore({ onClick: onShowMoreProjects })
        ) : (
          <Button
            className="h-7 w-full justify-start px-2 text-xs text-primary hover:text-primary/80"
            variant="ghost"
            onClick={onShowMoreProjects}
          >
            {t('ui.agent.showMore', 'Show more')}
          </Button>
        ))}
    </div>
  )
}
