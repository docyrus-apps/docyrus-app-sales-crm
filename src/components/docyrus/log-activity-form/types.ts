'use client';

import { type ReactNode } from 'react';

import { type Value } from 'platejs';

import { type MentionUser } from '@/lib/editor-mention';

export type LoggableActivityType = 'call' | 'email' | 'meeting' | 'task' | 'status_update' | 'comment';

export const LOGGABLE_ACTIVITY_TYPES: Array<LoggableActivityType> = [
  'call',
  'email',
  'meeting',
  'task',
  'status_update',
  'comment'
];

export interface EventOption {
  id: string;
  label: string;
  startDate: Date;
  endDate: Date;
}

export interface StatusOption {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  parent?: string;
}

export interface SelectorOption {
  id: string;
  label: string;
  icon?: ReactNode;
  color?: string;
}

export interface SelectorFieldConfig {
  key: string;
  label: string;
  placeholder?: string;
  icon?: ReactNode;
  options: Array<SelectorOption>;
  value?: string | null;
  defaultValue?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  onChange?: (value: string | null) => void;
  clearsFields?: Array<string>;
}

export interface EmailAttachment {
  name: string;
  size: number;
}

export interface SectionHandle {
  getData: () => Partial<LogActivityPayload>;
  reset: () => void;
  isEmpty: () => boolean;
}

export interface LogActivityPayload {
  type: LoggableActivityType;
  body: Value;
  bodyText: string;
  mentionedUserIds: Array<string>;
  subject?: string;
  to?: Array<string>;
  cc?: Array<string>;
  bcc?: Array<string>;
  attachments?: Array<EmailAttachment>;
  eventId?: string;
  eventSubject?: string;
  startDate?: Date;
  endDate?: Date;
  taskSubject?: string;
  taskFields?: Record<string, string | null>;
  statusId?: string;
  secondaryStatusId?: string;
  statusDescription?: string;
  followupDate?: Date | null;
}

export interface LogActivityFormProps {
  activityType?: LoggableActivityType;
  defaultActivityType?: LoggableActivityType;
  onTypeChange?: (type: LoggableActivityType) => void;
  onSubmit?: (payload: LogActivityPayload) => void | Promise<void>;
  isSubmitting?: boolean;
  mentionUsers?: Array<MentionUser>;
  placeholder?: string;
  submitLabel?: string;
  showKeyboardHint?: boolean;
  disabled?: boolean;
  className?: string;
  emailAttachments?: Array<EmailAttachment>;
  onAttach?: () => void;
  onRemoveAttachment?: (index: number) => void;
  events?: Array<EventOption>;
  taskHeaderFields?: Array<SelectorFieldConfig>;
  taskFooterFields?: Array<SelectorFieldConfig>;
  statusOptions?: Array<StatusOption>;
}