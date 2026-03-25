'use client';

import { type ReactNode } from 'react';

import {
  createContext, useCallback, useContext, useMemo, useState
} from 'react';

import { type ChatStatus, type UIMessage } from 'ai';

import { type UiI18nKey, type UiI18nLocale, tUi } from '@/lib/ui-i18n';
import { TooltipProvider } from '@/components/ui/tooltip';

import {
  type ActionPanelView,
  type AgentAction,
  type AgentActionPayload,
  type AgentMessagePayload,
  type AgentMode,
  type AgentProfile,
  type AgentSource
} from './types';

/*
 * ============================================================================
 * Context Value
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
  t: (key: UiI18nKey) => string;
}

/*
 * ============================================================================
 * Context
 * ============================================================================
 */

const DocyrusAgentContext = createContext<DocyrusAgentContextValue | null>(null);

export const useDocyrusAgent = () => {
  const ctx = useContext(DocyrusAgentContext);

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
  locale?: UiI18nLocale;
  allowAttachments?: boolean;
  acceptFileTypes?: string;
  suggestions?: Array<string>;
  emptyState?: ReactNode;
  showMessageActions?: boolean;
  mode: AgentMode;
  children: ReactNode;
}

/*
 * ============================================================================
 * Provider
 * ============================================================================
 */

export const DocyrusAgentProvider = ({
  agent,
  messages = [],
  chatStatus,
  actions = [],
  sources = [],
  onSendMessage,
  onStopGeneration,
  onExecuteAction,
  locale = 'en',
  allowAttachments = false,
  acceptFileTypes,
  suggestions = [],
  emptyState,
  showMessageActions = true,
  mode: initialMode,
  children
}: DocyrusAgentProviderProps) => {
  const [mode, setMode] = useState<AgentMode>(initialMode);
  const [selectedAction, setSelectedAction] = useState<AgentAction | null>(null);
  const [actionPanelView, setActionPanelView] = useState<ActionPanelView>('action-list');

  const t = useCallback(
    (key: UiI18nKey) => tUi(locale, key),
    [locale]
  );

  const value = useMemo<DocyrusAgentContextValue>(
    () => ({
      acceptFileTypes,
      actionPanelView,
      actions,
      agent,
      allowAttachments,
      chatStatus,
      emptyState,
      messages,
      mode,
      onExecuteAction,
      onSendMessage,
      onStopGeneration,
      selectedAction,
      setActionPanelView,
      setMode,
      setSelectedAction,
      showMessageActions,
      sources,
      suggestions,
      t
    }),
    [
      acceptFileTypes,
      actionPanelView,
      actions,
      agent,
      allowAttachments,
      chatStatus,
      emptyState,
      messages,
      mode,
      onExecuteAction,
      onSendMessage,
      onStopGeneration,
      selectedAction,
      showMessageActions,
      sources,
      suggestions,
      t
    ]
  );

  return (
    <DocyrusAgentContext.Provider value={value}>
      <TooltipProvider>
        {children}
      </TooltipProvider>
    </DocyrusAgentContext.Provider>
  );
};