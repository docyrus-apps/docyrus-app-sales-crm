'use client';

import { useState } from 'react';

import {
  MoreHorizontalIcon,
  PencilIcon,
  TrashIcon
} from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

import { type ChatPost, type ChatUser } from './types';
import { PostContent } from './post-content';
import { PostAttachments } from './post-attachments';
import { PostLinkPreview } from './post-link-preview';
import { PostEntityLink } from './post-entity-link';
import { PostReactions } from './post-reactions';
import { PostActions } from './post-actions';
import { formatRelativeTime, getUserDisplayName, getUserInitials } from './lib/post-utils';

interface PostCardProps {
  post: ChatPost;
  user: ChatUser | undefined;
  isOwn: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onReply: () => void;
  isReply?: boolean;
}

export function PostCard({
  post,
  user,
  isOwn,
  onEdit,
  onDelete,
  onReply,
  isReply = false
}: PostCardProps) {
  const [hovering, setHovering] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isEdited = post.last_modified_on !== post.created_on;
  const initials = getUserInitials(user);
  const displayName = getUserDisplayName(user);
  const attachments = post.attachments ?? [];

  return (
    <div
      className="group relative rounded-lg border bg-card p-3 transition-colors hover:bg-accent/30"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Avatar className={isReply ? 'size-6' : 'size-8'}>
          <AvatarFallback className={isReply ? 'text-[9px]' : 'text-[10px]'}>
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="truncate text-sm font-semibold">{displayName}</span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatRelativeTime(post.created_on)}
          </span>
          {isEdited && (
            <span className="shrink-0 text-xs text-muted-foreground">(edited)</span>
          )}
        </div>

        {/* Actions dropdown */}
        {isOwn && (hovering || dropdownOpen) && (
          <DropdownMenu
            open={dropdownOpen}
            onOpenChange={setDropdownOpen}
            modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="size-7 p-0 text-muted-foreground">
                <MoreHorizontalIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48" align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={onEdit}>
                  <PencilIcon className="size-4" />
                  Edit post
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete}>
                  <TrashIcon className="size-4" />
                  Delete post
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Content */}
      <div className="mt-2 flex flex-col gap-2">
        <PostContent content={post.content} postId={post.id} />

        {attachments.length > 0 && (
          <PostAttachments attachments={attachments} />
        )}

        {post.link_previews.length > 0 && (
          <PostLinkPreview previews={post.link_previews} />
        )}

        {post.linked_entities.length > 0 && (
          <PostEntityLink entities={post.linked_entities} />
        )}
      </div>

      {/* Footer */}
      <div className="mt-2 flex items-center justify-between">
        <PostReactions postId={post.id} reactions={post.reactions} />

        {!isReply && (
          <div className="opacity-0 transition-opacity group-hover:opacity-100">
            <PostActions postId={post.id} onReply={onReply} />
          </div>
        )}
      </div>
    </div>
  );
}