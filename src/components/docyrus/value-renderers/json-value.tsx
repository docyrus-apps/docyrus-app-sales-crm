'use client';

import { cn } from '@/lib/utils';

import { type DocyrusValueProps } from './types';

export function JsonValue({ value, className }: DocyrusValueProps) {
  if (value == null || value === '') {
    return <span className="text-muted-foreground">—</span>;
  }

  let display: string;

  if (typeof value === 'string') {
    display = value;
  } else {
    try {
      display = JSON.stringify(value);
    } catch {
      display = String(value);
    }
  }

  const maxLength = 100;
  const truncated
    = display.length > maxLength ? `${display.slice(0, maxLength)}...` : display;

  return (
    <span
      className={cn(
        'truncate font-mono text-xs text-muted-foreground',
        className
      )}
      title={display}>
      {truncated}
    </span>
  );
}