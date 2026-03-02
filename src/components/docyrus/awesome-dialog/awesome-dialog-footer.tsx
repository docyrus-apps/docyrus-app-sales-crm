'use client';

import { type ReactNode } from 'react';

import { cn } from '@/lib/utils';

export function AwesomeDialogFooter({
  children,
  className
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      data-slot="awesome-dialog-footer"
      className={cn(
        'flex shrink-0 items-center justify-end gap-2 border-t bg-muted/50 px-4 py-3',
        className
      )}>
      {children}
    </div>
  );
}