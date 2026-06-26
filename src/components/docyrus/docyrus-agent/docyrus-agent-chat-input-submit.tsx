'use client';

// @ts-nocheck
/* eslint-disable */
import { type ComponentProps } from 'react';

import { PromptInputSubmit } from '@/components/ai-elements/prompt-input';

import { useDocyrusAgent } from './docyrus-agent-context';

export type DocyrusAgentChatInputSubmitProps = Omit<
  ComponentProps<typeof PromptInputSubmit>,
  'status' | 'onStop'
> & {
  /** Override the streaming status from context. */
  status?: ComponentProps<typeof PromptInputSubmit>['status'];
  /** Override the stop callback from context. */
  onStop?: ComponentProps<typeof PromptInputSubmit>['onStop'];
};

/**
 * Submit / stop button bound to the agent context. Reads `chatStatus` + `onStopGeneration`
 * from `useDocyrusAgent()`; both can be overridden via props for custom flows.
 */
export const DocyrusAgentChatInputSubmit = ({
  status,
  onStop,
  ...rest
}: DocyrusAgentChatInputSubmitProps) => {
  const { chatStatus, onStopGeneration } = useDocyrusAgent();

  return (
    <PromptInputSubmit
      {...rest}
      onStop={onStop ?? onStopGeneration}
      status={status ?? chatStatus} />
  );
};