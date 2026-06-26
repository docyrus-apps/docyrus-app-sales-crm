'use client';

// @ts-nocheck
/* eslint-disable */
import { Brain } from 'lucide-react';

import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation';

import { DocyrusAgentChatInputFeatureToggle } from './docyrus-agent-chat-input-feature-toggle';

export interface DocyrusAgentChatInputThinkingToggleProps {
  className?: string;
}

export const DocyrusAgentChatInputThinkingToggle = ({
  className
}: DocyrusAgentChatInputThinkingToggleProps) => {
  const { t } = useUiTranslation();

  return (
    <DocyrusAgentChatInputFeatureToggle
      className={className}
      feature="thinking"
      icon={<Brain className="size-4" />}
      tooltip={t('ui.agent.tools.thinking', 'Thinking')} />
  );
};