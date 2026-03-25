'use client';

import { cn } from '@/lib/utils';

import { useDocyrusAgent } from './docyrus-agent-context';
import { DocyrusAgentChatInput } from './docyrus-agent-chat-input';
import { DocyrusAgentChatMessages } from './docyrus-agent-chat-messages';
import { DocyrusAgentHeader } from './docyrus-agent-header';

export interface DocyrusAgentChatProps {
  className?: string;
}

export const DocyrusAgentChat = ({ className }: DocyrusAgentChatProps) => {
  const { agent } = useDocyrusAgent();

  return (
    <div className={cn('flex h-full flex-col', className)}>
      <DocyrusAgentHeader agent={agent} />
      <DocyrusAgentChatMessages className="flex-1" />
      <DocyrusAgentChatInput />
    </div>
  );
};