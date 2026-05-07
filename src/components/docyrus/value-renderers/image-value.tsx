'use client'

import { ImageIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

import { type DocyrusValueProps } from './types'

interface ImageData {
  file_name?: string
  signed_url?: string | null
  mime_type?: string
  size?: number
}

function isImageData(val: unknown): val is ImageData {
  return (
    typeof val === 'object' &&
    val !== null &&
    ('signed_url' in val || 'file_name' in val)
  )
}

function normalizeImages(value: unknown): ImageData[] {
  const items = Array.isArray(value) ? value : [value]

  return items.flatMap((item) => {
    if (typeof item === 'string' && item.length > 0) {
      return [{ signed_url: item } satisfies ImageData]
    }

    if (isImageData(item)) {
      return [item]
    }

    return []
  })
}

function renderFallbackLabel(value: unknown, images: ImageData[]): string {
  const names = images
    .map((image) => image.file_name)
    .filter((name): name is string => Boolean(name))

  if (names.length > 1) {
    return `${names[0]} +${names.length - 1}`
  }

  if (names.length === 1) {
    return names[0] ?? 'Image'
  }

  return String(value)
}

export function ImageValue({ value, className }: DocyrusValueProps) {
  if (
    value == null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  ) {
    return <span className="text-muted-foreground">—</span>
  }

  const images = normalizeImages(value)
  const previewableImages = images.filter((image) => Boolean(image.signed_url))

  if (previewableImages.length > 1) {
    const visibleImages = previewableImages.slice(0, 4)
    const hiddenCount = previewableImages.length - visibleImages.length

    return (
      <span
        className={cn('inline-flex flex-wrap items-center gap-1.5', className)}
      >
        {visibleImages.map((image, index) => (
          <span
            key={image.signed_url ?? `${image.file_name ?? 'image'}-${index}`}
            className="inline-flex size-10 shrink-0 overflow-hidden rounded-md border bg-muted"
          >
            <img
              src={image.signed_url ?? ''}
              alt={image.file_name ?? `Image ${index + 1}`}
              className="size-full object-cover"
            />
          </span>
        ))}
        {hiddenCount > 0 && (
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md border bg-muted px-2 text-xs font-medium text-muted-foreground">
            +{hiddenCount}
          </span>
        )}
      </span>
    )
  }

  const image = previewableImages[0] ?? images[0] ?? null

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
      <span className="truncate">{renderFallbackLabel(value, images)}</span>
    </span>
  )
}
