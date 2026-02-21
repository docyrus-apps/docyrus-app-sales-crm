import * as React from 'react'

import { cn } from '@/lib/utils'

function AwesomeCard({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="awesome-card"
      className={cn(
        'rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden transition-shadow duration-200 hover:shadow-md',
        className,
      )}
      {...props}
    />
  )
}

function AwesomeCardHeader({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="awesome-card-header"
      className={cn(
        'flex items-center justify-between px-4 py-3',
        'bg-[repeating-linear-gradient(-45deg,transparent,transparent_4px,hsl(var(--muted))_4px,hsl(var(--muted))_5px)]',
        className,
      )}
      {...props}
    />
  )
}

function AwesomeCardTitle({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="awesome-card-title"
      className={cn('text-sm font-medium', className)}
      {...props}
    />
  )
}

function AwesomeCardIcon({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="awesome-card-icon"
      className={cn('text-muted-foreground', className)}
      {...props}
    />
  )
}

function AwesomeCardBody({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="awesome-card-body"
      className={cn('bg-card p-4', className)}
      {...props}
    />
  )
}

function AwesomeCardValue({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="awesome-card-value"
      className={cn('text-2xl font-bold tracking-tight', className)}
      {...props}
    />
  )
}

function AwesomeCardTrend({
  positive,
  className,
  ...props
}: React.ComponentProps<'p'> & { positive?: boolean }) {
  return (
    <p
      data-slot="awesome-card-trend"
      className={cn(
        'mt-1 text-xs',
        positive === true && 'text-emerald-600 dark:text-emerald-400',
        positive === false && 'text-red-600 dark:text-red-400',
        positive === undefined && 'text-muted-foreground',
        className,
      )}
      {...props}
    />
  )
}

export {
  AwesomeCard,
  AwesomeCardHeader,
  AwesomeCardTitle,
  AwesomeCardIcon,
  AwesomeCardBody,
  AwesomeCardValue,
  AwesomeCardTrend,
}
