'use client';

// @ts-nocheck
/* eslint-disable */
import {
  type ReactNode, createContext, use, useCallback, useMemo, useState
} from 'react';

import { type ChatStatus, type UIMessage } from 'ai';

import { TooltipProvider } from '@/components/ui/tooltip';

import {
  type ActionPanelView, type AgentAction, type AgentActionPayload, type AgentCapabilities, type AgentFeatureFlags, type AgentMessagePayload, type AgentMode, type AgentProfile, type AgentSource
} from './types';

/*
 * ============================================================================
 * Context
 * ============================================================================
 */

export interface DocyrusAgentContextValue {
  agent: AgentProfile;
  messages: Array<UIMessage>;
  chatStatus?: ChatStatus;
  actions: Array<AgentAction>;
  sources: Array<AgentSource>;
  selectedAction: AgentAction | null;
  setSelectedAction: (action: AgentAction | null) => void;
  actionPanelView: ActionPanelView;
  setActionPanelView: (view: ActionPanelView) => void;
  mode: AgentMode;
  setMode: (mode: AgentMode) => void;
  onSendMessage?: (payload: AgentMessagePayload) => void | Promise<void>;
  onStopGeneration?: () => void;
  onExecuteAction?: (payload: AgentActionPayload) => void | Promise<void>;
  allowAttachments: boolean;
  acceptFileTypes?: string;
  suggestions: Array<string>;
  emptyState?: ReactNode;
  showMessageActions: boolean;
  capabilities: AgentCapabilities;
  featureFlags: AgentFeatureFlags;
  setFeatureFlag: (key: keyof AgentFeatureFlags, value: boolean) => void;
}

const DEFAULT_FEATURE_FLAGS: AgentFeatureFlags = {
  webSearch: false,
  documentSearch: false,
  thinking: false,
  deepResearch: false,
  workCanvas: false
};

const EMPTY_CAPABILITIES: AgentCapabilities = {};

const DocyrusAgentContext = createContext<DocyrusAgentContextValue | null>(null);

export const useDocyrusAgent = () => {
  const ctx = use(DocyrusAgentContext);

  if (!ctx) {
    throw new Error('useDocyrusAgent must be used within DocyrusAgentProvider');
  }

  return ctx;
};

/*
 * ============================================================================
 * Provider Props
 * ============================================================================
 */

export interface DocyrusAgentProviderProps {
  agent: AgentProfile;
  messages?: Array<UIMessage>;
  chatStatus?: ChatStatus;
  actions?: Array<AgentAction>;
  sources?: Array<AgentSource>;
  onSendMessage?: (payload: AgentMessagePayload) => void | Promise<void>;
  onStopGeneration?: () => void;
  onExecuteAction?: (payload: AgentActionPayload) => void | Promise<void>;
  allowAttachments?: boolean;
  acceptFileTypes?: string;
  suggestions?: Array<string>;
  emptyState?: ReactNode;
  showMessageActions?: boolean;
  mode: AgentMode;
  capabilities?: AgentCapabilities;
  initialFeatureFlags?: Partial<AgentFeatureFlags>;
  featureFlags?: AgentFeatureFlags;
  onFeatureFlagsChange?: (flags: AgentFeatureFlags) => void;
  children: ReactNode;
}

/*
 * ============================================================================
 * Provider
 * ============================================================================
 */

const EMPTY_ARRAY: never[] = [];

export const DocyrusAgentProvider = ({
  agent,
  messages = EMPTY_ARRAY,
  chatStatus,
  actions = EMPTY_ARRAY,
  sources = EMPTY_ARRAY,
  onSendMessage,
  onStopGeneration,
  onExecuteAction,
  allowAttachments = false,
  acceptFileTypes,
  suggestions = EMPTY_ARRAY,
  emptyState,
  showMessageActions = true,
  mode: initialMode,
  capabilities,
  initialFeatureFlags,
  featureFlags: controlledFeatureFlags,
  onFeatureFlagsChange,
  children
}: DocyrusAgentProviderProps) => {
  const [mode, setMode] = useState<AgentMode>(initialMode);
  const [selectedAction, setSelectedAction] = useState<AgentAction | null>(null);
  const [actionPanelView, setActionPanelView] = useState<ActionPanelView>('action-list');

  const [internalFeatureFlags, setInternalFeatureFlags] = useState<AgentFeatureFlags>(() => ({
    ...DEFAULT_FEATURE_FLAGS,
    ...initialFeatureFlags
  }));

  const featureFlags = controlledFeatureFlags ?? internalFeatureFlags;

  const setFeatureFlag = useCallback(
    (key: keyof AgentFeatureFlags, value: boolean) => {
      if (controlledFeatureFlags) {
        onFeatureFlagsChange?.({ ...controlledFeatureFlags, [key]: value });

        return;
      }

      setInternalFeatureFlags((prev) => {
        const next = { ...prev, [key]: value };

        onFeatureFlagsChange?.(next);

        return next;
      });
    },
    [controlledFeatureFlags, onFeatureFlagsChange]
  );

  const resolvedCapabilities = capabilities ?? EMPTY_CAPABILITIES;

  const value = useMemo<DocyrusAgentContextValue>(
    () => ({
      acceptFileTypes,
      actionPanelView,
      actions,
      agent,
      allowAttachments,
      capabilities: resolvedCapabilities,
      chatStatus,
      emptyState,
      featureFlags,
      messages,
      mode,
      onExecuteAction,
      onSendMessage,
      onStopGeneration,
      selectedAction,
      setActionPanelView,
      setFeatureFlag,
      setMode,
      setSelectedAction,
      showMessageActions,
      sources,
      suggestions
    }),
    [
      acceptFileTypes,
      actionPanelView,
      actions,
      agent,
      allowAttachments,
      resolvedCapabilities,
      chatStatus,
      emptyState,
      featureFlags,
      messages,
      mode,
      onExecuteAction,
      onSendMessage,
      onStopGeneration,
      selectedAction,
      setFeatureFlag,
      showMessageActions,
      sources,
      suggestions
    ]
  );

  return (
    <DocyrusAgentContext value={value}>
      <TooltipProvider>
        {children}
      </TooltipProvider>
    </DocyrusAgentContext>
  );
};