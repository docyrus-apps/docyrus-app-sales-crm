'use client';

import { type ReactNode } from 'react';

import { cn } from '@/lib/utils';

function AwesomeCard({
  className,
  children
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      data-slot="awesome-card"
      className={cn(
        'group relative overflow-hidden rounded-xl border hover:border-card-foreground/30 bg-muted/50 text-card-foreground shadow-sm p-1.5',
        className
      )}
      style={{
        backgroundImage:
          'repeating-linear-gradient(-45deg, transparent, transparent 6px, var(--stripe-color, rgba(0,0,0,0.03)) 6px, var(--stripe-color, rgba(0,0,0,0.03)) 7px)'
      }}>
      {children}
    </div>
  );
}

function AwesomeCardHeader({
  className,
  children
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      data-slot="awesome-card-header"
      className={cn(
        'relative flex items-center justify-between px-2 pb-0 pt-1',
        className
      )}>
      <div
        className="pointer-events-none absolute inset-0" />
      <div className="relative z-10 flex w-full items-center justify-between">
        {children}
      </div>
    </div>
  );
}

function AwesomeCardTitle({
  className,
  children
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      data-slot="awesome-card-title"
      className={cn('text-base font-normal text-muted-foreground group-hover:text-foreground', className)}>
      {children}
    </div>
  );
}

function AwesomeCardIcon({
  className,
  children
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      data-slot="awesome-card-icon"
      className={cn('text-muted-foreground/60', className)}>
      {children}
    </div>
  );
}

function AwesomeCardBody({
  className,
  children
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mt-2 px-0 pb-0">
      <div
        data-slot="awesome-card-body"
        className={cn(
          'rounded-lg border bg-card px-5 py-4',
          className
        )}>
        {children}
      </div>
    </div>
  );
}

function AwesomeCardValue({
  className,
  children
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      data-slot="awesome-card-value"
      className={cn(
        'text-3xl font-bold tracking-tight tabular-nums text-foreground',
        className
      )}>
      {children}
    </div>
  );
}

function AwesomeCardTrend({
  className,
  positive,
  children
}: {
  className?: string;
  positive?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      data-slot="awesome-card-trend"
      className={cn('mt-1 flex items-center gap-1.5 text-sm', className)}>
      {positive !== undefined && (
        <span
          className={cn(
            'font-semibold',
            positive
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-red-600 dark:text-red-400'
          )}>
          {children}
        </span>
      )}
      {positive === undefined && (
        <span className="text-muted-foreground">{children}</span>
      )}
    </div>
  );
}

export {
  AwesomeCard,
  AwesomeCardHeader,
  AwesomeCardTitle,
  AwesomeCardIcon,
  AwesomeCardBody,
  AwesomeCardValue,
  AwesomeCardTrend
};