'use client'

// @ts-nocheck
/* eslint-disable */
import { type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Eye, Pencil, Trash2 } from 'lucide-react'

import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation'

import { type DocyrusAgentProject } from '@/hooks/docyrus/use-docyrus-agent-projects'

export interface DocyrusAgentProjectCardProps {
  project: DocyrusAgentProject
  /** Fires when the View button is pressed. */
  onSelect?: (project: DocyrusAgentProject) => void
  /** Fires when the Edit button is pressed. */
  onEdit?: (project: DocyrusAgentProject) => void
  /** Fires when the Delete button is pressed. */
  onDelete?: (project: DocyrusAgentProject) => void
  /** Replace the card header (default: name + description). */
  header?: ReactNode
  /** Replace the description below the name. Set to `null` to hide. */
  description?: ReactNode | null
  /** Slot rendered between the header and the action footer. */
  body?: ReactNode
  /** Replace the action footer entirely (View / Edit / Delete) with custom buttons. */
  actions?: ReactNode
  className?: string
}

/**
 * Card representation of a project — used in the projects browser grid. Renders the
 * project name + description and a footer of View / Edit / Delete buttons.
 */
export const DocyrusAgentProjectCard = ({
  project,
  onSelect,
  onEdit,
  onDelete,
  header,
  description,
  body,
  actions,
  className,
}: DocyrusAgentProjectCardProps) => {
  const { t } = useUiTranslation()

  const resolvedDescription =
    description === null
      ? null
      : (description ??
        (project.description ? (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {project.description}
          </p>
        ) : null))

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-lg border bg-card p-4 transition-shadow hover:shadow-md',
        className,
      )}
    >
      {header ?? (
        <div className="flex min-w-0 flex-col">
          <h3 className="line-clamp-2 font-medium text-card-foreground">
            {project.name}
          </h3>
          {resolvedDescription}
        </div>
      )}
      {body}
      <div className="flex items-center gap-1 border-t pt-2">
        {actions ?? (
          <>
            {onSelect && (
              <Button
                className="h-7 px-2 text-xs text-primary hover:bg-primary/10 hover:text-primary/80"
                size="sm"
                variant="ghost"
                onClick={() => onSelect(project)}
              >
                <Eye className="size-3.5" />
                {t('ui.common.view', 'View')}
              </Button>
            )}
            {onEdit && (
              <Button
                className="h-7 px-2 text-xs text-primary hover:bg-primary/10 hover:text-primary/80"
                size="sm"
                variant="ghost"
                onClick={() => onEdit(project)}
              >
                <Pencil className="size-3.5" />
                {t('ui.common.edit', 'Edit')}
              </Button>
            )}
            {onDelete && (
              <Button
                aria-label={t('ui.common.delete', 'Delete')}
                className="ml-auto size-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                size="icon"
                variant="ghost"
                onClick={() => onDelete(project)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
