'use client'

// @ts-nocheck
/* eslint-disable */
import { type ReactNode } from 'react'

import { type ChatStatus } from 'ai'

import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation'

import { type DocyrusAgentProject } from '@/hooks/docyrus/use-docyrus-agent-projects'
import { type DocyrusAgentThread } from '@/hooks/docyrus/use-docyrus-agent-threads'

import { DocyrusAgentProjectHeader } from './docyrus-agent-project-header'
import { DocyrusAgentProjectPromptInput } from './docyrus-agent-project-prompt-input'
import {
  type DocyrusAgentProjectDetailTab,
  DocyrusAgentProjectTabs,
} from './docyrus-agent-project-tabs'
import { DocyrusAgentProjectThreadRow } from './docyrus-agent-project-thread-row'
import { type AgentMessagePayload, type AgentProfile } from './types'

export type { DocyrusAgentProjectDetailTab } from './docyrus-agent-project-tabs'

export interface DocyrusAgentProjectDetailViewProps {
  /** Active project. */
  project: DocyrusAgentProject
  /** Owning agent — required by the prompt input. */
  agent: AgentProfile

  /** Goes back to the projects list. */
  onBack?: () => void
  /** Custom label for the "All Projects" link. */
  allProjectsLabel?: string
  /** Slot rendered to the left of the back link — typically a sidebar-toggle spacer. */
  headerLeading?: ReactNode

  /** Fires when the user submits the prompt. */
  onSendMessage?: (payload: AgentMessagePayload) => void | Promise<void>
  /** Fires when the streaming Submit button is pressed in stop mode. */
  onStopGeneration?: () => void
  /** Drives the Submit / Stop button. */
  chatStatus?: ChatStatus
  /** Show the attach-file button. */
  allowAttachments?: boolean
  /** HTML `accept` for the file picker. */
  acceptFileTypes?: string
  /** Placeholder shown in the input textarea. */
  inputPlaceholder?: string

  /** Threads to render under the Sessions tab. */
  threads: Array<DocyrusAgentThread>
  isLoadingThreads?: boolean
  activeThreadId?: string | null
  onSelectThread?: (thread: DocyrusAgentThread) => void

  /** Override the rendered Sessions tab body. When omitted, the built-in threads list is shown. */
  sessionsContent?: ReactNode
  /** Slot rendered inside the Works tab. When omitted, the tab is hidden. */
  worksContent?: ReactNode
  /** Slot rendered inside the Documents tab. When omitted, the tab is hidden. */
  documentsContent?: ReactNode
  /** Replace the per-thread row renderer used by the default sessions content. */
  renderThreadRow?: (
    thread: DocyrusAgentThread,
    props: {
      isActive: boolean
      onSelect?: (thread: DocyrusAgentThread) => void
    },
  ) => ReactNode

  /** Controlled active tab (defaults to 'sessions'). */
  activeTab?: DocyrusAgentProjectDetailTab
  onTabChange?: (tab: DocyrusAgentProjectDetailTab) => void

  /** Footer text under the prompt input (defaults to the standard AI disclaimer). */
  footerText?: ReactNode
  className?: string
}

/**
 * Default composition of the project detail surface. Wires together
 * `DocyrusAgentProjectHeader`, `DocyrusAgentProjectPromptInput`, `DocyrusAgentProjectTabs`,
 * and `DocyrusAgentProjectThreadRow` to mirror the pro `AssistantChatPanel` "project view".
 *
 * For custom layouts, compose those sub-components directly instead of using this view.
 */
export const DocyrusAgentProjectDetailView = ({
  project,
  agent,
  onBack,
  allProjectsLabel,
  headerLeading,
  onSendMessage,
  onStopGeneration,
  chatStatus,
  allowAttachments,
  acceptFileTypes,
  inputPlaceholder,
  threads,
  isLoadingThreads,
  activeThreadId,
  onSelectThread,
  sessionsContent,
  worksContent,
  documentsContent,
  renderThreadRow,
  activeTab,
  onTabChange,
  footerText,
  className,
}: DocyrusAgentProjectDetailViewProps) => {
  const { t } = useUiTranslation()

  const defaultSessionsContent =
    isLoadingThreads && threads.length === 0 ? (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
      </div>
    ) : threads.length === 0 ? (
      <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
        <p className="text-foreground">
          {t('ui.agent.noThreadsForProject', 'No threads yet for this project')}
        </p>
        <p>
          {t(
            'ui.agent.startConversationToCreate',
            'Start a conversation to create the first thread',
          )}
        </p>
      </div>
    ) : (
      <div className="flex flex-col gap-2">
        <div className="text-right text-xs text-muted-foreground">
          {threads.length === 1 ? '1 thread' : `${threads.length} threads`}
        </div>
        <div className="flex max-h-[420px] flex-col gap-2 overflow-y-auto">
          {threads.map((thread) => {
            const rowProps = {
              isActive: thread.id === activeThreadId,
              onSelect: onSelectThread,
            }

            if (renderThreadRow) return renderThreadRow(thread, rowProps)

            return (
              <DocyrusAgentProjectThreadRow
                key={thread.id}
                isActive={rowProps.isActive}
                thread={thread}
                onSelect={rowProps.onSelect}
              />
            )
          })}
        </div>
      </div>
    )

  const resolvedSessionsContent = sessionsContent ?? defaultSessionsContent

  return (
    <div
      className={cn(
        'flex h-full min-h-0 flex-col overflow-y-auto bg-background px-6 pb-6',
        className,
      )}
    >
      <DocyrusAgentProjectHeader
        allProjectsLabel={allProjectsLabel}
        className="mt-4"
        leading={headerLeading}
        project={project}
        onBack={onBack}
      />

      <DocyrusAgentProjectPromptInput
        acceptFileTypes={acceptFileTypes}
        agent={agent}
        allowAttachments={allowAttachments}
        chatStatus={chatStatus}
        className="mt-6"
        footerText={footerText}
        placeholder={inputPlaceholder}
        onSendMessage={onSendMessage}
        onStopGeneration={onStopGeneration}
      />

      <DocyrusAgentProjectTabs
        className="mt-6"
        documentsContent={documentsContent}
        sessionsContent={resolvedSessionsContent}
        value={activeTab}
        worksContent={worksContent}
        onValueChange={onTabChange}
      />
    </div>
  )
}
