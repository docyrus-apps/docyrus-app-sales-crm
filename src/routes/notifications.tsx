import { useEffect, useMemo, useState } from 'react'
import {
  Inbox,
  MessageSquare,
  MessageSquareText,
  UserRound,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import type { InboxComment } from '@/hooks/use-inbox'
import { CommentsPanel } from '@/components/docyrus/comments-panel'
import { useUsersCollection } from '@/collections/users.collection'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  useDeleteInboxComment,
  useInboxComments,
  useReplyInboxComment,
  useUpdateInboxComment,
} from '@/hooks/use-inbox'

type InboxThread = {
  root: InboxComment
  comments: Array<InboxComment>
  lastActivityOn: string
}

function formatDateTime(value?: string) {
  if (!value) return ''

  return new Date(value).toLocaleString()
}

function formatPreview(message: string) {
  return message.replace(/\s+/g, ' ').trim()
}

function getDisplayName(user?: {
  firstname?: string | null
  lastname?: string | null
}) {
  if (!user) return ''

  return [user.firstname, user.lastname].filter(Boolean).join(' ').trim()
}

export function InboxPage() {
  const { t } = useTranslation()
  const usersCollection = useUsersCollection()
  const { data: currentUser, isLoading: currentUserLoading } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: () => usersCollection.getMyInfo(),
  })
  const { data: comments = [], isLoading: commentsLoading } = useInboxComments()
  const replyComment = useReplyInboxComment()
  const updateComment = useUpdateInboxComment()
  const deleteComment = useDeleteInboxComment()
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)

  const commentUsers = useMemo(() => {
    const users = new Map<
      string,
      { id: string; firstname?: string | null; lastname?: string | null }
    >()

    for (const comment of comments) {
      users.set(comment.author.id, comment.author)
    }

    return Array.from(users.values())
  }, [comments])

  const allThreads = useMemo<Array<InboxThread>>(() => {
    const repliesByParent = new Map<string, Array<InboxComment>>()

    for (const comment of comments) {
      if (!comment.parent_id) continue

      const existing = repliesByParent.get(comment.parent_id) ?? []
      existing.push(comment)
      repliesByParent.set(comment.parent_id, existing)
    }

    return comments
      .filter((comment) => comment.parent_id === null)
      .map((root) => {
        const replies = (repliesByParent.get(root.id) ?? []).sort(
          (a, b) =>
            new Date(a.created_on).getTime() - new Date(b.created_on).getTime(),
        )
        const threadComments = [root, ...replies]

        return {
          root,
          comments: threadComments,
          lastActivityOn:
            threadComments[threadComments.length - 1]?.created_on ||
            root.created_on,
        }
      })
      .sort(
        (a, b) =>
          new Date(b.lastActivityOn).getTime() -
          new Date(a.lastActivityOn).getTime(),
      )
  }, [comments])

  const threads = useMemo(() => {
    if (!currentUser?.id) {
      return allThreads
    }

    const incomingThreads = allThreads.filter(
      (thread) => thread.root.created_by !== currentUser.id,
    )

    return incomingThreads.length > 0 ? incomingThreads : allThreads
  }, [allThreads, currentUser?.id])

  useEffect(() => {
    if (threads.length === 0) {
      setSelectedThreadId(null)
      return
    }

    setSelectedThreadId((current) => {
      if (current && threads.some((thread) => thread.root.id === current)) {
        return current
      }

      return threads[0]?.root.id ?? null
    })
  }, [threads])

  const selectedThread =
    threads.find((thread) => thread.root.id === selectedThreadId) ?? null

  return (
    <>
      <PageHeader
        title={t('notifications.title')}
        icon={<Inbox className="h-4 w-4 text-cyan-600" />}
      />
      <PageContainer className="max-w-full">
        {commentsLoading || currentUserLoading ? (
          <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
            <Card className="min-h-[70vh]">
              <CardContent className="space-y-3 p-4">
                {Array.from({ length: 7 }).map((_, index) => (
                  <Skeleton key={index} className="h-20 w-full rounded-xl" />
                ))}
              </CardContent>
            </Card>
            <Card className="min-h-[70vh]">
              <CardContent className="space-y-4 p-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-[60vh] w-full rounded-xl" />
              </CardContent>
            </Card>
          </div>
        ) : threads.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Inbox className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">{t('notifications.empty')}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('notifications.allCaughtUp')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
            <Card className="overflow-hidden lg:min-h-[70vh]">
              <CardHeader className="border-b pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="h-4 w-4 text-cyan-600" />
                  {t('inbox.listTitle')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {threads.map((thread) => {
                    const sender =
                      commentUsers.find(
                        (user) => user.id === thread.root.created_by,
                      ) || thread.root.author
                    const senderName =
                      getDisplayName(sender) || t('inbox.unknownSender')
                    const replyCount = Math.max(thread.comments.length - 1, 0)

                    return (
                      <button
                        key={thread.root.id}
                        type="button"
                        onClick={() => setSelectedThreadId(thread.root.id)}
                        className={cn(
                          'flex w-full flex-col gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/40',
                          selectedThreadId === thread.root.id && 'bg-muted/60',
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold">
                              {senderName}
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                              <UserRound className="h-3.5 w-3.5" />
                              <span className="truncate">
                                {formatDateTime(thread.root.created_on)}
                              </span>
                            </div>
                          </div>
                          {thread.root.created_by === currentUser?.id ? (
                            <Badge variant="secondary">{t('inbox.mine')}</Badge>
                          ) : (
                            <Badge variant="outline">
                              {t('inbox.incoming')}
                            </Badge>
                          )}
                        </div>

                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {formatPreview(thread.root.message) ||
                            t('inbox.noPreview')}
                        </p>

                        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span className="flex min-w-0 items-center gap-1.5 truncate">
                            <MessageSquareText className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">
                              {replyCount} {t('inbox.replies')}
                            </span>
                          </span>
                          <span className="shrink-0">
                            {formatDateTime(thread.lastActivityOn)}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden lg:min-h-[70vh]">
              {selectedThread ? (
                <>
                  <CardHeader className="border-b pb-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <CardTitle className="truncate text-lg">
                          {getDisplayName(selectedThread.root.author) ||
                            t('inbox.untitledThread')}
                        </CardTitle>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <UserRound className="h-4 w-4" />
                            {formatDateTime(selectedThread.root.created_on)}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {selectedThread.root.created_by === currentUser?.id ? (
                          <Badge variant="secondary">{t('inbox.mine')}</Badge>
                        ) : (
                          <Badge variant="outline">{t('inbox.incoming')}</Badge>
                        )}
                        <Badge variant="outline">
                          {selectedThread.comments.length - 1}{' '}
                          {t('inbox.replies')}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <CommentsPanel
                      comments={selectedThread.comments}
                      currentUser={
                        currentUser
                          ? {
                              id: currentUser.id,
                              firstname: currentUser.firstname,
                              lastname: currentUser.lastname,
                            }
                          : undefined
                      }
                      users={commentUsers}
                      title={t('inbox.threadTitle')}
                      editable
                      showCreateForm={false}
                      maxHeight="58vh"
                      className="min-h-[58vh]"
                      onCreateComment={async ({ message, parentId }) => {
                        await replyComment.mutateAsync({
                          commentId: parentId as string,
                          message,
                        })
                      }}
                      onUpdateComment={async (commentId, message) => {
                        await updateComment.mutateAsync({
                          commentId,
                          message,
                        })
                      }}
                      onDeleteComment={async (commentId) => {
                        await deleteComment.mutateAsync(commentId)
                      }}
                      isCreatePending={replyComment.isPending}
                      isDeletePending={deleteComment.isPending}
                    />
                  </CardContent>
                </>
              ) : (
                <CardContent className="flex min-h-[70vh] flex-col items-center justify-center text-center">
                  <Inbox className="mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-lg font-medium">
                    {t('inbox.selectThread')}
                  </p>
                </CardContent>
              )}
            </Card>
          </div>
        )}
      </PageContainer>
    </>
  )
}
