'use client'

// @ts-nocheck
/* eslint-disable */
import { FileIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

import { type DocyrusValueProps } from './types'

export function DocEditorValue({ value, className }: DocyrusValueProps) {
  if (value == null || value === '') {
    return <span className="text-muted-foreground">–</span>
  }

  let preview = 'Document'

  if (typeof value === 'string') {
    const stripped = value.replace(/<[^>]*>/g, '').trim()

    if (stripped) {
      preview = stripped.length > 80 ? `${stripped.slice(0, 80)}...` : stripped
    }
  } else if (typeof value === 'object') {
    preview = 'Document'
  }

  return (
    <span
      className={cn(
        'inline-flex min-w-0 max-w-full items-center gap-1 text-sm',
        className,
      )}
    >
      <FileIcon className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="truncate">{preview}</span>
    </span>
  )
}
