'use client';

import { Hash } from 'lucide-react';

import { cn } from '@/lib/utils';

import { type DocyrusValueProps } from './types';

export function IdentityValue({ value, className }: DocyrusValueProps) {
  if (value == null || value === '') {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 tabular-nums text-sm text-muted-foreground',
        className
      )}>
      <Hash className="size-3.5 shrink-0" />
      <span>{String(value)}</span>
    </span>
  );
}