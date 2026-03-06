'use client'

import { Fragment, useCallback, useMemo, useState } from 'react'

import { AnimatePresence, motion } from 'motion/react'
import { ListFilterIcon } from 'lucide-react'

import { ScrollArea } from '@/components/ui/scroll-area'
import { Timeline } from '@/components/ui/timeline'
import { cn } from '@/lib/utils'

import { DeleteConfirmDialog } from '@/components/docyrus/delete-confirm-dialog'
import { useDisclosure } from '@/components/docyrus/comments-panel/hooks/use-disclosure'

import {
  type ActivityType,
  type ChatUser,
  type ContactActivityPanelProps,
  type MentionUser,
} from './types'

import {
  ContactActivityProvider,
  type ContactActivityContextValue,
} from './contact-activity-context'
import {
  ACTIVITY_TYPE_CONFIG,
  ALL_ACTIVITY_TYPES,
} from './activity-type-config'
import { ActivityThread } from './activity-thread'
import { ActivityEmptyState } from './activity-empty-state'
import { ActivityLoadingSkeleton } from './activity-skeleton'
import { groupActivitiesByDate } from './lib/activity-utils'

export function ContactActivityPanel({
  activities,
  currentUser,
  users,
  contactName,
  isLoading = false,
  isCreatePending = false,
  isDeletePending = false,
  onDeleteActivity,
  onCreateComment,
  onDeleteComment,
  onToggleReaction,
  onUploadFile,
  onLoadReplies,
  mentionUsers: mentionUsersProp,
  dataSources,
  onSearchEntity,
  activityTypes,
  maxHeight,
  className,
}: ContactActivityPanelProps) {
  const [activeFilters, setActiveFilters] = useState<Array<ActivityType>>([])
  const [activityToDeleteId, setActivityToDeleteId] = useState<string | null>(
    null,
  )

  const isAllSelected = activeFilters.length === 0

  const deleteDialog = useDisclosure()

  const allowedTypes = activityTypes ?? ALL_ACTIVITY_TYPES

  const usersMap = useMemo(() => {
    const map = new Map<string, NonNullable<typeof users>[0]>()

    if (users) {
      for (const user of users) {
        if (user.id) {
          map.set(user.id, user)
        }
      }
    }

    return map
  }, [users])

  const mentionUsers = useMemo<Array<MentionUser>>(() => {
    if (mentionUsersProp) return mentionUsersProp
    if (!users) return []

    return users
      .filter((u: ChatUser) => u.id)
      .map((u: ChatUser) => ({
        key: u.id,
        text: `${u.firstname ?? ''} ${u.lastname ?? ''}`.trim(),
        initials: `${u.firstname?.[0] ?? ''}${u.lastname?.[0] ?? ''}`,
        avatar_url: u.avatar_url,
      }))
  }, [mentionUsersProp, users])

  const handleFilterToggle = useCallback((type: ActivityType | 'all') => {
    if (type === 'all') {
      setActiveFilters([])

      return
    }

    setActiveFilters((prev) => {
      if (prev.includes(type)) {
        return prev.filter((t) => t !== type)
      }

      return [...prev, type]
    })
  }, [])

  const filteredActivities = useMemo(() => {
    const sorted = [...(activities ?? [])].sort(
      (a, b) =>
        new Date(b.created_on).getTime() - new Date(a.created_on).getTime(),
    )

    if (activeFilters.length === 0) return sorted

    return sorted.filter(
      (a) =>
        activeFilters.includes(a.type) ||
        a.type === 'record_create' ||
        a.type === 'record_update',
    )
  }, [activities, activeFilters])

  const dateGroups = useMemo(
    () => groupActivitiesByDate(filteredActivities),
    [filteredActivities],
  )

  const handleDeleteClick = useCallback(
    (activityId: string) => {
      setActivityToDeleteId(activityId)
      deleteDialog.onOpen()
    },
    [deleteDialog],
  )

  const handleDeleteConfirm = useCallback(async () => {
    if (!activityToDeleteId) return
    await onDeleteActivity?.(activityToDeleteId)
    deleteDialog.onClose()
    setActivityToDeleteId(null)
  }, [activityToDeleteId, onDeleteActivity, deleteDialog])

  const contextValue = useMemo<ContactActivityContextValue>(
    () => ({
      currentUser,
      usersMap,
      mentionUsers,
      allowedTypes,
      onDeleteActivity,
      onCreateComment,
      onDeleteComment,
      onToggleReaction,
      onUploadFile,
      onLoadReplies,
      dataSources,
      onSearchEntity,
      isCreatePending,
      isDeletePending,
    }),
    [
      currentUser,
      usersMap,
      mentionUsers,
      allowedTypes,
      onDeleteActivity,
      onCreateComment,
      onDeleteComment,
      onToggleReaction,
      onUploadFile,
      onLoadReplies,
      dataSources,
      onSearchEntity,
      isCreatePending,
      isDeletePending,
    ],
  )

  const resolvedHeight = maxHeight
    ? typeof maxHeight === 'number'
      ? `${maxHeight}px`
      : maxHeight
    : undefined

  return (
    <ContactActivityProvider value={contextValue}>
      <div
        className={cn(
          '@container/activity-panel flex flex-col overflow-hidden bg-background',
          className,
        )}
        style={resolvedHeight ? { maxHeight: resolvedHeight } : undefined}
      >
        {/* Header: animated filter toggle group */}
        <div className="flex items-center gap-1 overflow-x-auto border-b px-3 py-2">
          <div className="flex items-center gap-1 rounded-lg border p-0.5 shadow-xs">
            {/* "All" toggle */}
            <button
              type="button"
              onClick={() => handleFilterToggle('all')}
              className={cn(
                'relative flex h-7 shrink-0 items-center gap-1 rounded-md px-2.5 text-xs font-medium transition-colors',
                isAllSelected
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <AnimatePresence>
                {isAllSelected && (
                  <motion.div
                    layoutId="activity-filter-highlight"
                    className="absolute inset-0 rounded-md bg-accent"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                  />
                )}
              </AnimatePresence>
              <span className="relative z-10 flex items-center gap-1">
                <ListFilterIcon className="size-3" />
                All
              </span>
            </button>

            {/* Activity type toggles */}
            {allowedTypes.map((type) => {
              const config = ACTIVITY_TYPE_CONFIG[type]
              const Icon = config.icon
              const isActive = activeFilters.includes(type)

              return (
                <motion.button
                  key={type}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleFilterToggle(type)}
                  className={cn(
                    'relative flex h-7 shrink-0 items-center gap-1 rounded-md px-2 text-xs font-medium transition-colors',
                    isActive
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        layoutId={`activity-filter-${type}`}
                        className="absolute inset-0 rounded-md bg-accent"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{
                          type: 'spring',
                          stiffness: 200,
                          damping: 25,
                        }}
                      />
                    )}
                  </AnimatePresence>
                  <span className="relative z-10 flex items-center gap-1">
                    <Icon className={`size-3 ${config.colorClass}`} />
                    <span className="hidden @sm/activity-panel:inline">
                      {config.label}
                    </span>
                  </span>
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Timeline feed */}
        <ScrollArea className="flex-1">
          <div className="p-3">
            {isLoading ? (
              <ActivityLoadingSkeleton />
            ) : filteredActivities.length === 0 ? (
              <ActivityEmptyState contactName={contactName} />
            ) : (
              <Timeline className="gap-0 [--timeline-dot-size:2rem]">
                {dateGroups.map((group) => (
                  <Fragment key={group.label}>
                    <div className="pb-1 pl-10 pt-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground first:pt-0">
                      {group.label}
                    </div>
                    {group.items.map((activity) => (
                      <ActivityThread
                        key={activity.id}
                        activity={activity}
                        user={usersMap.get(activity.created_by)}
                        isOwn={currentUser?.id === activity.created_by}
                        usersMap={usersMap}
                        onDelete={handleDeleteClick}
                      />
                    ))}
                  </Fragment>
                ))}
              </Timeline>
            )}
          </div>
        </ScrollArea>

        {/* Delete confirmation dialog */}
        <DeleteConfirmDialog
          open={deleteDialog.isOpen}
          onOpenChange={deleteDialog.onClose}
          objectName="activity"
          count={1}
          onConfirm={handleDeleteConfirm}
          isPending={isDeletePending}
        />
      </div>
    </ContactActivityProvider>
  )
}
