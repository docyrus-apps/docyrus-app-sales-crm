'use client';

import { useCallback, useMemo, useState } from 'react';

import { type Value } from 'platejs';

import { DeleteConfirmDialog } from '@/components/docyrus/delete-confirm-dialog';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { useDisclosure } from '@/components/docyrus/comments-panel/hooks/use-disclosure';

import { MentionUsersContext } from '@/lib/editor-mention';

import {
  type LinkedEntity,
  type MentionUser,
  type TeamChatChannelProps
} from './types';

import { TeamChatProvider, type TeamChatContextValue } from './team-chat-context';
import { PostComposer } from './post-composer';
import { PostThread } from './post-thread';
import { PostEmptyState } from './post-empty-state';
import { serializePostMarkdown } from './lib/post-serializer';

export function TeamChatChannel({
  posts,
  currentUser,
  users,
  channelName,
  isLoading = false,
  isCreatePending = false,
  isDeletePending = false,
  onCreatePost,
  onUpdatePost,
  onDeletePost,
  onToggleReaction,
  onUploadFile,
  onFetchLinkPreview,
  onLoadReplies,
  dataSources,
  onSearchEntity,
  maxHeight,
  className
}: TeamChatChannelProps) {
  const [postToDeleteId, setPostToDeleteId] = useState<string | null>(null);
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
        initials: `${u.firstname?.[0] ?? ''}${u.lastname?.[0] ?? ''}`,
        avatar_url: u.avatar_url
      }));
  }, [users]);

  const topLevelPosts = useMemo(
    () => (posts ?? [])
      .filter(p => p.parent_id === null)
      .sort(
        (a, b) => new Date(b.created_on).getTime() - new Date(a.created_on).getTime()
      ),
    [posts]
  );

  const handleCreatePost = useCallback(
    async (content: Value, parentId?: string, files?: Array<File>, entities?: Array<LinkedEntity>) => {
      const message = serializePostMarkdown(content);

      await onCreatePost?.({
        content: message,
        parent_id: parentId,
        attachments: files,
        linked_entities: entities
      });
    },
    [onCreatePost]
  );

  const handleEditPost = useCallback(
    (_postId: string) => {
      /*
       * Edit is handled inline via onUpdatePost callback
       * This is a placeholder for future inline editing
       */
    },
    []
  );

  const handleDeleteClick = useCallback(
    (postId: string) => {
      setPostToDeleteId(postId);
      deleteDialog.onOpen();
    },
    [deleteDialog]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!postToDeleteId) return;
    await onDeletePost?.(postToDeleteId);
    deleteDialog.onClose();
    setPostToDeleteId(null);
  }, [postToDeleteId, onDeletePost, deleteDialog]);

  const currentUserId = currentUser?.id;

  const contextValue = useMemo<TeamChatContextValue>(() => ({
    currentUser,
    usersMap,
    mentionUsers,
    onCreatePost,
    onUpdatePost,
    onDeletePost,
    onToggleReaction,
    onUploadFile,
    onFetchLinkPreview,
    onLoadReplies,
    dataSources,
    onSearchEntity,
    isCreatePending,
    isDeletePending
  }), [
    currentUser,
    usersMap,
    mentionUsers,
    onCreatePost,
    onUpdatePost,
    onDeletePost,
    onToggleReaction,
    onUploadFile,
    onFetchLinkPreview,
    onLoadReplies,
    dataSources,
    onSearchEntity,
    isCreatePending,
    isDeletePending
  ]);

  const resolvedHeight = maxHeight ? (typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight) : undefined;

  return (
    <MentionUsersContext.Provider value={mentionUsers}>
      <TeamChatProvider value={contextValue}>
        <div
          className={cn(
            '@container/team-chat flex flex-col overflow-hidden bg-background',
            className
          )}
          style={resolvedHeight ? { maxHeight: resolvedHeight } : undefined}>
          {/* Header */}
          {channelName && (
            <>
              <div className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">{channelName}</h3>
                  {posts && posts.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      ({topLevelPosts.length})
                    </span>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Composer */}
          {onCreatePost && (
            <div className="border-b px-3 py-3">
              <PostComposer
                currentUser={currentUser}
                onSubmit={handleCreatePost}
                isPending={isCreatePending}
                placeholder="Write a post..." />
            </div>
          )}

          {/* Feed */}
          <ScrollArea className="min-h-0 flex-1">
            <div className="p-3">
              {isLoading ? (
                <div className="flex flex-col gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={`skeleton-${i}`} className="rounded-lg border p-3">
                      <div className="flex items-center gap-2">
                        <Skeleton className="size-8 shrink-0 rounded-full" />
                        <div className="flex-1 space-y-1.5">
                          <Skeleton className="h-3 w-28" />
                          <Skeleton className="h-2 w-16" />
                        </div>
                      </div>
                      <div className="mt-3 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : topLevelPosts.length === 0 ? (
                <PostEmptyState />
              ) : (
                <div className="flex flex-col gap-3">
                  {topLevelPosts.map(post => (
                    <PostThread
                      key={post.id}
                      post={post}
                      user={usersMap.get(post.created_by)}
                      isOwn={currentUserId === post.created_by}
                      usersMap={usersMap}
                      onEdit={handleEditPost}
                      onDelete={handleDeleteClick} />
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Delete confirmation dialog */}
          <DeleteConfirmDialog
            open={deleteDialog.isOpen}
            onOpenChange={deleteDialog.onClose}
            objectName="post"
            count={1}
            onConfirm={handleDeleteConfirm}
            isPending={isDeletePending} />
        </div>
      </TeamChatProvider>
    </MentionUsersContext.Provider>
  );
}