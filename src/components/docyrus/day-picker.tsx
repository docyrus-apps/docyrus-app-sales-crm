'use client';

import { type ComponentProps } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  DayPicker as ReactDayPicker,
  getDefaultClassNames
} from 'react-day-picker';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const dayPickerVariants = cva('bg-background p-3', {
  variants: {
    variant: {
      default: '',
      outline: 'border border-border rounded-xl',
      ghost: 'bg-transparent'
    },
    size: {
      default: '[--cell-size:36px] text-sm',
      sm: '[--cell-size:28px] p-2 text-xs',
      lg: '[--cell-size:44px] p-4 text-base'
    }
  },
  defaultVariants: {
    variant: 'default',
    size: 'default'
  }
});

interface DayPickerDocProps {
  showOutsideDays?: boolean;
  fixedWeeks?: boolean;
  numberOfMonths?: number;
  captionLayout?: 'label' | 'dropdown' | 'dropdown-months' | 'dropdown-years';
}

type DayPickerProps = ComponentProps<typeof ReactDayPicker> & VariantProps<typeof dayPickerVariants> & DayPickerDocProps;

function DayPicker({
  className,
  classNames,
  variant,
  size,
  showOutsideDays = true,
  ...props
}: DayPickerProps) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <ReactDayPicker
      showOutsideDays={showOutsideDays}
      className={cn(dayPickerVariants({ variant, size }), className)}
      classNames={{
        root: cn('w-fit', defaultClassNames.root),
        months: cn(
          'relative flex flex-col gap-4 md:flex-row',
          defaultClassNames.months
        ),
        month: cn('flex flex-col gap-4', defaultClassNames.month),
        month_caption: cn(
          'relative flex h-7 items-center justify-center',
          defaultClassNames.month_caption
        ),
        caption_label: cn(
          'text-sm font-medium',
          defaultClassNames.caption_label
        ),
        nav: cn(
          'absolute inset-x-0 top-0 flex w-full justify-between z-10',
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: 'outline' }),
          'h-[var(--cell-size)] w-[var(--cell-size)] bg-transparent p-0 opacity-50 hover:opacity-100',
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: 'outline' }),
          'h-[var(--cell-size)] w-[var(--cell-size)] bg-transparent p-0 opacity-50 hover:opacity-100',
          defaultClassNames.button_next
        ),
        month_grid: cn('w-full border-collapse', defaultClassNames.month_grid),
        weekdays: cn('flex', defaultClassNames.weekdays),
        weekday: cn(
          'text-muted-foreground w-[var(--cell-size)] font-normal text-[0.8rem]',
          defaultClassNames.weekday
        ),
        week: cn('flex w-full mt-2', defaultClassNames.week),
        day: cn(
          'h-[var(--cell-size)] w-[var(--cell-size)] text-center text-sm p-0 relative',
          '[&:has([aria-selected].day-range-end)]:rounded-r-md',
          '[&:has([aria-selected].day-outside)]:bg-accent/50',
          '[&:has([aria-selected])]:bg-accent',
          'first:[&:has([aria-selected])]:rounded-l-md',
          'last:[&:has([aria-selected])]:rounded-r-md',
          'focus-within:relative focus-within:z-20',
          defaultClassNames.day
        ),
        day_button: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-[var(--cell-size)] w-[var(--cell-size)] p-0 font-normal aria-selected:opacity-100 rounded-md',
          defaultClassNames.day_button
        ),
        range_end: 'day-range-end',
        selected:
          'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-md',
        today: 'bg-accent text-accent-foreground font-bold rounded-md',
        outside:
          'day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30',
        disabled: 'text-muted-foreground opacity-50',
        range_middle:
          'aria-selected:bg-accent aria-selected:text-accent-foreground',
        hidden: 'invisible',
        chevron: cn('fill-muted-foreground', defaultClassNames.chevron),
        ...classNames
      }}
      components={{
        Chevron: ({ orientation }) => {
          if (orientation === 'left') {
            return <ChevronLeft className="size-4" />;
          }

          return <ChevronRight className="size-4" />;
        }
      }}
      {...props} />
  );
}

DayPicker.displayName = 'DayPicker';

export { DayPicker, dayPickerVariants };
export type { DayPickerProps };