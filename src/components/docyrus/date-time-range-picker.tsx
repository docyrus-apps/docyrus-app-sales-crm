'use client';

import { forwardRef, type ComponentProps } from 'react';

import {
  type ControllerRenderProps, type FieldValues, type Path, type UseFormReturn
} from 'react-hook-form';

import { cva } from 'class-variance-authority';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const dateTimeRangePickerVariants = cva('flex flex-col', {
  variants: {
    size: {
      sm: 'gap-1 text-sm',
      default: 'gap-1.5',
      lg: 'gap-2 text-lg'
    }
  },
  defaultVariants: {
    size: 'default'
  }
});

interface DateTimeRangePickerProps<T extends FieldValues = FieldValues> extends Omit<ComponentProps<'div'>, 'children'> {
  form: UseFormReturn<T>;
  startField: ControllerRenderProps<T, Path<T>>;
  endField: ControllerRenderProps<T, Path<T>>;
  label?: string;
  use24HourFormat?: boolean;
  size?: 'sm' | 'default' | 'lg';
  defaultDuration?: number;
}

const DateTimeRangePicker = forwardRef<HTMLDivElement, DateTimeRangePickerProps>(
  ({
    form, startField, endField, label = 'Date & Time Range', use24HourFormat = true, size, defaultDuration, className, ...props
  }, ref) => {
    function applyDuration(start: Date): Date {
      return new Date(start.getTime() + (defaultDuration ?? 0) * 60_000);
    }

    function handleDateSelect(date: Date | undefined) {
      if (!date) return;

      const currentStart = form.getValues(startField.name) as Date | undefined;
      const currentEnd = form.getValues(endField.name) as Date | undefined;

      const newStart = currentStart ? new Date(currentStart) : new Date(date);

      newStart.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());

      const newEnd = defaultDuration ? applyDuration(newStart) : currentEnd ? new Date(currentEnd) : new Date(date);

      if (!defaultDuration && newEnd) {
        newEnd.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
      }

      form.setValue(startField.name, newStart as never);
      form.setValue(endField.name, newEnd as never);
    }

    function handleTimeChange(
      target: 'start' | 'end',
      type: 'hour' | 'minute' | 'ampm',
      value: string
    ) {
      const field = target === 'start' ? startField : endField;
      const currentDate = form.getValues(field.name) || new Date();
      const newDate = new Date(currentDate as Date);

      if (type === 'hour') {
        newDate.setHours(parseInt(value, 10));
      } else if (type === 'minute') {
        newDate.setMinutes(parseInt(value, 10));
      } else if (type === 'ampm') {
        const hours = newDate.getHours();

        if (value === 'AM' && hours >= 12) {
          newDate.setHours(hours - 12);
        } else if (value === 'PM' && hours < 12) {
          newDate.setHours(hours + 12);
        }
      }

      form.setValue(field.name, newDate as never);

      if (target === 'start' && defaultDuration) {
        form.setValue(endField.name, applyDuration(newDate) as never);
      }
    }

    const startValue = startField.value as Date | undefined;
    const endValue = endField.value as Date | undefined;
    const hasValue = startValue || endValue;
    const calendarDate = startValue ?? endValue;

    const timeFormat = use24HourFormat ? 'HH:mm' : 'hh:mm aa';
    const hourCount = use24HourFormat ? 24 : 12;

    const startHour = startValue ? startValue.getHours() : -1;
    const startMinute = startValue ? startValue.getMinutes() : -1;
    const endSelectedHour = endValue ? endValue.getHours() : -1;

    return (
      <div ref={ref} className={cn(dateTimeRangePickerVariants({ size }), className)} {...props}>
        {label && <Label>{label}</Label>}
        <Popover modal>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full pl-3 text-left font-normal',
                !hasValue && 'text-muted-foreground'
              )}>
              {hasValue ? (
                <>
                  {calendarDate && format(calendarDate, 'MM/dd/yyyy')}
                  {' '}
                  {startValue ? format(startValue, timeFormat) : '--:--'}
                  {' \u2013 '}
                  {endValue ? format(endValue, timeFormat) : '--:--'}
                </>
              ) : (
                <span>Pick a date & time range</span>
              )}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <div className="sm:flex">
              <Calendar
                mode="single"
                selected={calendarDate}
                onSelect={handleDateSelect}
                initialFocus />
              <div className="flex flex-col divide-y sm:flex-row sm:divide-x sm:divide-y-0">
                {/* Start time */}
                <div className="flex flex-col">
                  <div className="border-b px-3 py-1.5 text-center text-xs font-medium text-muted-foreground">
                    Start
                  </div>
                  <div className="flex sm:h-67 sm:flex-row">
                    <ScrollArea className="w-64 sm:w-auto">
                      <div className="flex p-2 sm:flex-col">
                        {Array.from({ length: hourCount }, (_, i) => i).map(hour => (
                          <Button
                            key={hour}
                            size="icon"
                            variant={
                              startValue
                              && startValue.getHours() % (use24HourFormat ? 24 : 12)
                              === hour % (use24HourFormat ? 24 : 12) ? 'default' : 'ghost'
                            }
                            className="aspect-square shrink-0 sm:w-full"
                            onClick={() => handleTimeChange('start', 'hour', hour.toString())}>
                            {hour.toString().padStart(2, '0')}
                          </Button>
                        ))}
                      </div>
                      <ScrollBar orientation="horizontal" className="sm:hidden" />
                    </ScrollArea>
                    <ScrollArea className="w-64 sm:w-auto">
                      <div className="flex p-2 sm:flex-col">
                        {Array.from({ length: 12 }, (_, i) => i * 5).map(minute => (
                          <Button
                            key={minute}
                            size="icon"
                            variant={startValue && startValue.getMinutes() === minute ? 'default' : 'ghost'}
                            className="aspect-square shrink-0 sm:w-full"
                            onClick={() => handleTimeChange('start', 'minute', minute.toString())}>
                            {minute.toString().padStart(2, '0')}
                          </Button>
                        ))}
                      </div>
                      <ScrollBar orientation="horizontal" className="sm:hidden" />
                    </ScrollArea>
                  </div>
                </div>
                {/* End time */}
                <div className="flex flex-col">
                  <div className="border-b px-3 py-1.5 text-center text-xs font-medium text-muted-foreground">
                    End
                  </div>
                  <div className="flex sm:h-67 sm:flex-row">
                    <ScrollArea className="w-64 sm:w-auto">
                      <div className="flex p-2 sm:flex-col">
                        {Array.from({ length: hourCount }, (_, i) => i)
                          .filter(hour => startHour < 0 || hour >= startHour)
                          .map(hour => (
                            <Button
                              key={hour}
                              size="icon"
                              variant={
                                endValue
                                && endValue.getHours() % (use24HourFormat ? 24 : 12)
                                === hour % (use24HourFormat ? 24 : 12) ? 'default' : 'ghost'
                              }
                              className="aspect-square shrink-0 sm:w-full"
                              onClick={() => handleTimeChange('end', 'hour', hour.toString())}>
                              {hour.toString().padStart(2, '0')}
                            </Button>
                          ))}
                      </div>
                      <ScrollBar orientation="horizontal" className="sm:hidden" />
                    </ScrollArea>
                    <ScrollArea className="w-64 sm:w-auto">
                      <div className="flex p-2 sm:flex-col">
                        {Array.from({ length: 12 }, (_, i) => i * 5)
                          .filter(minute => startHour < 0 || endSelectedHour !== startHour || minute >= startMinute)
                          .map(minute => (
                            <Button
                              key={minute}
                              size="icon"
                              variant={endValue && endValue.getMinutes() === minute ? 'default' : 'ghost'}
                              className="aspect-square shrink-0 sm:w-full"
                              onClick={() => handleTimeChange('end', 'minute', minute.toString())}>
                              {minute.toString().padStart(2, '0')}
                            </Button>
                          ))}
                      </div>
                      <ScrollBar orientation="horizontal" className="sm:hidden" />
                    </ScrollArea>
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  }
);

DateTimeRangePicker.displayName = 'DateTimeRangePicker';

export { DateTimeRangePicker, dateTimeRangePickerVariants };
export type { DateTimeRangePickerProps };