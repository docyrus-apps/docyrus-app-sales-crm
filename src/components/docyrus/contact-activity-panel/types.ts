'use client'

import {
  type ChatUser,
  type ChatPost,
  type PostAttachment,
  type PostReaction,
  type CreatePostPayload,
  type MentionUser,
  type LinkedEntity,
  type EntitySearchResult,
  type DataSourceOption,
} from '@/components/docyrus/team-chat-channel/types'

export type {
  ChatUser,
  ChatPost,
  PostAttachment,
  PostReaction,
  CreatePostPayload,
  MentionUser,
  LinkedEntity,
  EntitySearchResult,
  DataSourceOption,
}

export type ActivityType =
  | 'call'
  | 'meeting'
  | 'email'
  | 'status_update'
  | 'task'
  | 'chat'
  | 'trace'
  | 'comment'
  | 'record_create'
  | 'record_update'

export interface ContactActivity {
  id: string
  type: ActivityType
  subject: string
  description?: string
  metadata: Record<string, unknown>
  reply_count: number
  created_on: string
  created_by: string
  last_modified_on: string
  attachments?: Array<PostAttachment> | null
  reactions?: Array<PostReaction>
}

export interface ContactActivityPanelProps {
  activities: Array<ContactActivity>
  currentUser?: ChatUser
  users?: Array<ChatUser>
  contactName?: string

  isLoading?: boolean
  isCreatePending?: boolean
  isDeletePending?: boolean

  onDeleteActivity?: (activityId: string) => void | Promise<void>

  onCreateComment?: (payload: CreatePostPayload) => void | Promise<void>
  onDeleteComment?: (commentId: string) => void | Promise<void>
  onToggleReaction?: (targetId: string, emoji: string) => void | Promise<void>
  onUploadFile?: (file: File) => Promise<PostAttachment>
  onLoadReplies?: (activityId: string) => Promise<Array<ChatPost>>

  mentionUsers?: Array<MentionUser>
  dataSources?: Array<DataSourceOption>
  onSearchEntity?: (
    dataSourceId: string,
    query: string,
  ) => Promise<Array<EntitySearchResult>>

  activityTypes?: Array<ActivityType>

  maxHeight?: number | string
  className?: string
}
