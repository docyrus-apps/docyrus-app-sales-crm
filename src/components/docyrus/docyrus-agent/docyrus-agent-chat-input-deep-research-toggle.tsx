'use client';

// @ts-nocheck
/* eslint-disable */
import { Microscope } from 'lucide-react';

import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation';

import { DocyrusAgentChatInputFeatureToggle } from './docyrus-agent-chat-input-feature-toggle';

export interface DocyrusAgentChatInputDeepResearchToggleProps {
  className?: string;
}

export const DocyrusAgentChatInputDeepResearchToggle = ({
  className
}: DocyrusAgentChatInputDeepResearchToggleProps) => {
  const { t } = useUiTranslation();

  return (
    <DocyrusAgentChatInputFeatureToggle
      className={className}
      feature="deepResearch"
      icon={<Microscope className="size-4" />}
      tooltip={t('ui.agent.tools.deepResearch', 'Deep Research')} />
  );
};