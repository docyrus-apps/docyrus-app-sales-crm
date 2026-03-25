import { type ReactNode } from 'react';

import { type ChatStatus, type FileUIPart, type UIMessage } from 'ai';

import { type UiI18nLocale } from '@/lib/ui-i18n';

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
  mode: AgentMode;
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
  className?: string;
}

export interface DocyrusAgentTriggerProps extends Omit<DocyrusAgentProps, 'mode'> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  dialogContainer?: 'modal' | 'sheet' | 'drawer';
  dialogSide?: 'left' | 'right' | 'top' | 'bottom';
  dialogSize?: 'sm' | 'default' | 'lg' | 'xl' | 'full';
}