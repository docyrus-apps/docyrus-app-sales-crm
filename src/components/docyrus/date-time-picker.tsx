'use client';

import { forwardRef } from 'react';

import { type ComponentProps } from 'react';

import {
  type ControllerRenderProps, type FieldValues, type Path, type UseFormReturn
} from 'react-hook-form';

import { cva } from 'class-variance-authority';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const dateTimePickerVariants = cva('flex flex-col', {
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

interface DateTimePickerProps<T extends FieldValues = FieldValues> extends Omit<ComponentProps<'div'>, 'children'> {
  form: UseFormReturn<T>;
  field: ControllerRenderProps<T, Path<T>>;
  label?: string;
  use24HourFormat?: boolean;
  size?: 'sm' | 'default' | 'lg';
}

const DateTimePicker = forwardRef<HTMLDivElement, DateTimePickerProps>(
  ({
    form, field, label, use24HourFormat = true, size, className, ...props
  }, ref) => {
    function handleDateSelect(date: Date | undefined) {
      if (date) {
        form.setValue(field.name, date as never);
      }
    }

    function handleTimeChange(type: 'hour' | 'minute' | 'ampm', value: string) {
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
    }

    const fieldLabel = label ?? (field.name === 'startDate' ? 'Start Date' : 'End Date');

    return (
      <FormItem ref={ref} className={cn(dateTimePickerVariants({ size }), className)} {...props}>
        <FormLabel>{fieldLabel}</FormLabel>
        <Popover modal>
          <PopoverTrigger asChild>
            <FormControl>
              <Button
                variant="outline"
                className={cn(
                  'w-full pl-3 text-left font-normal',
                  !field.value && 'text-muted-foreground'
                )}>
                {field.value ? (
                  format(
                    field.value as Date,
                    use24HourFormat ? 'MM/dd/yyyy HH:mm' : 'MM/dd/yyyy hh:mm aa'
                  )
                ) : (
                  <span>MM/DD/YYYY hh:mm aa</span>
                )}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </FormControl>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <div className="sm:flex">
              <Calendar
                mode="single"
                selected={field.value as Date}
                onSelect={handleDateSelect}
                initialFocus />
              <div className="flex flex-col divide-y sm:h-[300px] sm:flex-row sm:divide-x sm:divide-y-0">
                <ScrollArea className="w-64 sm:w-auto">
                  <div className="flex p-2 sm:flex-col">
                    {Array.from(
                      { length: use24HourFormat ? 24 : 12 },
                      (_, i) => i
                    ).map(hour => (
                      <Button
                        key={hour}
                        size="icon"
                        variant={
                          field.value
                          && (field.value as Date).getHours() % (use24HourFormat ? 24 : 12)
                          === hour % (use24HourFormat ? 24 : 12)
                            ? 'default'
                            : 'ghost'
                        }
                        className="aspect-square shrink-0 sm:w-full"
                        onClick={() => handleTimeChange('hour', hour.toString())}>
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
                        variant={
                          field.value && (field.value as Date).getMinutes() === minute
                            ? 'default'
                            : 'ghost'
                        }
                        className="aspect-square shrink-0 sm:w-full"
                        onClick={() => handleTimeChange('minute', minute.toString())}>
                        {minute.toString().padStart(2, '0')}
                      </Button>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" className="sm:hidden" />
                </ScrollArea>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <FormMessage />
      </FormItem>
    );
  }
);

DateTimePicker.displayName = 'DateTimePicker';

export { DateTimePicker, dateTimePickerVariants };
export type { DateTimePickerProps };