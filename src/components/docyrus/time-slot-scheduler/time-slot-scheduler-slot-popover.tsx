'use client';

import { type ReactNode } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';

import { tUi } from '@/lib/ui-i18n';

import { formatSlotTime } from './lib/time-slot-utils';
import { useTimeSlotSchedulerContext } from './time-slot-scheduler-context';
import { type TimeSlot } from './types';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

interface SlotPopoverProps {
  slot: TimeSlot;
  children: ReactNode;
}

function TimeSlotSchedulerSlotPopover({ slot, children }: SlotPopoverProps) {
  const { locale } = useTimeSlotSchedulerContext();
  const timeRange = `${formatSlotTime(slot.startTime)} – ${formatSlotTime(slot.endTime)}`;

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-72 p-4" align="start">
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium">{timeRange}</p>
            <p className="text-xs text-muted-foreground">
              {slot.reservationCount} {tUi(locale, 'tssOf')} {slot.capacity} {tUi(locale, 'tssBooked')}
            </p>
          </div>

          <div className="space-y-2">
            {slot.reservations.map(reservation => (
              <div key={reservation.id} className="flex items-center gap-2">
                <Avatar className="size-7">
                  {reservation.avatarUrl && (
                    <AvatarImage src={reservation.avatarUrl} alt={reservation.name} />
                  )}
                  <AvatarFallback className="text-[10px]">
                    {getInitials(reservation.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{reservation.name}</p>
                  {reservation.email && (
                    <p className="truncate text-xs text-muted-foreground">
                      {reservation.email}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { TimeSlotSchedulerSlotPopover };