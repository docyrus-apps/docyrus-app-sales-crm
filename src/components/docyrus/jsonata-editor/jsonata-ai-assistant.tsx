'use client'

// @ts-nocheck
/* eslint-disable */
import { type KeyboardEvent, useCallback, useRef, useState } from 'react'

import { Bot, SendHorizontal, X } from 'lucide-react'

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
} from '@/components/ai-elements/conversation'
import { Message, MessageContent } from '@/components/ai-elements/message'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

import {
  type JsonataAIAssistantConfig,
  type JsonataChatMessage,
} from './jsonata-editor-types'

export interface JsonataAIAssistantProps {
  config: JsonataAIAssistantConfig
  open: boolean
  onClose: () => void
  expression: string
  input: string
}

/**
 * Left-side AI Assistant drawer mounted inside `JsonataEditor`. Renders a
 * conversation built on ai-elements (`Conversation`, `Message`) and a basic
 * prompt input. Animates `width` from 0 to `config.width ?? 320` so the
 * drawer slides in/out without affecting outer layout.
 */
export function JsonataAIAssistant({
  config,
  open,
  onClose,
  expression,
  input,
}: JsonataAIAssistantProps) {
  const width = config.width ?? 320
  const idCounterRef = useRef(0)
  const nextId = useCallback(() => {
    idCounterRef.current += 1

    return `msg-${idCounterRef.current}`
  }, [])

  const [messages, setMessages] = useState<JsonataChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [isSending, setIsSending] = useState(false)

  const send = useCallback(async () => {
    const trimmed = draft.trim()

    if (!trimmed || isSending) return

    const userMessage: JsonataChatMessage = {
      id: nextId(),
      role: 'user',
      content: trimmed,
    }
    const nextHistory = [...messages, userMessage]

    setMessages(nextHistory)
    setDraft('')

    if (!config.onSendMessage) return

    setIsSending(true)

    try {
      const reply = await Promise.resolve(
        config.onSendMessage(trimmed, {
          expression,
          input,
          history: nextHistory,
        }),
      )

      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: 'assistant', content: reply },
      ])
    } catch (err) {
      const fallback = err instanceof Error ? err.message : String(err)

      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: 'assistant', content: fallback },
      ])
    } finally {
      setIsSending(false)
    }
  }, [draft, isSending, messages, config, expression, input, nextId])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        void send()
      }
    },
    [send],
  )

  const applySuggestion = useCallback((suggestion: string) => {
    setDraft(suggestion)
  }, [])

  return (
    <div
      aria-hidden={!open}
      className={cn(
        'absolute inset-y-0 left-0 z-10 flex flex-col border-r border-border bg-background shadow-xl transition-transform duration-300 ease-in-out',
        !open && 'pointer-events-none -translate-x-full',
      )}
      style={{ width }}
    >
      <div className="flex h-full flex-col">
        <div className="flex h-10 shrink-0 items-center justify-between border-b border-border px-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Bot className="size-3.5" />
            <span>{config.title ?? 'AI Assistant'}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="size-7 p-0"
            aria-label="Close AI Assistant"
          >
            <X className="size-3.5" />
          </Button>
        </div>

        <Conversation className="min-h-0 flex-1">
          <ConversationContent className="gap-4 p-3">
            {messages.length === 0 ? (
              <ConversationEmptyState
                icon={<Bot className="size-8 text-muted-foreground" />}
                title={config.title ?? 'AI Assistant'}
                description={
                  config.emptyStateDescription ??
                  'Ask for help writing or debugging your JSONata expression.'
                }
              />
            ) : (
              messages.map((message) => (
                <Message key={message.id} from={message.role}>
                  <MessageContent>
                    <div className="whitespace-pre-wrap break-words text-sm">
                      {message.content}
                    </div>
                  </MessageContent>
                </Message>
              ))
            )}
          </ConversationContent>
        </Conversation>

        {messages.length === 0 &&
          config.suggestions &&
          config.suggestions.length > 0 && (
            <div className="shrink-0 border-t border-border px-3 py-2">
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Suggestions
              </div>
              <div className="flex flex-wrap gap-1">
                {config.suggestions.map((suggestion) => (
                  <Button
                    key={suggestion}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => applySuggestion(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}

        <form
          className="shrink-0 border-t border-border p-2"
          onSubmit={(event) => {
            event.preventDefault()
            void send()
          }}
        >
          <div className="flex items-end gap-1.5">
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={config.placeholder ?? 'Ask the AI assistant…'}
              disabled={isSending}
              rows={2}
              className={cn('min-h-9 max-h-32 resize-none text-sm')}
            />
            <Button
              type="submit"
              size="sm"
              disabled={!draft.trim() || isSending}
              className="size-9 shrink-0 p-0"
              aria-label="Send message"
            >
              <SendHorizontal className="size-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
