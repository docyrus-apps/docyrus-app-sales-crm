'use client';

// @ts-nocheck
/* eslint-disable */
import { type ReactNode, useCallback } from 'react';

import { type ChatStatus } from 'ai';

import {
  type PromptInputMessage,
  PromptInput,
  PromptInputFooter,
  PromptInputTools
} from '@/components/ai-elements/prompt-input';
import { cn } from '@/lib/utils';

import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation';

import { DocyrusAgentChatInputAttachButton } from './docyrus-agent-chat-input-attach-button';
import { DocyrusAgentChatInputAttachments } from './docyrus-agent-chat-input-attachments';
import { DocyrusAgentChatInputSubmit } from './docyrus-agent-chat-input-submit';
import { DocyrusAgentChatInputTextarea } from './docyrus-agent-chat-input-textarea';
import { DocyrusAgentProvider } from './docyrus-agent-context';
import { type AgentMessagePayload, type AgentProfile } from './types';

export interface DocyrusAgentProjectPromptInputProps {
  /** Owning agent — required by the provider that powers the prompt input. */
  agent: AgentProfile;
  onSendMessage?: (payload: AgentMessagePayload) => void | Promise<void>;
  onStopGeneration?: () => void;
  chatStatus?: ChatStatus;
  allowAttachments?: boolean;
  acceptFileTypes?: string;
  /** Placeholder shown in the input textarea. Defaults to "Ask about this project...". */
  placeholder?: string;
  /** Footer caption beneath the input. Set to `null` to hide. */
  footerText?: ReactNode;
  /** Override the input children. When omitted, renders the default composition. */
  children?: ReactNode;
  className?: string;
}

/**
 * Project-scoped prompt input. Mounts its own `DocyrusAgentProvider` so the standard
 * sub-components (`Attachments`, `AttachButton`, `Textarea`, `Submit`) work without
 * extra wiring. Drop into a project surface above a threads list to start a new chat.
 */
export const DocyrusAgentProjectPromptInput = ({
  agent,
  onSendMessage,
  onStopGeneration,
  chatStatus,
  allowAttachments,
  acceptFileTypes,
  placeholder,
  footerText,
  children,
  className
}: DocyrusAgentProjectPromptInputProps) => {
  const { t } = useUiTranslation();

  const handleSubmit = useCallback(
    (message: PromptInputMessage) => {
      if (!message.text.trim() && message.files.length === 0) return;
      void onSendMessage?.({
        text: message.text,
        files: message.files.length > 0 ? message.files : undefined
      });
    },
    [onSendMessage]
  );

  return (
    <DocyrusAgentProvider
      acceptFileTypes={acceptFileTypes}
      agent={agent}
      allowAttachments={allowAttachments}
      chatStatus={chatStatus}
      mode="chat"
      onSendMessage={onSendMessage}
      onStopGeneration={onStopGeneration}>
      <div className={cn('rounded-xl border bg-muted/30', className)}>
        <PromptInput accept={acceptFileTypes} multiple onSubmit={handleSubmit}>
          {children ?? (
            <>
              {allowAttachments && <DocyrusAgentChatInputAttachments />}
              <DocyrusAgentChatInputTextarea
                placeholder={placeholder ?? t('ui.agent.askAboutProject', 'Ask about this project...')} />
              <PromptInputFooter>
                <PromptInputTools>
                  {allowAttachments && <DocyrusAgentChatInputAttachButton />}
                </PromptInputTools>
                <DocyrusAgentChatInputSubmit />
              </PromptInputFooter>
            </>
          )}
        </PromptInput>
      </div>
      {footerText !== null && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {footerText ?? t('ui.agent.aiDisclaimer', 'Powered by AI — Responses may need verification')}
        </p>
      )}
    </DocyrusAgentProvider>
  );
};