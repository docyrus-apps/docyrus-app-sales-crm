'use client';

import { useCallback } from 'react';

import { type PromptInputMessage } from '@/components/ai-elements/prompt-input';

import {
  PromptInput,
  PromptInputButton,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools
} from '@/components/ai-elements/prompt-input';
import { cn } from '@/lib/utils';
import { PaperclipIcon } from 'lucide-react';

import { useDocyrusAgent } from './docyrus-agent-context';

export interface DocyrusAgentChatInputProps {
  className?: string;
}

export const DocyrusAgentChatInput = ({ className }: DocyrusAgentChatInputProps) => {
  const {
    onSendMessage,
    onStopGeneration,
    chatStatus,
    allowAttachments,
    acceptFileTypes,
    t
  } = useDocyrusAgent();

  const handleSubmit = useCallback(
    (message: PromptInputMessage) => {
      if (!message.text.trim() && message.files.length === 0) return;
      onSendMessage?.({
        files: message.files.length > 0 ? message.files : undefined,
        text: message.text
      });
    },
    [onSendMessage]
  );

  return (
    <div className={cn('border-t px-4 py-3', className)}>
      <PromptInput
        accept={acceptFileTypes}
        multiple
        onSubmit={handleSubmit}>
        <PromptInputTextarea placeholder={t('daAskPrompt')} />
        <PromptInputFooter>
          <PromptInputTools>
            {allowAttachments && (
              <PromptInputButton tooltip={t('daAttachFile')}>
                <PaperclipIcon className="size-4" />
              </PromptInputButton>
            )}
          </PromptInputTools>
          <PromptInputSubmit
            onStop={onStopGeneration}
            status={chatStatus} />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
};