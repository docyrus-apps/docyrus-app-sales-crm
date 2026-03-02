'use client';

import { useCallback, useMemo, useState } from 'react';

import { type Value } from 'platejs';

import { DeleteConfirmDialog } from '@/components/docyrus/delete-confirm-dialog';

import { ScrollArea } from '@/components/ui/scroll-area';

import { Separator } from '@/components/ui/separator';

import { Skeleton } from '@/components/ui/skeleton';

import { cn } from '@/lib/utils';

import { CommentCreateForm } from './comment-create-form';
import { CommentEmptyState } from './comment-empty-state';
import { CommentThread } from './comment-thread';
import { CommentMentionUsersContext } from './comment-mention-input';

import {
  type CommentThread as CommentThreadType,
  type CommentsPanelProps,
  type MentionUser
} from './types';

import { useDisclosure } from './hooks/use-disclosure';
import { serializeCommentMarkdown } from './lib/comment-markdown';

function buildThreads(
  comments: Array<{
    id: string;
    parent_id: string | null;
    created_on: string;
  }>
): Array<CommentThreadType> {
  const topLevel = comments.filter(c => c.parent_id === null);
  const repliesByParent = new Map<string, typeof comments>();

  for (const c of comments) {
    if (c.parent_id !== null) {
      const existing = repliesByParent.get(c.parent_id) ?? [];

      existing.push(c);
      repliesByParent.set(c.parent_id, existing);
    }
  }

  return topLevel
    .sort(
      (a, b) => new Date(a.created_on).getTime() - new Date(b.created_on).getTime()
    )
    .map(comment => ({
      comment: comment as CommentThreadType['comment'],
      replies: (repliesByParent.get(comment.id) ?? []).sort(
        (a, b) => new Date(a.created_on).getTime() - new Date(b.created_on).getTime()
      ) as CommentThreadType['replies']
    }));
}

export function CommentsPanel({
  comments,
  currentUser,
  users,
  title = 'Comments',
  editable = true,
  isLoading = false,
  maxHeight = '24rem',
  onCreateComment,
  onUpdateComment,
  onDeleteComment,
  isCreatePending = false,
  isDeletePending = false,
  className
}: CommentsPanelProps) {
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(
    null
  );
  const [commentToDeleteId, setCommentToDeleteId] = useState<string | null>(
    null
  );
  const deleteDialog = useDisclosure();

  const usersMap = useMemo(() => {
    const map = new Map<string, NonNullable<typeof users>[0]>();

    if (users) {
      for (const user of users) {
        if (user.id) {
          map.set(user.id, user);
        }
      }
    }

    return map;
  }, [users]);

  const mentionUsers = useMemo<Array<MentionUser>>(() => {
    if (!users) return [];

    return users
      .filter(u => u.id)
      .map(u => ({
        key: u.id,
        text: `${u.firstname} ${u.lastname}`,
        initials: `${u.firstname?.[0] ?? ''}${u.lastname?.[0] ?? ''}`
      }));
  }, [users]);

  const threads = useMemo(() => buildThreads(comments ?? []), [comments]);

  const handleCreateComment = useCallback(
    async (content: Value, parentId?: string, files?: Array<File>) => {
      const message = serializeCommentMarkdown(content);

      await onCreateComment?.({
        message,
        parentId,
        attachments: files && files.length > 0 ? files : undefined
      });
      setReplyingToCommentId(null);
    },
    [onCreateComment]
  );

  const handleSaveEdit = useCallback(
    async (commentId: string, content: Value) => {
      const message = serializeCommentMarkdown(content);

      await onUpdateComment?.(commentId, message);
      setEditingCommentId(null);
    },
    [onUpdateComment]
  );

  const handleDeleteClick = useCallback(
    (commentId: string) => {
      setCommentToDeleteId(commentId);
      deleteDialog.onOpen();
    },
    [deleteDialog]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!commentToDeleteId) return;
    await onDeleteComment?.(commentToDeleteId);
    deleteDialog.onClose();
    setCommentToDeleteId(null);
  }, [commentToDeleteId, onDeleteComment, deleteDialog]);

  const currentUserId = currentUser?.id;
  const resolvedHeight = maxHeight
    ? (typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight)
    : '24rem';
  const panelStyle = { maxHeight: resolvedHeight };

  return (
    <CommentMentionUsersContext.Provider value={mentionUsers}>
      <div
        className={cn('@container/comments-panel flex flex-col overflow-hidden', className)}
        style={panelStyle}>
        {/* Header */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium">{title}</h3>
            {comments && comments.length > 0 && (
              <span className="text-xs text-muted-foreground">
                ({comments.length})
              </span>
            )}
          </div>
        </div>

        <Separator className="my-2" />

        {/* Content */}
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex flex-col gap-4 px-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={`skeleton-${i}`} className="flex gap-2">
                  <Skeleton className="size-6 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : !comments || comments.length === 0 ? (
            <CommentEmptyState />
          ) : (
            <div className="flex flex-col gap-3 px-1">
              {threads.map(thread => (
                <CommentThread
                  key={thread.comment.id}
                  thread={thread}
                  usersMap={usersMap}
                  currentUserId={currentUserId}
                  currentUser={currentUser}
                  editingCommentId={editingCommentId}
                  replyingToCommentId={replyingToCommentId}
                  editable={editable}
                  onStartEdit={setEditingCommentId}
                  onCancelEdit={() => setEditingCommentId(null)}
                  onSaveEdit={handleSaveEdit}
                  onDelete={handleDeleteClick}
                  onStartReply={setReplyingToCommentId}
                  onCancelReply={() => setReplyingToCommentId(null)}
                  onSubmitReply={handleCreateComment}
                  isCreatePending={isCreatePending} />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Create form */}
        {editable && (
          <>
            <Separator className="my-2" />
            <div className="px-1">
              <CommentCreateForm
                currentUser={currentUser}
                onSubmit={handleCreateComment}
                isPending={isCreatePending} />
            </div>
          </>
        )}

        {/* Delete confirmation dialog */}
        <DeleteConfirmDialog
          open={deleteDialog.isOpen}
          onOpenChange={deleteDialog.onClose}
          objectName="comment"
          count={1}
          onConfirm={handleDeleteConfirm}
          isPending={isDeletePending} />
      </div>
    </CommentMentionUsersContext.Provider>
  );
}