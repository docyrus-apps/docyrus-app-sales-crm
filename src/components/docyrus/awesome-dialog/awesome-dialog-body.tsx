'use client';

// @ts-nocheck
/* eslint-disable */
import { type ReactNode } from 'react';

import { cn } from '@/lib/utils';

export function AwesomeDialogBody({
  children,
  className
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      data-slot="awesome-dialog-body"
      className={cn('flex-1 overflow-y-auto px-5 py-4', className)}>
      {children}
    </div>
  );
}