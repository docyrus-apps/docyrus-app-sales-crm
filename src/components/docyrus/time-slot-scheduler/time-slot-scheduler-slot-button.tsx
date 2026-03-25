'use client';

import { type ButtonHTMLAttributes, forwardRef } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

import { tUi } from '@/lib/ui-i18n';

import { formatSlotTime } from './lib/time-slot-utils';
import { useTimeSlotSchedulerContext } from './time-slot-scheduler-context';
import { TimeSlotSchedulerSlotPopover } from './time-slot-scheduler-slot-popover';
import { type DisabledReason, type TimeSlot } from './types';

const slotButtonVariants = cva(
  'relative flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  {
    variants: {
      status: {
        available: 'border-border bg-background hover:border-primary hover:bg-primary/5 cursor-pointer',
        partial: 'border-amber-300 bg-amber-50 hover:border-amber-400 hover:bg-amber-100/50 dark:border-amber-600 dark:bg-amber-950/30 dark:hover:bg-amber-950/50 cursor-pointer',
        full: 'border-red-200 bg-red-50/50 opacity-60 dark:border-red-800 dark:bg-red-950/20 cursor-not-allowed',
        unavailable: 'border-muted bg-muted/50 opacity-50 cursor-not-allowed',
        past: 'border-muted bg-muted/30 opacity-40 cursor-not-allowed',
        disabled: 'border-muted bg-muted/30 opacity-40 cursor-not-allowed'
      },
      selected: {
        true: 'ring-2 ring-primary border-primary',
        false: ''
      }
    },
    defaultVariants: {
      status: 'available',
      selected: false
    }
  }
);

const capacityDotVariants = cva('size-2 rounded-full', {
  variants: {
    status: {
      available: 'bg-green-500',
      partial: 'bg-amber-500',
      full: 'bg-red-500',
      unavailable: 'bg-muted-foreground/40',
      past: 'bg-muted-foreground/40',
      disabled: 'bg-muted-foreground/40'
    }
  },
  defaultVariants: {
    status: 'available'
  }
});

interface SlotButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'slot'>,
  VariantProps<typeof slotButtonVariants> {
  slot: TimeSlot;
}

const DISABLED_REASON_KEYS: Record<DisabledReason, string> = {
  past: 'tssPastSlot',
  full: 'tssFull',
  unavailable: 'tssUnavailable',
  'before-min-date': 'tssBeforeMinDate',
  'after-max-date': 'tssAfterMaxDate'
};

const TimeSlotSchedulerSlotButton = forwardRef<HTMLButtonElement, SlotButtonProps>(
  ({ slot, className, ...props }, ref) => {
    const {
      selectedSlot, onSelectSlot, showReservationDetail, slotCapacity, locale
    }
      = useTimeSlotSchedulerContext();

    const isSelected
      = selectedSlot?.startISO === slot.startISO && selectedSlot?.endISO === slot.endISO;
    const isDisabled
      = slot.status === 'full'
        || slot.status === 'unavailable'
        || slot.status === 'past'
        || slot.status === 'disabled';

    const handleClick = () => {
      if (isDisabled) return;
      onSelectSlot({
        day: slot.day,
        startTime: slot.startTime,
        endTime: slot.endTime,
        startISO: slot.startISO,
        endISO: slot.endISO,
        capacity: slot.capacity,
        reservationCount: slot.reservationCount,
        remainingCapacity: slot.remainingCapacity,
        reservations: slot.reservations
      });
    };

    const timeLabel = `${formatSlotTime(slot.startTime)} – ${formatSlotTime(slot.endTime)}`;

    const button = (
      <button
        ref={ref}
        type="button"
        disabled={isDisabled}
        onClick={handleClick}
        className={cn(
          slotButtonVariants({ status: slot.status, selected: isSelected, className })
        )}
        {...props}>
        <span className="truncate">{timeLabel}</span>
        {slotCapacity > 1 && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={capacityDotVariants({ status: slot.status })} />
            <span>
              {slot.reservationCount}/{slot.capacity}
            </span>
          </span>
        )}
      </button>
    );

    if (isDisabled && slot.disabledReason) {
      const reasonKey = DISABLED_REASON_KEYS[slot.disabledReason];

      return (
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>{button}</TooltipTrigger>
            <TooltipContent>
              <p>{tUi(locale, reasonKey as never)}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    if (showReservationDetail && slot.reservations.length > 0) {
      return (
        <TimeSlotSchedulerSlotPopover slot={slot}>{button}</TimeSlotSchedulerSlotPopover>
      );
    }

    return button;
  }
);

TimeSlotSchedulerSlotButton.displayName = 'TimeSlotSchedulerSlotButton';

export { TimeSlotSchedulerSlotButton, slotButtonVariants, capacityDotVariants };