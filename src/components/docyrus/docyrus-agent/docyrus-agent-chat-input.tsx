'use client'

// @ts-nocheck
/* eslint-disable */
import { type ReactNode, useCallback } from 'react'

import {
  type PromptInputMessage,
  PromptInput,
  PromptInputFooter,
  PromptInputProvider,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input'

import { cn } from '@/lib/utils'

import { useDocyrusAgent } from './docyrus-agent-context'
import { DocyrusAgentChatInputAttachButton } from './docyrus-agent-chat-input-attach-button'
import { DocyrusAgentChatInputAttachments } from './docyrus-agent-chat-input-attachments'
import { DocyrusAgentChatInputDeepResearchToggle } from './docyrus-agent-chat-input-deep-research-toggle'
import { DocyrusAgentChatInputDocumentSearchToggle } from './docyrus-agent-chat-input-document-search-toggle'
import { DocyrusAgentChatInputFeatureMenu } from './docyrus-agent-chat-input-feature-menu'
import { DocyrusAgentChatInputSubmit } from './docyrus-agent-chat-input-submit'
import { DocyrusAgentChatInputTextarea } from './docyrus-agent-chat-input-textarea'
import { DocyrusAgentChatInputThinkingToggle } from './docyrus-agent-chat-input-thinking-toggle'
import { DocyrusAgentChatInputWebSearchToggle } from './docyrus-agent-chat-input-web-search-toggle'
import { DocyrusAgentChatInputWorkCanvasToggle } from './docyrus-agent-chat-input-work-canvas-toggle'

export type DocyrusAgentChatInputToolbarLayout = 'menu' | 'expanded'

export interface DocyrusAgentChatInputProps {
  className?: string
  /**
   * Override the default body (attachments preview + textarea + footer). When supplied,
   * the wrapping `<PromptInput>` (with `onSubmit` wired to `onSendMessage` from context)
   * is still provided — so you can compose `<DocyrusAgentChatInputAttachments />`,
   * `<DocyrusAgentChatInputTextarea />`, `<DocyrusAgentChatInputAttachButton />`,
   * `<DocyrusAgentChatInputSubmit />`, custom toolbar buttons, etc.
   */
  children?: ReactNode
}

export const DocyrusAgentChatInput = ({
  className,
  children,
}: DocyrusAgentChatInputProps) => {
  const { onSendMessage, acceptFileTypes, featureFlags } = useDocyrusAgent()

  const handleSubmit = useCallback(
    (message: PromptInputMessage) => {
      if (!message.text.trim() && message.files.length === 0) return
      onSendMessage?.({
        files: message.files.length > 0 ? message.files : undefined,
        text: message.text,
        featureFlags,
      })
    },
    [onSendMessage, featureFlags],
  )

  return (
    <div className={cn('border-t px-4 py-3', className)}>
      <PromptInputProvider>
        <PromptInput accept={acceptFileTypes} multiple onSubmit={handleSubmit}>
          {children ?? <DocyrusAgentChatInputDefaultBody />}
        </PromptInput>
      </PromptInputProvider>
    </div>
  )
}

export interface DocyrusAgentChatInputDefaultBodyProps {
  /**
   * Controls how feature toggles render in the footer.
   * - `'menu'` (default): all five toggles collapse into one `DocyrusAgentChatInputFeatureMenu` dropdown
   * - `'expanded'`: each capability-supported toggle renders as a separate `PromptInputButton`
   */
  toolbarLayout?: DocyrusAgentChatInputToolbarLayout
}

/**
 * Default composition rendered when no `children` are passed to `DocyrusAgentChatInput`.
 * Exported so consumers can extend it (e.g. switch between menu/expanded toolbar layouts)
 * without having to recreate the structure from scratch.
 *
 * For full control beyond `toolbarLayout`, drop into composing the body yourself with
 * `<DocyrusAgentChatInputAttachments />`, `<DocyrusAgentChatInputTextarea />`,
 * `<DocyrusAgentChatInputFeatureMenu />` (or `<DocyrusAgentChatInputWebSearchToggle />` etc),
 * `<DocyrusAgentChatInputSubmit />`, and any custom buttons.
 */
export const DocyrusAgentChatInputDefaultBody = ({
  toolbarLayout = 'menu',
}: DocyrusAgentChatInputDefaultBodyProps = {}) => {
  const { allowAttachments, capabilities } = useDocyrusAgent()

  return (
    <>
      {allowAttachments && <DocyrusAgentChatInputAttachments />}
      <DocyrusAgentChatInputTextarea />
      <PromptInputFooter>
        <PromptInputTools>
          {allowAttachments && <DocyrusAgentChatInputAttachButton />}
          {toolbarLayout === 'menu' ? (
            <DocyrusAgentChatInputFeatureMenu />
          ) : (
            <>
              {capabilities.supportWebSearch && (
                <DocyrusAgentChatInputWebSearchToggle />
              )}
              {capabilities.supportDocumentSearch && (
                <DocyrusAgentChatInputDocumentSearchToggle />
              )}
              {capabilities.supportThinking && (
                <DocyrusAgentChatInputThinkingToggle />
              )}
              {capabilities.supportDeepResearch && (
                <DocyrusAgentChatInputDeepResearchToggle />
              )}
              {capabilities.supportWorkCanvas && (
                <DocyrusAgentChatInputWorkCanvasToggle />
              )}
            </>
          )}
        </PromptInputTools>
        <DocyrusAgentChatInputSubmit />
      </PromptInputFooter>
    </>
  )
}
