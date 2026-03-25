'use client';

import { memo, useCallback } from 'react';

import { type UIMessage, getToolName, isToolUIPart } from 'ai';

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
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
import { BotIcon, CopyIcon } from 'lucide-react';

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
  const { showMessageActions, t } = useDocyrusAgent();
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
        <MessageActions>
          <MessageAction onClick={handleCopy} tooltip={t('daCopyMessage')}>
            <CopyIcon className="size-3.5" />
          </MessageAction>
        </MessageActions>
      )}
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
  const {
    messages, suggestions, emptyState, onSendMessage, t, agent
  } = useDocyrusAgent();

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      onSendMessage?.({ text: suggestion });
    },
    [onSendMessage]
  );

  const hasMessages = messages.length > 0;

  return (
    <Conversation className={cn(className)}>
      <ConversationContent>
        {hasMessages ? (
          messages.map(msg => <ChatMessage key={msg.id} message={msg} />)
        ) : (
          emptyState ?? (
            <ConversationEmptyState
              description={t('daEmptyStateDescription')}
              icon={<BotIcon className="size-8" />}
              title={agent.name}>
              {suggestions.length > 0 && (
                <Suggestions className="mt-4">
                  {suggestions.map(s => (
                    <Suggestion
                      key={s}
                      onClick={handleSuggestionClick}
                      suggestion={s} />
                  ))}
                </Suggestions>
              )}
            </ConversationEmptyState>
          )
        )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
};