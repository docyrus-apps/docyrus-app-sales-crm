'use client'

// @ts-nocheck
/* eslint-disable */
import { type ReactNode } from 'react'

import { cn } from '@/lib/utils'
import { CirclePlus } from 'lucide-react'

import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation'

export interface DocyrusAgentSidebarNewChatButtonProps {
  onClick?: () => void
  /** Override the icon. */
  icon?: ReactNode
  /** Override the label. */
  label?: ReactNode
  className?: string
}

/**
 * Prominent "New Chat" row used at the top of the agent sidebar. Renders as a full-width
 * left-aligned button.
 */
export const DocyrusAgentSidebarNewChatButton = ({
  onClick,
  icon,
  label,
  className,
}: DocyrusAgentSidebarNewChatButtonProps) => {
  const { t } = useUiTranslation()

  return (
    <button
      className={cn(
        'flex items-center gap-3 px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-muted/40',
        className,
      )}
      type="button"
      onClick={onClick}
    >
      {icon ?? (
        <CirclePlus
          className="size-5 text-muted-foreground"
          strokeWidth={1.5}
        />
      )}
      {label ?? t('ui.agent.newChat', 'New Chat')}
    </button>
  )
}
