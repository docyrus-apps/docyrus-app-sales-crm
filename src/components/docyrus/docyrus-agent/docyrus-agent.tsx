'use client'

// @ts-nocheck
/* eslint-disable */
import { cn } from '@/lib/utils'

import { type DocyrusAgentProps } from './types'

import { DocyrusAgentProvider } from './docyrus-agent-context'
import { DocyrusAgentChat } from './docyrus-agent-chat'

export const DocyrusAgent = ({
  agent,
  messages,
  chatStatus,
  actions,
  sources,
  onSendMessage,
  onStopGeneration,
  onExecuteAction,
  allowAttachments,
  acceptFileTypes,
  suggestions,
  emptyState,
  showMessageActions,
  headerLeading,
  headerTrailing,
  chatInput,
  chatTrailing,
  capabilities,
  initialFeatureFlags,
  featureFlags,
  onFeatureFlagsChange,
  className,
}: DocyrusAgentProps) => (
  <DocyrusAgentProvider
    acceptFileTypes={acceptFileTypes}
    actions={actions}
    agent={agent}
    allowAttachments={allowAttachments}
    capabilities={capabilities}
    chatStatus={chatStatus}
    emptyState={emptyState}
    featureFlags={featureFlags}
    initialFeatureFlags={initialFeatureFlags}
    messages={messages}
    mode="chat"
    onExecuteAction={onExecuteAction}
    onFeatureFlagsChange={onFeatureFlagsChange}
    onSendMessage={onSendMessage}
    onStopGeneration={onStopGeneration}
    showMessageActions={showMessageActions}
    sources={sources}
    suggestions={suggestions}
  >
    <div className={cn('flex h-full flex-col bg-background', className)}>
      <DocyrusAgentChat
        chatInput={chatInput}
        chatTrailing={chatTrailing}
        headerLeading={headerLeading}
        headerTrailing={headerTrailing}
      />
    </div>
  </DocyrusAgentProvider>
)
