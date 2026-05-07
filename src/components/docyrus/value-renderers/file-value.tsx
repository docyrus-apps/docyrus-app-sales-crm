'use client'

import { FileIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

import { type DocyrusValueProps } from './types'

interface FileData {
  file_name?: string
  signed_url?: string
  mime_type?: string
  size?: number
}

function isFileData(val: unknown): val is FileData {
  return typeof val === 'object' && val !== null && 'file_name' in val
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function FileValue({ value, className }: DocyrusValueProps) {
  if (value == null || value === '') {
    return <span className="text-muted-foreground">—</span>
  }

  const file = isFileData(value) ? value : null

  if (!file) {
    return (
      <span className={cn('truncate text-sm', className)}>{String(value)}</span>
    )
  }

  const content = (
    <span className={cn('inline-flex items-center gap-1.5 text-sm', className)}>
      <FileIcon className="size-4 shrink-0 text-muted-foreground" />
      <span className="truncate">{file.file_name ?? 'File'}</span>
      {file.size != null && (
        <span className="text-muted-foreground text-xs shrink-0">
          ({formatFileSize(file.size)})
        </span>
      )}
    </span>
  )

  if (file.signed_url) {
    return (
      <a
        href={file.signed_url}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:underline underline-offset-4"
      >
        {content}
      </a>
    )
  }

  return content
}
