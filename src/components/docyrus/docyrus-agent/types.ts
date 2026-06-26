// @ts-nocheck
/* eslint-disable */
import { type ReactNode } from 'react';

import { type ChatStatus, type FileUIPart, type UIMessage } from 'ai';

/*
 * ============================================================================
 * Source Types
 * ============================================================================
 */

export type AgentSourceType = 'text' | 'json' | 'image' | 'pdf' | 'json-schema' | 'file' | 'custom';

export interface AgentSource {
  type: AgentSourceType;
  label?: string;
  value: string;
  mimeType?: string;
  meta?: Record<string, unknown>;
}

/*
 * ============================================================================
 * Action Types
 * ============================================================================
 */

export interface AgentActionParam {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'boolean' | 'select';
  required?: boolean;
  defaultValue?: string | number | boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
  description?: string;
}

export interface AgentAction {
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  params?: Array<AgentActionParam>;
  isDefault?: boolean;
  opensChat?: boolean;
}

/*
 * ============================================================================
 * Agent Identity
 * ============================================================================
 */

export interface AgentProfile {
  name: string;
  description?: string;
  /**
   * Markdown-rich welcome blurb rendered in the empty-state hero. Falls back to `description`
   * (and finally a generic line) when omitted.
   */
  welcomeMessage?: string;
  avatar?: {
    name?: string; color?: string; icon?: string; image?: string;
  };
  model?: string;
}

/*
 * ============================================================================
 * Payloads
 * ============================================================================
 */

export interface AgentMessagePayload {
  text: string;
  files?: Array<FileUIPart>;
  sources?: Array<AgentSource>;
  actionId?: string;
  actionParams?: Record<string, string | number | boolean>;
  /** Snapshot of the active feature flags when this message was submitted. */
  featureFlags?: AgentFeatureFlags;
}

/*
 * ============================================================================
 * Feature flags + capabilities
 * ============================================================================
 */

/**
 * Toolbar toggle state. Set via `<DocyrusAgent>` (controlled or via `initialFeatureFlags`)
 * and surfaced through `useDocyrusAgent()`. Each flag corresponds to a backend feature
 * (web search, document search, etc.) and is included in `AgentMessagePayload.featureFlags`
 * when the user submits a message.
 */
export interface AgentFeatureFlags {
  webSearch: boolean;
  documentSearch: boolean;
  thinking: boolean;
  deepResearch: boolean;
  workCanvas: boolean;
}

/**
 * Which features an agent advertises support for. Drives default visibility of the toolbar
 * toggle buttons. Apps typically populate this from the agent's deployment metadata
 * (see `useDocyrusAgentInfo`).
 */
export interface AgentCapabilities {
  supportFiles?: boolean;
  supportWebSearch?: boolean;
  supportDocumentSearch?: boolean;
  supportThinking?: boolean;
  supportDeepResearch?: boolean;
  supportWorkCanvas?: boolean;
  supportMultipleModels?: boolean;
  promptOptimizationChoice?: 'manual' | 'auto' | 'off' | null;
}

export interface AgentActionPayload {
  actionId: string;
  params: Record<string, string | number | boolean>;
  sources?: Array<AgentSource>;
  customPrompt?: string;
}

/*
 * ============================================================================
 * Component Modes & Views
 * ============================================================================
 */

export type AgentMode = 'chat' | 'action-panel' | 'trigger';
export type ActionPanelView = 'action-list' | 'action-params' | 'executing';

/*
 * ============================================================================
 * Component Props
 * ============================================================================
 */

export interface DocyrusAgentProps {
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
  /** Slot rendered before the agent avatar in the chat header. */
  headerLeading?: ReactNode;
  /** Slot rendered at the end of the chat header. */
  headerTrailing?: ReactNode;
  /**
   * Replace the chat input area entirely with a custom composition (e.g. a
   * `<DocyrusAgentChatInput>` containing the new Optimize / Mic / Memory buttons).
   */
  chatInput?: ReactNode;
  /** Slot rendered between the chat input and the bottom of the panel. */
  chatTrailing?: ReactNode;
  /**
   * Which toolbar features the agent supports. Default toolbar shows a toggle for each
   * `support*` flag set to `true`. Apps typically pull this from `useDocyrusAgentInfo`.
   */
  capabilities?: AgentCapabilities;
  /** Initial value of the toolbar toggle flags. */
  initialFeatureFlags?: Partial<AgentFeatureFlags>;
  /** Controlled feature flags. When supplied, `onFeatureFlagsChange` must be passed too. */
  featureFlags?: AgentFeatureFlags;
  /** Fires whenever any toolbar toggle is flipped. */
  onFeatureFlagsChange?: (flags: AgentFeatureFlags) => void;
  className?: string;
}

export interface DocyrusAgentTriggerProps extends Omit<DocyrusAgentProps, 'mode'> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  dialogContainer?: 'modal' | 'sheet' | 'drawer';
  dialogSide?: 'left' | 'right' | 'top' | 'bottom';
  dialogSize?: 'sm' | 'default' | 'lg' | 'xl' | 'full';
}