'use client';

import { AvatarThumbnail } from '@/components/docyrus/avatar-thumbnail';
import { cn } from '@/lib/utils';

import { type AgentProfile } from './types';

export interface DocyrusAgentHeaderProps {
  agent: AgentProfile;
  className?: string;
}

export const DocyrusAgentHeader = ({ agent, className }: DocyrusAgentHeaderProps) => (
  <div
    className={cn(
      'flex shrink-0 items-center gap-3 border-b bg-muted/50 px-4 py-3',
      className
    )}>
    {agent.avatar && (
      <AvatarThumbnail
        color={agent.avatar.color}
        icon={agent.avatar.icon}
        image={agent.avatar.image ? { signed_url: agent.avatar.image } : undefined}
        size={8}
        shape="rounded" />
    )}

    <div className="flex min-w-0 flex-1 flex-col">
      <div className="truncate text-base font-medium text-foreground">
        {agent.name}
      </div>
      {agent.description && (
        <div className="truncate text-sm text-muted-foreground">
          {agent.description}
        </div>
      )}
    </div>
  </div>
);