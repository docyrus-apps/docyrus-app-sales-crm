'use client'

import { useState } from 'react'

import { MoreHorizontalIcon, ReplyIcon, TrashIcon } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { type ChatUser, type ContactActivity } from './types'
import { getActivityTypeConfig } from './activity-type-config'
import { ActivityMetadata } from './activity-metadata'
import {
  formatRelativeTime,
  getUserDisplayName,
  getUserInitials,
} from './lib/activity-utils'

interface ActivityCardProps {
  activity: ContactActivity
  user: ChatUser | undefined
  isOwn: boolean
  onDelete: () => void
  onReply: () => void
}

export function ActivityCard({
  activity,
  user,
  isOwn,
  onDelete,
  onReply,
}: ActivityCardProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)

  const config = getActivityTypeConfig(activity.type)
  const initials = getUserInitials(user)
  const displayName = getUserDisplayName(user)
  const hasLongDescription = (activity.description?.length ?? 0) > 140
  const isComment = activity.type === 'comment'

  return (
    <div className="group/card relative">
      {/* User line: avatar + name + action + time */}
      <div className="flex items-center gap-2">
        <Avatar className="size-6 shrink-0">
          <AvatarFallback className="text-[9px]">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <span className="text-sm font-medium">{displayName}</span>
          <span className="truncate text-sm text-muted-foreground">
            {isComment
              ? `${activity.metadata.record_name ? `Mentioned you in a comment in ` : 'Commented'}`
              : activity.subject}
          </span>
          {isComment && typeof activity.metadata.record_name === 'string' && (
            <span className="truncate text-sm font-semibold">
              {activity.metadata.record_name}
            </span>
          )}
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {'\u00b7'} {formatRelativeTime(activity.created_on)}
        </span>

        {/* Hover actions */}
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/card:opacity-100">
          <Button
            variant="ghost"
            size="sm"
            className="size-6 p-0 text-muted-foreground"
            onClick={onReply}
          >
            <ReplyIcon className="size-3.5" />
          </Button>
          {isOwn && (
            <DropdownMenu
              open={dropdownOpen}
              onOpenChange={setDropdownOpen}
              modal={false}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="size-6 p-0 text-muted-foreground"
                >
                  <MoreHorizontalIcon className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-44" align="end">
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={onDelete}>
                    <TrashIcon className="size-4" />
                    Delete activity
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Content block — card area with left border */}
      {(activity.description ||
        activity.type === 'meeting' ||
        activity.type === 'comment') && (
        <div className="ml-8 mt-1.5">
          <div
            className={`rounded-md border-l-2 bg-muted/30 px-3 py-2 ${config.colorClass.replace('text-', 'border-')}`}
          >
            {/* Meeting: title + metadata */}
            {activity.type === 'meeting' && (
              <>
                <p className="text-sm font-medium">{activity.subject}</p>
                <div className="mt-0.5">
                  <ActivityMetadata activity={activity} />
                </div>
              </>
            )}

            {/* Comment: quoted body */}
            {isComment && activity.description && (
              <p className="text-sm text-foreground/80">
                {activity.description}
              </p>
            )}

            {/* Others: description only */}
            {!isComment &&
              activity.type !== 'meeting' &&
              activity.description && (
                <>
                  <p className="text-sm text-muted-foreground">
                    {showFullDescription || !hasLongDescription
                      ? activity.description
                      : `${activity.description.slice(0, 140)}\u2026`}
                  </p>
                  {hasLongDescription && (
                    <button
                      type="button"
                      className="mt-0.5 text-xs text-primary hover:underline"
                      onClick={() => setShowFullDescription((v) => !v)}
                    >
                      {showFullDescription ? 'Show less' : 'Show more'}
                    </button>
                  )}
                </>
              )}
          </div>
        </div>
      )}

      {/* Non-meeting metadata pills (shown below the user line) */}
      {activity.type !== 'meeting' && activity.type !== 'comment' && (
        <div className="ml-8 mt-1">
          <ActivityMetadata activity={activity} />
        </div>
      )}
    </div>
  )
}
