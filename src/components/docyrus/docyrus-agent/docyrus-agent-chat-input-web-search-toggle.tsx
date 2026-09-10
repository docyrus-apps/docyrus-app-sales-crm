'use client'

// @ts-nocheck
/* eslint-disable */
import { Globe } from 'lucide-react'

import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation'

import { DocyrusAgentChatInputFeatureToggle } from './docyrus-agent-chat-input-feature-toggle'

export interface DocyrusAgentChatInputWebSearchToggleProps {
  className?: string
}

/**
 * Toolbar toggle that flips the `webSearch` feature flag. Renders nothing when the agent's
 * `capabilities.supportWebSearch` is `false`/undefined — but mounting is left to the
 * caller (the default `DocyrusAgentChatInputDefaultBody` performs the capability check).
 */
export const DocyrusAgentChatInputWebSearchToggle = ({
  className,
}: DocyrusAgentChatInputWebSearchToggleProps) => {
  const { t } = useUiTranslation()

  return (
    <DocyrusAgentChatInputFeatureToggle
      className={className}
      feature="webSearch"
      icon={<Globe className="size-4" />}
      tooltip={t('ui.agent.tools.webSearch', 'Web Search')}
    />
  )
}
