'use client';

import { cn } from '@/lib/utils';

import { type DocyrusValueProps } from './types';

export function CodeValue({ value, className }: DocyrusValueProps) {
  if (value == null || value === '') {
    return <span className="text-muted-foreground">—</span>;
  }

  const code = String(value);
  const maxLength = 120;
  const truncated
    = code.length > maxLength ? `${code.slice(0, maxLength)}...` : code;

  return (
    <span
      className={cn(
        'truncate rounded bg-muted px-1.5 py-0.5 font-mono text-xs',
        className
      )}
      title={code}>
      {truncated}
    </span>
  );
}