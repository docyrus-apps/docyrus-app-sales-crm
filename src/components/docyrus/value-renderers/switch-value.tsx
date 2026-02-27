'use client';

import { cn } from '@/lib/utils';

import { type DocyrusValueProps } from './types';

export function SwitchValue({ value, className }: DocyrusValueProps) {
  if (value == null) {
    return <span className="text-muted-foreground">—</span>;
  }

  const isOn = value === true || value === 'true' || value === 1;

  return (
    <span className={cn('inline-flex items-center gap-1.5 text-sm', className)}>
      <span
        className={cn(
          'size-2 shrink-0 rounded-full',
          isOn ? 'bg-green-500' : 'bg-muted-foreground/40'
        )} />
      <span>{isOn ? 'On' : 'Off'}</span>
    </span>
  );
}