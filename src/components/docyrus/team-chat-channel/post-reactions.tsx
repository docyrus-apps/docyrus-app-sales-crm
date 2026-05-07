'use client'

import { PlusIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

import { useTeamChatContext } from './team-chat-context'
import { PRESET_EMOJIS, type PostReaction } from './types'

interface PostReactionsProps {
  postId: string
  reactions: Array<PostReaction>
}

export function PostReactions({ postId, reactions }: PostReactionsProps) {
  const { currentUser, onToggleReaction } = useTeamChatContext()
  const currentUserId = currentUser?.id

  if (reactions.length === 0 && !onToggleReaction) return null

  return (
    <div className="flex flex-wrap items-center gap-1">
      {reactions.map((reaction) => {
        const isActive = currentUserId
          ? reaction.user_ids.includes(currentUserId)
          : false

        return (
          <button
            key={reaction.emoji}
            type="button"
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors hover:bg-accent',
              isActive && 'border-primary/50 bg-primary/10',
            )}
            onClick={() => onToggleReaction?.(postId, reaction.emoji)}
          >
            <span>{reaction.emoji}</span>
            <span className="font-medium tabular-nums">{reaction.count}</span>
          </button>
        )
      })}

      {onToggleReaction && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="size-6 rounded-full">
              <PlusIcon className="size-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="grid grid-cols-4 gap-1">
              {PRESET_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="flex size-8 items-center justify-center rounded-md text-lg transition-colors hover:bg-accent"
                  onClick={() => onToggleReaction(postId, emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}
