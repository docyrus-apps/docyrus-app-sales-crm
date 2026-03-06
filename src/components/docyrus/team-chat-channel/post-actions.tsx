'use client'

import { MessageSquareIcon, SmilePlusIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import { useTeamChatContext } from './team-chat-context'
import { PRESET_EMOJIS } from './types'

interface PostActionsProps {
  postId: string
  onReply: () => void
}

export function PostActions({ postId, onReply }: PostActionsProps) {
  const { onToggleReaction } = useTeamChatContext()

  return (
    <div className="flex items-center gap-0.5">
      {onToggleReaction && (
        <Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground"
                >
                  <SmilePlusIcon className="size-4" />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>React</TooltipContent>
          </Tooltip>
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

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground"
            onClick={onReply}
          >
            <MessageSquareIcon className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Reply</TooltipContent>
      </Tooltip>
    </div>
  )
}
