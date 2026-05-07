'use client'

import { createContext, useContext } from 'react'

import {
  type ChatPost,
  type ChatUser,
  type CreatePostPayload,
  type DataSourceOption,
  type EntitySearchResult,
  type LinkPreview,
  type MentionUser,
  type PostAttachment,
} from './types'

export interface TeamChatContextValue {
  currentUser?: ChatUser
  usersMap: Map<string, ChatUser>
  mentionUsers: Array<MentionUser>

  onCreatePost?: (payload: CreatePostPayload) => void | Promise<void>
  onUpdatePost?: (postId: string, content: string) => void | Promise<void>
  onDeletePost?: (postId: string) => void | Promise<void>
  onToggleReaction?: (postId: string, emoji: string) => void | Promise<void>
  onUploadFile?: (file: File) => Promise<PostAttachment>
  onFetchLinkPreview?: (url: string) => Promise<LinkPreview | null>
  onLoadReplies?: (postId: string) => Promise<Array<ChatPost>>

  dataSources?: Array<DataSourceOption>
  onSearchEntity?: (
    dataSourceId: string,
    query: string,
  ) => Promise<Array<EntitySearchResult>>

  isCreatePending: boolean
  isDeletePending: boolean
}

const TeamChatContext = createContext<TeamChatContextValue | null>(null)

export const TeamChatProvider = TeamChatContext.Provider

export function useTeamChatContext(): TeamChatContextValue {
  const ctx = useContext(TeamChatContext)

  if (!ctx) {
    throw new Error('useTeamChatContext must be used within a TeamChatProvider')
  }

  return ctx
}
