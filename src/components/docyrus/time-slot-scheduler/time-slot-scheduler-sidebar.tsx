'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

import { tUi } from '@/lib/ui-i18n';

import { useTimeSlotSchedulerContext } from './time-slot-scheduler-context';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function TimeSlotSchedulerSidebar() {
  const {
    user, event, timezones, timezone, onTimezoneChange, locale
  }
    = useTimeSlotSchedulerContext();

  const hasUser = !!user;
  const hasEvent = !!event;
  const hasTimezones = timezones.length > 0;

  if (!hasUser && !hasEvent && !hasTimezones) return null;

  return (
    <div className="flex w-full flex-col gap-4 border-b p-4 lg:w-80 lg:shrink-0 lg:border-b-0 lg:border-r">
      {hasUser && (
        <div className="flex items-center gap-3">
          <Avatar className="size-10">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.fullName} />}
            <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user.fullName}</p>
            {user.email && (
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            )}
          </div>
        </div>
      )}

      {hasUser && hasEvent && <Separator />}

      {hasEvent && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {event.icon && <span className="text-muted-foreground">{event.icon}</span>}
            <p className="text-sm font-semibold">{event.subject}</p>
          </div>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>
              {tUi(locale, 'tssDuration')}: {event.duration}
            </p>
            {event.location && (
              <p>
                {tUi(locale, 'tssLocation')}: {event.location}
              </p>
            )}
            {event.description && <p>{event.description}</p>}
          </div>
        </div>
      )}

      {(hasUser || hasEvent) && hasTimezones && <Separator />}

      {hasTimezones && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            {tUi(locale, 'tssTimezone')}
          </label>
          <Select value={timezone} onValueChange={onTimezoneChange}>
            <SelectTrigger className="w-full" size="sm">
              <SelectValue placeholder={tUi(locale, 'tssSelectTimezone')} />
            </SelectTrigger>
            <SelectContent>
              {timezones.map(tz => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label} ({tz.offset})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

export { TimeSlotSchedulerSidebar };