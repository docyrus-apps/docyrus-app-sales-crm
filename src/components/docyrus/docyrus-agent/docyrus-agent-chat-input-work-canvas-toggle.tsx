'use client'

// @ts-nocheck
/* eslint-disable */
import { Ruler } from 'lucide-react'

import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation'

import { DocyrusAgentChatInputFeatureToggle } from './docyrus-agent-chat-input-feature-toggle'

export interface DocyrusAgentChatInputWorkCanvasToggleProps {
  className?: string
}

export const DocyrusAgentChatInputWorkCanvasToggle = ({
  className,
}: DocyrusAgentChatInputWorkCanvasToggleProps) => {
  const { t } = useUiTranslation()

  return (
    <DocyrusAgentChatInputFeatureToggle
      className={className}
      feature="workCanvas"
      icon={<Ruler className="size-4" />}
      tooltip={t('ui.agent.tools.workCanvas', 'Work Canvas')}
    />
  )
}
