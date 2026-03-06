import { DownloadIcon } from 'lucide-react'

import { DocyrusIcon } from '@/components/docyrus/docyrus-icon'

import {
  formatFileSize,
  getFileIcon,
  isImageFile,
} from '@/components/docyrus/comments-panel/lib/file-utils'

import { type PostAttachment } from './types'

interface PostAttachmentsProps {
  attachments: Array<PostAttachment>
}

export function PostAttachments({ attachments }: PostAttachmentsProps) {
  if (attachments.length === 0) return null

  const images = attachments.filter(
    (a) => isImageFile(a.file_type) && Boolean(a.signed_url),
  )
  const documents = attachments.filter(
    (a) => !isImageFile(a.file_type) || !a.signed_url,
  )

  return (
    <div className="flex flex-col gap-2">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((attachment) => (
            <a
              key={attachment.id}
              href={attachment.signed_url!}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-lg border"
            >
              <img
                src={attachment.signed_url!}
                alt={attachment.file_name}
                className="h-32 max-w-48 object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-black/50 px-2 py-1 text-[11px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                <span className="truncate">{attachment.file_name}</span>
                <DownloadIcon className="size-3 shrink-0" />
              </div>
            </a>
          ))}
        </div>
      )}

      {documents.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {documents.map((attachment) => {
            const fileIcon = getFileIcon(attachment.file_type)

            return (
              <a
                key={attachment.id}
                href={attachment.signed_url ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1.5 text-xs transition-colors hover:bg-muted/80"
              >
                <DocyrusIcon
                  icon={fileIcon.icon}
                  className={`size-4 shrink-0 ${fileIcon.color}`}
                />
                <span className="max-w-[140px] truncate">
                  {attachment.file_name}
                </span>
                <span className="text-muted-foreground">
                  ({formatFileSize(attachment.file_size)})
                </span>
                <DownloadIcon className="size-3 shrink-0 text-muted-foreground" />
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
