'use client';

// @ts-nocheck
/* eslint-disable */
import { type ComponentProps } from 'react';

import { PromptInputTextarea } from '@/components/ai-elements/prompt-input';

import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation';

export type DocyrusAgentChatInputTextareaProps = ComponentProps<typeof PromptInputTextarea>;

/**
 * Thin wrapper over `PromptInputTextarea` that fills `placeholder` from the UI translation
 * provider when one isn't supplied. Pass any of the underlying textarea props directly.
 */
export const DocyrusAgentChatInputTextarea = ({
  placeholder,
  ...rest
}: DocyrusAgentChatInputTextareaProps) => {
  const { t } = useUiTranslation();

  return (
    <PromptInputTextarea
      {...rest}
      placeholder={placeholder ?? t('ui.agent.askPrompt', 'Ask something...')} />
  );
};