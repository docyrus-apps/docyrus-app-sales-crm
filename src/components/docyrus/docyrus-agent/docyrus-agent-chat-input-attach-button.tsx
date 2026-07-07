'use client'

// @ts-nocheck
/* eslint-disable */
import { type ReactNode } from 'react'

import {
  PromptInputButton,
  usePromptInputAttachments,
} from '@/components/ai-elements/prompt-input'
import { PlusIcon } from 'lucide-react'

import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation'

export interface DocyrusAgentChatInputAttachButtonProps {
  className?: string
  /** Replace the default `+` icon. */
  children?: ReactNode
  /** Override the default aria-label / tooltip text. */
  label?: string
}

/**
 * Opens the file picker for the surrounding `PromptInput`. Must be rendered inside
 * `PromptInput` so `usePromptInputAttachments()` resolves.
 */
export const DocyrusAgentChatInputAttachButton = ({
  className,
  children,
  label,
}: DocyrusAgentChatInputAttachButtonProps) => {
  const { t } = useUiTranslation()
  const attachments = usePromptInputAttachments()

  const resolvedLabel = label ?? t('ui.agent.attachFile', 'Attach file')

  return (
    <PromptInputButton
      aria-label={resolvedLabel}
      className={className}
      onClick={() => attachments.openFileDialog()}
    >
      {children ?? <PlusIcon className="size-4" />}
    </PromptInputButton>
  )
}
