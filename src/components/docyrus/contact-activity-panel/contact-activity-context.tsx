'use client';

import { createContext, useContext } from 'react';

import {
  type ActivityType,
  type ChatPost,
  type ChatUser,
  type CreatePostPayload,
  type DataSourceOption,
  type EntitySearchResult,
  type MentionUser,
  type PostAttachment
} from './types';

export interface ContactActivityContextValue {
  currentUser?: ChatUser;
  usersMap: Map<string, ChatUser>;
  mentionUsers: Array<MentionUser>;
  allowedTypes: Array<ActivityType>;

  onDeleteActivity?: (activityId: string) => void | Promise<void>;

  onCreateComment?: (payload: CreatePostPayload) => void | Promise<void>;
  onDeleteComment?: (commentId: string) => void | Promise<void>;
  onToggleReaction?: (targetId: string, emoji: string) => void | Promise<void>;
  onUploadFile?: (file: File) => Promise<PostAttachment>;
  onLoadReplies?: (activityId: string) => Promise<Array<ChatPost>>;

  dataSources?: Array<DataSourceOption>;
  onSearchEntity?: (dataSourceId: string, query: string) => Promise<Array<EntitySearchResult>>;

  isCreatePending: boolean;
  isDeletePending: boolean;
}

const ContactActivityContext = createContext<ContactActivityContextValue | null>(null);

export const ContactActivityProvider = ContactActivityContext.Provider;

export function useContactActivityContext(): ContactActivityContextValue {
  const ctx = useContext(ContactActivityContext);

  if (!ctx) {
    throw new Error('useContactActivityContext must be used within a ContactActivityProvider');
  }

  return ctx;
}