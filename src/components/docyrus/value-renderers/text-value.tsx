'use client';

import { cn } from '@/lib/utils';

import { type DocyrusValueProps } from './types';

export function TextValue({ field, value, className }: DocyrusValueProps) {
  if (value == null || value === '') {
    return <span className="text-muted-foreground">—</span>;
  }

  const isMultiline
    = field.type === 'field-textarea' || field.type === 'field-display';

  return (
    <span
      className={cn(
        isMultiline ? 'whitespace-pre-wrap' : 'truncate',
        className
      )}>
      {String(value)}
    </span>
  );
}