'use client'

import { useCallback, useMemo, useState } from 'react'

import { ChevronDownIcon, Loader2Icon, ReplyIcon } from 'lucide-react'

import { type Value } from 'platejs'

import { Button } from '@/components/ui/button'
import {
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
} from '@/components/ui/timeline'

import { PostCard } from '@/components/docyrus/team-chat-channel/post-card'
import { PostComposer } from '@/components/docyrus/team-chat-channel/post-composer'
import {
  TeamChatProvider,
  type TeamChatContextValue,
} from '@/components/docyrus/team-chat-channel/team-chat-context'
import { serializePostMarkdown } from '@/components/docyrus/team-chat-channel/lib/post-serializer'

import {
  type ChatPost,
  type ChatUser,
  type ContactActivity,
  type LinkedEntity,
} from './types'
import {
  getActivityTypeConfig,
  isCompactActivity,
} from './activity-type-config'
import { useContactActivityContext } from './contact-activity-context'
import { ActivityCard } from './activity-card'
import { ActivityCompact } from './activity-compact'

interface ActivityThreadProps {
  activity: ContactActivity
  user: ChatUser | undefined
  isOwn: boolean
  usersMap: Map<string, ChatUser>
  onDelete: (activityId: string) => void
}

export function ActivityThread({
  activity,
  user,
  isOwn,
  usersMap,
  onDelete,
}: ActivityThreadProps) {
  const ctx = useContactActivityContext()
  const isCompact = isCompactActivity(activity.type)

  const [isExpanded, setIsExpanded] = useState(false)
  const [replies, setReplies] = useState<Array<ChatPost>>([])
  const [isLoadingReplies, setIsLoadingReplies] = useState(false)
  const [isReplying, setIsReplying] = useState(false)

  const config = getActivityTypeConfig(activity.type)
  const Icon = config.icon

  const handleToggleReplies = useCallback(async () => {
    if (isExpanded) {
      setIsExpanded(false)

      return
    }

    if (ctx.onLoadReplies && replies.length === 0) {
      setIsLoadingReplies(true)
      const loadedReplies = await ctx.onLoadReplies(activity.id)

      setReplies(loadedReplies)
      setIsLoadingReplies(false)
    }

    setIsExpanded(true)
  }, [isExpanded, ctx, replies.length, activity.id])

  const handleSubmitReply = useCallback(
    async (
      content: Value,
      _parentId?: string,
      files?: Array<File>,
      entities?: Array<LinkedEntity>,
    ) => {
      const message = serializePostMarkdown(content)

      await ctx.onCreateComment?.({
        content: message,
        parent_id: activity.id,
        attachments: files,
        linked_entities: entities,
      })
      setIsReplying(false)

      if (ctx.onLoadReplies) {
        const loadedReplies = await ctx.onLoadReplies(activity.id)

        setReplies(loadedReplies)
        setIsExpanded(true)
      }
    },
    [ctx, activity.id],
  )

  const chatContextBridge = useMemo<TeamChatContextValue>(
    () => ({
      currentUser: ctx.currentUser,
      usersMap,
      mentionUsers: ctx.mentionUsers,
      onCreatePost: ctx.onCreateComment,
      onDeletePost: ctx.onDeleteComment,
      onToggleReaction: ctx.onToggleReaction,
      onUploadFile: ctx.onUploadFile,
      onLoadReplies: ctx.onLoadReplies,
      dataSources: ctx.dataSources,
      onSearchEntity: ctx.onSearchEntity,
      isCreatePending: ctx.isCreatePending,
      isDeletePending: ctx.isDeletePending,
    }),
    [ctx, usersMap],
  )

  if (isCompact) {
    return (
      <TimelineItem className="gap-2 pb-0.5 last:pb-0 [--timeline-dot-size:1.25rem]">
        <TimelineDot className={config.colorClass}>
          <Icon className={`size-2.5 ${config.colorClass}`} />
        </TimelineDot>
        <TimelineConnector />
        <TimelineContent>
          <ActivityCompact activity={activity} user={user} />
        </TimelineContent>
      </TimelineItem>
    )
  }

  return (
    <TimelineItem className="gap-2 pb-3 last:pb-0">
      <TimelineDot className={`border-2 ${config.colorClass}`}>
        <Icon className={`size-3.5 ${config.colorClass}`} />
      </TimelineDot>
      <TimelineConnector />
      <TimelineContent>
        <div className="flex flex-col gap-1.5">
          <ActivityCard
            activity={activity}
            user={user}
            isOwn={isOwn}
            onDelete={() => onDelete(activity.id)}
            onReply={() => setIsReplying((prev) => !prev)}
          />

          {/* Reply count toggle — show reply avatar stack */}
          {activity.reply_count > 0 && !isExpanded && (
            <div className="ml-8">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto gap-1.5 px-0 py-0.5 text-xs font-medium text-primary"
                onClick={handleToggleReplies}
                disabled={isLoadingReplies}
              >
                {isLoadingReplies ? (
                  <Loader2Icon className="size-3 animate-spin" />
                ) : (
                  <>
                    <ReplyIcon className="size-3" />
                    <span>
                      View {activity.reply_count}{' '}
                      {activity.reply_count === 1 ? 'reply' : 'replies'}
                    </span>
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Expanded collapse button */}
          {isExpanded && replies.length > 0 && (
            <div className="ml-8">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto gap-1 px-0 py-0.5 text-xs text-muted-foreground"
                onClick={handleToggleReplies}
              >
                <ChevronDownIcon className="size-3" />
                Hide replies
              </Button>
            </div>
          )}

          {/* Expanded replies */}
          {isExpanded && replies.length > 0 && (
            <TeamChatProvider value={chatContextBridge}>
              <div className="ml-8 flex flex-col gap-1 border-l-2 border-muted pl-3">
                {replies.map((reply) => (
                  <PostCard
                    key={reply.id}
                    post={reply}
                    user={usersMap.get(reply.created_by)}
                    isOwn={ctx.currentUser?.id === reply.created_by}
                    onEdit={() => {}}
                    onDelete={() => ctx.onDeleteComment?.(reply.id)}
                    onReply={() => setIsReplying(true)}
                    isReply
                  />
                ))}
              </div>
            </TeamChatProvider>
          )}

          {/* Reply composer */}
          {isReplying && (
            <div className="ml-8 border-l-2 border-muted pl-3">
              <PostComposer
                currentUser={ctx.currentUser}
                onSubmit={handleSubmitReply}
                isPending={ctx.isCreatePending}
                parentId={activity.id}
                placeholder="Write a reply..."
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
      </TimelineContent>
    </TimelineItem>
  )
}
