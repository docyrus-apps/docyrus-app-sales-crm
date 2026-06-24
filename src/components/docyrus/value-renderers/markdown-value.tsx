'use client'

// @ts-nocheck
/* eslint-disable */
import { cn } from '@/lib/utils'

import { MarkdownContent } from '@/lib/docyrus/markdown-content'

import { type DocyrusValueProps } from './types'

export function MarkdownValue({ value, className }: DocyrusValueProps) {
  if (value == null || value === '') {
    return <span className="text-muted-foreground">–</span>
  }

  return (
    <MarkdownContent
      content={String(value)}
      className={cn('text-sm', className)}
    />
  )
}
