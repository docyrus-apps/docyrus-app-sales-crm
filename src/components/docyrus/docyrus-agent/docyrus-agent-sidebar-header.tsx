'use client'

// @ts-nocheck
/* eslint-disable */
import { type ReactNode } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PanelLeft } from 'lucide-react'

import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation'

import { type AgentProfile } from './types'

export interface DocyrusAgentSidebarHeaderProps {
  /** Agent identity rendered as avatar + name. Omit to fall back to `title`. */
  agent?: AgentProfile
  /** Title shown when no agent is provided. Defaults to "Threads". */
  title?: ReactNode
  /** Show a collapse button on the right — clicking calls `onClose`. */
  onClose?: () => void
  /** Override the close icon. */
  closeIcon?: ReactNode
  /** Slot rendered on the right, replacing the close button when supplied. */
  trailing?: ReactNode
  className?: string
}

/**
 * Sidebar header card with agent avatar + name and an optional collapse button.
 * Drop into `DocyrusAgentSidebar` directly above the first nav row.
 */
export const DocyrusAgentSidebarHeader = ({
  agent,
  title,
  onClose,
  closeIcon,
  trailing,
  className,
}: DocyrusAgentSidebarHeaderProps) => {
  const { t } = useUiTranslation()

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-2 border-b px-4 py-3',
        className,
      )}
    >
      {agent ? (
        <div className="flex min-w-0 items-center gap-2">
          <Avatar className="size-7 shrink-0">
            {agent.avatar?.image && (
              <AvatarImage alt={agent.name} src={agent.avatar.image} />
            )}
            <AvatarFallback
              className="text-xs font-medium"
              style={
                agent.avatar?.color
                  ? { backgroundColor: agent.avatar.color, color: 'white' }
                  : undefined
              }
            >
              {(agent.avatar?.name ?? agent.name).slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <span className="truncate text-sm font-semibold">{agent.name}</span>
        </div>
      ) : (
        <span className="text-sm font-semibold">
          {title ?? t('ui.agent.threads', 'Threads')}
        </span>
      )}
      {trailing ??
        (onClose && (
          <Button
            aria-label={t('ui.agent.collapseSidebar', 'Collapse sidebar')}
            className="size-7 text-muted-foreground"
            size="icon"
            variant="ghost"
            onClick={onClose}
          >
            {closeIcon ?? <PanelLeft className="size-4" />}
          </Button>
        ))}
    </div>
  )
}
