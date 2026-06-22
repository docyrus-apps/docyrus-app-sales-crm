'use client';

// @ts-nocheck
/* eslint-disable */
import { FileSearch } from 'lucide-react';

import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation';

import { DocyrusAgentChatInputFeatureToggle } from './docyrus-agent-chat-input-feature-toggle';

export interface DocyrusAgentChatInputDocumentSearchToggleProps {
  className?: string;
}

export const DocyrusAgentChatInputDocumentSearchToggle = ({
  className
}: DocyrusAgentChatInputDocumentSearchToggleProps) => {
  const { t } = useUiTranslation();

  return (
    <DocyrusAgentChatInputFeatureToggle
      className={className}
      feature="documentSearch"
      icon={<FileSearch className="size-4" />}
      tooltip={t('ui.agent.tools.documentSearch', 'Document Search')} />
  );
};