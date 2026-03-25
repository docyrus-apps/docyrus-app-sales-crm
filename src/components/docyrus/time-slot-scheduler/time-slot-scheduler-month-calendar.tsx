'use client';

import { cn } from '@/lib/utils';

import { useTimeSlotSchedulerContext } from './time-slot-scheduler-context';

const WEEKDAY_HEADERS = [
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
  'Sun'
];

function TimeSlotSchedulerMonthCalendar() {
  const { monthDayMeta, selectedDay, onSelectDay } = useTimeSlotSchedulerContext();

  return (
    <div className="w-full md:w-64 lg:w-72">
      <div className="grid grid-cols-7 gap-0">
        {WEEKDAY_HEADERS.map(header => (
          <div
            key={header}
            className="flex items-center justify-center py-2 text-[10px] font-medium text-muted-foreground">
            {header}
          </div>
        ))}

        {monthDayMeta.map((day, i) => {
          const isSelected
            = selectedDay && day.date.toDateString() === selectedDay.toDateString();

          return (
            <button
              key={i}
              type="button"
              disabled={!day.isIncluded}
              onClick={() => {
                if (day.isIncluded) onSelectDay(day.date);
              }}
              className={cn(
                'relative flex flex-col items-center justify-center gap-0.5 rounded-md py-1.5 text-sm transition-colors',
                !day.isCurrentMonth && 'text-muted-foreground/40',
                !day.isIncluded && 'cursor-default opacity-50',
                day.isIncluded && 'cursor-pointer hover:bg-muted',
                day.isToday && 'ring-1 ring-primary',
                isSelected && 'bg-primary text-primary-foreground hover:bg-primary/90'
              )}>
              <span>{day.dayLabel}</span>
              {day.isIncluded && (
                <span
                  className={cn(
                    'size-1 rounded-full',
                    day.hasAvailability ? isSelected ? 'bg-primary-foreground' : 'bg-green-500' : isSelected ? 'bg-primary-foreground/40' : 'bg-red-400'
                  )} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { TimeSlotSchedulerMonthCalendar };