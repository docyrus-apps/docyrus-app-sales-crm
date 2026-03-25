'use client';

import { cn } from '@/lib/utils';

import { type DocyrusAgentProps } from './types';

import { DocyrusAgentProvider } from './docyrus-agent-context';
import { DocyrusAgentActionPanel } from './docyrus-agent-action-panel';
import { DocyrusAgentChat } from './docyrus-agent-chat';

export const DocyrusAgent = ({
  mode,
  agent,
  messages,
  chatStatus,
  actions,
  sources,
  onSendMessage,
  onStopGeneration,
  onExecuteAction,
  locale,
  allowAttachments,
  acceptFileTypes,
  suggestions,
  emptyState,
  showMessageActions,
  className
}: DocyrusAgentProps) => (
  <DocyrusAgentProvider
    acceptFileTypes={acceptFileTypes}
    actions={actions}
    agent={agent}
    allowAttachments={allowAttachments}
    chatStatus={chatStatus}
    emptyState={emptyState}
    locale={locale}
    messages={messages}
    mode={mode}
    onExecuteAction={onExecuteAction}
    onSendMessage={onSendMessage}
    onStopGeneration={onStopGeneration}
    showMessageActions={showMessageActions}
    sources={sources}
    suggestions={suggestions}>
    <div className={cn('flex h-full flex-col bg-background', className)}>
      {mode === 'chat' && <DocyrusAgentChat />}
      {mode === 'action-panel' && <DocyrusAgentActionPanel />}
    </div>
  </DocyrusAgentProvider>
);