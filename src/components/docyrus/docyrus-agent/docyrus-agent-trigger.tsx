'use client'

// @ts-nocheck
/* eslint-disable */
import { type ChangeEvent, type FormEvent, useCallback, useState } from 'react'

import { AwesomeDialog } from '@/components/docyrus/awesome-dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { SendIcon } from 'lucide-react'

import { type DocyrusAgentTriggerProps } from './types'

import { DocyrusAgentProvider } from './docyrus-agent-context'
import { DocyrusAgentChat } from './docyrus-agent-chat'

const EMPTY_ARRAY: never[] = []

export const DocyrusAgentTrigger = ({
  agent,
  messages = EMPTY_ARRAY,
  chatStatus,
  actions = EMPTY_ARRAY,
  sources = EMPTY_ARRAY,
  onSendMessage,
  onStopGeneration,
  onExecuteAction,
  allowAttachments,
  acceptFileTypes,
  suggestions = EMPTY_ARRAY,
  emptyState,
  showMessageActions,
  open: controlledOpen,
  onOpenChange,
  dialogContainer = 'sheet',
  dialogSide = 'right',
  dialogSize = 'lg',
  className,
}: DocyrusAgentTriggerProps) => {
  const [internalOpen, setInternalOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const isOpen = controlledOpen ?? internalOpen
  const setIsOpen = onOpenChange ?? setInternalOpen

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }, [])

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault()
      if (!inputValue.trim()) return
      onSendMessage?.({ text: inputValue })
      setInputValue('')
      setIsOpen(true)
    },
    [inputValue, onSendMessage, setIsOpen],
  )

  const handleCardClick = useCallback(() => {
    setIsOpen(true)
  }, [setIsOpen])

  const avatarInitial = agent.avatar?.name?.[0] ?? agent.name[0] ?? 'A'

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm',
          className,
        )}
      >
        <button
          className="flex shrink-0 cursor-pointer items-center gap-3 bg-transparent text-left"
          onClick={handleCardClick}
          type="button"
        >
          <Avatar className="size-9">
            <AvatarFallback
              className="text-xs"
              style={
                agent.avatar?.color
                  ? { backgroundColor: agent.avatar.color }
                  : undefined
              }
            >
              {agent.avatar?.image ? (
                <img
                  alt={agent.name}
                  className="size-full object-cover"
                  src={agent.avatar.image}
                />
              ) : (
                avatarInitial
              )}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium text-sm leading-none">{agent.name}</p>
            {agent.description && (
              <p className="mt-0.5 truncate text-muted-foreground text-xs">
                {agent.description}
              </p>
            )}
          </div>
        </button>

        <form
          className="ml-auto flex items-center gap-1.5"
          onSubmit={handleSubmit}
        >
          <input
            className="h-8 w-40 rounded-md border bg-background px-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
            onChange={handleInputChange}
            placeholder="Ask something..."
            value={inputValue}
          />
          <button
            className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
            disabled={!inputValue.trim()}
            type="submit"
          >
            <SendIcon className="size-3.5" />
          </button>
        </form>
      </div>

      <AwesomeDialog
        container={dialogContainer}
        onOpenChange={setIsOpen}
        open={isOpen}
        side={dialogSide}
        size={dialogSize}
      >
        <DocyrusAgentProvider
          acceptFileTypes={acceptFileTypes}
          actions={actions}
          agent={agent}
          allowAttachments={allowAttachments}
          chatStatus={chatStatus}
          emptyState={emptyState}
          messages={messages}
          mode="chat"
          onExecuteAction={onExecuteAction}
          onSendMessage={onSendMessage}
          onStopGeneration={onStopGeneration}
          showMessageActions={showMessageActions}
          sources={sources}
          suggestions={suggestions}
        >
          <DocyrusAgentChat />
        </DocyrusAgentProvider>
      </AwesomeDialog>
    </>
  )
}
