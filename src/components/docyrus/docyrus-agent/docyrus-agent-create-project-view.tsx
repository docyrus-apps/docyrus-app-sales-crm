'use client'

// @ts-nocheck
/* eslint-disable */
import { type ReactNode, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'

import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation'

export interface DocyrusAgentCreateProjectViewProps {
  /** Fires when the back arrow or Cancel button is pressed. */
  onCancel: () => void
  /** Fires when the user submits the form. */
  onCreate: (input: {
    name: string
    description: string
  }) => void | Promise<void>
  /** Disable the Create button (e.g. while the create mutation is pending). */
  isCreating?: boolean
  /** Override the heading. */
  title?: string
  /** Override the name field label. */
  nameLabel?: string
  /** Override the description field label. */
  descriptionLabel?: string
  /** Override the name input placeholder. */
  namePlaceholder?: string
  /** Override the description textarea placeholder. */
  descriptionPlaceholder?: string
  /** Slot rendered to the left of the back button (e.g. sidebar-toggle spacer). */
  headerLeading?: ReactNode
  /** Extra fields rendered between the description textarea and the action footer. */
  extraFields?: ReactNode
  /** Replace the action footer (Cancel + Create buttons). */
  actions?: ReactNode
  className?: string
}

/**
 * Full-pane "Create a Project" form. Drop this where the chat surface would normally render
 * to slide the chat area into project-creation mode. Owns its own input state; emits the
 * collected values via `onCreate` and a back/cancel signal via `onCancel`.
 */
export const DocyrusAgentCreateProjectView = ({
  onCancel,
  onCreate,
  isCreating = false,
  title,
  nameLabel,
  descriptionLabel,
  namePlaceholder,
  descriptionPlaceholder,
  headerLeading,
  extraFields,
  actions,
  className,
}: DocyrusAgentCreateProjectViewProps) => {
  const { t } = useUiTranslation()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const canSubmit = name.trim().length > 0 && !isCreating

  const handleSubmit = () => {
    if (!canSubmit) return
    void onCreate({ name: name.trim(), description: description.trim() })
  }

  return (
    <div className={cn('flex h-full flex-col bg-background', className)}>
      <div className="flex shrink-0 items-center gap-2 px-4 py-3">
        {headerLeading}
        <Button
          aria-label={t('ui.common.back', 'Back')}
          className="size-8"
          size="icon"
          variant="ghost"
          onClick={onCancel}
        >
          <ArrowLeft className="size-4" />
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 items-start justify-center overflow-y-auto px-6">
        <div className="flex w-full max-w-xl flex-col gap-6 py-8">
          <h1 className="text-2xl font-semibold tracking-tight">
            {title ?? t('ui.agent.createProjectTitle', 'Create a Project')}
          </h1>

          <div className="flex flex-col gap-2">
            <Label htmlFor="project-name">
              {nameLabel ??
                t(
                  'ui.agent.createProjectNameLabel',
                  'What are you working on?',
                )}
            </Label>
            <Input
              autoFocus
              id="project-name"
              placeholder={
                namePlaceholder ??
                t('ui.agent.createProjectNamePlaceholder', 'Name your project')
              }
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleSubmit()
              }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="project-description">
              {descriptionLabel ??
                t(
                  'ui.agent.createProjectDescriptionLabel',
                  'What are you trying to achieve?',
                )}
            </Label>
            <Textarea
              className="min-h-24"
              id="project-description"
              placeholder={
                descriptionPlaceholder ??
                t(
                  'ui.agent.createProjectDescriptionPlaceholder',
                  'Describe your Project',
                )
              }
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          {extraFields}

          {actions ?? (
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={onCancel}>
                {t('ui.common.cancel', 'Cancel')}
              </Button>
              <Button disabled={!canSubmit} onClick={handleSubmit}>
                {t('ui.agent.createProjectSubmit', 'Create project')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
