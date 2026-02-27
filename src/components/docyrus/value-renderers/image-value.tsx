'use client'

import { ImageIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

import { type DocyrusValueProps } from './types'

interface ImageData {
  file_name?: string
  signed_url?: string
  mime_type?: string
  size?: number
}

function isImageData(val: unknown): val is ImageData {
  return typeof val === 'object' && val !== null && 'signed_url' in val
}

export function ImageValue({ value, className }: DocyrusValueProps) {
  if (value == null || value === '') {
    return <span className="text-muted-foreground">—</span>
  }

  const image = isImageData(value) ? value : null

  if (image?.signed_url) {
    return (
      <span className={cn('inline-flex items-center', className)}>
        <img
          src={image.signed_url}
          alt={image.file_name ?? 'Image'}
          className="size-8 rounded object-cover"
        />
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-muted-foreground text-sm',
        className,
      )}
    >
      <ImageIcon className="size-4 shrink-0" />
      <span className="truncate">{image?.file_name ?? String(value)}</span>
    </span>
  )
}
