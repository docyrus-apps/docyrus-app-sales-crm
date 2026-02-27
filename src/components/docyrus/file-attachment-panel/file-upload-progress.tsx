import { DocyrusIcon } from '@/components/docyrus/docyrus-icon'
import { Progress } from '@/components/ui/progress'

import { type UploadingFile } from './types'
import { getFileIcon } from './lib/file-utils'

interface FileUploadProgressProps {
  file: UploadingFile
}

export function FileUploadProgress({ file }: FileUploadProgressProps) {
  const iconInfo = getFileIcon(file.file.type)

  return (
    <div className="flex items-center gap-3 rounded-md border px-3 py-2">
      <DocyrusIcon
        icon={iconInfo.icon}
        className={`size-4 shrink-0 ${iconInfo.color}`}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{file.file.name}</p>
        {file.status === 'uploading' && (
          <Progress value={file.progress} className="mt-1 h-1" />
        )}
        {file.status === 'error' && (
          <p className="mt-0.5 text-xs text-destructive">
            {file.error || 'Upload failed'}
          </p>
        )}
      </div>
      {file.status === 'uploading' && (
        <DocyrusIcon
          icon="far spinner-third"
          animation="spin"
          className="size-3.5 text-muted-foreground"
        />
      )}
      {file.status === 'complete' && (
        <DocyrusIcon icon="far check" className="size-3.5 text-green-500" />
      )}
      {file.status === 'error' && (
        <DocyrusIcon icon="far xmark" className="size-3.5 text-destructive" />
      )}
    </div>
  )
}
