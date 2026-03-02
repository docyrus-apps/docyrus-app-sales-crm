'use client';

import { useRef, useState } from 'react';

import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

import { type DateRange } from 'react-day-picker';

import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import { parseDateRange } from './lib/utils';
import { type DocyrusFormFieldProps } from './types';

export function DateRangeFormField({
  field: fieldConfig,
  form,
  disabled,
  className
}: DocyrusFormFieldProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | undefined>(undefined);
  const snapshotRef = useRef<string | null>(null);

  return (
    <form.Field
      name={fieldConfig.slug}
      children={(field: any) => {
        const isInvalid
          = field.state.meta.isTouched && !field.state.meta.isValid;
        const parsed = parseDateRange(field.state.value);
        const dateRange: DateRange | undefined = parsed
          ? { from: parsed.start, to: parsed.end }
          : undefined;
        const displayValue = open ? draft : dateRange;

        function handleOpenChange(nextOpen: boolean) {
          if (nextOpen) {
            snapshotRef.current = field.state.value ?? null;
            setDraft(dateRange ? { ...dateRange } : undefined);
          }

          setOpen(nextOpen);
        }

        function handleOk() {
          if (draft?.from && draft.to) {
            field.handleChange(
              `[${draft.from.toISOString()}, ${draft.to.toISOString()}]`
            );
          } else if (draft?.from) {
            field.handleChange(
              `[${draft.from.toISOString()}, ${draft.from.toISOString()}]`
            );
          } else {
            field.handleChange(null);
          }

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
                  disabled={disabled || fieldConfig.readOnly === true}
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !dateRange && 'text-muted-foreground'
                  )}>
                  <CalendarIcon className="mr-2 size-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, 'LLL dd, y')} -{' '}
                        {format(dateRange.to, 'LLL dd, y')}
                      </>
                    ) : (
                      format(dateRange.from, 'LLL dd, y')
                    )
                  ) : (
                    'Pick a date range'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={displayValue}
                  onSelect={setDraft}
                  numberOfMonths={2} />
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