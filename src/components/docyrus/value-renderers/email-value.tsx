'use client'

// @ts-nocheck
/* eslint-disable */
import { Mail } from 'lucide-react'

import { cn } from '@/lib/utils'

import { type DocyrusValueProps } from './types'

export function EmailValue({ value, className }: DocyrusValueProps) {
  if (value == null || value === '') {
    return <span className="text-muted-foreground">–</span>
  }

  const email = String(value)

  return (
    <a
      href={`mailto:${email}`}
      className={cn(
        'inline-flex min-w-0 max-w-full items-center gap-1 text-primary underline-offset-4 hover:underline',
        className,
      )}
    >
      <Mail className="size-3.5 shrink-0" />
      <span className="truncate">{email}</span>
    </a>
  )
}
