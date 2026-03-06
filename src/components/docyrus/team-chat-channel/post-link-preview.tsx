import { XIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { type LinkPreview } from './types'

interface PostLinkPreviewProps {
  previews: Array<LinkPreview>
  onDismiss?: (url: string) => void
}

export function PostLinkPreview({ previews, onDismiss }: PostLinkPreviewProps) {
  if (previews.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      {previews.map((preview) => (
        <a
          key={preview.url}
          href={preview.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex overflow-hidden rounded-lg border bg-card transition-colors hover:bg-accent/50"
        >
          {preview.image_url && (
            <div className="shrink-0">
              <img
                src={preview.image_url}
                alt={preview.title ?? ''}
                className="h-24 w-32 object-cover"
              />
            </div>
          )}
          <div className="flex min-w-0 flex-col justify-center gap-0.5 p-3">
            {preview.site_name && (
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {preview.site_name}
              </p>
            )}
            {preview.title && (
              <p className="truncate text-sm font-medium">{preview.title}</p>
            )}
            {preview.description && (
              <p className="line-clamp-2 text-xs text-muted-foreground">
                {preview.description}
              </p>
            )}
          </div>
          {onDismiss && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1 right-1 size-6 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onDismiss(preview.url)
              }}
            >
              <XIcon className="size-3" />
            </Button>
          )}
        </a>
      ))}
    </div>
  )
}
