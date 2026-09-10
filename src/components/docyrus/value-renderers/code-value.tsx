'use client'

// @ts-nocheck
/* eslint-disable */
import { cn } from '@/lib/utils'

import { type DocyrusValueProps } from './types'

export function CodeValue({ value, className }: DocyrusValueProps) {
  if (value == null || value === '') {
    return <span className="text-muted-foreground">–</span>
  }

  const code = String(value)
  const maxLength = 120
  const truncated =
    code.length > maxLength ? `${code.slice(0, maxLength)}...` : code

  return (
    <span
      className={cn(
        'inline-block max-w-full truncate align-middle rounded bg-muted px-1.5 py-0.5 font-mono text-xs',
        className,
      )}
      title={code}
    >
      {truncated}
    </span>
  )
}
