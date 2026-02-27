'use client';

import { cn } from '@/lib/utils';

import { type DocyrusValueProps } from './types';

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium'
});

export function DateValue({ value, className }: DocyrusValueProps) {
  if (value == null || value === '') {
    return <span className="text-muted-foreground">—</span>;
  }

  const date = new Date(value as string | number);

  if (Number.isNaN(date.getTime())) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <span className={cn('truncate text-sm', className)}>
      {dateFormatter.format(date)}
    </span>
  );
}