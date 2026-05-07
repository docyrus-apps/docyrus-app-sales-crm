export type { MentionUser } from '@/lib/editor-mention'

export interface ChatUser {
  id: string
  firstname?: string | null
  lastname?: string | null
  avatar_url?: string | null
}

export interface PostAttachment {
  id: string
  file_name: string
  file_type: string
  file_size: number
  signed_url: string | null
}

export interface PostReaction {
  emoji: string
  user_ids: Array<string>
  count: number
}

export interface LinkPreview {
  url: string
  title?: string
  description?: string
  image_url?: string
  site_name?: string
}

export interface LinkedEntity {
  id: string
  data_source_id: string
  data_source_name: string
  record_id: string
  display_value: string
  icon?: string
}

export interface EntitySearchResult {
  record_id: string
  display_value: string
  icon?: string
}

export interface DataSourceOption {
  id: string
  name: string
  icon?: string
}

export interface ChatPost {
  id: string
  content: string
  attachments: Array<PostAttachment> | null
  reactions: Array<PostReaction>
  link_previews: Array<LinkPreview>
  linked_entities: Array<LinkedEntity>
  hashtags: Array<string>
  mentioned_user_ids: Array<string>
  reply_count: number
  created_on: string
  created_by: string
  last_modified_on: string
  parent_id: string | null
}

export interface CreatePostPayload {
  content: string
  parent_id?: string
  attachments?: Array<File>
  linked_entities?: Array<LinkedEntity>
  hashtags?: Array<string>
  mentioned_user_ids?: Array<string>
}

export interface TeamChatChannelProps {
  posts: Array<ChatPost>
  currentUser?: ChatUser
  users?: Array<ChatUser>
  channelName?: string

  isLoading?: boolean
  isCreatePending?: boolean
  isDeletePending?: boolean

  onCreatePost?: (payload: CreatePostPayload) => void | Promise<void>
  onUpdatePost?: (postId: string, content: string) => void | Promise<void>
  onDeletePost?: (postId: string) => void | Promise<void>

  onToggleReaction?: (postId: string, emoji: string) => void | Promise<void>

  onUploadFile?: (file: File) => Promise<PostAttachment>

  onFetchLinkPreview?: (url: string) => Promise<LinkPreview | null>

  dataSources?: Array<DataSourceOption>
  onSearchEntity?: (
    dataSourceId: string,
    query: string,
  ) => Promise<Array<EntitySearchResult>>

  onLoadReplies?: (postId: string) => Promise<Array<ChatPost>>

  maxHeight?: number | string
  className?: string
}

export type PresetEmoji =
  | '\ud83d\udc4d'
  | '\u2764\ufe0f'
  | '\ud83d\ude02'
  | '\ud83d\ude2e'
  | '\ud83c\udf89'
  | '\ud83d\udd25'
  | '\ud83d\udc40'
  | '\ud83d\udca1'

export const PRESET_EMOJIS: Array<PresetEmoji> = [
  '\ud83d\udc4d',
  '\u2764\ufe0f',
  '\ud83d\ude02',
  '\ud83d\ude2e',
  '\ud83c\udf89',
  '\ud83d\udd25',
  '\ud83d\udc40',
  '\ud83d\udca1',
]
