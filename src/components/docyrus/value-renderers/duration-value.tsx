'use client';

import { Clock } from 'lucide-react';

import { cn } from '@/lib/utils';

import { type DocyrusValueProps } from './types';

import { formatDuration } from './utils';

export function DurationValue({ value, className }: DocyrusValueProps) {
  if (value == null || value === '') {
    return <span className="text-muted-foreground">—</span>;
  }

  const seconds = Number(value);

  if (Number.isNaN(seconds)) {
    return <span className="text-muted-foreground">—</span>;
  }

  const formatted = formatDuration(seconds);

  if (!formatted) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 tabular-nums text-sm',
        className
      )}>
      <Clock className="size-3.5 shrink-0 text-muted-foreground" />
      <span>{formatted}</span>
    </span>
  );
}