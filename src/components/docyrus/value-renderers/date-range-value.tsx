'use client';

import { Calendar } from 'lucide-react';

import { cn } from '@/lib/utils';

import { type DocyrusValueProps } from './types';

import { formatDateRange, parseDateRange } from './utils';

export function DateRangeValue({ value, className }: DocyrusValueProps) {
  if (value == null || value === '') {
    return <span className="text-muted-foreground">—</span>;
  }

  const range = parseDateRange(String(value));

  if (!range) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <span className={cn('inline-flex items-center gap-1 text-sm', className)}>
      <Calendar className="size-3.5 shrink-0 text-muted-foreground" />
      <span>{formatDateRange(range.start, range.end)}</span>
    </span>
  );
}