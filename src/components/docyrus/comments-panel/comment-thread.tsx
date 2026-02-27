import { type Value } from 'platejs'

import { Button } from '@/components/ui/button'

import {
  type CommentThread as CommentThreadType,
  type CommentUser,
} from './types'

import { CommentItem } from './comment-item'
import { CommentCreateForm } from './comment-create-form'

interface CommentThreadProps {
  thread: CommentThreadType
  usersMap: Map<string, CommentUser>
  currentUserId: string | undefined
  currentUser: CommentUser | undefined
  editingCommentId: string | null
  replyingToCommentId: string | null
  editable: boolean
  onStartEdit: (commentId: string) => void
  onCancelEdit: () => void
  onSaveEdit: (commentId: string, content: Value) => void
  onDelete: (commentId: string) => void
  onStartReply: (commentId: string) => void
  onCancelReply: () => void
  onSubmitReply: (
    content: Value,
    parentId?: string,
    files?: Array<File>,
  ) => void
  isCreatePending: boolean
}

export function CommentThread({
  thread,
  usersMap,
  currentUserId,
  currentUser,
  editingCommentId,
  replyingToCommentId,
  editable,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onStartReply,
  onCancelReply,
  onSubmitReply,
  isCreatePending,
}: CommentThreadProps) {
  const { comment, replies } = thread
  const isReplying = replyingToCommentId === comment.id

  return (
    <>
      <CommentItem
        comment={comment}
        user={usersMap.get(comment.created_by)}
        isOwn={currentUserId === comment.created_by}
        isEditing={editingCommentId === comment.id}
        onStartEdit={() => onStartEdit(comment.id)}
        onCancelEdit={onCancelEdit}
        onSaveEdit={(content) => onSaveEdit(comment.id, content)}
        onDelete={() => onDelete(comment.id)}
      />

      {editable && !isReplying && (
        <div className="pl-7">
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs text-muted-foreground"
            onClick={() => onStartReply(comment.id)}
          >
            Reply
          </Button>
        </div>
      )}

      {replies.length > 0 && (
        <div className="pl-7">
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              user={usersMap.get(reply.created_by)}
              isOwn={currentUserId === reply.created_by}
              isEditing={editingCommentId === reply.id}
              onStartEdit={() => onStartEdit(reply.id)}
              onCancelEdit={onCancelEdit}
              onSaveEdit={(content) => onSaveEdit(reply.id, content)}
              onDelete={() => onDelete(reply.id)}
            />
          ))}
        </div>
      )}

      {isReplying && (
        <div className="pl-7">
          <CommentCreateForm
            currentUser={currentUser}
            onSubmit={onSubmitReply}
            isPending={isCreatePending}
            parentId={comment.id}
            placeholder="Reply..."
          />
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs text-muted-foreground"
            onClick={onCancelReply}
          >
            Cancel
          </Button>
        </div>
      )}
    </>
  )
}
