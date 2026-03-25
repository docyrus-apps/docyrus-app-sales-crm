'use client';

import { User } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

export function UserValue({ value, enumOptions, className }: DocyrusValueProps) {
  if (value == null || value === '') {
    return <span className="text-muted-foreground">—</span>;
  }

  if (isExpandedUser(value)) {
    const name = value.display_name ?? value.name ?? value.email ?? value.id;
    const avatarUrl = value.avatar_url ?? value.profile_image_url;

    return (
      <span className={cn('inline-flex items-center gap-1.5', className)}>
        <Avatar size="sm">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
          <AvatarFallback>{getInitials(name)}</AvatarFallback>
        </Avatar>
        <span className="truncate text-sm">{name}</span>
      </span>
    );
  }

  const enumMatch = typeof value === 'string' ? enumOptions?.find(o => o.id === value) : undefined;

  if (enumMatch) {
    return (
      <span className={cn('inline-flex items-center gap-1.5', className)}>
        <Avatar size="sm">
          <AvatarFallback>{getInitials(enumMatch.name)}</AvatarFallback>
        </Avatar>
        <span className="truncate text-sm">{enumMatch.name}</span>
      </span>
    );
  }

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <Avatar size="sm">
        <AvatarFallback>
          <User className="size-3" />
        </AvatarFallback>
      </Avatar>
      <span className="truncate text-sm text-muted-foreground">
        {String(value).slice(0, 8)}
      </span>
    </span>
  );
}