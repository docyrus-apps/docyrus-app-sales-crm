'use client'

// @ts-nocheck
/* eslint-disable */
import { useState } from 'react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'

import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation'

import { type DocyrusAgentProject } from '@/hooks/docyrus/use-docyrus-agent-projects'

export interface DocyrusAgentProjectItemProps {
  project: DocyrusAgentProject
  isActive?: boolean
  onSelect?: (project: DocyrusAgentProject) => void
  onRename?: (
    project: DocyrusAgentProject,
    name: string,
  ) => void | Promise<void>
  onDelete?: (project: DocyrusAgentProject) => void | Promise<void>
  hideActions?: boolean
  className?: string
}

export const DocyrusAgentProjectItem = ({
  project,
  isActive,
  onSelect,
  onRename,
  onDelete,
  hideActions,
  className,
}: DocyrusAgentProjectItemProps) => {
  const { t } = useUiTranslation()
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [draft, setDraft] = useState(project.name)

  const handleRenameSubmit = async () => {
    const next = draft.trim()

    if (!next || next === project.name) {
      setRenameOpen(false)

      return
    }

    await onRename?.(project, next)
    setRenameOpen(false)
  }

  return (
    <div
      className={cn(
        'group relative cursor-pointer rounded-md px-2 py-1 transition-colors hover:bg-muted/40',
        isActive && 'bg-muted/60 hover:bg-muted/60',
        className,
      )}
      onClick={() => onSelect?.(project)}
    >
      <div className="flex items-center gap-1">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm">{project.name}</div>
          <div className="truncate text-xs text-muted-foreground">
            {project.description ||
              t('ui.agent.noDescription', 'No description')}
          </div>
        </div>

        {!hideActions && (onRename || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label="Project actions"
                className="size-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
                size="icon"
                variant="ghost"
                onClick={(event) => event.stopPropagation()}
              >
                <MoreVertical className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-40"
              onClick={(event) => event.stopPropagation()}
            >
              {onRename && (
                <DropdownMenuItem
                  onSelect={() => {
                    setDraft(project.name)
                    setRenameOpen(true)
                  }}
                >
                  <Pencil className="size-4" />
                  {t('ui.agent.rename', 'Rename')}
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={() => setDeleteOpen(true)}
                >
                  <Trash2 className="size-4" />
                  {t('ui.agent.delete', 'Delete')}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <AlertDialog open={renameOpen} onOpenChange={setRenameOpen}>
        <AlertDialogContent onClick={(event) => event.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('ui.agent.renameProject', 'Rename project')}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <Input
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void handleRenameSubmit()
            }}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('ui.common.cancel', 'Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleRenameSubmit()}>
              {t('ui.common.save', 'Save')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent onClick={(event) => event.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('ui.agent.deleteProject', 'Delete project?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'ui.agent.deleteProjectDescription',
                'Threads inside this project will remain but be detached from it.',
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('ui.common.cancel', 'Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                await onDelete?.(project)
                setDeleteOpen(false)
              }}
            >
              {t('ui.agent.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
