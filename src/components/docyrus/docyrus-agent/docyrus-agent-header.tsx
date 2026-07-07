'use client'

// @ts-nocheck
/* eslint-disable */
import { type ReactNode } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

import { type AgentProfile } from './types'

export interface DocyrusAgentHeaderProps {
  agent: AgentProfile
  /** Slot rendered before the agent avatar — typically a sidebar toggle or back button. */
  leading?: ReactNode
  /** Slot rendered at the end of the header — typically extra controls. */
  trailing?: ReactNode
  className?: string
}

function getAvatarInitials(agent: AgentProfile): string {
  const source = agent.avatar?.name ?? agent.name ?? ''

  return source.slice(0, 2).toUpperCase()
}

export const DocyrusAgentHeader = ({
  agent,
  leading,
  trailing,
  className,
}: DocyrusAgentHeaderProps) => (
  <div
    className={cn(
      'flex shrink-0 items-center gap-3 border-b bg-muted/50 px-4 py-3',
      className,
    )}
  >
    {leading}
    <Avatar className="size-8 shrink-0">
      {agent.avatar?.image && (
        <AvatarImage alt={agent.name} src={agent.avatar.image} />
      )}
      <AvatarFallback
        className="rounded-md text-xs font-medium"
        style={
          agent.avatar?.color
            ? { backgroundColor: agent.avatar.color, color: 'white' }
            : undefined
        }
      >
        {getAvatarInitials(agent)}
      </AvatarFallback>
    </Avatar>

    <div className="min-w-0 flex-1">
      <div className="truncate text-base font-medium text-foreground">
        {agent.name}
      </div>
    </div>
    {trailing}
  </div>
)
