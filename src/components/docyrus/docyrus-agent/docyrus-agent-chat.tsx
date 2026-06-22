'use client';

// @ts-nocheck
/* eslint-disable */
import { type ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { useDocyrusAgent } from './docyrus-agent-context';
import { DocyrusAgentChatInput } from './docyrus-agent-chat-input';
import { DocyrusAgentChatMessages } from './docyrus-agent-chat-messages';
import { DocyrusAgentHeader } from './docyrus-agent-header';

export interface DocyrusAgentChatProps {
  className?: string;
  /** Slot rendered before the agent avatar in the header. */
  headerLeading?: ReactNode;
  /** Slot rendered at the end of the header. */
  headerTrailing?: ReactNode;
  /**
   * Replace the chat input area entirely. Supply a fully composed `<DocyrusAgentChatInput>`
   * (with a custom body) to add toolbar buttons, swap the textarea, etc. Falls back to
   * the bare default `<DocyrusAgentChatInput />` when omitted.
   */
  chatInput?: ReactNode;
  /**
   * Slot rendered between the chat input and the bottom of the panel — handy for footer
   * disclaimers, memory menus, or other meta controls.
   */
  chatTrailing?: ReactNode;
}

export const DocyrusAgentChat = ({
  className, headerLeading, headerTrailing, chatInput, chatTrailing
}: DocyrusAgentChatProps) => {
  const { agent } = useDocyrusAgent();

  return (
    <div className={cn('flex h-full flex-col', className)}>
      <DocyrusAgentHeader agent={agent} leading={headerLeading} trailing={headerTrailing} />
      <DocyrusAgentChatMessages className="flex-1" />
      {chatInput ?? <DocyrusAgentChatInput />}
      {chatTrailing}
    </div>
  );
};