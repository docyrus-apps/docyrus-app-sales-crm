'use client';

// @ts-nocheck
/* eslint-disable */
import { memo, useCallback } from 'react';

import { type UIMessage, getToolName, isToolUIPart } from 'ai';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton
} from '@/components/ai-elements/conversation';
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse
} from '@/components/ai-elements/message';
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger
} from '@/components/ai-elements/reasoning';
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion';
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput
} from '@/components/ai-elements/tool';
import { cn } from '@/lib/utils';
import { CopyIcon } from 'lucide-react';

import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation';

import { useDocyrusAgent } from './docyrus-agent-context';

/*
 * ============================================================================
 * Message Parts Renderer
 * ============================================================================
 */

const MessageParts = memo(({ message }: { message: UIMessage }) => {
  const { chatStatus } = useDocyrusAgent();
  const isStreaming = chatStatus === 'streaming' || chatStatus === 'submitted';

  return (
    <>
      {message.parts.map((part, i) => {
        const key = `${message.id}-part-${String(i)}`;

        switch (part.type) {
          case 'text': {
            if (!part.text) return null;

            return <MessageResponse key={key}>{part.text}</MessageResponse>;
          }

          case 'reasoning': {
            return (
              <Reasoning
                isStreaming={isStreaming && i === message.parts.length - 1}
                key={key}>
                <ReasoningTrigger />
                <ReasoningContent>{part.text}</ReasoningContent>
              </Reasoning>
            );
          }

          default: {
            if (isToolUIPart(part)) {
              const toolName = getToolName(part);

              return (
                <Tool key={key}>
                  <ToolHeader
                    state={part.state}
                    toolName={toolName}
                    type="dynamic-tool" />
                  <ToolContent>
                    <ToolInput input={part.input} />
                    <ToolOutput
                      errorText={part.errorText}
                      output={part.output} />
                  </ToolContent>
                </Tool>
              );
            }

            return null;
          }
        }
      })}
    </>
  );
});

MessageParts.displayName = 'MessageParts';

/*
 * ============================================================================
 * Single Message
 * ============================================================================
 */

const ChatMessage = memo(({ message }: { message: UIMessage }) => {
  const { t } = useUiTranslation();
  const { showMessageActions } = useDocyrusAgent();
  const isAssistant = message.role === 'assistant';

  const handleCopy = useCallback(() => {
    const text = message.parts
      .filter(p => p.type === 'text')
      .map(p => ('text' in p ? p.text : ''))
      .join('\n');

    void navigator.clipboard.writeText(text);
  }, [message.parts]);

  return (
    <Message from={message.role}>
      <div className={cn('flex items-start gap-1', !isAssistant && 'flex-row-reverse')}>
        <MessageContent>
          {message.role === 'user' ? (
            <p>
              {message.parts
                .filter(p => p.type === 'text')
                .map(p => ('text' in p ? p.text : ''))
                .join('\n')}
            </p>
          ) : (
            <MessageParts message={message} />
          )}
        </MessageContent>
        {isAssistant && showMessageActions && (
          <MessageActions className="mt-1 shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
            <MessageAction onClick={handleCopy} tooltip={t('ui.agent.copyMessage', 'Copy message')}>
              <CopyIcon className="size-3.5" />
            </MessageAction>
          </MessageActions>
        )}
      </div>
    </Message>
  );
});

ChatMessage.displayName = 'ChatMessage';

/*
 * ============================================================================
 * Messages List
 * ============================================================================
 */

export interface DocyrusAgentChatMessagesProps {
  className?: string;
}

export const DocyrusAgentChatMessages = ({ className }: DocyrusAgentChatMessagesProps) => {
  const { t } = useUiTranslation();
  const {
    messages, suggestions, emptyState, onSendMessage, agent, chatStatus
  } = useDocyrusAgent();

  const lastMessage = messages[messages.length - 1];
  const isWaitingForFirstChunk
    = (chatStatus === 'submitted' || chatStatus === 'streaming')
      && lastMessage?.role === 'user';

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      onSendMessage?.({ text: suggestion });
    },
    [onSendMessage]
  );

  const hasMessages = messages.length > 0;

  return (
    <Conversation className={cn(className)}>
      <ConversationContent className={cn(!hasMessages && 'min-h-full')}>
        {hasMessages ? (
          <>
            {messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
            {isWaitingForFirstChunk && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="inline-block size-1.5 animate-pulse rounded-full bg-muted-foreground" />
                <span className="animate-pulse">
                  {t('ui.agent.thinking', 'Thinking…')}
                </span>
              </div>
            )}
          </>
        ) : (
          emptyState ?? (
            <div className="flex flex-1 items-center justify-center">
              <div className="flex max-w-md flex-col items-center gap-3 px-4 text-center">
                <Avatar className="size-20">
                  {agent.avatar?.image && <AvatarImage alt={agent.name} src={agent.avatar.image} />}
                  <AvatarFallback
                    className="rounded-2xl text-2xl font-semibold"
                    style={agent.avatar?.color ? { backgroundColor: agent.avatar.color, color: 'white' } : undefined}>
                    {(agent.avatar?.name ?? agent.name ?? '').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <p className="text-lg font-semibold text-foreground">{agent.name}</p>
                <div className="text-sm text-muted-foreground">
                  {agent.welcomeMessage ? (
                    <MessageResponse>{agent.welcomeMessage}</MessageResponse>
                  ) : (
                    <p>{agent.description ?? t('ui.agent.defaultWelcome', 'Your AI-powered assistant.')}</p>
                  )}
                </div>
                {suggestions.length > 0 && (
                  <Suggestions className="mt-2">
                    {suggestions.map(s => (
                      <Suggestion
                        key={s}
                        onClick={handleSuggestionClick}
                        suggestion={s} />
                    ))}
                  </Suggestions>
                )}
              </div>
            </div>
          )
        )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
};