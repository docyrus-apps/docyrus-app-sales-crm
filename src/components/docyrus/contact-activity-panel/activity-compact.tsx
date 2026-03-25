'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';

import { type ChatUser, type ContactActivity } from './types';
import { formatRelativeTime, getUserDisplayName, getUserInitials } from './lib/activity-utils';

interface ActivityCompactProps {
  activity: ContactActivity;
  user: ChatUser | undefined;
}

export function ActivityCompact({ activity, user }: ActivityCompactProps) {
  const displayName = getUserDisplayName(user);
  const initials = getUserInitials(user);

  return (
    <div className="flex items-center gap-2 py-0.5">
      <Avatar className="size-5 shrink-0">
        <AvatarFallback className="text-[8px]">{initials}</AvatarFallback>
      </Avatar>
      <p className="min-w-0 text-sm leading-snug">
        <span className="font-medium">{displayName}</span>
        {' '}
        <span className="text-muted-foreground">{activity.subject}</span>
      </p>
      <span className="shrink-0 text-xs text-muted-foreground">
        {'\u00b7'} {formatRelativeTime(activity.created_on)}
      </span>
    </div>
  );
}