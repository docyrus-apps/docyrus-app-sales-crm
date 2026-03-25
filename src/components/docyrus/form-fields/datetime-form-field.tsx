'use client';

import { useRef, useState } from 'react';

import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

import { type DocyrusFormFieldProps } from './types';

export function DateTimeFormField({
  field: fieldConfig,
  form,
  disabled,
  className
}: DocyrusFormFieldProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Date | undefined>(undefined);
  const snapshotRef = useRef<string | null>(null);

  return (
    <form.Field
      name={fieldConfig.slug}
      children={(field: any) => {
        const isInvalid
          = field.state.meta.isTouched && !field.state.meta.isValid;
        const dateValue = field.state.value ? new Date(field.state.value) : undefined;
        const isDisabled = disabled || fieldConfig.readOnly === true;
        const displayValue = open ? draft : dateValue;

        function handleOpenChange(nextOpen: boolean) {
          if (nextOpen) {
            snapshotRef.current = field.state.value ?? null;
            setDraft(dateValue ? new Date(dateValue) : undefined);
          }

          setOpen(nextOpen);
        }

        function handleDateSelect(date: Date | undefined) {
          if (!date) return;
          const current = draft ?? new Date();

          date.setHours(current.getHours(), current.getMinutes());
          setDraft(new Date(date));
        }

        function handleTimeChange(type: 'hour' | 'minute', value: number) {
          const current = draft ? new Date(draft) : new Date();

          if (type === 'hour') {
            current.setHours(value);
          } else {
            current.setMinutes(value);
          }

          setDraft(new Date(current));
        }

        function handleOk() {
          field.handleChange(draft ? draft.toISOString() : null);
          setOpen(false);
        }

        function handleCancel() {
          field.handleChange(snapshotRef.current);
          setOpen(false);
        }

        return (
          <Field data-invalid={isInvalid} className={className}>
            <FieldLabel htmlFor={field.name}>{fieldConfig.name}</FieldLabel>
            <Popover open={open} onOpenChange={handleOpenChange}>
              <PopoverTrigger asChild>
                <Button
                  id={field.name}
                  variant="outline"
                  aria-invalid={isInvalid}
                  onBlur={field.handleBlur}
                  disabled={isDisabled}
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !dateValue && 'text-muted-foreground'
                  )}>
                  <CalendarIcon className="mr-2 size-4" />
                  {dateValue ? format(dateValue, 'MM/dd/yyyy HH:mm') : 'Pick a date & time'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <div className="sm:flex">
                  <Calendar
                    mode="single"
                    selected={displayValue}
                    onSelect={handleDateSelect}
                    initialFocus />
                  <div className="flex flex-col divide-y sm:h-75 sm:flex-row sm:divide-x sm:divide-y-0">
                    <ScrollArea className="w-64 sm:w-auto">
                      <div className="flex p-2 sm:flex-col">
                        {Array.from({ length: 24 }, (_, i) => i).map(hour => (
                          <Button
                            key={hour}
                            size="icon"
                            variant={displayValue && displayValue.getHours() === hour ? 'default' : 'ghost'}
                            className="aspect-square shrink-0 sm:w-full"
                            onClick={() => handleTimeChange('hour', hour)}>
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
                            variant={displayValue && displayValue.getMinutes() === minute ? 'default' : 'ghost'}
                            className="aspect-square shrink-0 sm:w-full"
                            onClick={() => handleTimeChange('minute', minute)}>
                            {minute.toString().padStart(2, '0')}
                          </Button>
                        ))}
                      </div>
                      <ScrollBar orientation="horizontal" className="sm:hidden" />
                    </ScrollArea>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 border-t p-2">
                  <Button variant="ghost" size="sm" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleOk}>
                    Ok
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        );
      }} />
  );
}