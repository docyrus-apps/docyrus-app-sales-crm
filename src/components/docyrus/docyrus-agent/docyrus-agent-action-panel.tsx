'use client'

// @ts-nocheck
/* eslint-disable */
import { useEffect } from 'react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation'

import { useDocyrusAgent } from './docyrus-agent-context'
import { DocyrusAgentActionList } from './docyrus-agent-action-list'
import { DocyrusAgentActionParams } from './docyrus-agent-action-params'
import { DocyrusAgentChatInput } from './docyrus-agent-chat-input'
import { DocyrusAgentChatMessages } from './docyrus-agent-chat-messages'
import { DocyrusAgentHeader } from './docyrus-agent-header'

export interface DocyrusAgentActionPanelProps {
  className?: string
}

export const DocyrusAgentActionPanel = ({
  className,
}: DocyrusAgentActionPanelProps) => {
  const { t } = useUiTranslation()
  const {
    agent,
    actions,
    sources,
    actionPanelView,
    selectedAction,
    setSelectedAction,
    setActionPanelView,
  } = useDocyrusAgent()

  useEffect(() => {
    const firstAction = actions[0]

    if (actions.length === 1 && firstAction?.isDefault && !selectedAction) {
      setSelectedAction(firstAction)
      if (firstAction.params && firstAction.params.length > 0) {
        setActionPanelView('action-params')
      } else {
        setActionPanelView('executing')
      }
    }
  }, [actions, selectedAction, setSelectedAction, setActionPanelView])

  const showChat = actionPanelView === 'executing' && selectedAction?.opensChat

  return (
    <div className={cn('flex h-full flex-col', className)}>
      <DocyrusAgentHeader agent={agent} />

      {sources.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-b px-5 py-2">
          <span className="text-muted-foreground text-xs">
            {t('ui.agent.sources', 'Sources')}:
          </span>
          {sources.map((source, i) => (
            <Badge
              className="text-[10px]"
              key={`${source.type}-${String(i)}`}
              variant="secondary"
            >
              {source.label ?? source.type}
            </Badge>
          ))}
        </div>
      )}

      {showChat ? (
        <>
          <DocyrusAgentChatMessages className="flex-1" />
          <DocyrusAgentChatInput />
        </>
      ) : (
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {actionPanelView === 'action-list' && <DocyrusAgentActionList />}
          {actionPanelView === 'action-params' && <DocyrusAgentActionParams />}
          {actionPanelView === 'executing' && (
            <div className="flex items-center justify-center p-8 text-muted-foreground text-sm">
              {t('ui.agent.executing', 'Executing...')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
