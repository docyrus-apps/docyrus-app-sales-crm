'use client'

// @ts-nocheck
/* eslint-disable */
import { type ReactNode } from 'react'

import { PromptInputButton } from '@/components/ai-elements/prompt-input'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

import { useDocyrusAgent } from './docyrus-agent-context'
import { type AgentFeatureFlags } from './types'

const ACTIVE_CLASSES =
  'bg-primary/10 text-primary ring-1 ring-primary/30 hover:bg-primary/20'

export interface DocyrusAgentChatInputFeatureToggleProps {
  /** Which `AgentFeatureFlags` key this toggle controls. */
  feature: keyof AgentFeatureFlags
  /** Icon shown inside the button. */
  icon: ReactNode
  /** Tooltip / aria-label. */
  tooltip: string
  /** Override the active state styling. */
  activeClassName?: string
  className?: string
}

/**
 * Generic toolbar toggle bound to one of the agent's feature flags. Reads + writes the
 * flag via `useDocyrusAgent()` context, so it works inside any `<DocyrusAgentChatInput>`
 * (or any tree under `DocyrusAgentProvider`).
 *
 * Use the preset wrappers (`DocyrusAgentChatInputWebSearchToggle`, etc.) for the standard
 * five toggles, or use this directly to add your own feature key.
 */
export const DocyrusAgentChatInputFeatureToggle = ({
  feature,
  icon,
  tooltip,
  activeClassName,
  className,
}: DocyrusAgentChatInputFeatureToggleProps) => {
  const { featureFlags, setFeatureFlag } = useDocyrusAgent()
  const isActive = featureFlags[feature]

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <PromptInputButton
          aria-label={tooltip}
          className={cn(
            'transition-all duration-200',
            isActive && (activeClassName ?? ACTIVE_CLASSES),
            className,
          )}
          variant="ghost"
          onClick={() => setFeatureFlag(feature, !isActive)}
        >
          {icon}
        </PromptInputButton>
      </TooltipTrigger>
      <TooltipContent side="top">{tooltip}</TooltipContent>
    </Tooltip>
  )
}
