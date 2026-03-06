'use client'

import { useCallback, useState } from 'react'

import { ChevronDownIcon, ChevronRightIcon, Loader2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { type Value } from 'platejs'

import { useTeamChatContext } from './team-chat-context'
import { type ChatPost, type ChatUser, type LinkedEntity } from './types'
import { PostCard } from './post-card'
import { PostComposer } from './post-composer'
import { serializePostMarkdown } from './lib/post-serializer'

interface PostThreadProps {
  post: ChatPost
  user: ChatUser | undefined
  isOwn: boolean
  usersMap: Map<string, ChatUser>
  onEdit: (postId: string) => void
  onDelete: (postId: string) => void
}

export function PostThread({
  post,
  user,
  isOwn,
  usersMap,
  onEdit,
  onDelete,
}: PostThreadProps) {
  const { onCreatePost, onLoadReplies, isCreatePending, currentUser } =
    useTeamChatContext()
  const [isExpanded, setIsExpanded] = useState(false)
  const [replies, setReplies] = useState<Array<ChatPost>>([])
  const [isLoadingReplies, setIsLoadingReplies] = useState(false)
  const [isReplying, setIsReplying] = useState(false)

  const handleToggleReplies = useCallback(async () => {
    if (isExpanded) {
      setIsExpanded(false)

      return
    }

    if (onLoadReplies && replies.length === 0) {
      setIsLoadingReplies(true)
      const loadedReplies = await onLoadReplies(post.id)

      setReplies(loadedReplies)
      setIsLoadingReplies(false)
    }

    setIsExpanded(true)
  }, [isExpanded, onLoadReplies, replies.length, post.id])

  const handleSubmitReply = useCallback(
    async (
      content: Value,
      _parentId?: string,
      files?: Array<File>,
      entities?: Array<LinkedEntity>,
    ) => {
      const message = serializePostMarkdown(content)

      await onCreatePost?.({
        content: message,
        parent_id: post.id,
        attachments: files,
        linked_entities: entities,
      })
      setIsReplying(false)

      if (onLoadReplies) {
        const loadedReplies = await onLoadReplies(post.id)

        setReplies(loadedReplies)
        setIsExpanded(true)
      }
    },
    [onCreatePost, onLoadReplies, post.id],
  )

  return (
    <div className="flex flex-col gap-1">
      <PostCard
        post={post}
        user={user}
        isOwn={isOwn}
        onEdit={() => onEdit(post.id)}
        onDelete={() => onDelete(post.id)}
        onReply={() => setIsReplying((prev) => !prev)}
      />

      {/* Reply count / toggle */}
      {post.reply_count > 0 && (
        <div className="pl-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-auto gap-1 p-0 text-xs text-muted-foreground"
            onClick={handleToggleReplies}
            disabled={isLoadingReplies}
          >
            {isLoadingReplies ? (
              <Loader2Icon className="size-3 animate-spin" />
            ) : isExpanded ? (
              <ChevronDownIcon className="size-3" />
            ) : (
              <ChevronRightIcon className="size-3" />
            )}
            {post.reply_count} {post.reply_count === 1 ? 'reply' : 'replies'}
          </Button>
        </div>
      )}

      {/* Expanded replies */}
      {isExpanded && replies.length > 0 && (
        <div className="ml-6 flex flex-col gap-1 border-l-2 border-muted pl-3">
          {replies.map((reply) => (
            <PostCard
              key={reply.id}
              post={reply}
              user={usersMap.get(reply.created_by)}
              isOwn={currentUser?.id === reply.created_by}
              onEdit={() => onEdit(reply.id)}
              onDelete={() => onDelete(reply.id)}
              onReply={() => setIsReplying(true)}
              isReply
            />
          ))}
        </div>
      )}

      {/* Reply composer */}
      {isReplying && (
        <div className="ml-6 border-l-2 border-muted pl-3">
          <PostComposer
            currentUser={currentUser}
            onSubmit={handleSubmitReply}
            isPending={isCreatePending}
            parentId={post.id}
            placeholder="Reply..."
            compact
          />
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs text-muted-foreground"
            onClick={() => setIsReplying(false)}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}
