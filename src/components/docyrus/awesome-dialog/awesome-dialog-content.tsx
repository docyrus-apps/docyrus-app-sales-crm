'use client';

// @ts-nocheck
/* eslint-disable */
import { type ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { type PatternStyle, getPatternStyle } from '@/lib/docyrus/pattern-styles';

export function AwesomeDialogContent({
  children,
  className,
  pattern = true,
  patternStyle = 'stripes',
  isFullscreen = false
}: {
  children: ReactNode;
  className?: string;
  pattern?: boolean;
  patternStyle?: PatternStyle;
  isFullscreen?: boolean;
}) {
  return (
    <div
      data-slot="awesome-dialog-outer"
      className={cn(
        'flex h-full flex-col overflow-hidden bg-muted/50 text-card-foreground shadow-sm',
        isFullscreen ? 'rounded-none p-0' : 'rounded-xl border p-1.5'
      )}
      style={pattern ? getPatternStyle(patternStyle) : undefined}>
      <div
        data-slot="awesome-dialog-inner"
        className={cn(
          'flex min-h-0 flex-1 flex-col overflow-hidden bg-card',
          isFullscreen ? 'rounded-none' : 'rounded-lg border',
          className
        )}>
        {children}
      </div>
    </div>
  );
}