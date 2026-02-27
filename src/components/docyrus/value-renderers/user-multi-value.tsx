'use client';

import { User } from 'lucide-react';

import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarImage
} from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

import { type DocyrusValueProps } from './types';

interface ExpandedUser {
  id: string;
  name?: string;
  display_name?: string;
  email?: string;
  avatar_url?: string;
  profile_image_url?: string;
}

function isExpandedUser(val: unknown): val is ExpandedUser {
  return typeof val === 'object' && val !== null && 'id' in val;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function UserMultiValue({ value, className }: DocyrusValueProps) {
  if (value == null || (Array.isArray(value) && value.length === 0)) {
    return <span className="text-muted-foreground">—</span>;
  }

  const items: Array<unknown> = Array.isArray(value) ? value : [value];

  return (
    <AvatarGroup className={cn(className)}>
      {items.map((item, idx) => {
        if (isExpandedUser(item)) {
          const name = item.display_name ?? item.name ?? item.email ?? item.id;
          const avatarUrl = item.avatar_url ?? item.profile_image_url;

          return (
            <Avatar key={item.id} size="sm">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
              <AvatarFallback>{getInitials(name)}</AvatarFallback>
            </Avatar>
          );
        }

        return (
          <Avatar key={`user-${String(item)}-${idx}`} size="sm">
            <AvatarFallback>
              <User className="size-3" />
            </AvatarFallback>
          </Avatar>
        );
      })}
    </AvatarGroup>
  );
}