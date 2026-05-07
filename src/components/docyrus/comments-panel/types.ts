export interface CommentAttachment {
  id: string
  file_name: string
  file_type: string
  file_size: number
  signed_url: string | null
}

export interface DocyrusComment {
  id: string
  message: string
  attachments: Array<CommentAttachment> | null
  created_on: string
  created_by: string
  last_modified_on: string
  record_id: string | null
  parent_id: string | null
}

export interface CommentUser {
  id: string
  firstname?: string | null
  lastname?: string | null
}

export interface CommentsPanelProps {
  comments: Array<DocyrusComment>
  currentUser?: CommentUser
  users?: Array<CommentUser>
  title?: string
  editable?: boolean
  isLoading?: boolean
  maxHeight?: number | string
  onCreateComment?: (payload: {
    message: string
    parentId?: string
    attachments?: Array<File>
  }) => void | Promise<void>
  onUpdateComment?: (commentId: string, message: string) => void | Promise<void>
  onDeleteComment?: (commentId: string) => void | Promise<void>
  onUploadFile?: (file: File) => Promise<CommentAttachment>
  isCreatePending?: boolean
  isDeletePending?: boolean
  className?: string
}

export interface CommentThread {
  comment: DocyrusComment
  replies: Array<DocyrusComment>
}

export type { MentionUser } from '@/lib/editor-mention'
